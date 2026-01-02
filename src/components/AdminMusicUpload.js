// src/components/AdminMusicUpload.js
import { useState } from "react";
import { uploadSongWithMetadata } from "../services/ingestionService";
import { showSuccessToast, showErrorToast } from "../utils/Toast";
import WriterForm from "./WriterForm";

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

  // Multi-writer splits
  const [writers, setWriters] = useState([]);
  const [showWriterForm, setShowWriterForm] = useState(false);

  // Writer management
  const addWriter = (writer) => {
    setWriters([...writers, writer]);
    setShowWriterForm(false);
  };

  const removeWriter = (index) => {
    setWriters(writers.filter((_, i) => i !== index));
  };

  const getTotalSplit = () => {
    return writers.reduce((sum, w) => sum + w.split, 0);
  };

  // Handler for uploading a new song (delegated to ingestion service)
  const handleUpload = async (e) => {
    e.preventDefault();

    // Validate writer splits if any
    if (writers.length > 0) {
      const totalSplit = getTotalSplit();
      if (Math.abs(totalSplit - 1.0) > 0.001) {
        showErrorToast(`Writer splits must total 100%. Current: ${(totalSplit * 100).toFixed(1)}%`);
        return;
      }
    }

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
        coverFile,
        writers: writers.length > 0 ? writers : []
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
      setWriters([]);
    } catch (error) {
      console.error("Error uploading song:", error);
      showErrorToast(error.message || "Failed to upload song.");
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

        {/* Co-Writers Revenue Split */}
        <div className="border-t border-gray-600 pt-4 mt-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold">Co-Writers (Revenue Split)</h3>
            {!showWriterForm && (
              <button
                type="button"
                onClick={() => setShowWriterForm(true)}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
              >
                + Add Co-Writer
              </button>
            )}
          </div>

          {/* Current Writers List */}
          {writers.length > 0 && (
            <div className="bg-gray-700 p-4 rounded-lg mb-3">
              <p className="text-sm text-gray-300 mb-2">
                Total Allocated: {(getTotalSplit() * 100).toFixed(1)}%
                {getTotalSplit() < 1.0 && (
                  <span className="text-yellow-400 ml-2">
                    (Remaining: {((1.0 - getTotalSplit()) * 100).toFixed(1)}%)
                  </span>
                )}
              </p>
              <div className="space-y-2">
                {writers.map((writer, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center bg-gray-800 p-3 rounded"
                  >
                    <div>
                      <p className="font-semibold">{writer.name}</p>
                      <p className="text-xs text-gray-400">{writer.userId}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-green-400 font-bold">
                        {(writer.split * 100).toFixed(1)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => removeWriter(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Writer Form */}
          {showWriterForm && (
            <WriterForm
              onAdd={addWriter}
              onCancel={() => setShowWriterForm(false)}
              existingWriters={writers}
            />
          )}

          {writers.length === 0 && !showWriterForm && (
            <p className="text-sm text-gray-400">
              No co-writers added. If this is a solo track, you can skip this section.
            </p>
          )}
        </div>

        {/* Upload Button */}
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-white font-semibold mt-4"
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
