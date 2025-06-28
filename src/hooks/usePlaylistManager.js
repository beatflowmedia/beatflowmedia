import { useEffect, useState } from "react";
import { db, storage } from "../firebaseConfig";
import {
  getDoc,
  setDoc,
  doc,
  collection,
  updateDoc,
  arrayUnion,
  onSnapshot,
} from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
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

  const createNewPlaylist = async (data) => {
    if (!user?.uid) throw new Error("User not authenticated");
    // data: { name, year, description, coverFile, songs }
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

    // Handle cover upload
    let coverUrl = null;
    if (data.coverFile) {
      const ext = data.coverFile.name.split(".").pop();
      const path = `users/${user.uid}/playlists/${newPlaylistRef.id}/cover.${ext}`;
      const imgRef = storageRef(storage, path);
      await uploadBytes(imgRef, data.coverFile);
      coverUrl = await getDownloadURL(imgRef);
    }

    // Write the new playlist
    const playlistData = {
      name: data.name,
      year: data.year ?? null,
      description: data.description ?? '',
      coverUrl,
      songs: data.songs || [],
      createdAt: new Date(),
    };
    await setDoc(newPlaylistRef, playlistData);

    console.log("✅ Playlist created:", data.name, "→", newPlaylistRef.id);
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
