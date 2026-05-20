import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AccountType } from "@/lib/userProfiles";

export type ReferralTargetType = Exclude<AccountType, null>;

export function createReferralCode(email: string) {
  const base = email
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 14);

  const random = Math.random().toString(36).slice(2, 7);

  return `${base}-${random}`;
}

export async function createReferralProfile(input: {
  userId: string;
  email: string;
  displayName?: string | null;
}) {
  const code = createReferralCode(input.email);

  await setDoc(
    doc(db, "referralProfiles", input.userId),
    {
      userId: input.userId,
      email: input.email,
      displayName: input.displayName ?? "",
      code,
      totalSignups: 0,
      brokerSignups: 0,
      carrierSignups: 0,
      dispatcherSignups: 0,
      driverSignups: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return code;
}

export async function findReferralByCode(code: string) {
  const q = query(
    collection(db, "referralProfiles"),
    where("code", "==", code),
    limit(1)
  );

  const snap = await getDocs(q);

  if (snap.empty) return null;

  const first = snap.docs[0];

  return {
    id: first.id,
    ...first.data(),
  };
}

export async function recordReferralSignup(input: {
  referralCode: string;
  referredUserId: string;
  referredEmail: string | null;
  referredAccountType: ReferralTargetType;
}) {
  const referrer = await findReferralByCode(input.referralCode);

  await addDoc(collection(db, "referralSignups"), {
    referralCode: input.referralCode,
    referrerUserId: referrer?.id ?? null,
    referredUserId: input.referredUserId,
    referredEmail: input.referredEmail ?? "",
    referredAccountType: input.referredAccountType,
    status: "created",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return referrer;
}