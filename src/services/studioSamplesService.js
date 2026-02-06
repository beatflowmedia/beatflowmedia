import { db } from '../firebaseConfig';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';

/**
 * Fetch all studio samples
 * @returns {Promise<Array>} Array of sample objects
 */
export const getStudioSamples = async () => {
  try {
    const samplesRef = collection(db, 'studioSamples');
    const q = query(samplesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching studio samples:', error);
    throw error;
  }
};

/**
 * Fetch studio samples filtered by mood
 * @param {string} mood - Mood filter
 * @returns {Promise<Array>} Array of sample objects
 */
export const getStudioSamplesByMood = async (mood) => {
  try {
    const samplesRef = collection(db, 'studioSamples');
    const q = query(
      samplesRef,
      where('moods', 'array-contains', mood),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching samples by mood:', error);
    throw error;
  }
};

/**
 * Fetch studio samples filtered by use case
 * @param {string} useCase - Use case filter
 * @returns {Promise<Array>} Array of sample objects
 */
export const getStudioSamplesByUseCase = async (useCase) => {
  try {
    const samplesRef = collection(db, 'studioSamples');
    const q = query(
      samplesRef,
      where('useCases', 'array-contains', useCase),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching samples by use case:', error);
    throw error;
  }
};

/**
 * Get a single studio sample by ID
 * @param {string} sampleId - Sample ID
 * @returns {Promise<Object>} Sample object
 */
export const getStudioSample = async (sampleId) => {
  try {
    const sampleRef = doc(db, 'studioSamples', sampleId);
    const sampleDoc = await getDoc(sampleRef);

    if (!sampleDoc.exists()) {
      throw new Error('Sample not found');
    }

    return {
      id: sampleDoc.id,
      ...sampleDoc.data()
    };
  } catch (error) {
    console.error('Error fetching studio sample:', error);
    throw error;
  }
};

/**
 * Add a new studio sample (admin only)
 * @param {Object} sampleData - Sample data
 * @returns {Promise<string>} New sample ID
 */
export const addStudioSample = async (sampleData) => {
  try {
    const samplesRef = collection(db, 'studioSamples');
    const docRef = await addDoc(samplesRef, {
      ...sampleData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error adding studio sample:', error);
    throw error;
  }
};

/**
 * Update a studio sample (admin only)
 * @param {string} sampleId - Sample ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export const updateStudioSample = async (sampleId, updates) => {
  try {
    const sampleRef = doc(db, 'studioSamples', sampleId);
    await updateDoc(sampleRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating studio sample:', error);
    throw error;
  }
};

/**
 * Delete a studio sample (admin only)
 * @param {string} sampleId - Sample ID
 * @returns {Promise<void>}
 */
export const deleteStudioSample = async (sampleId) => {
  try {
    const sampleRef = doc(db, 'studioSamples', sampleId);
    await deleteDoc(sampleRef);
  } catch (error) {
    console.error('Error deleting studio sample:', error);
    throw error;
  }
};
