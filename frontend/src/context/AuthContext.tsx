"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth, googleProvider, FIREBASE_CONFIGURED } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  idToken: string | null;
  firebaseConfigured: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  idToken: null,
  firebaseConfigured: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  // If Firebase is not configured, skip auth loading state entirely
  const [loading, setLoading] = useState(FIREBASE_CONFIGURED);

  useEffect(() => {
    // No-op if Firebase is not configured
    if (!FIREBASE_CONFIGURED || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        setIdToken(token);
      } else {
        setIdToken(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Refresh ID token every 55 minutes
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      const token = await user.getIdToken(true);
      setIdToken(token);
    }, 55 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const signInWithGoogle = async () => {
    if (!auth || !googleProvider) {
      alert("Firebase is not configured. Add your Firebase credentials to .env.local");
      return;
    }
    await signInWithPopup(auth, googleProvider);
  };

  const signOut = async () => {
    if (auth) await firebaseSignOut(auth);
    setIdToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user, loading, idToken,
      firebaseConfigured: FIREBASE_CONFIGURED,
      signInWithGoogle, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

/** Returns the Authorization header value for API calls */
export function useAuthHeader(): string | null {
  const { idToken } = useAuth();
  return idToken ? `Bearer ${idToken}` : null;
}
