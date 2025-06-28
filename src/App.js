// src/App.js
import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { PlaybackProvider } from "./context/PlaybackContext";
import AppRoutes from "./AppRoutes";
import "./index.css"; // Tailwind or global styles

export default function App() {
  return (
    <AuthProvider>
      <PlaybackProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </PlaybackProvider>
    </AuthProvider>
  );
}
