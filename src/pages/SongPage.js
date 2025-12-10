// src/pages/SongPage.js
import React, { useEffect, useState , useMemo } from "react";
import { useParams } from "react-router-dom";
import PlayButton from "../components/PlayButton";
import LikeButton from "../components/LikeButton";
import { useAuth } from "../context/AuthContext";
import musicData from "../musicData.json";
import PropTypes from 'prop-types';

function SongPage({ onPlaySong, onToggleFavorite }) {
  const { id } = useParams();
  const { user, signInWithGoogle } = useAuth();
  const song = useMemo(() => musicData.find((s) => String(s.id) === id), [id]);
  const [isLiked, setIsLiked] = useState(false);

  // 1) If the song exists, queue it on mount
  useEffect(() => {
    if (song) {
      onPlaySong(song);
    }
  }, [song, onPlaySong]);

  // 2) Keep local like state in sync with user profile
  useEffect(() => {
    setIsLiked(user?.likes?.includes(song?.id) ?? false);
  }, [user, song]);

  if (!song) {
    return (
      <div className="p-6 text-white">
        <h2 className="text-2xl">Song not found</h2>
      </div>
    );
  }

  const handleToggle = async () => {
    if (!user) {
      // redirect into Google sign-in flow if unauthenticated
      await signInWithGoogle();
      return;
    }
    // Optimistically update UI
    setIsLiked((prev) => !prev);
    onToggleFavorite(song);
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-4">{song.title}</h1>
      <p className="text-gray-400 mb-4">by {song.artist}</p>

      <div className="flex items-center space-x-4">
        <PlayButton
          isPlaying={false}
          onClick={() => onPlaySong(song)}
          size={32}
        />
        <LikeButton
          item={song}
          isLiked={isLiked}
          onToggleFavorite={handleToggle}
          size={24}
        />
      </div>

      <div className="mt-6">
        <img
          src={song.cover || "https://via.placeholder.com/300"}
          alt={song.title}
          className="rounded-lg max-w-full"
        />
      </div>

      <div className="mt-6">
        <h2 className="text-2xl font-semibold">Lyrics / Details</h2>
        <p className="text-gray-300 mt-2">
          {/* TODO: Populate with actual lyrics or additional metadata */}
          No lyrics available.
        </p>
      </div>
    </div>
  );
}

SongPage.propTypes = {
  /** Callback to queue/play a song */
  onPlaySong: PropTypes.func.isRequired,
  /** Callback to toggle like/unlike in parent state */
  onToggleFavorite: PropTypes.func.isRequired
};

export default React.memo(SongPage);
