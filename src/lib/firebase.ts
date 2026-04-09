"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getFunctions, type Functions } from "firebase/functions";

/**
 * Next.js IMPORTANT:
 * In CLIENT code, env vars must be referenced directly:
 *   process.env.NEXT_PUBLIC_...
 * Dynamic access like process.env[k] will NOT work.
 */

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const AUTH_DOMAIN = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const STORAGE_BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const MESSAGING_SENDER_ID = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const APP_ID = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
// Optional (safe to ignore if missing)
const MEASUREMENT_ID = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;

function assertEnv() {
  const missing: string[] = [];
  if (!API_KEY) missing.push("NEXT_PUBLIC_FIREBASE_API_KEY");
  if (!AUTH_DOMAIN) missing.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
  if (!PROJECT_ID) missing.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  if (!STORAGE_BUCKET) missing.push("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");
  if (!MESSAGING_SENDER_ID) missing.push("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
  if (!APP_ID) missing.push("NEXT_PUBLIC_FIREBASE_APP_ID");

  if (missing.length) {
    throw new Error(
      `Missing Firebase env vars: ${missing.join(", ")}. Check your .env.local and RESTART dev server.`
    );
  }
}

assertEnv();

const firebaseConfig = {
  apiKey: API_KEY!,
  authDomain: AUTH_DOMAIN!,
  projectId: PROJECT_ID!,
  storageBucket: STORAGE_BUCKET!,
  messagingSenderId: MESSAGING_SENDER_ID!,
  appId: APP_ID!,
  // optional
  measurementId: MEASUREMENT_ID,
};

// ✅ Named export: app
export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// Region lock (you use us-central1)
export const functions: Functions = getFunctions(app, "us-central1");