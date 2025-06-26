import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../context/AuthContext";

const ArtistDashboard = () => {
  const { user } = useAuth();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSong, setEditingSong] = useState(null);
  const [form, setForm] = useState({ title: "", coverUrl: "", audioUrl: "" });
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  useEffect(() => {
    const fetchSongs = async () => {
      if (!user) return;
      const q = query(collection(db, "artistSubmissions"), where("uid", "==", user.uid));
      const snapshot = await getDocs(q);
      const songList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSongs(songList);
      setLoading(false);
    };

    fetchSongs();
  }, [user]);

  // Fetch playlists for submission (replace with your playlist source)
  useEffect(() => {
    const fetchPlaylists = async () => {
      // Example: fetch from Firestore 'playlists' collection
      const q = query(collection(db, "playlists"));
      const snapshot = await getDocs(q);
      setPlaylists(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchPlaylists();
  }, []);

  const startEditing = (song) => {
    setEditingSong(song);
    setForm({
      title: song.title || "",
      coverUrl: song.coverUrl || "",
      audioUrl: song.audioUrl || "",
    });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!editingSong) return;
    const ref = doc(db, "artistSubmissions", editingSong.id);
    await updateDoc(ref, form);
    setEditingSong(null);
    setSongs((prev) => prev.map((s) => (s.id === editingSong.id ? { ...s, ...form } : s)));
  };

  const openSubmitModal = (song) => {
    setSelectedSong(song);
    setShowSubmitModal(true);
    setSelectedPlaylist("");
    setSubmitMessage("");
  };

  const handleSubmitToPlaylist = async () => {
    if (!selectedPlaylist || !selectedSong) return;
    setSubmitting(true);
    setSubmitMessage("");
    try {
      const res = await fetch("/.netlify/functions/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.uid,
        },
        body: JSON.stringify({ songId: selectedSong.id, playlistId: selectedPlaylist }),
      });
      if (res.ok) {
        setSubmitMessage("Submitted successfully!");
      } else {
        setSubmitMessage("Submission failed.");
      }
    } catch (e) {
      setSubmitMessage("Submission error.");
    }
    setSubmitting(false);
  };

  if (loading) return <div className="p-6 text-white">Loading your songs...</div>;

  return (
    <div className="p-6 text-white max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Your Songs</h1>
      {songs.length === 0 && <p className="text-gray-400">You haven't uploaded any songs yet.</p>}

      {songs.map((song) => (
        <div key={song.id} className="bg-gray-800 p-4 rounded mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">{song.title}</h2>
              <p className="text-sm text-gray-400">{song.audioUrl}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => startEditing(song)}
                className="text-sm bg-blue-500 px-3 py-1 rounded hover:bg-blue-600"
              >
                Edit
              </button>
              <button
                onClick={() => openSubmitModal(song)}
                className="text-sm bg-green-500 px-3 py-1 rounded hover:bg-green-600"
              >
                Submit to Playlists
              </button>
            </div>
          </div>
        </div>
      ))}

      {editingSong && (
        <div className="mt-8 bg-gray-900 p-6 rounded">
          <h2 className="text-2xl font-bold mb-4">Edit Song</h2>
          <div className="space-y-4">
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Song Title"
              className="w-full p-2 bg-gray-800 rounded"
            />
            <input
              name="coverUrl"
              value={form.coverUrl}
              onChange={handleChange}
              placeholder="Cover Image URL"
              className="w-full p-2 bg-gray-800 rounded"
            />
            <input
              name="audioUrl"
              value={form.audioUrl}
              onChange={handleChange}
              placeholder="Audio File URL"
              className="w-full p-2 bg-gray-800 rounded"
            />
            <div className="flex gap-4">
              <button
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                Save
              </button>
              <button
                onClick={() => setEditingSong(null)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Submit "{selectedSong?.title}" to Playlist</h2>
            <select
              className="w-full p-2 mb-4 bg-gray-800 rounded"
              value={selectedPlaylist}
              onChange={(e) => setSelectedPlaylist(e.target.value)}
            >
              <option value="">Select a playlist</option>
              {playlists.map((pl) => (
                <option key={pl.id} value={pl.id}>{pl.name}</option>
              ))}
            </select>
            <div className="flex gap-4">
              <button
                onClick={handleSubmitToPlaylist}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
            {submitMessage && <div className="mt-4 text-center text-sm">{submitMessage}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtistDashboard;
