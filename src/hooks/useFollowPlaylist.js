import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const useFollowPlaylist = (playlistId) => {
  const { followPlaylist, unfollowPlaylist, isPlaylistFollowed } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (playlistId) {
      const result = isPlaylistFollowed(playlistId);
      setIsFollowing(result);
    } else {
      setIsFollowing(false);
    }
  }, [playlistId, isPlaylistFollowed]);

  const toggleFollow = async () => {
    try {
      if (isFollowing) {
        await unfollowPlaylist(playlistId);
      } else {
        await followPlaylist(playlistId);
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error("Error toggling playlist follow state:", error);
    }
  };

  return { isFollowing, toggleFollow };
};

export default useFollowPlaylist;
