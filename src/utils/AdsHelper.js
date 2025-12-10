import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where
} from "firebase/firestore";
import { db } from "../firebaseConfig";

// Listen for ads updates in Firebase
export const subscribeToAds = (callback) => {
  return onSnapshot(collection(db, "advertisements"), (snapshot) => {
    const ads = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
    // Sort by createdAt on client side
    ads.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB - dateA;
    });
    callback(ads);
  });
};

// Get active ads only
export const subscribeToActiveAds = (callback) => {
  const q = query(
    collection(db, "advertisements"),
    where("isActive", "==", true)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const ads = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort by priority on client side
      ads.sort((a, b) => (b.priority || 0) - (a.priority || 0));
      callback(ads);
    },
    (error) => {
      console.error('Error loading advertisements:', error);
    }
  );
};

// Create a new advertisement
export const createAd = async (adData) => {
  try {
    const docRef = await addDoc(collection(db, "advertisements"), {
      title: adData.title,
      description: adData.description,
      imageUrl: adData.imageUrl || "",
      ctaText: adData.ctaText || "Learn More",
      ctaLink: adData.ctaLink || "",
      isActive: adData.isActive !== undefined ? adData.isActive : true,
      priority: adData.priority || 0,
      type: adData.type || "promotional", // promotional, commercial_break, homepage_feature
      displayLocations: adData.displayLocations || ["mini_player"], // mini_player, homepage, commercial_break
      frequency: adData.frequency || 5, // Show after X songs for commercial breaks
      duration: adData.duration || 10, // Duration in seconds for commercial breaks
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log("✅ Advertisement created with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("❌ Error creating advertisement:", error);
    throw error;
  }
};

// Update an existing advertisement
export const updateAd = async (adId, adData) => {
  try {
    const adRef = doc(db, "advertisements", adId);
    await updateDoc(adRef, {
      ...adData,
      updatedAt: new Date()
    });
    console.log("✅ Advertisement updated:", adId);
  } catch (error) {
    console.error("❌ Error updating advertisement:", error);
    throw error;
  }
};

// Delete an advertisement
export const deleteAd = async (adId) => {
  try {
    await deleteDoc(doc(db, "advertisements", adId));
    console.log("✅ Advertisement deleted:", adId);
  } catch (error) {
    console.error("❌ Error deleting advertisement:", error);
    throw error;
  }
};

// Toggle ad active status
export const toggleAdStatus = async (adId, currentStatus) => {
  try {
    const adRef = doc(db, "advertisements", adId);
    await updateDoc(adRef, {
      isActive: !currentStatus,
      updatedAt: new Date()
    });
    console.log("✅ Advertisement status toggled:", adId);
  } catch (error) {
    console.error("❌ Error toggling advertisement status:", error);
    throw error;
  }
};

// Get ads for commercial breaks
export const subscribeToCommercialBreakAds = (callback) => {
  const q = query(
    collection(db, "advertisements"),
    where("isActive", "==", true),
    where("displayLocations", "array-contains", "commercial_break")
  );
  return onSnapshot(q, (snapshot) => {
    const ads = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
    // Sort by priority on client side
    ads.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    callback(ads);
  });
};

// Get a random ad for commercial break
export const getRandomCommercialAd = (ads) => {
  if (!ads || ads.length === 0) return null;
  return ads[Math.floor(Math.random() * ads.length)];
};
