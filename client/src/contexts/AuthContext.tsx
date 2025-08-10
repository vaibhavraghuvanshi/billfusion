import React, { createContext, useContext, useEffect, useState } from "react";
import { User as FirebaseUser, onAuthStateChanged, signOut, getRedirectResult } from "firebase/auth";
import { auth } from "../lib/firebase";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (firebaseUser: FirebaseUser) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Login and sync user to backend
   */
  const login = async (fbUser: FirebaseUser) => {
    try {
      const response = await apiRequest("POST", "/api/auth/login", {
        email: fbUser.email,
        firebaseUid: fbUser.uid,
        userData: {
          displayName: fbUser.displayName,
          email: fbUser.email,
          photoURL: fbUser.photoURL,
          firstName: fbUser.displayName?.split(" ")[0] || "",
          lastName: fbUser.displayName?.split(" ")[1] || "",
        },
      });

      const data = await response.json();
      setUser(data.user);
      setFirebaseUser(fbUser);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  /**
   * Logout from both Firebase and backend
   */
  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setFirebaseUser(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1️⃣ First, check if there’s a redirect result from Firebase (Google, etc.)
        const redirectResult = await getRedirectResult(auth);
        if (redirectResult?.user) {
          await login(redirectResult.user);
          setLoading(false);
          return;
        }

        // 2️⃣ Listen to Firebase auth changes
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
          if (fbUser) {
            await login(fbUser);
          } else {
            setUser(null);
            setFirebaseUser(null);
          }
          setLoading(false);
        });

        // 3️⃣ Check backend session if Firebase user isn’t set yet
        const response = await apiRequest("GET", "/api/user");
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
        }

        return unsubscribe;
      } catch (error) {
        console.error("Auth init error:", error);
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
