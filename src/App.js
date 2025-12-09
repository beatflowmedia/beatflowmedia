// src/App.js
import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { PlaybackProvider } from "./context/PlaybackContext";
import { PlayerProvider } from "./context/PlayerContext";
import AppRoutes from "./AppRoutes";
import "./index.css"; // Tailwind or global styles

export default function App() {
  return (
    <AuthProvider>
      <PlaybackProvider>
        <PlayerProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </PlayerProvider>
      </PlaybackProvider>
    </AuthProvider>
  );
}