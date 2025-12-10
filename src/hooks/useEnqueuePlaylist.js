import { useCallback } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { usePlayer } from "../context/PlayerContext";

/**
 * Hook to enqueue all songs of a playlist into the playback queue.
 * If the passed playlist object doesn't include songs, it fetches from Firestore.
 */
export default function useEnqueuePlaylist() {
  const { dispatch, actions } = usePlayer();

  const enqueuePlaylist = useCallback(
    async (playlist) => {
      let songs = Array.isArray(playlist.songs) ? playlist.songs : [];
      if (songs.length === 0 && playlist.id) {
        const ref = doc(db, "playlists", playlist.id);
        const snap = await getDoc(ref);
        songs = snap.exists() ? snap.data().songs || [] : [];
      }
      songs.forEach((song) => {
        dispatch({ type: actions.ENQUEUE, payload: { item: song } });
      });
    },
    [dispatch, actions],
  );

  return enqueuePlaylist;
}
