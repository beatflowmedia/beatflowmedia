import React, { createContext, useContext, useState } from "react";

const PlaybackContext = createContext();

export const PlaybackProvider = ({ children }) => {
  const [currentSongId, setCurrentSongId] = useState(null);
  const [duration, setDuration] = useState(0);

  return (
    <PlaybackContext.Provider
      value={{ currentSongId, setCurrentSongId, duration, setDuration }}
    >
      {children}
    </PlaybackContext.Provider>
  );
};

export const usePlayback = () => useContext(PlaybackContext);
