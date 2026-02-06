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
