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
      console.log('Toggle follow:', { playlistId, isFollowing });
      if (isFollowing) {
        console.log('Unfollowing playlist...');
        await unfollowPlaylist(playlistId);
        console.log('Unfollowed successfully');
      } else {
        console.log('Following playlist...');
        await followPlaylist(playlistId);
        console.log('Followed successfully');
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error("Error toggling playlist follow state:", error);
    }
  };

  return { isFollowing, toggleFollow };
};

export default useFollowPlaylist;
