import React, { memo, useState } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import PropTypes from 'prop-types';

/**
 * LikeButton renders a heart icon that users can click to like/unlike a song.
 * It handles authentication checks, Firestore updates via AuthContext,
 * and supports an optional onCountChange for optimistic UI updates.
 */
const LikeButton = ({
  item,
  isLiked,
  onToggleFavorite,
  onCountChange = () => {},
  size,
  className
}) => {
  const { user, signInWithGoogle, addLike, removeLike } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleClick = async (e) => {
    e.stopPropagation();
    if (!user) {
      signInWithGoogle();
      return;
    }
    if (!item?.id) return;

    setLoading(true);
    const songId = String(item.id);
    // Optimistically update UI count
    onCountChange(isLiked ? -1 : 1);

    try {
      if (isLiked) {
        await removeLike(songId);
      } else {
        await addLike(songId);
      }
      onToggleFavorite(item);
    } catch (error) {
      console.error("Error toggling like:", error);
      // rollback count on error
      onCountChange(isLiked ? 1 : -1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-label={!user ? "Sign in to like" : isLiked ? "Unlike" : "Like"}
      className={`focus:outline-none focus:ring-2 focus:ring-yellow-400 transition ${className}`}
    >
      {isLiked ? (
        <FaHeart size={size} className="text-red-500" />
      ) : (
        <FaRegHeart size={size} className="text-gray-400 hover:text-red-400" />
      )}
    </button>
  );
};

LikeButton.propTypes = {
  /** Song item; must have id */
  item: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
  }).isRequired,
  /** Whether currently liked */
  isLiked: PropTypes.bool,
  /** Callback to sync local favorite state */
  onToggleFavorite: PropTypes.func.isRequired,
  /** Optional callback to adjust global like count in parent */
  onCountChange: PropTypes.func,
  /** Icon size */
  size: PropTypes.number,
  /** Additional CSS classes */
  className: PropTypes.string
};

LikeButton.defaultProps = {
  isLiked: false,
  onCountChange: () => {},
  size: 20,
  className: ""
};

export default memo(LikeButton);
