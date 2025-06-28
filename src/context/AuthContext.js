import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut
} from "firebase/auth";
import { db } from "../firebaseConfig";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  onSnapshot
} from "firebase/firestore";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [followedArtists, setFollowedArtists] = useState([]);

  const auth = getAuth();
  const provider = new GoogleAuthProvider();

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setFollowedArtists([]);
        return;
      }
      setUser(firebaseUser);
      const userRef = doc(db, "users", firebaseUser.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(
          userRef,
          {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            favorites: [],
            follows: [],
            playlists: [],
            likes: []
          },
          { merge: true }
        );
      }
      // Subscribe to follow list
      const unsubFollows = onSnapshot(userRef, (ds) =>
        setFollowedArtists(ds.data()?.follows || [])
      );
      return () => unsubFollows();
    });
    return () => unsubscribe();
  }, [auth]);

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const { user: fbUser } = await signInWithPopup(auth, provider);
      const userRef = doc(db, "users", fbUser.uid);
      await setDoc(
        userRef,
        {
          uid: fbUser.uid,
          email: fbUser.email,
          name: fbUser.displayName,
          photoURL: fbUser.photoURL
        },
        { merge: true }
      );
    } catch (e) {
      console.error("Google sign-in error:", e);
    }
  };

  // Sign out
  const signOutUser = async () => {
    await signOut(auth);
    setUser(null);
  };

  // Update favorites array
  const updateFavorites = async (arr) => {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid), { favorites: arr });
  };

  // Follow/unfollow artist
  const followArtist = async (name) => {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid), { follows: arrayUnion(name) });
  };
  const unfollowArtist = async (name) => {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid), { follows: arrayRemove(name) });
  };
  const isArtistFollowed = (name) => followedArtists.includes(name);

  // Like/unlike uses a likers array in songLikes collection
  const addLike = async (songId) => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const songLikesRef = doc(db, "songLikes", songId);
    // add to user's own likes
    await updateDoc(userRef, { likes: arrayUnion(songId) });
    // add this user's UID to likers list
    await setDoc(songLikesRef, { likers: arrayUnion(user.uid) }, { merge: true });
  };
  const removeLike = async (songId) => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const songLikesRef = doc(db, "songLikes", songId);
    // remove from user's own likes
    await updateDoc(userRef, { likes: arrayRemove(songId) });
    // remove this user's UID from likers list
    await updateDoc(songLikesRef, { likers: arrayRemove(user.uid) });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        signInWithGoogle,
        signOutUser,
        updateFavorites,
        followArtist,
        unfollowArtist,
        isArtistFollowed,
        addLike,
        removeLike
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
