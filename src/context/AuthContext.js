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
  const [role, setRole] = useState(null);
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

      try {
        const userRef = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(userRef);

        // Set initial user with likes array
        const userData = snap.exists() ? snap.data() : {};
        setUser({
          ...firebaseUser,
          likes: userData?.likes || [],
          follows: userData?.follows || [],
          role: userData?.role || null
        });

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
              likes: [],
              role: "artist" // Default role, update as needed
            },
            { merge: true }
          );
          setRole("artist");
        } else {
          setRole(snap.data()?.role || null);
        }

        // Subscribe to follow list, role, and likes
        const unsubFollows = onSnapshot(
          userRef,
          (ds) => {
            const data = ds.data();
            if (data) {
              setFollowedArtists(data?.follows || []);
              setRole(data?.role || null);
              // Update user object with latest likes - ensure firebaseUser also has likes
              const updatedUser = {
                ...firebaseUser,
                likes: data?.likes || [],
                follows: data?.follows || [],
                role: data?.role || null
              };
              setUser(updatedUser);
            }
          },
          (error) => {
            console.error("Error in user snapshot listener:", error);
          }
        );
        return () => unsubFollows();
      } catch (error) {
        console.error("Error setting up user data:", error);
      }
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
    // add to user's own likes (use setDoc with merge to handle non-existent docs)
    await setDoc(userRef, { likes: arrayUnion(songId) }, { merge: true });
    // add this user's UID to likers list
    await setDoc(songLikesRef, { likers: arrayUnion(user.uid) }, { merge: true });
  };
  const removeLike = async (songId) => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const songLikesRef = doc(db, "songLikes", songId);
    // remove from user's own likes (use setDoc with merge)
    await setDoc(userRef, { likes: arrayRemove(songId) }, { merge: true });
    // remove this user's UID from likers list
    await setDoc(songLikesRef, { likers: arrayRemove(user.uid) }, { merge: true });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
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
