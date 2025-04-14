// src/pages/ArtistPage.js
import React, { useState, useMemo } from "react";
import musicData from "../musicData.json";
import { buildArtistInfo } from "../utils/buildArtistInfo";
import RightPanel from "../components/RightPanel";

function ArtistPage() {
  const [panelVisible, setPanelVisible] = useState(false);
  // Choose the artist you want to build info for (e.g., "Percy Rice")
  const selectedArtistName = "Percy Rice";

  // Build the artist info object from musicData.json
  const artistInfo = useMemo(
    () => buildArtistInfo(selectedArtistName, musicData),
    [selectedArtistName, musicData]
  );

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
