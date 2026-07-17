import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Firebase restores a persisted session asynchronously — on a fresh page
// load, auth.currentUser can briefly be null even though the user is
// signed in. Wait for the first auth-state resolution instead of trusting
// currentUser immediately, otherwise early fetches fail with "Not signed in".
let authReadyPromise: Promise<User | null> | null = null;

function waitForAuthUser(): Promise<User | null> {
  if (auth.currentUser) return Promise.resolve(auth.currentUser);
  if (!authReadyPromise) {
    authReadyPromise = new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });
  }
  return authReadyPromise;
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const user = await waitForAuthUser();
  const token = await user?.getIdToken();
  if (!token) throw new Error("Not signed in");

  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });
}
