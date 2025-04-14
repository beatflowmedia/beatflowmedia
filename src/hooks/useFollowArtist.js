import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { showSuccessToast } from "../utils/Toast";

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
  }, [selectedArtist, isArtistFollowed]);

  const toggleFollow = async () => {
    try {
      if (isFollowing) {
        await unfollowArtist(selectedArtist);
        showSuccessToast(`Unfollowed ${selectedArtist}`);
      } else {
        await followArtist(selectedArtist);
        showSuccessToast(`Followed ${selectedArtist}`);
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error("Error toggling follow state:", error);
    }
  };

  return { isFollowing, toggleFollow };
};

export default useFollowArtist;
