// src/pages/AdminDashboard.js
import React from "react";
import usePendingSongs from "../hooks/usePendingSongs";

export default function AdminDashboard() {
  const { pending, approveSong } = usePendingSongs();

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-4">Pending Songs</h1>
      {pending.length === 0 && <p>No pending songs.</p>}

      <ul className="space-y-4">
        {pending.map((song) => (
          <li key={song.id} className="bg-gray-800 p-4 rounded">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">{song.title}</h3>
                <p className="text-sm text-gray-400">{song.artist}</p>
              </div>
              <button
                onClick={() => approveSong(song)}
                className="bg-green-500 px-4 py-2 rounded hover:bg-green-600"
              >
                Approve
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
