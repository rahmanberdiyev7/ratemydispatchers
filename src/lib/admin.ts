"use client";

import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function forceFlagDispatcher(id: string) {
  await updateDoc(doc(db, "dispatchers", id), {
    aiFlagged: true,
    aiOverridden: false,
    updatedAt: serverTimestamp(),
  });
}

export async function clearFlagDispatcher(id: string) {
  await updateDoc(doc(db, "dispatchers", id), {
    aiFlagged: false,
    aiOverridden: true,
    updatedAt: serverTimestamp(),
  });
}

export async function overrideAIFlag(input: {
  id: string;
  reason: string;
}) {
  await updateDoc(doc(db, "dispatchers", input.id), {
    aiOverridden: true,
    aiOverrideReason: input.reason,
    updatedAt: serverTimestamp(),
  });
}