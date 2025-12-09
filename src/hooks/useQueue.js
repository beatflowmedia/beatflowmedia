import { useState, useEffect, useCallback } from "react";
import { auth, db, doc, setDoc } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";

// Hook to manage user's playback queue in Firestore
export default function useQueue() {
  // Determine test mode
  const isTest = process.env.NODE_ENV === "test";

  // State hooks
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(isTest ? false : true);
  const [error, setError] = useState(null);

  // Track authenticated user ID
  const [uid, setUid] = useState(null);

  // Listen for auth state changes
  useEffect(() => {
    if (isTest) return;
    console.log("useQueue: setting up auth listener");
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      console.log("useQueue: auth changed, uid:", user?.uid);
      setUid(user?.uid || null);
    });
    return () => unsubAuth();
  }, [isTest]);

  // Subscribe to queue document
  useEffect(() => {
    if (isTest) return;
    console.log("useQueue: subscribing to queue document for uid:", uid);
    if (!uid) return;
    const ref = doc(db, "queues", uid);
    const unsubQueue = onSnapshot(ref, {
      next(snapshot) {
        if (!snapshot.exists()) {
          setDoc(ref, { tracks: [] }, { merge: true }).catch(console.error);
          setQueue([]);
          setLoading(false);
          return;
        }
        const raw = snapshot.data()?.tracks || [];
        const cleaned = raw.filter(Boolean);
        if (cleaned.length !== raw.length) {
          setDoc(ref, { tracks: cleaned }, { merge: true }).catch(
            console.error,
          );
        }
        setQueue(cleaned);
        setLoading(false);
      },
      error(err) {
        console.error("Queue subscription error:", err);
        setError(err);
        setLoading(false);
      }
    });
    return () => unsubQueue();
  }, [uid, isTest]);

  // Persist queue to Firestore
  const persistQueue = useCallback(
    async (newTracks) => {
      if (isTest || !uid) return;
      const ref = doc(db, "queues", uid);
      try {
        await setDoc(ref, { tracks: newTracks }, { merge: true });
      } catch (err) {
        console.error("Failed to persist queue:", err);
        setError(err);
      }
    },
    [uid, isTest],
  );

  const add = useCallback(
    (item) => {
      // Append only valid item and remove falsy entries
      const newQueue = [...queue.filter(Boolean), item].filter(Boolean);
      setQueue(newQueue);
      persistQueue(newQueue);
    },
    [queue, persistQueue],
  );

  const removeAt = useCallback(
    (index) => {
      const newQueue = queue.filter(Boolean);
      newQueue.splice(index, 1);
      setQueue(newQueue);
      persistQueue(newQueue);
    },
    [queue, persistQueue],
  );

  const clear = useCallback(() => {
    setQueue([]);
    persistQueue([]);
  }, [persistQueue]);

  const reorder = useCallback(
    (from, to) => {
      const newQueue = queue.filter(Boolean);
      const [moved] = newQueue.splice(from, 1);
      newQueue.splice(to, 0, moved);
      setQueue(newQueue);
      persistQueue(newQueue);
    },
    [queue, persistQueue],
  );

  // Return all hooks regardless of environment
  return { queue, loading, error, add, removeAt, clear, reorder };
}
