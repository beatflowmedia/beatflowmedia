import { collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebaseConfig';

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

const MAX_BYTES = 25 * 1024 * 1024;
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

export function validateApplication(form) {
  const errors = [];

  if (!form.tierId) errors.push('Please choose a sponsorship package.');
  if (!form.company || !form.company.trim()) errors.push('Please give us the advertiser or brand name.');
  if (!form.blurb || !form.blurb.trim()) errors.push('Please give us the one line for your sponsor card.');
  if (!form.cta || !form.cta.trim()) errors.push('Please give us a button label for your sponsor card.');
  if (!form.contactName || !form.contactName.trim()) errors.push('Please give us a contact name.');

  if (!form.email || !form.email.trim()) {
    errors.push('Please give us an email address.');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.push('That email address does not look right.');
  }

  if (!form.landingUrl || !form.landingUrl.trim()) {
    errors.push('Please give us the web address the sponsor card should link to.');
  } else if (!/^https?:\/\/.+\..+/i.test(form.landingUrl.trim())) {
    errors.push('The landing web address should start with http:// or https://');
  }

  if (!form.describe || form.describe.trim().length < 20) {
    errors.push('Please describe what you are advertising in a little more detail.');
  }

  // The audio spot is optional ONLY because two tiers include production. If the
  // sponsor is not asking us to produce it and has not attached one, there is nothing
  // to air -- which is exactly the state this whole flow exists to prevent.
  if (!form.wantsProduction && !form.audioFile) {
    errors.push('Attach your audio spot, or tick "produce the spot for me".');
  }

  [['audioFile', AUDIO_TYPES, 'audio'], ['logoFile', IMAGE_TYPES, 'image']].forEach(
    ([field, types, label]) => {
      const file = form[field];
      if (!file) return;
      if (file.size > MAX_BYTES) errors.push(`That ${label} file is over 25MB.`);
      if (file.type && !types.includes(file.type)) {
        errors.push(`That ${label} file is not a supported format.`);
      }
    }
  );

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
