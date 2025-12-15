// src/components/AdminMusicUpload.js
import { useState } from "react";
import { uploadSongWithMetadata } from "../services/ingestionService";
import { showSuccessToast, showErrorToast } from "../utils/Toast";

const AdminMusicUpload = () => {
  // Form fields state
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [category, setCategory] = useState("R&B");
  const [biography, setBiography] = useState("");
  const [credits, setCredits] = useState("");
  const [onTour, setOnTour] = useState("");
  const [nextInQueueTitle, setNextInQueueTitle] = useState("");
  const [nextInQueueArtist, setNextInQueueArtist] = useState("");
  const [nextInQueueCover, setNextInQueueCover] = useState("");
  const [videoSrc, setVideoSrc] = useState("");
  const [videoPoster, setVideoPoster] = useState("");
  const [musicFile, setMusicFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);

  // Handler for uploading a new song (delegated to ingestion service)
  const handleUpload = async (e) => {
    e.preventDefault();
    try {
      await uploadSongWithMetadata({
        title,
        artist,
        category,
        biography,
        credits,
        onTour,
        nextInQueueTitle,
        nextInQueueArtist,
        nextInQueueCover,
        videoSrc,
        videoPoster,
        musicFile,
        coverFile
      });
      showSuccessToast("Song uploaded successfully!");
      // Reset form fields
      setTitle("");
      setArtist("");
      setCategory("R&B");
      setBiography("");
      setCredits("");
      setOnTour("");
      setNextInQueueTitle("");
      setNextInQueueArtist("");
      setNextInQueueCover("");
      setVideoSrc("");
      setVideoPoster("");
      setMusicFile(null);
      setCoverFile(null);
    } catch (error) {
      console.error("Error uploading song:", error);
      showErrorToast("Failed to upload song.");
    }
  };

  // Handler to trigger music data update (via an API endpoint)
  const handleUpdateMusicData = async () => {
    try {
      const response = await fetch("/api/updateMusicData", {
        method: "POST"
      });
      if (!response.ok) throw new Error("Failed to update music data");
      showSuccessToast("Music data updated successfully.");
    } catch (error) {
      console.error("Error updating music data:", error);
      showErrorToast(error.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-gray-800 text-white rounded-lg mt-10">
      <h2 className="text-2xl font-bold mb-4">Admin Music Upload</h2>
      <form onSubmit={handleUpload} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block mb-1">Title:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 rounded text-black"
            required
          />
        </div>
        {/* Artist */}
        <div>
          <label className="block mb-1">Artist:</label>
          <input
            type="text"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            className="w-full p-2 rounded text-black"
            required
          />
        </div>
        {/* Category Dropdown */}
        <div>
          <label className="block mb-1">Category:</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-2 rounded text-black"
          >
            <option value="R&B">R&B</option>
            <option value="Pop">Pop</option>
            <option value="Rock">Rock</option>
            <option value="Jazz">Jazz</option>
            <option value="Hip-Hop">Hip-Hop</option>
          </select>
        </div>
        {/* Biography */}
        <div>
          <label className="block mb-1">Biography:</label>
          <textarea
            value={biography}
            onChange={(e) => setBiography(e.target.value)}
            className="w-full p-2 rounded text-black"
            rows="3"
          />
        </div>
        {/* Credits */}
        <div>
          <label className="block mb-1">Credits (comma-separated):</label>
          <input
            type="text"
            value={credits}
            onChange={(e) => setCredits(e.target.value)}
            className="w-full p-2 rounded text-black"
            placeholder="e.g. Producer X, Composer Y"
          />
        </div>
        {/* On Tour */}
        <div>
          <label className="block mb-1">
            On Tour (separate entries with ";" and each as "date, location,
            venue"):
          </label>
          <input
            type="text"
            value={onTour}
            onChange={(e) => setOnTour(e.target.value)}
            className="w-full p-2 rounded text-black"
            placeholder="e.g. 2023-05-10, New York, MSG; 2023-06-15, Los Angeles, Hollywood Bowl"
          />
        </div>
        {/* Next in Queue */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block mb-1">Next in Queue - Title:</label>
            <input
              type="text"
              value={nextInQueueTitle}
              onChange={(e) => setNextInQueueTitle(e.target.value)}
              className="w-full p-2 rounded text-black"
              placeholder="Next song title"
            />
          </div>
          <div>
            <label className="block mb-1">Next in Queue - Artist:</label>
            <input
              type="text"
              value={nextInQueueArtist}
              onChange={(e) => setNextInQueueArtist(e.target.value)}
              className="w-full p-2 rounded text-black"
              placeholder="Next song artist"
            />
          </div>
          <div>
            <label className="block mb-1">Next in Queue - Cover URL:</label>
            <input
              type="text"
              value={nextInQueueCover}
              onChange={(e) => setNextInQueueCover(e.target.value)}
              className="w-full p-2 rounded text-black"
              placeholder="Cover image URL"
            />
          </div>
        </div>
        {/* Video Source and Poster */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">Video Source URL:</label>
            <input
              type="text"
              value={videoSrc}
              onChange={(e) => setVideoSrc(e.target.value)}
              className="w-full p-2 rounded text-black"
              placeholder="Video URL (optional)"
            />
          </div>
          <div>
            <label className="block mb-1">Video Poster URL:</label>
            <input
              type="text"
              value={videoPoster}
              onChange={(e) => setVideoPoster(e.target.value)}
              className="w-full p-2 rounded text-black"
              placeholder="Video poster URL (optional)"
            />
          </div>
        </div>
        {/* File Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">Music File (.mp3):</label>
            <input
              type="file"
              accept=".mp3"
              onChange={(e) => setMusicFile(e.target.files[0])}
              className="w-full p-2 rounded text-black"
            />
          </div>
          <div>
            <label className="block mb-1">Cover Image File:</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files[0])}
              className="w-full p-2 rounded text-black"
            />
          </div>
        </div>
        {/* Upload Button */}
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-white font-semibold"
        >
          Upload Song
        </button>
      </form>

      {/* Button to trigger updateMusicData.js via API */}
      <div className="mt-8">
        <button
          onClick={handleUpdateMusicData}
          className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded text-white font-semibold"
        >
          Update Music Data
        </button>
      </div>
    </div>
  );
};

export default AdminMusicUpload;
