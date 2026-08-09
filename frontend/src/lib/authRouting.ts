import { User as FirebaseUser } from "firebase/auth";
import { NiiDoUser } from "@/types";

const VALID_ROLES = ["student", "teacher", "admin"];

// Single definition of "this Firebase Auth account has a usable NiiDo
// profile" — used identically by login, signup, and complete-profile so
// they can never disagree about where a given user belongs. Previously
// each page computed this slightly differently (and separately from a
// one-time getDoc used only for the initial post-auth redirect), which
// raced against this same reactive check and could send an already-
// profiled user back to complete-profile — where the backend correctly
// rejects them with "Profile already exists for this account".
export function hasCompleteProfile(user: NiiDoUser | null): boolean {
  return !!user && !!user.role && VALID_ROLES.includes(user.role);
}

// A human-readable label for "who am I signed in as right now", used by
// the account-switch affordances on login/signup/complete-profile.
export function identityLabel(firebaseUser: FirebaseUser | null): string {
  if (!firebaseUser) return "";
  return firebaseUser.email || firebaseUser.phoneNumber || firebaseUser.displayName || "your account";
}
