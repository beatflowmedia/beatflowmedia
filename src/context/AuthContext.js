import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
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

        // Set initial user WITHOUT likes (likes handled by separate LikesContext)
        const userData = snap.exists() ? snap.data() : {};
        setUser({
          ...firebaseUser,
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
              setFollowedArtists(data?.follows || []);
              setRole(data?.role || null);
              // Only update user if follows/role actually changed to prevent unnecessary re-renders
              setUser(prevUser => {
                const newFollows = data?.follows || [];
                const newRole = data?.role || null;

                // Check if anything actually changed
                const followsChanged = JSON.stringify(prevUser?.follows) !== JSON.stringify(newFollows);
                const roleChanged = prevUser?.role !== newRole;

                if (!followsChanged && !roleChanged) {
                  return prevUser; // No change, return same object to prevent re-render
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

  const isArtistFollowed = useCallback((name) => followedArtists.includes(name), [followedArtists]);

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
    followedArtists,
    signInWithGoogle,
    signOutUser,
    updateFavorites,
    followArtist,
    unfollowArtist,
    isArtistFollowed,
    updateUserRole,
    hasRole,
    isCreator
  }), [user, role, followedArtists, signInWithGoogle, signOutUser, updateFavorites, followArtist, unfollowArtist, isArtistFollowed, updateUserRole, hasRole, isCreator]);

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
