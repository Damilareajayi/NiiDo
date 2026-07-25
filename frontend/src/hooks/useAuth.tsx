"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithPhoneNumber,
  GoogleAuthProvider,
  RecaptchaVerifier,
  ConfirmationResult,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { NiiDoUser } from "@/types";

interface AuthContextType {
  user: NiiDoUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<{ hasProfile: boolean }>;
  sendPhoneOtp: (phoneNumber: string, recaptchaContainerId: string) => Promise<ConfirmationResult>;
  confirmPhoneOtp: (confirmation: ConfirmationResult, code: string) => Promise<{ hasProfile: boolean }>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function checkHasProfile(uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<NiiDoUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      if (fbUser) {
        unsubscribeDoc = onSnapshot(doc(db, "users", fbUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUser({ uid: fbUser.uid, ...docSnap.data() } as NiiDoUser);
          } else {
            setUser(null);
          }
          setLoading(false);
        }, (err) => {
          console.error("Error listening to user profile:", err);
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setError(msg);
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: "select_account",
      });
      const result = await signInWithPopup(auth, provider);
      const hasProfile = await checkHasProfile(result.user.uid);
      return { hasProfile };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google sign-in failed";
      setError(msg);
      throw err;
    }
  };

  const sendPhoneOtp = async (phoneNumber: string, recaptchaContainerId: string) => {
    setError(null);
    try {
      // Reuse a single verifier across attempts — re-creating one on every call tries
      // to render a second reCAPTCHA widget into the same DOM node and Firebase throws
      // "reCAPTCHA has already been rendered in this element".
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, recaptchaContainerId, { size: "invisible" });
      }
      return await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifierRef.current);
    } catch (err: unknown) {
      // Widget may be in a bad state after a failure — drop it so the next attempt starts clean.
      recaptchaVerifierRef.current?.clear();
      recaptchaVerifierRef.current = null;
      const msg = err instanceof Error ? err.message : "Failed to send verification code";
      setError(msg);
      throw err;
    }
  };

  const confirmPhoneOtp = async (confirmation: ConfirmationResult, code: string) => {
    setError(null);
    try {
      const result = await confirmation.confirm(code);
      const hasProfile = await checkHasProfile(result.user.uid);
      return { hasProfile };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid verification code";
      setError(msg);
      throw err;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user, firebaseUser, loading, login, loginWithGoogle,
      sendPhoneOtp, confirmPhoneOtp, logout, error,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
