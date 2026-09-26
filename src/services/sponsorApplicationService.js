import { collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebaseConfig';
import { SPONSOR_TIERS } from '../data/sponsorshipTiers';
import {
  isAllowedCta,
  AUDIO_SPEC,
  LOGO_SPEC,
  mimeTypesOf,
  megabytesOf,
  DEFAULT_SPOT_BLOCK
} from '../data/radioStation';

/**
 * Sponsor applications — apply, be approved, THEN pay.
 *
 * The order is modelled on how a self-serve CTV ad platform actually sequences a
 * buy. Roku Ads Manager states its flow as four steps:
 *
 *   1. "Create your account."
 *   2. "Choose your objective and target audience."
 *   3. "Upload your creative for approval."
 *   4. "Launch your campaign and measure results."
 *
 * Payment is not one of the four. It attaches at launch, AFTER creative approval.
 * That ordering is not a courtesy, it is what makes the product operable:
 *
 *   - A card payment tells you money arrived and nothing else. Without the brand,
 *     the landing URL and the audio, a paid sponsorship cannot be scheduled, and the
 *     sponsor is billed from day one for airtime that cannot run.
 *   - The spot airs under BFMG's name. You cannot let a stranger onto the station by
 *     credit card and review it afterwards; declining then means refunding someone
 *     you have already annoyed, and /advertising promises we decline BEFORE taking
 *     payment.
 *
 * So this service covers steps 1-3. Step 4 is the existing Stripe subscription
 * checkout, unlocked once an admin approves.
 */

export const APPLICATION_STATUS = {
  SUBMITTED: 'submitted',
  IN_REVIEW: 'in_review',
  APPROVED: 'approved',
  DECLINED: 'declined',
  ACTIVE: 'active'
};

// Only 'submitted' may be written by an applicant; firestore.rules enforces it, and
// this constant is here so the client cannot accidentally send anything else.
const INITIAL_STATUS = APPLICATION_STATUS.SUBMITTED;

/**
 * When the sponsor wants to start.
 *
 * This was a bare date picker, which was wrong twice over. A native date input
 * renders differently in every browser and is genuinely awkward on a phone; worse, an
 * exact date implies a precision we do not control. We review within two business
 * days and the sponsor then chooses when to start, so "14 March" was a commitment
 * neither side had made.
 *
 * A timeline also QUALIFIES the applicant, which a date cannot. "As soon as you can"
 * and "just exploring" are different conversations, and knowing which arrives is the
 * difference between answering in order and answering in the right order.
 *
 * 'date' keeps the precise case rather than losing it: a sponsor with a product
 * launch or an event has a real date, and choosing that option reveals the picker.
 * Progressive disclosure, so the awkward widget is only in front of the few people
 * who actually need it.
 *
 * `urgent` marks the ones worth answering first. It is data rather than a rule about
 * ordering, because who to call first is a business judgement, not a constant.
 */
export const START_TIMELINES = [
  { id: 'asap', label: 'As soon as you can', urgent: true },
  { id: 'two-weeks', label: 'Within two weeks', urgent: true },
  { id: 'month', label: 'Within a month', urgent: false },
  { id: 'quarter', label: 'In the next three months', urgent: false },
  { id: 'date', label: 'On a particular date', urgent: false, needsDate: true },
  { id: 'exploring', label: 'Just exploring for now', urgent: false }
];

export const DEFAULT_START_TIMELINE = 'month';

export function startTimelineById(id) {
  return START_TIMELINES.find((t) => t.id === id) || null;
}

export function timelineNeedsDate(id) {
  const timeline = startTimelineById(id);
  return Boolean(timeline && timeline.needsDate);
}

export function startTimelineLabel(id) {
  const timeline = startTimelineById(id);
  return timeline ? timeline.label : id;
}

// Size and format come from radioStation.js, which is also what the dropzones use.
// These were separate lists here and drifted: the UI accepted FLAC, M4A, AAC, OGG,
// GIF and AVIF while this file rejected every one of them, so a sponsor could attach
// a file the form welcomed and be refused at submit.

/**
 * Upload one creative file to the sponsor's own folder.
 *
 * Path is keyed by uid because storage.rules only permits a write where the folder
 * matches the authenticated user. Filenames are prefixed with a timestamp so a
 * re-submission never silently overwrites the version an admin is mid-review on.
 */
async function uploadCreative(userId, file, kind) {
  const safeName = String(file.name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `sponsor-creative/${userId}/${Date.now()}-${kind}-${safeName}`;
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file);
  // Store the download URL AND the path. The URL is what an admin clicks; the path is
  // what survives if the URL is ever regenerated, and is the only way to find the
  // object again from a script.
  return { path, url: await getDownloadURL(fileRef) };
}

/**
 * Add https:// when the sponsor did not type a scheme.
 *
 * People type "example.com". Rejecting that taught them nothing and cost a round
 * trip through an error message for a mistake the form can simply fix.
 *
 * ONE implementation, used in three places that must agree: the validator checks the
 * normalised value, submitApplication STORES the normalised value, and the field
 * normalises on blur so the sponsor sees exactly what will be saved. If the UI tidied
 * the display and the service stored the raw text, the card would link somewhere the
 * applicant never saw.
 *
 * https, not http, because it is the safe default and the station's validate.js curls
 * advertiser URLs following redirects -- an http-only site will redirect and still
 * resolve. An existing scheme is left alone: a sponsor who deliberately typed http://
 * knows something we do not, and silently upgrading it could break a link that works.
 */
export function normalizeLandingUrl(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) return trimmed;
  // Guard against a mistyped or unsupported scheme becoming "https://ftp://host".
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  return 'https://' + trimmed;
}

