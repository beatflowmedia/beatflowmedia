import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from "firebase/auth"; // ✅ All imports are now used
import { db } from "../firebaseConfig"; // Adjust path as needed
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  onSnapshot, // ✅ Firestore Real-Time Listener
} from "firebase/firestore";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [followedArtists, setFollowedArtists] = useState([]); // ✅ Store follow state in real-time

  const auth = getAuth();
  const provider = new GoogleAuthProvider(); // ✅ Defined once at the top

  // 🔥 Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userDocRef = doc(db, "users", firebaseUser.uid);

        // ✅ If user doesn't exist, create default fields
        const userSnap = await getDoc(userDocRef);
        if (!userSnap.exists()) {
          await setDoc(userDocRef, { favorites: [], follows: [], playlists: [], likes: [] });
        }

        // ✅ Start listening for follow updates in real-time
        const unsubscribeFollows = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setFollowedArtists(docSnap.data().follows || []);
          }
        });

        return () => unsubscribeFollows(); // Cleanup listener when user logs out
      } else {
        setUser(null);
        setFollowedArtists([]); // Reset follow state when user logs out
      }
    });

    return () => unsubscribe(); // Cleanup auth listener
  }, [auth]);

  // ✅ Google Sign-In
  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google sign-in error:", error);
    }
  };

  // ✅ Sign out
  const signOutUser = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // ✅ Update favorites
  const updateFavorites = async (favoritesArray) => {
    if (!user) return;
    const userDocRef = doc(db, "users", user.uid);
    try {
      await updateDoc(userDocRef, { favorites: favoritesArray });
    } catch (error) {
      console.error("Error updating favorites:", error);
    }
  };

  // ✅ Follow an artist
  const followArtist = async (artistName) => {
    if (!user) return;
    const userDocRef = doc(db, "users", user.uid);
    try {
      await updateDoc(userDocRef, { follows: arrayUnion(artistName) });
      console.log("Followed artist:", artistName);
    } catch (error) {
      console.error("Error following artist:", error);
    }
  };

  // ✅ Unfollow an artist
  const unfollowArtist = async (artistName) => {
    if (!user) return;
    const userDocRef = doc(db, "users", user.uid);
    try {
      await updateDoc(userDocRef, { follows: arrayRemove(artistName) });
      console.log("Unfollowed artist:", artistName);
    } catch (error) {
      console.error("Error unfollowing artist:", error);
    }
  };

  // ✅ Check if an artist is followed (syncs with Firestore in real-time)
  const isArtistFollowed = (artistName) => {
    return followedArtists.includes(artistName);
  };

  // ✅ Add a like
  const addLike = async (likeItem) => {
    if (!user) return;
    const userDocRef = doc(db, "users", user.uid);
    try {
      await updateDoc(userDocRef, { likes: arrayUnion(likeItem) });
    } catch (error) {
      console.error("Error adding like:", error);
    }
  };

  // ✅ Remove a like
  const removeLike = async (likeItem) => {
    if (!user) return;
    const userDocRef = doc(db, "users", user.uid);
    try {
      await updateDoc(userDocRef, { likes: arrayRemove(likeItem) });
    } catch (error) {
      console.error("Error removing like:", error);
    }
  };

  const value = {
    user,
    signInWithGoogle,
    signOutUser,
    updateFavorites,
    followArtist,
    unfollowArtist,
    isArtistFollowed,
    addLike,
    removeLike,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
