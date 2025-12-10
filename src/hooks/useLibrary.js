import { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import {
import { useCallback } from 'react';
import { onSnapshot } from 'firebase/firestore';
  collection,
  doc,
  setDoc,
  deleteDoc
} from "firebase/firestore";

// Hook to manage user's saved library (saved tracks) in Firestore
export default function useLibrary() {
  const [savedIds, setSavedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    const colRef = collection(db, "users", uid, "library");
    const unsub = onSnapshot(
      colRef,
      (snapshot) => {
        const ids = new Set(snapshot.docs.map((doc) => doc.id));
        setSavedIds(ids);
        setLoading(false);
      },
      (err) => {
        console.error("Library subscription error:", err);
        setError(err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [uid]);

  const save = useCallback(
    async (track) => {
      if (!uid) return;
      const trackId = String(track.id);
      const docRef = doc(db, "users", uid, "library", trackId);
      try {
        await setDoc(docRef, { addedAt: new Date(), ...track });
      } catch (err) {
        console.error("Failed to save track:", err);
        setError(err);
      }
    },
    [uid],
  );

  const unsave = useCallback(
    async (trackId) => {
      if (!uid) return;
      const id = String(trackId);
      const docRef = doc(db, "users", uid, "library", id);
      try {
        await deleteDoc(docRef);
      } catch (err) {
        console.error("Failed to unsave track:", err);
        setError(err);
      }
    },
    [uid],
  );

  const toggle = useCallback(
    async (track) => {
      const trackId = String(track.id);
      if (savedIds.has(trackId)) {
        await unsave(trackId);
      } else {
        await save(track);
      }
    },
    [savedIds, save, unsave],
  );

  const isSaved = useCallback(
    (trackId) => savedIds.has(String(trackId)),
    [savedIds],
  );

  return { savedIds, loading, error, save, unsave, toggle, isSaved };
}
