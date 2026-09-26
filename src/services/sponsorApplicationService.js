import { collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebaseConfig';
import { SPONSOR_TIERS } from '../data/sponsorshipTiers';

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

const MAX_BYTES = 50 * 1024 * 1024;
const AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/aiff'];
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

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

  cta: (f) =>
    !f.cta || !f.cta.trim() ? 'Please give us a button label for your sponsor card.' : null,

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
    if (!f.landingUrl || !f.landingUrl.trim()) {
      return 'Please give us the web address the sponsor card should link to.';
    }
    if (!/^https?:\/\/.+\..+/i.test(f.landingUrl.trim())) {
      return 'The landing web address should start with http:// or https://';
    }
    return null;
  },

  describe: (f) =>
    !f.describe || f.describe.trim().length < 20
      ? 'Please describe what you are advertising in a little more detail.'
      : null,

  // Required only for tiers that CARRY audio. Supporter is a sponsor-card package
  // with no spot, so demanding one there would block a valid application over a file
  // that could never be played. The tier is the authority, not the form.
  audioFile: (f) => {
    const tier = SPONSOR_TIERS.find((t) => t.id === f.tierId);
    if (tier && tier.audioSpot && !f.wantsProduction && !f.audioFile) {
      return 'Attach your audio spot, or tick "produce the spot for me".';
    }
    return fileProblem(f.audioFile, AUDIO_TYPES, 'audio');
  },

  logoFile: (f) => fileProblem(f.logoFile, IMAGE_TYPES, 'image')
};

function fileProblem(file, types, label) {
  if (!file) return null;
  if (file.size > MAX_BYTES) return `That ${label} file is over 50MB.`;
  if (file.type && !types.includes(file.type)) {
    return `That ${label} file is not a supported format.`;
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
      spotBlock: form.spotBlock || '30',
      company: form.company.trim(),
      // Straight onto the station's sponsor card. Collected, never composed by us.
      blurb: form.blurb.trim(),
      cta: form.cta.trim(),
      contactName: form.contactName.trim(),
      email: form.email.trim().toLowerCase(),
      landingUrl: form.landingUrl.trim(),
      describe: form.describe.trim(),
      preferredStart: form.preferredStart || '',
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