/**
 * Validation rules, keyed by the field they belong to.
 *
 * A wizard validates ONE STEP at a time, and the obvious way to do that is a second
 * set of per-step checks -- which is exactly how a wizard and its submit handler end
 * up disagreeing about what a valid application is. The rules live here once; a step
 * names the fields it covers and gets the same rule applied.
 *
 * Each entry returns an error string or null. Rules that depend on another field
 * (audio depends on the chosen tier) receive the whole form.
 */
const RULES = {
  tierId: (f) => (!f.tierId ? 'Please choose a sponsorship package.' : null),

  company: (f) =>
    !f.company || !f.company.trim() ? 'Please give us the advertiser or brand name.' : null,

  blurb: (f) =>
    !f.blurb || !f.blurb.trim() ? 'Please give us the one line for your sponsor card.' : null,

  // Must be one of the allowed labels, not merely non-empty.
  //
  // Checking only that free text was present would leave the fixed list as a UI
  // suggestion: anything reaching this function by another route -- a restored draft
  // written when the list was different, or a later caller -- would pass. The list is
  // the rule, so the rule checks the list.
  cta: (f) => {
    if (!f.cta || !f.cta.trim()) return 'Please choose a button label for your sponsor card.';
    if (!isAllowedCta(f.cta)) return 'Please choose one of the listed button labels.';
    return null;
  },

  contactName: (f) =>
    !f.contactName || !f.contactName.trim() ? 'Please give us a contact name.' : null,

  email: (f) => {
    if (!f.email || !f.email.trim()) return 'Please give us an email address.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) {
      return 'That email address does not look right.';
    }
    return null;
  },

  landingUrl: (f) => {
    const url = normalizeLandingUrl(f.landingUrl);
    if (!url) return 'Please give us the web address the sponsor card should link to.';
    if (!/^https?:\/\/[^\s.]+\.[^\s]+$/i.test(url)) {
      return 'That does not look like a web address. Try something like example.com';
    }
    return null;
  },

  describe: (f) =>
    !f.describe || f.describe.trim().length < 20
      ? 'Please describe what you are advertising in a little more detail.'
      : null,

  startTimeline: (f) => {
    if (!startTimelineById(f.startTimeline)) return 'Please tell us when you would like to start.';
    // The date is required ONLY for the option that asks for one. Requiring it always
    // would reimpose the picker this replaced; never requiring it would let someone
    // choose "on a particular date" and not say which.
    if (timelineNeedsDate(f.startTimeline) && !String(f.preferredStart || '').trim()) {
      return 'Please pick the date you would like to start.';
    }
    return null;
  },

  // Required only for tiers that CARRY audio. Supporter is a sponsor-card package
  // with no spot, so demanding one there would block a valid application over a file
  // that could never be played. The tier is the authority, not the form.
  audioFile: (f) => {
    const tier = SPONSOR_TIERS.find((t) => t.id === f.tierId);
    if (tier && tier.audioSpot && !f.wantsProduction && !f.audioFile) {
      return 'Attach your audio spot, or tick "produce the spot for me".';
    }
    return fileProblem(f.audioFile, AUDIO_SPEC, 'audio');
  },

  logoFile: (f) => fileProblem(f.logoFile, LOGO_SPEC, 'logo')
};

