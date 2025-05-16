// src/utils/usePlaybackResume.js
import { useEffect, useRef } from "react";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

export function usePlaybackResume(audioRef, song, user) {
  const saveTimer = useRef();
  const key = song ? `song_pos_${song.id}` : null;

  // Restore position on song load
  useEffect(() => {
    if (!song || !audioRef.current) return;
    let cancelled = false;

    async function restorePosition() {
      let resumeTime = null;
      if (user && user.uid) {
        try {
          const snap = await getDoc(
            doc(db, "users", user.uid, "songPositions", String(song.id))
          );
          if (snap.exists()) resumeTime = snap.data().position;
        } catch (e) {
          // Silent fail
        }
      }
      if (resumeTime == null) {
        const local = localStorage.getItem(key);
        if (local && !isNaN(local)) resumeTime = parseFloat(local);
      }
      if (!cancelled && resumeTime && resumeTime > 0 && audioRef.current.duration > resumeTime) {
        // If duration is available, set time; if not, listen for loadedmetadata
        if (audioRef.current.readyState >= 1) {
          audioRef.current.currentTime = resumeTime;
        } else {
          // Wait for metadata (duration)
          const setOnMeta = () => {
            audioRef.current.currentTime = resumeTime;
            audioRef.current.removeEventListener("loadedmetadata", setOnMeta);
          };
          audioRef.current.addEventListener("loadedmetadata", setOnMeta);
        }
      }
    }
    restorePosition();
    return () => { cancelled = true; };
  // Only run on song change!
  }, [song?.id]);

  // Save position every 2s and on pause/unload
  useEffect(() => {
    if (!song || !audioRef.current) return;
    const audio = audioRef.current;

    const saveTime = async () => {
      // Don't save if not loaded
      if (!audio || isNaN(audio.currentTime) || !song?.id) return;
      if (!audio.ended && !audio.seeking) {
        const position = audio.currentTime;
        if (user && user.uid) {
          await setDoc(
            doc(db, "users", user.uid, "songPositions", String(song.id)),
            { position, updatedAt: Date.now() },
            { merge: true }
          );
        } else {
          localStorage.setItem(key, position);
        }
      }
    };

    saveTimer.current = setInterval(saveTime, 2000);
    audio.addEventListener("pause", saveTime);
    window.addEventListener("beforeunload", saveTime);

    return () => {
      clearInterval(saveTimer.current);
      audio.removeEventListener("pause", saveTime);
      window.removeEventListener("beforeunload", saveTime);
    };
  }, [song?.id, audioRef, user, key]);

  // Remove resume on song end
  useEffect(() => {
    if (!song || !audioRef.current) return;
    const audio = audioRef.current;
    const clearTime = async () => {
      if (user && user.uid) {
        await deleteDoc(
          doc(db, "users", user.uid, "songPositions", String(song.id))
        );
      }
      localStorage.removeItem(key);
    };
    audio.addEventListener("ended", clearTime);
    return () => audio.removeEventListener("ended", clearTime);
  }, [song?.id, audioRef, user, key]);
}
