// AdminPanel.js
// ------------------------------------------------------
// A simple admin interface for updating music data.
// You can include dropdowns, checkboxes, text fields, etc.
// For now, we include a couple of fields and an "Update Music Data" button.
// ------------------------------------------------------
import React, { useState } from "react";
import { showSuccessToast, showErrorToast } from "../utils/Toast";

const AdminPanel = () => {
  // Example form state – expand as needed
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [fileName, setFileName] = useState("");
  const [cover, setCover] = useState("");
  const [category, setCategory] = useState("R&B");
  const [biography, setBiography] = useState("No biography available.");
  // (Add more fields if necessary)

  // This function simulates updating the music data.
  // In a real-world scenario you might call a secure API endpoint that runs updateMusicData.js.
  const handleUpdateMusicData = async () => {
    try {
      // For now, just log the new record.
      const newRecord = {
        title,
        artist,
        fileName,
        cover,
        category,
        biography,
        // Add default dummy data for missing fields:
        credits: [],
        onTour: [],
        nextInQueue: null,
        videoSrc: null,
        videoPoster: null,
      };
      console.log("New music record to add:", newRecord);

      // Show a success toast message.
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
            <label className="block text-sm font-semibold mb-1" htmlFor="title">
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
            <label className="block text-sm font-semibold mb-1" htmlFor="artist">
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
            <label className="block text-sm font-semibold mb-1" htmlFor="fileName">
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
          {/* You can add additional fields for cover, category, biography, etc. */}
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
