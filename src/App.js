// src/App.js
import React from "react";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AuthProvider } from "./context/AuthContext";
import { LikesProvider } from "./context/LikesContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { PlayerProvider } from "./context/PlayerContext";
import { ModalProvider } from "./context/ModalContext";
import AppRoutes from "./AppRoutes";
import beatflowTheme from "./theme/muiTheme";
import "./index.css"; // Tailwind or global styles
import { cleanupPlaylistDuplicates } from "./utils/cleanupPlaylistDuplicates"; // Make cleanup function available in console
import { initializePlatformStats } from "./utils/initializePlatformStats"; // Platform stats initialization
import { cleanupDuplicateCollections } from "./utils/cleanupDuplicateCollections"; // Duplicate collections cleanup
import { migrateArtistImages } from "./utils/migrateArtistImages"; // Artist image migration

export default function App() {
  // Attach utility functions to window on component mount
  React.useEffect(() => {
    window.cleanupPlaylistDuplicates = cleanupPlaylistDuplicates;
    window.initializePlatformStats = initializePlatformStats;
    window.cleanupDuplicateCollections = cleanupDuplicateCollections;
    window.migrateArtistImages = migrateArtistImages;
    console.log('✅ cleanupPlaylistDuplicates() is available in console');
    console.log('✅ initializePlatformStats() is available in console');
    console.log('✅ cleanupDuplicateCollections() is available in console');
    console.log('✅ migrateArtistImages() is available in console');
  }, []);

  return (
    <HelmetProvider>
      <ThemeProvider theme={beatflowTheme}>
        <CssBaseline />
        <ModalProvider>
          <AuthProvider>
            <LikesProvider>
              <FavoritesProvider>
                <PlayerProvider>
                  <BrowserRouter>
                    <AppRoutes />
                  </BrowserRouter>
                </PlayerProvider>
              </FavoritesProvider>
            </LikesProvider>
          </AuthProvider>
        </ModalProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}