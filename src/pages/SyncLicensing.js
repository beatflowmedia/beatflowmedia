import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import TrackCard from "../components/TrackCard";

export default function SyncLicensing() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snapshot = await getDocs(collection(db, "songs"));
        // only include approved tracks
        const approved = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(track => track.status === 'approved');
        setTracks(approved);
      } catch {
        setError("Failed to load tracks.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading tracks…</div>;
  if (error)   return <div className="p-8 text-center text-red-400">Error: {error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Sync Licensing</h1>
      <p className="text-sm text-gray-400 mb-4">{tracks.length} approved track{tracks.length!==1?'s':''} available.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tracks.map(track => (
          <TrackCard key={track.id} track={track} />
        ))}
      </div>
      <div className="mt-8 text-center">
        <p className="text-gray-400 mb-2">
          Interested in licensing? Email us at{' '}
          <a href="mailto:sync@beatflowmedia.com" className="underline">
            sync@beatflowmedia.com
          </a>
        </p>
        <a
          href="mailto:sync@beatflowmedia.com"
          className="inline-block bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-500"
        >
          Request Info
        </a>
      </div>
    </div>
  );
}