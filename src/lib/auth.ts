"use client";

import {
  GoogleAuthProvider,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ensureUserProfile, getUserProfile } from "@/lib/userProfiles";

export type PlatformRole = "super_admin" | "admin" | "user";

async function ensureUserProfileExists(user: User) {
  await ensureUserProfile({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
  });
}

export async function loginWithGoogle() {
  await setPersistence(auth, browserLocalPersistence);

  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);

  await ensureUserProfileExists(result.user);
  return result.user;
}

export async function loginWithEmail(email: string, password: string) {
  await setPersistence(auth, browserLocalPersistence);

  const result = await signInWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );

  await ensureUserProfileExists(result.user);
  return result.user;
}

export async function signupWithEmail(
  email: string,
  password: string,
  displayName?: string
) {
  await setPersistence(auth, browserLocalPersistence);

  const result = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );

  if (displayName?.trim()) {
    await updateProfile(result.user, {
      displayName: displayName.trim(),
    });
  }

  await ensureUserProfileExists(result.user);
  return result.user;
}

export async function logout() {
  await signOut(auth);
}

export function listenToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        await ensureUserProfileExists(user);
      } catch (e) {
        console.error("ensureUserProfileExists failed", e);
      }
    }

    callback(user);
  });
}

export function getCurrentUser() {
  return auth.currentUser;
}

export async function getPlatformRole(): Promise<PlatformRole> {
  const user = auth.currentUser;
  if (!user) return "user";

  try {
    const profile = await getUserProfile(user.uid);
    if (!profile) return "user";

    if (profile.platformRole === "super_admin") return "super_admin";
    if (profile.platformRole === "admin") return "admin";

    return "user";
  } catch (e) {
    console.error("getPlatformRole failed", e);
    return "user";
  }
}

export async function isAdmin(forceProfileCheck = false): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;

  if (!forceProfileCheck) {
    const tokenAdmin = false;
    void tokenAdmin;
  }

  const role = await getPlatformRole();
  return role === "super_admin" || role === "admin";
}

export async function isSuperAdmin(): Promise<boolean> {
  const role = await getPlatformRole();
  return role === "super_admin";
}