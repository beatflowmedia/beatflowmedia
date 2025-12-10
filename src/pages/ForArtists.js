import React, { useState, useEffect } from "react";
import {
  db,
  storage,
  auth,
  signInWithPopup,
  provider
} from "../firebaseConfig";
import { collection, Timestamp, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";

const initialForm = {
  artist: "",
  title: "",
  genre: "",
  bio: "",
  cover: null,
  song: null
};

export default function ArtistUploadForm() {
  const [form, setForm] = useState(initialForm);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(() => auth.currentUser);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(setUser);
    return unsub;
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      setStatus("Sign-in failed.");
      console.error("SIGN IN ERROR:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((f) => ({ ...f, [name]: files?.[0] || value }));
    if (name === "cover" && files?.[0])
      setPreview(URL.createObjectURL(files[0]));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    setLoading(true);

    if (!form.artist || !form.title || !form.genre || !form.song) {
      setStatus("Fill in all required fields.");
      setLoading(false);
      return;
    }

    try {
      if (!auth.currentUser) throw new Error("You must be signed in.");

      let coverUrl = "";
      if (form.cover) {
        const coverRef = ref(
          storage,
          `artist-uploads/covers/${Date.now()}_${form.cover.name}`,
        );
        await uploadBytes(coverRef, form.cover);
        coverUrl = await getDownloadURL(coverRef);
      }

      const audioRef = ref(
        storage,
        `artist-uploads/audio/${Date.now()}_${form.song.name}`,
      );
      await uploadBytes(audioRef, form.song);
      const audioUrl = await getDownloadURL(audioRef);

      await addDoc(collection(db, "artistSubmissions"), {
        artist: form.artist,
        title: form.title,
        genre: form.genre,
        bio: form.bio,
        coverUrl,
        audioUrl,
        uploadedBy: user.uid,
        submittedAt: Timestamp.now(),
        status: "pending"
      });

      setForm(initialForm);
      setPreview(null);
      setStatus("✅ Song uploaded! Redirecting...");
      setTimeout(() => navigate("/"), 1000);
    } catch (err) {
      setStatus("❌ Upload failed. " + (err?.message || ""));
      console.error("UPLOAD ERROR:", err);
    }

    setLoading(false);
  };

  if (!user) {
    return (
      <div className="bg-gray-900 max-w-lg mx-auto rounded-2xl shadow-xl p-8 mt-10 text-white text-center">
        <h2 className="text-2xl font-bold mb-4">Sign in to Upload Your Song</h2>
        <button
          onClick={handleSignIn}
          className="py-2 px-4 rounded-xl font-bold bg-yellow-400 text-gray-900 hover:bg-yellow-300 transition"
        >
          Sign in with Google
        </button>
        {status && <div className="mt-4 text-center text-sm">{status}</div>}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-900 max-w-lg mx-auto rounded-2xl shadow-xl p-8 mt-10 text-white space-y-6"
      encType="multipart/form-data"
    >
      <div className="mb-3 text-right text-xs text-gray-400">
        Signed in as <span className="font-semibold">{user.email}</span>
      </div>
      <h2 className="text-2xl font-bold mb-4">Upload Your Song</h2>
      <input
        name="artist"
        required
        value={form.artist}
        onChange={handleChange}
        placeholder="Artist Name*"
        className="w-full p-2 mb-2 rounded bg-gray-800 border border-gray-700"
      />
      <input
        name="title"
        required
        value={form.title}
        onChange={handleChange}
        placeholder="Song Title*"
        className="w-full p-2 mb-2 rounded bg-gray-800 border border-gray-700"
      />
      <input
        name="genre"
        required
        value={form.genre}
        onChange={handleChange}
        placeholder="Genre*"
        className="w-full p-2 mb-2 rounded bg-gray-800 border border-gray-700"
      />
      <textarea
        name="bio"
        value={form.bio}
        onChange={handleChange}
        placeholder="Bio / Description (optional)"
        className="w-full p-2 mb-2 rounded bg-gray-800 border border-gray-700"
      />
      <input
        type="file"
        name="cover"
        accept="image/*"
        onChange={handleChange}
        className="block mb-2"
      />
      {preview && (
        <img src={preview} alt="Preview" className="h-24 rounded mb-2" />
      )}
      <input
        type="file"
        name="song"
        accept="audio/*"
        required
        onChange={handleChange}
        className="block mb-2"
      />
      <button
        disabled={loading}
        type="submit"
        className={`w-full py-2 mt-2 rounded-xl font-bold bg-yellow-400 text-gray-900 hover:bg-yellow-300 ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        {loading ? "Uploading..." : "Upload Song"}
      </button>
      {status && <div className="mt-2 text-center text-sm">{status}</div>}
    </form>
  );
}
