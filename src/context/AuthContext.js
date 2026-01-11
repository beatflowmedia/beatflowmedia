import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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
  // Use ref to store followedArtists to avoid triggering re-renders
  const followedArtistsRef = useRef([]);

  const auth = getAuth();

  // Handle redirect result on mount
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          console.log("Sign-in redirect successful:", result.user.email);
          // Create/update user profile after redirect
          const userRef = doc(db, "users", result.user.uid);
          await setDoc(
            userRef,
            {
              uid: result.user.uid,
              email: result.user.email,
              name: result.user.displayName,
              photoURL: result.user.photoURL
            },
            { merge: true }
          );
        }
      })
      .catch((error) => {
        console.error("Redirect sign-in error:", error);
      });
  }, [auth]);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        followedArtistsRef.current = [];
        return;
      }

      try {
        const userRef = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(userRef);

        // Set initial user WITHOUT likes (likes handled by separate LikesContext)
        const userData = snap.exists() ? snap.data() : {};
        const initialFollows = userData?.follows || [];

        // Initialize ref with initial follows
        followedArtistsRef.current = initialFollows;

        setUser({
          ...firebaseUser,
          follows: initialFollows,
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
              role: "listener" // Default role for new users
            },
            { merge: true }
          );
          setRole("listener");
        } else {
          setRole(snap.data()?.role || "listener");
        }

        // Subscribe to follow list and role (likes handled separately by LikesContext)
        const unsubFollows = onSnapshot(
          userRef,
          (ds) => {
            const data = ds.data();
            if (data) {
              const newFollows = data?.follows || [];
              const newRole = data?.role || null;

              // Update ref immediately (doesn't trigger re-render)
              followedArtistsRef.current = newFollows;

              // Only update state if role changed (follows changes don't need to trigger re-renders)
              setRole(prevRole => {
                if (prevRole !== newRole) {
                  return newRole;
                }
                return prevRole;
              });

              // Only update user if role changed
              setUser(prevUser => {
                const roleChanged = prevUser?.role !== newRole;

                if (!roleChanged) {
                  return prevUser; // No role change, return same object to prevent re-render
                }

                return {
                  ...firebaseUser,
                  follows: newFollows,
                  role: newRole
                };
              });
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
  const signInWithGoogle = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();

      // Try popup first
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
      } catch (popupError) {
        // If popup fails due to COOP or being blocked, fallback to redirect
        if (
          popupError.code === 'auth/popup-blocked' ||
          popupError.code === 'auth/cancelled-popup-request' ||
          popupError.message?.includes('Cross-Origin-Opener-Policy')
        ) {
          console.log("Popup blocked, using redirect method...");
          await signInWithRedirect(auth, provider);
        } else {
          throw popupError;
        }
      }
    } catch (e) {
      console.error("Google sign-in error:", e);
      throw e;
    }
  }, [auth]);

  // Sign out
  const signOutUser = useCallback(async () => {
    await signOut(auth);
    setUser(null);
  }, [auth]);

  // Update favorites array
  const updateFavorites = useCallback(async (arr) => {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid), { favorites: arr });
  }, [user]);

  // Follow/unfollow artist
  const followArtist = useCallback(async (name) => {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid), { follows: arrayUnion(name) });
  }, [user]);

  const unfollowArtist = useCallback(async (name) => {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid), { follows: arrayRemove(name) });
  }, [user]);

  const isArtistFollowed = useCallback((name) => followedArtistsRef.current.includes(name), []);

  // Update user role (for creator onboarding)
  const updateUserRole = useCallback(async (newRole) => {
    if (!user) return;
    // Valid roles: "listener", "artist", "podcaster", "author", "admin"
    const validRoles = ["listener", "artist", "podcaster", "author", "admin"];
    if (!validRoles.includes(newRole)) {
      console.error("Invalid role:", newRole);
      return;
    }
    await updateDoc(doc(db, "users", user.uid), { role: newRole });
  }, [user]);

  // Check if user has a specific role
  const hasRole = useCallback((checkRole) => role === checkRole, [role]);

  // Check if user is any type of creator
  const isCreator = useCallback(() => {
    return ["artist", "podcaster", "author"].includes(role);
  }, [role]);

  // Likes are now handled by separate LikesContext to prevent re-renders

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    role,
    followedArtists: followedArtistsRef.current, // Use ref value to avoid triggering re-renders
    signInWithGoogle,
    signOutUser,
    updateFavorites,
    followArtist,
    unfollowArtist,
    isArtistFollowed,
    updateUserRole,
    hasRole,
    isCreator
  }), [user, role, signInWithGoogle, signOutUser, updateFavorites, followArtist, unfollowArtist, isArtistFollowed, updateUserRole, hasRole, isCreator]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
