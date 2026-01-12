import { useEffect, useState, useMemo } from "react";
import { db, storage } from "../firebaseConfig";
import {
  getDoc,
  setDoc,
  doc,
  collection,
  updateDoc,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "./useAuth"; // ✅ Auth hook
import { onSnapshot, arrayUnion } from 'firebase/firestore';

export function usePlaylistManager() {
  const { user } = useAuth();
  const [privatePlaylists, setPrivatePlaylists] = useState([]);
  const [publicPlaylists, setPublicPlaylists] = useState([]);

  // Deduplicate playlists - private takes precedence over public for same ID
  const playlists = useMemo(() => {
    const playlistMap = new Map();

    // Add public playlists first
    publicPlaylists.forEach(p => playlistMap.set(p.id, p));

    // Add private playlists (overwrites if duplicate ID)
    privatePlaylists.forEach(p => playlistMap.set(p.id, p));

    return Array.from(playlistMap.values());
  }, [privatePlaylists, publicPlaylists]);

  useEffect(() => {
    if (!user) return;

    // Listen to private playlists (user subcollection)
    const userPlaylistsRef = collection(db, "users", user.uid, "playlists");
    const unsubscribePrivate = onSnapshot(userPlaylistsRef, (snapshot) => {
      setPrivatePlaylists(snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        isPrivate: true
      })));
    });

    // Listen to ALL public playlists (visible to everyone)
    const publicPlaylistsRef = collection(db, "playlists");
    const unsubscribePublic = onSnapshot(publicPlaylistsRef, (snapshot) => {
      setPublicPlaylists(snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        isPrivate: false
      })));
    });

    // Clean up both listeners on unmount
    return () => {
      unsubscribePrivate();
      unsubscribePublic();
    };
  }, [user]);

  const createNewPlaylist = async (name, imageFile = null, isPrivate = true, moods = []) => {
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

    let imageUrl = null;

    // Upload image to Firebase Storage if provided
    if (imageFile) {
      const timestamp = Date.now();
      const storageRef = ref(storage, `users/${user.uid}/playlist-covers/${timestamp}_${imageFile.name}`);
      await uploadBytes(storageRef, imageFile);
      imageUrl = await getDownloadURL(storageRef);
      console.log("✅ Playlist image uploaded:", imageUrl);
    }

    // Create playlist in the appropriate collection based on privacy
    let newPlaylistRef;
    const playlistData = {
      name: capitalizedName,
      songs: [],
      imageUrl,
      moods: moods || [], // 2026 Hybrid Strategy: Mood tags for algorithmic recommendations
      createdAt: new Date()
    };

    if (isPrivate) {
      // Create in user's private collection
      newPlaylistRef = doc(collection(db, "users", user.uid, "playlists"));
      await setDoc(newPlaylistRef, {
        ...playlistData,
        isPrivate: true
      });
    } else {
      // Create in public collection
      newPlaylistRef = doc(collection(db, "playlists"));
      await setDoc(newPlaylistRef, {
        ...playlistData,
        creatorId: user.uid,
        isPrivate: false
      });
    }

    console.log("✅ Playlist created:", capitalizedName, "→", newPlaylistRef.id, `(${isPrivate ? 'private' : 'public'})`);
    return newPlaylistRef;
  };

  const addSong = async (playlistId, song) => {
    if (!user) return;

    // Check if playlist is in private collection
    const privateRef = doc(db, "users", user.uid, "playlists", playlistId);
    const privateSnap = await getDoc(privateRef);

    const ref = privateSnap.exists()
      ? privateRef
      : doc(db, "playlists", playlistId);

    // Get current playlist data to check for duplicates
    const playlistSnap = await getDoc(ref);
    const playlistData = playlistSnap.data();
    const existingSongs = playlistData?.songs || [];

    // Check if song already exists in playlist
    const songExists = existingSongs.some(entry => {
      const entryId = entry.songId || entry.id;
      return entryId === song.id;
    });

    if (songExists) {
      console.log(`⚠️ Song "${song.title}" already in playlist`);
      throw new Error('Song already in playlist');
    }

    // DRY: Only store song ID and metadata, NOT the full song data
    // Full song data will be fetched from the songs collection when needed
    const playlistEntry = {
      songId: song.id,
      addedAt: new Date()
    };

    return updateDoc(ref, { songs: arrayUnion(playlistEntry) });
  };

  const removeSong = async (playlistId, song) => {
    if (!user) return;

    // Check if playlist is in private collection
    const privateRef = doc(db, "users", user.uid, "playlists", playlistId);
    const privateSnap = await getDoc(privateRef);

    const ref = privateSnap.exists()
      ? privateRef
      : doc(db, "playlists", playlistId);

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

    // Check if playlist is in private collection
    const privateRef = doc(db, "users", user.uid, "playlists", playlistId);
    const privateSnap = await getDoc(privateRef);

    const { deleteDoc } = await import('firebase/firestore');

    if (privateSnap.exists()) {
      // Delete from private collection
      return deleteDoc(privateRef);
    } else {
      // Delete from public collection
      const publicRef = doc(db, "playlists", playlistId);
      return deleteDoc(publicRef);
    }
  };

  const updatePlaylistDetails = async (playlistId, updates) => {
    if (!user?.uid) throw new Error("User not authenticated");

    // Check if playlist is in private collection
    const privateRef = doc(db, "users", user.uid, "playlists", playlistId);
    const privateSnap = await getDoc(privateRef);

    const playlistRef = privateSnap.exists()
      ? privateRef
      : doc(db, "playlists", playlistId);

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

    // Check both collections to find the playlist
    const privateRef = doc(db, "users", user.uid, "playlists", playlistId);
    const publicRef = doc(db, "playlists", playlistId);

    const privateSnap = await getDoc(privateRef);
    const publicSnap = await getDoc(publicRef);

    // Determine which collection the playlist is currently in
    let currentRef, currentSnap, playlistData;

    if (privateSnap.exists()) {
      currentRef = privateRef;
      currentSnap = privateSnap;
      playlistData = privateSnap.data();
    } else if (publicSnap.exists()) {
      currentRef = publicRef;
      currentSnap = publicSnap;
      playlistData = publicSnap.data();
    } else {
      throw new Error("Playlist not found");
    }

    if (isPrivate) {
      // Moving from public to private: playlists/ → users/{userId}/playlists/
      if (publicSnap.exists()) {
        // Copy to user subcollection
        await setDoc(privateRef, {
          ...playlistData,
          isPrivate: true,
          updatedAt: new Date()
        });

        // Delete from public collection
        const { deleteDoc } = await import('firebase/firestore');
        await deleteDoc(publicRef);
      } else {
        // Already in private collection, just update flag
        await updateDoc(privateRef, { isPrivate: true, updatedAt: new Date() });
      }
    } else {
      // Moving from private to public: users/{userId}/playlists/ → playlists/
      // Copy to public collection with creatorId
      await setDoc(publicRef, {
        ...playlistData,
        creatorId: user.uid,
        isPrivate: false,
        updatedAt: new Date()
      });

      // Delete from private collection
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(currentRef);
    }
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
