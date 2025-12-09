// src/hooks/useApplications.js
import { useEffect, useState } from "react";
import { collection } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { onSnapshot } from 'firebase/firestore';

export default function useApplications() {
  const [applications, setApplications] = useState([]);
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "applications"),
      (snapshot) => {
        setApplications(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
      },
    );
    return unsubscribe;
  }, []);

  return { applications };
}
