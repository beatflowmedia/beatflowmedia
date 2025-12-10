import { useState, useEffect, useCallback } from "react";
import { subscribeToCommercialBreakAds, getRandomCommercialAd } from "../utils/AdsHelper";

/**
 * Hook to manage commercial breaks between songs
 * @param {number} frequency - Show ad after X songs (default: 5)
 * @param {boolean} enabled - Whether commercial breaks are enabled (default: true)
 */
export const useCommercialBreaks = (frequency = 5, enabled = true) => {
  const [songsPlayed, setSongsPlayed] = useState(0);
  const [commercialAds, setCommercialAds] = useState([]);
  const [currentAd, setCurrentAd] = useState(null);
  const [isShowingAd, setIsShowingAd] = useState(false);
  const [adTimeRemaining, setAdTimeRemaining] = useState(0);

  // Subscribe to commercial break ads from Firebase
  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = subscribeToCommercialBreakAds((ads) => {
      setCommercialAds(ads);
      console.log(`📺 Loaded ${ads.length} commercial break ads`);
    });

    return () => unsubscribe();
  }, [enabled]);

  // Increment songs played counter
  const trackSongPlayed = useCallback(() => {
    if (!enabled) return;

    setSongsPlayed((prev) => {
      const newCount = prev + 1;
      console.log(`🎵 Songs played: ${newCount}/${frequency}`);

      // Check if we should show an ad
      if (newCount >= frequency && commercialAds.length > 0) {
        const ad = getRandomCommercialAd(commercialAds);
        if (ad) {
          setCurrentAd(ad);
          setIsShowingAd(true);
          setAdTimeRemaining(ad.duration || 10);
          console.log(`📺 Showing commercial break: ${ad.title}`);
        }
        return 0; // Reset counter
      }

      return newCount;
    });
  }, [enabled, frequency, commercialAds]);

  // Countdown timer for ad duration
  useEffect(() => {
    if (!isShowingAd || adTimeRemaining <= 0) {
      if (isShowingAd && adTimeRemaining <= 0) {
        setIsShowingAd(false);
        setCurrentAd(null);
        console.log(`📺 Commercial break ended`);
      }
      return;
    }

    const timer = setInterval(() => {
      setAdTimeRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isShowingAd, adTimeRemaining]);

  // Skip ad (for premium users or after minimum duration)
  const skipAd = useCallback(() => {
    setIsShowingAd(false);
    setCurrentAd(null);
    setAdTimeRemaining(0);
    console.log(`📺 Commercial break skipped`);
  }, []);

  // Reset counter (useful for testing or manual control)
  const resetCounter = useCallback(() => {
    setSongsPlayed(0);
  }, []);

  return {
    songsPlayed,
    currentAd,
    isShowingAd,
    adTimeRemaining,
    trackSongPlayed,
    skipAd,
    resetCounter
  };
};
