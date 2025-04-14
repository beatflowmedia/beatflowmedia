// index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Import your AuthProvider and PlaybackProvider
import { AuthProvider } from './context/AuthContext'; // adjust path as needed
import { PlaybackProvider } from './context/PlaybackContext'; // adjust path as needed

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <PlaybackProvider>
        <App />
      </PlaybackProvider>
    </AuthProvider>
  </React.StrictMode>
);

reportWebVitals();
