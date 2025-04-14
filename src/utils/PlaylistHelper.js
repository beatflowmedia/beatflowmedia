import { collection, addDoc, updateDoc, doc, arrayUnion, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

// ✅ Listen for playlist updates in Firebase
export const subscribeToPlaylists = (callback) => {
  return onSnapshot(collection(db, "playlists"), (snapshot) => {
    const updatedPlaylists = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(updatedPlaylists);
  });
};

// ✅ Create a new playlist in Firebase
export const createPlaylist = async (playlistName) => {
  try {
    const docRef = await addDoc(collection(db, "playlists"), {
      name: playlistName,
      songs: [],
      createdAt: new Date(),
    });
    console.log("✅ Playlist created with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("❌ Error creating playlist:", error);
    throw error;
  }
};

// ✅ Add a song to an existing playlist
export const addSongToPlaylist = async (playlistId, song) => {
  const playlistRef = doc(db, "playlists", playlistId);
  try {
    await updateDoc(playlistRef, {
      songs: arrayUnion(song),
    });
    console.log(`🎵 Added song "${song.title}" to playlist: ${playlistId}`);
  } catch (error) {
    console.error("❌ Error adding song to playlist:", error);
    throw error;
  }
};

// ✅ Remove a song from a playlist
export const removeSongFromPlaylist = async (playlistId, song) => {
  const playlistRef = doc(db, "playlists", playlistId);
  try {
    const playlistSnapshot = await getDoc(playlistRef);
    const playlistData = playlistSnapshot.data();
    if (!playlistData || !playlistData.songs) return;

    const updatedSongs = playlistData.songs.filter((s) => s.id !== song.id);
    await updateDoc(playlistRef, { songs: updatedSongs });
    console.log(`🗑️ Removed song "${song.title}" from playlist: ${playlistId}`);
  } catch (error) {
    console.error("❌ Error removing song from playlist:", error);
    throw error;
  }
};
