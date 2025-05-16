// src/pages/SongPage.js
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PlayButton from '../components/PlayButton';
import LikeButton from '../components/LikeButton';
import { useAuth } from '../context/AuthContext';
import musicData from '../musicData.json';

export default function SongPage({ history }) {
  const { id } = useParams();
  const song = musicData.find((s) => String(s.id) === id);
  const { user } = useAuth(); // if you want to gate liking

  // Optional: auto-play when landing here
  useEffect(() => {
    if (song) {
      // emit an event, context call, or localStorage flag that MusicPlayer can pick up
      window.dispatchEvent(new CustomEvent('PLAY_SONG', { detail: song }));
    }
  }, [song]);

  if (!song) {
    return <div className="p-6 text-white">Song not found.</div>;
  }

  return (
    <div className="p-6 text-white">
      <button
        onClick={() => history.goBack()}
        className="mb-4 text-sm text-gray-400 hover:text-white"
      >
        ← Back
      </button>

      <h1 className="text-3xl font-bold mb-2">{song.title}</h1>
      <p className="text-gray-400 mb-4">by {song.artist}</p>

      <div className="flex items-center space-x-4 mb-6">
        <PlayButton
          isPlaying={false}
          onClick={() => window.dispatchEvent(new CustomEvent('PLAY_SONG', { detail: song }))}
          size={32}
        />
        <LikeButton
          item={song}
          isLiked={false}
          onToggleFavorite={() => {}}
          size={24}
        />
      </div>

      <img
        src={song.cover || 'https://via.placeholder.com/300'}
        alt={song.title}
        className="rounded-lg max-w-full mb-6"
      />

      <section>
        <h2 className="text-2xl font-semibold mb-2">Details</h2>
        <p className="text-gray-300">
          Album: {song.album || 'Unknown'}<br />
          Year: {song.year || 'N/A'}<br />
          {/* insert any other metadata or lyrics here */}
        </p>
      </section>
    </div>
  );
}
