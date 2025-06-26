// src/hooks/usePendingSongs.js
import { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, onSnapshot, doc, setDoc } from "firebase/firestore";

export default function usePendingSongs() {
  const [pending, setPending] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "artistSubmissions"), (snap) => {
      const list = snap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((s) => s.status !== "approved");
      setPending(list);
    });

    return unsub;
  }, []);

  const approveSong = async (song) => {
    const { id, ...rest } = song;
    await setDoc(doc(db, "songs", id), {
      ...rest,
      status: "approved",
    });
  };

  return { pending, approveSong };
}
