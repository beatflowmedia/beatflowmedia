// src/pages/SongPage.js

import React from 'react';
import { useParams, useHistory } from 'react-router-dom';
import PlayButton from '../components/PlayButton';
import LikeButton from '../components/LikeButton';
import { useAuth } from '../context/AuthContext';
import musicData from '../musicData.json';

export default function SongPage() {
  const { id } = useParams();
  const history = useHistory();
  const song = musicData.find((s) => String(s.id) === id);
  const { user, signInWithGoogle } = useAuth();

  if (!song) {
    return <div className="p-6 text-white">Song not found.</div>;
  }

  // wrapper for the “toggle favorite” flow
  const handleToggleFavorite = (song) => {
    if (!user) {
      // not signed in yet — send them to your auth flow
      signInWithGoogle()
        .then(() => {
          // after sign-in, you could optionally auto-like:
          // onToggleFavorite(song)
        })
        .catch((err) => {
          console.error("Sign-in failed:", err);
        });
    } else {
      // if you had a prop onToggleFavorite passed in, call it here.
      // e.g. props.onToggleFavorite(song)
      // since you don’t, we’ll just console.log for demo:
      console.log(user.email, "toggled favorite on", song.title);
    }
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-4">{song.title}</h1>
      <p className="text-gray-400 mb-4">by {song.artist}</p>

      <div className="flex items-center">
        <PlayButton isPlaying={false} onClick={() => {}} size={32} />

        <div className="ml-4">
          <LikeButton
            item={song}
            isLiked={false /* derive from your likes state */}
            onToggleFavorite={handleToggleFavorite}
            size={24}
          />
        </div>
      </div>

      <div className="mt-6">
        <img
          src={song.cover || 'https://via.placeholder.com/300'}
          alt={song.title}
          className="rounded-lg max-w-full"
        />
      </div>

      <div className="mt-6">
        <h2 className="text-2xl font-semibold">Lyrics / Details</h2>
        <p className="text-gray-300 mt-2">{/* … */}</p>
      </div>
    </div>
  );
}
