// src/App.js
import React from "react";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AuthProvider } from "./context/AuthContext";
import { PlayerProvider } from "./context/PlayerContext";
import AppRoutes from "./AppRoutes";
import beatflowTheme from "./theme/muiTheme";
import "./index.css"; // Tailwind or global styles

export default function App() {
  return (
    <ThemeProvider theme={beatflowTheme}>
      <CssBaseline />
      <AuthProvider>
        <PlayerProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </PlayerProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}