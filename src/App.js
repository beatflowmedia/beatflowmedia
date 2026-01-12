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

export default function App() {
  // Attach cleanup function to window on component mount
  React.useEffect(() => {
    window.cleanupPlaylistDuplicates = cleanupPlaylistDuplicates;
    console.log('✅ cleanupPlaylistDuplicates() is available in console');
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