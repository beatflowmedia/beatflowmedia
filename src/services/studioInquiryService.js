import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Studio Inquiry Service
 *
 * Handles consultation form submissions and inquiry management for BeatFlow Studio
 * - Lead capture and tracking
 * - Inquiry status management
 * - Admin workflow support
 */

/**
 * Submit a new studio inquiry from the consultation form
 *
 * @param {Object} inquiryData - Form data from consultation form
 * @param {string} inquiryData.name - Contact name
 * @param {string} inquiryData.email - Contact email
 * @param {string} inquiryData.businessName - Business name (optional)
 * @param {string} inquiryData.serviceInterest - Service interest (Audio Kits, Mood Library, Invisible Services)
 * @param {string} inquiryData.useCase - Use case (Café, Boutique, Fitness, etc.)
 * @param {string} inquiryData.projectDetails - Project details
 * @param {string} inquiryData.timeline - Timeline (optional)
 * @param {string} inquiryData.budget - Budget (optional)
 * @returns {Promise<{success: boolean, inquiryId: string|null, message: string}>}
 */
export const submitInquiry = async (inquiryData) => {
  try {
    console.log('Submitting studio inquiry:', inquiryData);

    // Prepare inquiry document
    const inquiry = {
      name: inquiryData.name.trim(),
      email: inquiryData.email.trim().toLowerCase(),
      businessName: inquiryData.businessName?.trim() || '',
      serviceInterest: inquiryData.serviceInterest,
      useCase: inquiryData.useCase,
      projectDetails: inquiryData.projectDetails.trim(),
      timeline: inquiryData.timeline?.trim() || '',
      budget: inquiryData.budget?.trim() || '',
      status: 'new',
      adminNotes: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Add to Firestore
    const docRef = await addDoc(collection(db, 'studioInquiries'), inquiry);

    console.log('Studio inquiry submitted successfully, ID:', docRef.id);

    return {
      success: true,
      inquiryId: docRef.id,
      message: 'Thank you for your inquiry! We will get back to you within 24 hours.'
    };
  } catch (error) {
    console.error('Error submitting studio inquiry:', error);
    return {
      success: false,
      inquiryId: null,
      message: 'Failed to submit inquiry. Please try again or contact us directly.',
      error: error.message
    };
  }
};

/**
 * Get studio inquiries with optional status filtering
 *
 * @param {string|null} status - Filter by status ('new', 'contacted', 'quoted', 'closed'), or null for all
 * @returns {Promise<Array>} Array of inquiry objects
 */
export const getInquiries = async (status = null) => {
  try {
    console.log('Fetching studio inquiries, status filter:', status);

    let q;
    if (status) {
      // Query with status filter
      q = query(
        collection(db, 'studioInquiries'),
        where('status', '==', status)
      );
    } else {
      // Query all inquiries
      q = query(collection(db, 'studioInquiries'));
    }

    const querySnapshot = await getDocs(q);
    const inquiries = [];

    querySnapshot.forEach((doc) => {
      inquiries.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log(`Fetched ${inquiries.length} inquiries`);
    return inquiries;
  } catch (error) {
    console.error('Error fetching studio inquiries:', error);
    throw error;
  }
};

/**
 * Update inquiry status and optionally add admin notes
 *
 * @param {string} inquiryId - Firestore document ID
 * @param {string} newStatus - New status ('new', 'contacted', 'quoted', 'closed')
 * @param {string} notes - Admin notes (optional)
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const updateInquiryStatus = async (inquiryId, newStatus, notes = '') => {
  try {
    console.log(`Updating inquiry ${inquiryId} to status: ${newStatus}`);

    const inquiryRef = doc(db, 'studioInquiries', inquiryId);

    const updateData = {
      status: newStatus,
      updatedAt: serverTimestamp()
    };

    // Add admin notes if provided
    if (notes.trim()) {
      updateData.adminNotes = notes.trim();
    }

    await updateDoc(inquiryRef, updateData);

    console.log('Inquiry updated successfully');
    return {
      success: true,
      message: 'Inquiry updated successfully'
    };
  } catch (error) {
    console.error('Error updating inquiry:', error);
    return {
      success: false,
      message: 'Failed to update inquiry. Please try again.',
      error: error.message
    };
  }
};

/**
 * Helper function to validate inquiry data before submission
 *
 * @param {Object} data - Form data to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
export const validateInquiryData = (data) => {
  const errors = [];

  // Required fields
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Name is required');
  }

  if (!data.email || data.email.trim().length === 0) {
    errors.push('Email is required');
  } else {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      errors.push('Please enter a valid email address');
    }
  }

  if (!data.serviceInterest) {
    errors.push('Service interest is required');
  }

  if (!data.useCase) {
    errors.push('Use case is required');
  }

  if (!data.projectDetails || data.projectDetails.trim().length === 0) {
    errors.push('Project details are required');
  } else if (data.projectDetails.trim().length < 20) {
    errors.push('Please provide more details about your project (minimum 20 characters)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/* ------------------------------------------------------------------------- *
 * One inbox, not three.
 *
 * The platform had three places a lead could land and only ONE of them had a
 * reader. `syncLicensingInquiries` was written by the Sync Licensing form and
 * queried by nothing -- no admin screen, no notification, no export. Every sync
 * enquiry ever submitted went into a collection nobody opens, and the submitter
 * got a "we'll be in touch" that was not true. Sync is the highest-value lead on
 * this platform, so that was the most expensive silent failure on the site.
 *
 * The fix is Single Source: every enquiry lands in `studioInquiries`, which is
 * the collection StudioInquiriesManager already reads. It is NOT renamed --
 * a name matching the code, the rules and the admin screen beats a better word
 * matching nothing, and renaming a live collection orphans its documents.
 *
 * The mapping below deliberately reuses `serviceInterest` and `useCase` rather
 * than adding parallel fields, because those are the two columns the admin table
 * already renders. A new field would need new UI to be visible, and an enquiry
 * that is invisible in the back office is the bug we are fixing.
 * ------------------------------------------------------------------------- */

export const INQUIRY_SOURCES = {
  STUDIO: 'studio',
  CONTACT: 'contact',
  SYNC: 'sync',
  SPONSOR: 'sponsor'
};

// What the admin table's "Use Case" column shows for each source. A lookup rather
// than a ternary chain: the ternary read `source === SYNC ? 'Sync Licensing' : ...`
// and every new source would have added another branch to a conditional nobody would
// remember to update -- the third source is exactly where that goes wrong.
const USE_CASE_BY_SOURCE = {
  [INQUIRY_SOURCES.SYNC]: 'Sync Licensing',
  [INQUIRY_SOURCES.SPONSOR]: 'Advertising / Sponsorship',
  [INQUIRY_SOURCES.CONTACT]: 'General Contact',
  [INQUIRY_SOURCES.STUDIO]: 'Studio Consultation'
};

/**
 * Submit a general enquiry (contact form, sync licensing) into the same inbox
 * the back office reads.
 *
 * @param {Object} data
 * @param {string} data.name
 * @param {string} data.email
 * @param {string} data.topic   - what it is about; shown as the table's "Service Interest"
 * @param {string} data.message
 * @param {string} [data.company]
 * @param {string} [data.source] - one of INQUIRY_SOURCES; defaults to CONTACT
 * @returns {Promise<{success: boolean, inquiryId: string|null, message: string}>}
 */
export const submitGeneralInquiry = async (data) => {
  const source = data.source || INQUIRY_SOURCES.CONTACT;
  try {
    const inquiry = {
      name: String(data.name || '').trim(),
      email: String(data.email || '').trim().toLowerCase(),
      businessName: String(data.company || '').trim(),
      serviceInterest: String(data.topic || '').trim() || 'General Enquiry',
      useCase: USE_CASE_BY_SOURCE[source] || 'General Contact',
      projectDetails: String(data.message || '').trim(),
      timeline: '',
      budget: '',
      source,
      status: 'new',
      adminNotes: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'studioInquiries'), inquiry);

    return {
      success: true,
      inquiryId: docRef.id,
      message: 'Thanks — your message reached the team. We reply within two business days.'
    };
  } catch (error) {
    console.error('Error submitting enquiry:', error);
    return {
      success: false,
      inquiryId: null,
      message: 'We could not send that. Please try again in a moment.',
      error: error.message
    };
  }
};

/**
 * Validate a general enquiry. Separate from validateInquiryData because the
 * studio consultation form requires serviceInterest/useCase/20-char details and
 * a contact message legitimately does not -- reusing that validator would reject
 * valid messages, which is the DRY caveat: two rules that look alike are still
 * two rules.
 */
export const validateGeneralInquiry = (data) => {
  const errors = [];
  if (!data.name || !data.name.trim()) errors.push('Please tell us your name.');
  if (!data.email || !data.email.trim()) {
    errors.push('Please give us an email address so we can reply.');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.push('That email address does not look right.');
  }
  if (!data.topic || !data.topic.trim()) errors.push('Please choose what your message is about.');
  if (!data.message || data.message.trim().length < 10) {
    errors.push('Please add a little more detail (at least 10 characters).');
  }
  return { isValid: errors.length === 0, errors };
};
