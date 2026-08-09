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
  AuthCredential,
  AuthError,
  linkWithCredential,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { NiiDoUser } from "@/types";

interface AuthContextType {
  user: NiiDoUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  sendPhoneOtp: (phoneNumber: string, recaptchaContainerId: string) => Promise<ConfirmationResult>;
  confirmPhoneOtp: (confirmation: ConfirmationResult, code: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  // Set when Google sign-in collides with an existing password account for
  // the same email — Firebase treats each provider as a distinct identity
  // by default, so without this the user is simply locked out of the
  // account they already have. See loginWithGoogle/linkGoogleAccount.
  googleLinkEmail: string | null;
  linkGoogleAccount: (password: string) => Promise<void>;
  cancelGoogleLink: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<NiiDoUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const pendingGoogleCredRef = useRef<AuthCredential | null>(null);
  const [googleLinkEmail, setGoogleLinkEmail] = useState<string | null>(null);

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
      await signInWithPopup(auth, provider);
    } catch (err: unknown) {
      const fbErr = err as AuthError;
      // This project's Firebase Auth uses "one account per email" (the
      // default), so an email that already signed up with a password hits
      // this error the moment it tries Google — Firebase treats the two
      // providers as separate identities until explicitly linked. Rather
      // than surface that as a dead-end failure, capture the pending
      // Google credential and hand control to linkGoogleAccount() below.
      if (fbErr.code === "auth/account-exists-with-different-credential") {
        const pendingCred = GoogleAuthProvider.credentialFromError(fbErr);
        const email = fbErr.customData?.email as string | undefined;
        if (pendingCred && email) {
          pendingGoogleCredRef.current = pendingCred;
          setGoogleLinkEmail(email);
          throw Object.assign(new Error("account-link-required"), { code: "account-link-required" });
        }
      }
      const msg = err instanceof Error ? err.message : "Google sign-in failed";
      setError(msg);
      throw err;
    }
  };

  // Completes the link started above: verifies the user actually owns the
  // existing password account, then attaches the pending Google credential
  // to it so both sign-in methods work going forward.
  const linkGoogleAccount = async (password: string) => {
    if (!googleLinkEmail || !pendingGoogleCredRef.current) {
      throw new Error("No pending Google sign-in to link");
    }
    setError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, googleLinkEmail, password);
      await linkWithCredential(result.user, pendingGoogleCredRef.current);
      pendingGoogleCredRef.current = null;
      setGoogleLinkEmail(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to link account";
      setError(msg);
      throw err;
    }
  };

  const cancelGoogleLink = () => {
    pendingGoogleCredRef.current = null;
    setGoogleLinkEmail(null);
    setError(null);
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
      await confirmation.confirm(code);
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
      googleLinkEmail, linkGoogleAccount, cancelGoogleLink,
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
