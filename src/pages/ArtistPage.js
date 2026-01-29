import { useState, useMemo, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { buildArtistInfo } from "../utils/buildArtistInfo";
import RightPanel from "../components/RightPanel";

function ArtistPage() {
  const [panelVisible, setPanelVisible] = useState(false);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Choose the artist you want to build info for (e.g., "Percy Rice")
  const selectedArtistName = "Percy Rice";

  // Load songs from Firebase
  useEffect(() => {
    const loadSongs = async () => {
      try {
        const songsQuery = query(
          collection(db, "songs"),
          where("artist", "==", selectedArtistName)
        );
        const snapshot = await getDocs(songsQuery);
        const songsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSongs(songsData);
      } catch (error) {
        console.error("Error loading songs:", error);
      } finally {
        setLoading(false);
      }
    };
    loadSongs();
  }, [selectedArtistName]);

  // Memoize artist info to avoid recomputing unless songs change
  const artistInfo = useMemo(
    () => buildArtistInfo(selectedArtistName, songs),
    [selectedArtistName, songs],
  );

  if (loading) {
    return (
      <div className="bg-black text-white min-h-screen p-6">
        <p>Loading artist data...</p>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen p-6">
      <button
        onClick={() => setPanelVisible(true)}
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        Show Artist Info for {selectedArtistName}
      </button>

      <RightPanel
        visible={panelVisible}
        artistInfo={artistInfo}
        onClose={() => setPanelVisible(false)}
      />
    </div>
  );
}

export default ArtistPage;
