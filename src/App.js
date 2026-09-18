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
import { fixAlbumCovers } from "./utils/fixAlbumCovers"; // Fix missing album covers
import { fixCatalogPrices } from "./utils/fixCatalogPrices"; // Realign Firestore prices with pricing.js
import { createMissingAlbums } from "./utils/createMissingAlbums"; // Create albums from orphaned songs
import { diagnoseSongStorage } from "./utils/diagnoseSongStorage"; // Diagnose storage/Firestore alignment
import { standardizeFirebaseStorage, auditStorageStructure, migrateFirestoreDocuments } from "./utils/standardizeFirebaseStorage"; // Standardize Firebase
import { migrateAllSongs, migrateSong } from "./utils/migrateStorageBrowser"; // Browser-based storage migration
import { auditFirestoreCollections, purgeFirestoreCollections, auditFirebaseStorage, purgeFirebaseStorage, purgeAllFirebase } from "./utils/purgeFirebase"; // Firebase cleanup
import { minimalCleanup, deleteDuplicates, deleteUnimplemented } from "./utils/minimalCleanup"; // Minimal recommended cleanup

export default function App() {
  // Attach utility functions to window on component mount
  React.useEffect(() => {
    window.cleanupPlaylistDuplicates = cleanupPlaylistDuplicates;
    window.initializePlatformStats = initializePlatformStats;
    window.cleanupDuplicateCollections = cleanupDuplicateCollections;
    window.migrateArtistImages = migrateArtistImages;
    window.fixAlbumCovers = fixAlbumCovers;
    window.fixCatalogPrices = fixCatalogPrices;
    window.createMissingAlbums = createMissingAlbums;
    window.diagnoseSongStorage = diagnoseSongStorage;
    window.standardizeFirebaseStorage = standardizeFirebaseStorage;
    window.auditStorageStructure = auditStorageStructure;
    window.migrateFirestoreDocuments = migrateFirestoreDocuments;
    window.migrateAllSongs = migrateAllSongs;
    window.migrateSong = migrateSong;
    window.auditFirestoreCollections = auditFirestoreCollections;
    window.purgeFirestoreCollections = purgeFirestoreCollections;
    window.auditFirebaseStorage = auditFirebaseStorage;
    window.purgeFirebaseStorage = purgeFirebaseStorage;
    window.purgeAllFirebase = purgeAllFirebase;
    window.minimalCleanup = minimalCleanup;
    window.deleteDuplicates = deleteDuplicates;
    window.deleteUnimplemented = deleteUnimplemented;
    console.log('✅ cleanupPlaylistDuplicates() is available in console');
    console.log('✅ initializePlatformStats() is available in console');
    console.log('✅ cleanupDuplicateCollections() is available in console');
    console.log('✅ migrateArtistImages() is available in console');
    console.log('✅ fixAlbumCovers() is available in console');
    console.log("✅ fixCatalogPrices() is available in console - DRY RUN by default; { apply: true } writes");
    console.log('✅ createMissingAlbums() is available in console');
    console.log('✅ diagnoseSongStorage() is available in console - Run to check storage/DB sync');
    console.log('✅ standardizeFirebaseStorage() is available in console - STANDARDIZE STORAGE');
    console.log('✅ migrateAllSongs() is available in console - MIGRATE FILES (browser-based)');
    console.log('✅ purgeAllFirebase() is available in console - 🗑️  PURGE UNUSED DATA');
    console.log('✅ minimalCleanup() is available in console - ⭐ RECOMMENDED CLEANUP');
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