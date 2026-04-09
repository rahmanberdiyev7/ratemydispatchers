"use client";

import { auth, db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit as qLimit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

export type VerificationRequestStatus = "pending" | "approved" | "rejected";

export type DispatcherVerificationRequest = {
  id: string;
  dispatcherId: string;
  dispatcherName?: string;
  company?: string;
  createdBy: string;
  createdAt?: any;
  status: VerificationRequestStatus;
  email?: string;
  phone?: string;
  mcNumber?: string;
  dotNumber?: string;
  notes?: string;
};

function requireUser() {
  const u = auth.currentUser;
  if (!u) throw new Error("Not logged in");
  return u;
}

function mapDoc<T>(id: string, data: any): T {
  return { id, ...(data ?? {}) } as T;
}

function cleanOptional(value?: string) {
  const v = (value ?? "").trim();
  return v.length > 0 ? v : null;
}

const verificationRequestsCol = collection(db, "verificationRequests");

export async function createDispatcherVerificationRequest(input: {
  dispatcherId: string;
  dispatcherName?: string;
  company?: string;
  email?: string;
  phone?: string;
  mcNumber?: string;
  dotNumber?: string;
  notes?: string;
}) {
  const u = requireUser();

  const payload: Record<string, any> = {
    dispatcherId: input.dispatcherId,
    createdBy: u.uid,
    createdAt: serverTimestamp(),
    status: "pending",
  };

  const dispatcherName = cleanOptional(input.dispatcherName);
  const company = cleanOptional(input.company);
  const email = cleanOptional(input.email);
  const phone = cleanOptional(input.phone);
  const mcNumber = cleanOptional(input.mcNumber);
  const dotNumber = cleanOptional(input.dotNumber);
  const notes = cleanOptional(input.notes);

  if (dispatcherName !== null) payload.dispatcherName = dispatcherName;
  if (company !== null) payload.company = company;
  if (email !== null) payload.email = email;
  if (phone !== null) payload.phone = phone;
  if (mcNumber !== null) payload.mcNumber = mcNumber;
  if (dotNumber !== null) payload.dotNumber = dotNumber;
  if (notes !== null) payload.notes = notes;

  const ref = await addDoc(verificationRequestsCol, payload);
  return ref.id;
}

export async function listVerificationRequests(opts?: { limit?: number }) {
  const lim = opts?.limit ?? 100;
  const q = query(verificationRequestsCol, orderBy("createdAt", "desc"), qLimit(lim));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapDoc<DispatcherVerificationRequest>(d.id, d.data()));
}

export async function listPendingVerificationRequests(opts?: { limit?: number }) {
  const lim = opts?.limit ?? 100;
  const q = query(
    verificationRequestsCol,
    where("status", "==", "pending"),
    orderBy("createdAt", "desc"),
    qLimit(lim)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapDoc<DispatcherVerificationRequest>(d.id, d.data()));
}

export async function approveVerificationRequest(requestId: string, dispatcherId: string) {
  await updateDoc(doc(db, "verificationRequests", requestId), {
    status: "approved",
  });

  await updateDoc(doc(db, "dispatchers", dispatcherId), {
    verified: true,
  });
}

export async function rejectVerificationRequest(requestId: string) {
  await updateDoc(doc(db, "verificationRequests", requestId), {
    status: "rejected",
  });
}