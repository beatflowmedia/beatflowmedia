import { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import {
  getDoc,
  setDoc,
  doc,
  collection,
  updateDoc
} from "firebase/firestore";
import { useAuth } from "./useAuth"; // ✅ Auth hook
import { onSnapshot, arrayUnion } from 'firebase/firestore';

export function usePlaylistManager() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState([]);

  useEffect(() => {
    if (!user) return;

    const userPlaylistsRef = collection(db, "users", user.uid, "playlists");

    const unsubscribe = onSnapshot(userPlaylistsRef, (snapshot) => {
      const loaded = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setPlaylists(loaded);
    });

    return () => unsubscribe();
  }, [user]);

  const createNewPlaylist = async (name) => {
    if (!user?.uid) throw new Error("User not authenticated");

    // Reference to the user's main doc
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    // Create the user doc if it doesn't exist (first-time user)
    if (!userDocSnap.exists()) {
      await setDoc(userDocRef, { createdAt: new Date() });
      console.log("👤 Created user doc");
    }

    // Generate a new doc ref (with unique ID you control)
    const newPlaylistRef = doc(collection(db, "users", user.uid, "playlists"));

    // Write the new playlist
    await setDoc(newPlaylistRef, {
      name,
      songs: [],
      createdAt: new Date()
    });

    console.log("✅ Playlist created:", name, "→", newPlaylistRef.id);
    return newPlaylistRef;
  };

  const addSong = (playlistId, song) => {
    if (!user) return;

    const ref = doc(db, "users", user.uid, "playlists", playlistId);
    return updateDoc(ref, { songs: arrayUnion(song) });
  };

  const removeSong = async (playlistId, song) => {
    if (!user) return;

    const ref = doc(db, "users", user.uid, "playlists", playlistId);
    const snap = await getDoc(ref);
    const data = snap.data();

    if (!data?.songs) return;

    const updated = data.songs.filter((s) => s.id !== song.id);
    return updateDoc(ref, { songs: updated });
  };

  return { playlists, createNewPlaylist, addSong, removeSong };
}
