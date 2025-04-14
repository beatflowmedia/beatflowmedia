import { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import {
  getDoc,
  setDoc,
  doc,
  collection,
  addDoc,
  updateDoc,
  arrayUnion,
  onSnapshot,
} from "firebase/firestore";
import { useAuth } from "./useAuth"; // ✅ Auth hook

export function usePlaylistManager() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState([]);

  useEffect(() => {
    if (!user) return;

    const userPlaylistsRef = collection(db, "users", user.uid, "playlists");

    const unsubscribe = onSnapshot(userPlaylistsRef, (snapshot) => {
      const loaded = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPlaylists(loaded);
    });

    return () => unsubscribe();
  }, [user]);

  const createNewPlaylist = async (name) => {
    if (!user || !user.uid) {
      throw new Error("User not authenticated");
    }

    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    // 🛠 Ensure parent user doc exists
    if (!userDocSnap.exists()) {
      await setDoc(userDocRef, { createdAt: new Date() });
      console.log("👤 Created user doc");
    }

    const playlistCollectionRef = collection(db, "users", user.uid, "playlists");
    const newDocRef = doc(playlistCollectionRef); // manual ID
    await setDoc(newDocRef, {
      name,
      songs: [],
      createdAt: new Date(),
    });

    console.log("✅ Playlist created:", name, "→", newDocRef.id);
    return newDocRef;
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
