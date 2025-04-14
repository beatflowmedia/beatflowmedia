// netlify/functions/updateMonthlyListeners.js
const admin = require("firebase-admin");

// Initialize Firebase Admin if it hasn't been already
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
    databaseURL: process.env.FIREBASE_DATABASE_URL, // e.g., "https://your-app.firebaseio.com"
  });
}

exports.handler = async function(event, context) {
  const db = admin.firestore();
  const nowMillis = Date.now();
  // Calculate timestamp for 30 days ago
  const thirtyDaysAgo = admin.firestore.Timestamp.fromMillis(
    nowMillis - 30 * 24 * 60 * 60 * 1000
  );

  try {
    // Query all listening events in the last 30 days
    const listensSnapshot = await db
      .collection("listens")
      .where("timestamp", ">=", thirtyDaysAgo)
      .get();

    // Build a map of artistId => Set of unique userIds
    const artistListenersMap = {};

    listensSnapshot.forEach((doc) => {
      const data = doc.data();
      const artistId = data.artistId;
      const userId = data.userId;
      if (!artistId || !userId) return;
      if (!artistListenersMap[artistId]) {
        artistListenersMap[artistId] = new Set();
      }
      artistListenersMap[artistId].add(userId);
    });

    // For each artist, update the Firestore document with monthlyListeners count
    const updatePromises = Object.keys(artistListenersMap).map(async (artistId) => {
      const listenerCount = artistListenersMap[artistId].size;
      const artistDocRef = db.collection("artists").doc(artistId);
      await artistDocRef.set({ monthlyListeners: listenerCount }, { merge: true });
      return console.log(`Updated ${artistId} => ${listenerCount} monthly listeners`);
    });

    await Promise.all(updatePromises);
    console.log("Monthly listeners updated successfully.");
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Monthly listeners updated." }),
    };
  } catch (error) {
    console.error("Error updating monthly listeners:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error updating monthly listeners." }),
    };
  }
};
