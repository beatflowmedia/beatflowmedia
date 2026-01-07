import { useEffect, useState } from "react";
import { db, storage } from "../firebaseConfig";
import {
  getDoc,
  setDoc,
  doc,
  collection,
  updateDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
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

  const createNewPlaylist = async (name, imageFile = null) => {
    if (!user?.uid) throw new Error("User not authenticated");

    // Capitalize playlist name (Title Case)
    const capitalizedName = name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

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

    let imageUrl = null;

    // Upload image to Firebase Storage if provided
    if (imageFile) {
      const timestamp = Date.now();
      const storageRef = ref(storage, `users/${user.uid}/playlist-covers/${timestamp}_${imageFile.name}`);
      await uploadBytes(storageRef, imageFile);
      imageUrl = await getDownloadURL(storageRef);
      console.log("✅ Playlist image uploaded:", imageUrl);
    }

    // Write the new playlist
    await setDoc(newPlaylistRef, {
      name: capitalizedName,
      songs: [],
      imageUrl,
      createdAt: new Date()
    });

    console.log("✅ Playlist created:", capitalizedName, "→", newPlaylistRef.id);
    return newPlaylistRef;
  };

  const addSong = (playlistId, song) => {
    if (!user) return;

    // DRY: Only store song ID and metadata, NOT the full song data
    // Full song data will be fetched from the songs collection when needed
    const playlistEntry = {
      songId: song.id,
      addedAt: new Date()
    };

    const ref = doc(db, "users", user.uid, "playlists", playlistId);
    return updateDoc(ref, { songs: arrayUnion(playlistEntry) });
  };

  const removeSong = async (playlistId, song) => {
    if (!user) return;

    const ref = doc(db, "users", user.uid, "playlists", playlistId);
    const snap = await getDoc(ref);
    const data = snap.data();

    if (!data?.songs) return;

    // Handle both old format (full song object) and new format (songId entry)
    const updated = data.songs.filter((entry) => {
      const entryId = entry.songId || entry.id;
      return entryId !== song.id;
    });

    return updateDoc(ref, { songs: updated });
  };

  const deletePlaylist = async (playlistId) => {
    if (!user?.uid) throw new Error("User not authenticated");

    const playlistRef = doc(db, "users", user.uid, "playlists", playlistId);

    // Use Firestore's deleteDoc for safe deletion
    const { deleteDoc } = await import('firebase/firestore');
    return deleteDoc(playlistRef);
  };

  const updatePlaylistDetails = async (playlistId, updates) => {
    if (!user?.uid) throw new Error("User not authenticated");

    const playlistRef = doc(db, "users", user.uid, "playlists", playlistId);

    // Only allow specific fields to be updated (security)
    const allowedUpdates = {};
    if (updates.name !== undefined) allowedUpdates.name = updates.name;
    if (updates.description !== undefined) allowedUpdates.description = updates.description;
    if (updates.imageUrl !== undefined) allowedUpdates.imageUrl = updates.imageUrl;
    if (updates.isPinned !== undefined) allowedUpdates.isPinned = updates.isPinned;
    if (updates.excludedFromTaste !== undefined) allowedUpdates.excludedFromTaste = updates.excludedFromTaste;
    if (updates.hiddenFromProfile !== undefined) allowedUpdates.hiddenFromProfile = updates.hiddenFromProfile;
    if (updates.collaborators !== undefined) allowedUpdates.collaborators = updates.collaborators;

    return updateDoc(playlistRef, { ...allowedUpdates, updatedAt: new Date() });
  };

  const togglePrivacy = async (playlistId, isPrivate) => {
    if (!user?.uid) throw new Error("User not authenticated");

    const playlistRef = doc(db, "users", user.uid, "playlists", playlistId);
    return updateDoc(playlistRef, { isPrivate, updatedAt: new Date() });
  };

  return {
    playlists,
    createNewPlaylist,
    addSong,
    removeSong,
    deletePlaylist,
    updatePlaylistDetails,
    togglePrivacy
  };
}
