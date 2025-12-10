// src/hooks/useJobs.js
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebaseConfig"; // adjust path if needed

export function useJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Query only "open" jobs for best UX
    const q = query(collection(db, "jobs"), where("status", "==", "open"));
    getDocs(q)
      .then((snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        // Optional: sort by most recent
        data.sort((a, b) => b.posted_at - a.posted_at);
        setJobs(data);
      })
      .finally(() => setLoading(false));
  }, []);

  return { jobs, loading };
}
