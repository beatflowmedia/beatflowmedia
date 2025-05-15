// src/pages/SongPage.js
import React from 'react';
import { useParams } from 'react-router-dom';
import PlayButton from '../components/PlayButton';
import LikeButton from '../components/LikeButton';
import musicData from '../musicData.json';

export default function SongPage() {
  const { id } = useParams();
  const song = musicData.find((s) => String(s.id) === id);

  if (!song) {
    return <div className="p-6 text-white">Song not found.</div>;
  }

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-4">{song.title}</h1>
      <p className="text-gray-400 mb-4">by {song.artist}</p>

      <div className="flex items-center space-x-4 mb-6">
        <PlayButton
          isPlaying={false}
          onClick={() => {}}
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
        className="rounded-lg mb-6 max-w-full"
      />

      <section>
        <h2 className="text-2xl font-semibold mb-2">Lyrics / Details</h2>
        <p className="text-gray-300">
          {/* TODO: render actual lyrics or extra metadata here */}
          No additional details available.
        </p>
      </section>
    </div>
  );
}
