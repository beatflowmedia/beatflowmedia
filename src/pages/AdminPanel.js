import React, { useState } from "react";
import { showSuccessToast, showErrorToast } from "../utils/Toast";

const AdminPanel = () => {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [fileName, setFileName] = useState("");
  const [cover, setCover] = useState("");
  const [category, setCategory] = useState("R&B");
  const [biography, setBiography] = useState("No biography available.");

  const handleUpdateMusicData = async () => {
    try {
      const newRecord = {
        title,
        artist,
        fileName,
        cover,
        category,
        biography,
        credits: [],
        onTour: [],
        nextInQueue: null,
        videoSrc: null,
        videoPoster: null,
      };
      console.log("New music record to add:", newRecord);
      showSuccessToast("Music data updated successfully!");
    } catch (error) {
      console.error("Error updating music data:", error);
      showErrorToast("Error updating music data");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Admin Panel</h1>
      <div className="bg-gray-800 p-4 rounded-lg">
        <h2 className="text-xl mb-4">Update Music Data</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-semibold mb-1">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter song title"
              className="w-full p-2 rounded bg-gray-700 text-white"
            />
          </div>
          <div>
            <label htmlFor="artist" className="block text-sm font-semibold mb-1">
              Artist
            </label>
            <input
              id="artist"
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Enter artist name"
              className="w-full p-2 rounded bg-gray-700 text-white"
            />
          </div>
          <div>
            <label htmlFor="fileName" className="block text-sm font-semibold mb-1">
              File Name
            </label>
            <input
              id="fileName"
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Enter file name (with .mp3)"
              className="w-full p-2 rounded bg-gray-700 text-white"
            />
          </div>
          <div>
            <label htmlFor="cover" className="block text-sm font-semibold mb-1">
              Cover URL
            </label>
            <input
              id="cover"
              type="text"
              value={cover}
              onChange={(e) => setCover(e.target.value)}
              placeholder="Enter album cover URL"
              className="w-full p-2 rounded bg-gray-700 text-white"
            />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-semibold mb-1">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white"
            >
              <option>R&B</option>
              <option>Hip-Hop</option>
              <option>Electronic</option>
              <option>Pop</option>
              <option>Rock</option>
            </select>
          </div>
          <div>
            <label htmlFor="biography" className="block text-sm font-semibold mb-1">
              Biography
            </label>
            <textarea
              id="biography"
              value={biography}
              onChange={(e) => setBiography(e.target.value)}
              placeholder="Write a short artist bio"
              className="w-full p-2 rounded bg-gray-700 text-white"
              rows={4}
            />
          </div>
          <button
            onClick={handleUpdateMusicData}
            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded mt-4"
          >
            Update Music Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
