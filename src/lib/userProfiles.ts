"use client";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "./firebase";

/* =========================
   TYPES
========================= */

export type PlatformRole =
  | "super_admin"
  | "admin"
  | "user";

export type AccountType =
  | "dispatcher"
  | "carrier"
  | "driver"
  | "broker"
  | null;

export type DriverSubtype =
  | "owner_operator"
  | "company_driver"
  | null;

export type VerificationStatus =
  | "unverified"
  | "pending"
  | "verified";

export type UserTier = "tier1" | "tier2" | "tier3";

export type UserProfile = {
  uid: string;
  email: string;
  displayName?: string;

  // permissions
  platformRole: PlatformRole;

  // business identity
  accountType: AccountType;
  driverSubtype: DriverSubtype;

  // trust
  verificationStatus: VerificationStatus;
  tier: UserTier;

  // AI / moderation
  aiFlagged?: boolean;
  aiOverride?: boolean;
  aiOverrideReason?: string;
  aiRiskScore?: number;
  aiRiskLevel?: "low" | "medium" | "high" | "critical" | string;
  aiSignals?: string[];

  createdAt?: any;
  updatedAt?: any;
  verificationRequestedAt?: any;
};

/* =========================
   NORMALIZERS
========================= */

function cleanString(value: unknown, fallback = "") {
  return String(value ?? fallback).trim();
}

function normalizePlatformRole(value: unknown): PlatformRole {
  const v = String(value ?? "").trim();
  if (v === "super_admin" || v === "admin") return v;
  return "user";
}

function normalizeAccountType(value: unknown): AccountType {
  const v = String(value ?? "").trim();
  if (
    v === "dispatcher" ||
    v === "carrier" ||
    v === "driver" ||
    v === "broker"
  ) {
    return v;
  }
  return null;
}

function normalizeDriverSubtype(value: unknown): DriverSubtype {
  const v = String(value ?? "").trim();
  if (v === "owner_operator" || v === "company_driver") {
    return v;
  }
  return null;
}

function normalizeVerificationStatus(value: unknown): VerificationStatus {
  const v = String(value ?? "").trim();
  if (v === "pending" || v === "verified") return v;
  return "unverified";
}

function normalizeTier(value: unknown): UserTier {
  const v = String(value ?? "").trim();
  if (v === "tier2" || v === "tier3") return v;
  return "tier1";
}

function toUserProfile(
  docSnap:
    | QueryDocumentSnapshot<DocumentData>
    | { id: string; data: () => DocumentData }
): UserProfile {
  const data = docSnap.data() || {};

  return {
    uid: cleanString(data.uid || docSnap.id),
    email: cleanString(data.email),
    displayName: cleanString(data.displayName),

    platformRole: normalizePlatformRole(data.platformRole),

    accountType: normalizeAccountType(data.accountType),
    driverSubtype: normalizeDriverSubtype(data.driverSubtype),

    verificationStatus: normalizeVerificationStatus(data.verificationStatus),
    tier: normalizeTier(data.tier),

    aiFlagged: data.aiFlagged === true,
    aiOverride: data.aiOverride === true,
    aiOverrideReason: cleanString(data.aiOverrideReason),
    aiRiskScore:
      typeof data.aiRiskScore === "number" ? data.aiRiskScore : 0,
    aiRiskLevel:
      typeof data.aiRiskLevel === "string" ? data.aiRiskLevel : "low",
    aiSignals: Array.isArray(data.aiSignals)
      ? data.aiSignals.map((x: unknown) => String(x))
      : [],

    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    verificationRequestedAt: data.verificationRequestedAt,
  };
}

/* =========================
   GET USER PROFILE
========================= */

