import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const useFollowArtist = (selectedArtist) => {
  const { followArtist, unfollowArtist, isArtistFollowed } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (selectedArtist) {
        const result = await isArtistFollowed(selectedArtist);
        setIsFollowing(result);
      }
    };
    checkFollowStatus();
  }, [selectedArtist]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleFollow = async () => {
    try {
      if (isFollowing) {
        await unfollowArtist(selectedArtist);
      } else {
        await followArtist(selectedArtist);
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error("Error toggling follow state:", error);
    }
  };

  return { isFollowing, toggleFollow };
};

export default useFollowArtist;