function fileProblem(file, spec, label) {
  if (!file) return null;
  // Size quoted FROM the limit, not typed beside it: a hardcoded "50MB" becomes a
  // lie the moment the ceiling moves, and it is the sponsor who is misinformed.
  if (file.size > spec.maxBytes) {
    return `That ${label} file is over ${megabytesOf(spec)}MB.`;
  }
  if (file.type && !mimeTypesOf(spec).includes(file.type)) {
    return `That ${label} file is not a format we can use.`;
  }
  return null;
}

/**
 * Validate the whole application, or only the named fields.
 *
 * @param {Object} form
 * @param {string[]} [fields] - restrict the check to these; omit to check everything.
 */
export function validateApplication(form, fields) {
  // Array.isArray, NOT a truthiness check on .length.
  //
  // This read `fields && fields.length ? fields : Object.keys(RULES)`, which cannot
  // tell "check nothing" from "check everything": an empty array is truthy but its
  // .length is 0, so it fell through to validating the WHOLE form. The wizard's first
  // step owns no fields and passes [], so pressing Continue on step one reported every
  // error on the form before the sponsor had been shown a single input.
  //
  // An explicit [] now means exactly what it says. Omitting the argument still checks
  // everything, which is what the final submit relies on.
  const names = Array.isArray(fields) ? fields : Object.keys(RULES);
  const errors = names
    .map((name) => (RULES[name] ? RULES[name](form) : null))
    .filter(Boolean);
  return { isValid: errors.length === 0, errors };
}

/**
 * Submit an application. Uploads first, then writes the record, so a document never
 * exists claiming creative that failed to upload.
 */
export async function submitApplication(user, form) {
  if (!user) {
    return { success: false, message: 'Please sign in before applying.' };
  }

  try {
    const audio = form.audioFile ? await uploadCreative(user.uid, form.audioFile, 'spot') : null;
    const logo = form.logoFile ? await uploadCreative(user.uid, form.logoFile, 'logo') : null;

    await addDoc(collection(db, 'sponsorApplications'), {
      userId: user.uid,
      status: INITIAL_STATUS,
      tierId: form.tierId,
      // Which programme they want. Stored so the desk knows where to place the spot
      // and can check that programme's ad load before approving.
      programId: form.programId || 'no-preference',
      // The sponsor's INTENDED length. Never a measured duration -- see the form.
      spotBlock: form.spotBlock || DEFAULT_SPOT_BLOCK,
      company: form.company.trim(),
      // Straight onto the station's sponsor card. Collected, never composed by us.
      blurb: form.blurb.trim(),
      cta: form.cta.trim(),
      contactName: form.contactName.trim(),
      email: form.email.trim().toLowerCase(),
      // Stored normalised, so the card links where the applicant was shown it would.
      landingUrl: normalizeLandingUrl(form.landingUrl),
      describe: form.describe.trim(),
      startTimeline: form.startTimeline || DEFAULT_START_TIMELINE,
      // Only meaningful for the 'date' timeline; blanked otherwise so a stale value
      // from a changed answer cannot be read as a commitment.
      preferredStart: timelineNeedsDate(form.startTimeline) ? form.preferredStart || '' : '',
      wantsProduction: Boolean(form.wantsProduction),
      audio,
      logo,
      adminNotes: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return {
      success: true,
      message:
        'Application received. We review every sponsorship before it airs and will come back to you within two business days. Nothing is charged until we approve it.'
    };
  } catch (error) {
    console.error('Sponsor application failed:', error);
    return {
      success: false,
      message: 'We could not submit that. Please try again in a moment.'
    };
  }
}

/**
 * The applicant's most recent application, so the page can show where they stand
 * rather than inviting them to apply again.
 */
export async function latestApplicationFor(user) {
  if (!user) return null;
  try {
    const snap = await getDocs(
      query(
        collection(db, 'sponsorApplications'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(1)
      )
    );
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    // A missing composite index surfaces here. Returning null degrades to "no
    // application yet", which shows the form -- annoying but harmless -- rather than
    // breaking the page.
    console.warn('Could not load sponsor application:', error);
    return null;
  }
}

/** Payment is unlocked by approval and by nothing else. */
export function canPay(application) {
  return Boolean(application) && application.status === APPLICATION_STATUS.APPROVED;
}
