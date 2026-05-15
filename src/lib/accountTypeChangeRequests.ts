import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AccountType, DriverSubtype } from "@/lib/userProfiles";

export type AccountTypeChangeRequestStatus = "pending" | "approved" | "denied";

export type AccountTypeChangeRequest = {
  id?: string;
  userId: string;
  userEmail?: string | null;
  displayName?: string | null;

  currentAccountType: AccountType;
  currentDriverSubtype?: DriverSubtype;

  requestedAccountType: AccountType;
  requestedDriverSubtype?: DriverSubtype;

  reason: string;
  status: AccountTypeChangeRequestStatus;

  createdAt?: unknown;
  updatedAt?: unknown;
};

export async function createAccountTypeChangeRequest(input: {
  userId: string;
  userEmail?: string | null;
  displayName?: string | null;
  currentAccountType: AccountType;
  currentDriverSubtype?: DriverSubtype;
  requestedAccountType: AccountType;
  requestedDriverSubtype?: DriverSubtype;
  reason: string;
}) {
  return addDoc(collection(db, "accountTypeChangeRequests"), {
    ...input,
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function listMyAccountTypeChangeRequests(userId: string) {
  const q = query(
    collection(db, "accountTypeChangeRequests"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);

  return snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as AccountTypeChangeRequest[];
}