export async function getUserProfile(
  uid: string
): Promise<UserProfile | null> {
  const cleanUid = cleanString(uid);
  if (!cleanUid) return null;

  const ref = doc(db, "userProfiles", cleanUid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return toUserProfile({
    id: snap.id,
    data: () => snap.data() || {},
  });
}

/* =========================
   LIST USER PROFILES
========================= */

export async function listUserProfiles(): Promise<UserProfile[]> {
  const ref = collection(db, "userProfiles");

  try {
    const snap = await getDocs(
      query(ref, orderBy("updatedAt", "desc"), limit(500))
    );
    return snap.docs.map((d) => toUserProfile(d));
  } catch (e) {
    console.warn("Falling back to unordered userProfiles query", e);

    const snap = await getDocs(ref);
    const rows = snap.docs.map((d) => toUserProfile(d));

    return rows.sort((a, b) => {
      const aSec =
        typeof a.updatedAt?.seconds === "number" ? a.updatedAt.seconds : 0;
      const bSec =
        typeof b.updatedAt?.seconds === "number" ? b.updatedAt.seconds : 0;
      return bSec - aSec;
    });
  }
}

/* =========================
   FIND USER BY EMAIL
========================= */

export async function getUserProfileByEmail(
  email: string
): Promise<UserProfile | null> {
  const cleanEmail = cleanString(email).toLowerCase();
  if (!cleanEmail) return null;

  const ref = collection(db, "userProfiles");
  const snap = await getDocs(
    query(ref, where("email", "==", cleanEmail), limit(1))
  );

  if (snap.empty) return null;

  return toUserProfile(snap.docs[0]);
}

/* =========================
   ENSURE PROFILE EXISTS
========================= */

export async function ensureUserProfile(input: {
  uid: string;
  email?: string | null;
  displayName?: string | null;
}): Promise<UserProfile> {
  const uid = cleanString(input.uid);
  if (!uid) {
    throw new Error("Missing uid");
  }

  const ref = doc(db, "userProfiles", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const profile: UserProfile = {
      uid,
      email: cleanString(input.email).toLowerCase(),
      displayName: cleanString(input.displayName),

      platformRole: "user",

      accountType: null,
      driverSubtype: null,

      verificationStatus: "unverified",
      tier: "tier1",

      aiFlagged: false,
      aiOverride: false,
      aiOverrideReason: "",
      aiRiskScore: 0,
      aiRiskLevel: "low",
      aiSignals: [],
    };

    await setDoc(ref, {
      ...profile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const createdSnap = await getDoc(ref);
    if (!createdSnap.exists()) {
      throw new Error("Failed to create user profile");
    }

    return toUserProfile({
      id: createdSnap.id,
      data: () => createdSnap.data() || {},
    });
  }

  const existing = snap.data() || {};

  const patch: Record<string, unknown> = {};
  let needsPatch = false;

  if (existing.platformRole === undefined) {
    patch.platformRole = "user";
    needsPatch = true;
  }

  if (existing.accountType === undefined) {
    patch.accountType = null;
    needsPatch = true;
  }

  if (existing.driverSubtype === undefined) {
    patch.driverSubtype = null;
    needsPatch = true;
  }

  if (existing.verificationStatus === undefined) {
    patch.verificationStatus = "unverified";
    needsPatch = true;
  }

  if (existing.tier === undefined) {
    patch.tier = "tier1";
    needsPatch = true;
  }

  if (existing.aiFlagged === undefined) {
    patch.aiFlagged = false;
    needsPatch = true;
  }

  if (existing.aiOverride === undefined) {
    patch.aiOverride = false;
    needsPatch = true;
  }

  if (existing.aiOverrideReason === undefined) {
    patch.aiOverrideReason = "";
    needsPatch = true;
  }

  if (existing.aiRiskScore === undefined) {
    patch.aiRiskScore = 0;
    needsPatch = true;
  }

  if (existing.aiRiskLevel === undefined) {
    patch.aiRiskLevel = "low";
    needsPatch = true;
  }

  if (existing.aiSignals === undefined) {
    patch.aiSignals = [];
    needsPatch = true;
  }

  const nextEmail = cleanString(input.email).toLowerCase();
  if (nextEmail && !existing.email) {
    patch.email = nextEmail;
    needsPatch = true;
  }

  const nextDisplayName = cleanString(input.displayName);
  if (nextDisplayName && !existing.displayName) {
    patch.displayName = nextDisplayName;
    needsPatch = true;
  }

  if (needsPatch) {
    patch.updatedAt = serverTimestamp();
    await updateDoc(ref, patch);
  }

  const finalSnap = await getDoc(ref);
  return toUserProfile({
    id: finalSnap.id,
    data: () => finalSnap.data() || {},
  });
}

/* backwards-compatible helper */
export async function ensureUserProfileExists(user: User) {
  return ensureUserProfile({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
  });
}

/* =========================
   UPDATE MY PROFILE ROLE DATA
========================= */

export async function updateMyProfileRoleData(input: {
  uid: string;
  displayName: string;
  accountType: AccountType;
  driverSubtype?: DriverSubtype;
}) {
  const uid = cleanString(input.uid);
  if (!uid) {
    throw new Error("Missing uid");
  }

  const ref = doc(db, "userProfiles", uid);

  const nextAccountType = normalizeAccountType(input.accountType);
  const nextDriverSubtype =
    nextAccountType === "driver"
      ? normalizeDriverSubtype(input.driverSubtype)
      : null;

  const updateData: Record<string, unknown> = {
    displayName: cleanString(input.displayName),
    accountType: nextAccountType,
    driverSubtype: nextDriverSubtype,
    updatedAt: serverTimestamp(),
  };

  await updateDoc(ref, updateData);
}

/* =========================
   ADMIN / SYSTEM UPDATE
========================= */

export async function updateUserRoleTierVerification(input: {
  uid: string;
  platformRole?: PlatformRole;
  accountType?: AccountType;
  driverSubtype?: DriverSubtype;
  verificationStatus?: VerificationStatus;
  tier?: UserTier;
}) {
  const uid = cleanString(input.uid);
  if (!uid) {
    throw new Error("Missing uid");
  }

  const ref = doc(db, "userProfiles", uid);

  const updateData: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (input.platformRole !== undefined) {
    updateData.platformRole = normalizePlatformRole(input.platformRole);
  }

  if (input.accountType !== undefined) {
    const nextAccountType = normalizeAccountType(input.accountType);
    updateData.accountType = nextAccountType;

    if (nextAccountType === "driver") {
      updateData.driverSubtype = normalizeDriverSubtype(input.driverSubtype);
    } else {
      updateData.driverSubtype = null;
    }
  } else if (input.driverSubtype !== undefined) {
    updateData.driverSubtype = normalizeDriverSubtype(input.driverSubtype);
  }

  if (input.verificationStatus !== undefined) {
    updateData.verificationStatus = normalizeVerificationStatus(
      input.verificationStatus
    );
  }

  if (input.tier !== undefined) {
    updateData.tier = normalizeTier(input.tier);
  }

  await updateDoc(ref, updateData);
}

/* =========================
   REQUEST VERIFICATION
========================= */

export async function requestVerification(uid: string) {
  const cleanUid = cleanString(uid);
  if (!cleanUid) {
    throw new Error("Missing uid");
  }

  const ref = doc(db, "userProfiles", cleanUid);

  await updateDoc(ref, {
    verificationStatus: "pending",
    verificationRequestedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/* backwards-compatible helper */
export async function requestUserVerification(uid: string) {
  return requestVerification(uid);
}

/* =========================
   ADMIN AI OVERRIDE
========================= */

export async function overrideAIFlag(input: {
  uid: string;
  aiFlagged: boolean;
  aiOverrideReason?: string;
}) {
  const uid = cleanString(input.uid);
  if (!uid) {
    throw new Error("Missing uid");
  }

  const ref = doc(db, "userProfiles", uid);

  await updateDoc(ref, {
    aiFlagged: !!input.aiFlagged,
    aiOverride: true,
    aiOverrideReason: cleanString(input.aiOverrideReason),
    updatedAt: serverTimestamp(),
  });
}

/* =========================
   ADMIN SET PLATFORM ROLE
========================= */

export async function setUserPlatformRole(
  uid: string,
  role: PlatformRole
) {
  const cleanUid = cleanString(uid);
  if (!cleanUid) {
    throw new Error("Missing uid");
  }

  const ref = doc(db, "userProfiles", cleanUid);

  await updateDoc(ref, {
    platformRole: normalizePlatformRole(role),
    updatedAt: serverTimestamp(),
  });
}