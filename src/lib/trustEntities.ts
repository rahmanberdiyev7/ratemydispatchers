import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export type TrustEntityType =
  | "dispatcher"
  | "broker"
  | "driver"
  | "carrier";

export type DispatchGuardLevel =
  | "trusted"
  | "verified"
  | "watch"
  | "high_risk"
  | "critical";

export type TrustEntity = {
  id?: string;

  type: TrustEntityType;

  displayName: string;

  companyName?: string;

  mcNumber?: string;
  dotNumber?: string;

  phone?: string;
  email?: string;

  verified?: boolean;

  dispatchGuard?: {
    score: number;
    level: DispatchGuardLevel;

    reportsCount: number;
    reviewCount: number;

    riskSignals: number;
  };

  createdAt?: unknown;
  updatedAt?: unknown;
};

export async function createTrustEntity(
  input: TrustEntity,
) {
  return addDoc(collection(db, "trust_entities"), {
    ...input,

    dispatchGuard: input.dispatchGuard ?? {
      score: 85,
      level: "verified",
      reportsCount: 0,
      reviewCount: 0,
      riskSignals: 0,
    },

    verified: input.verified ?? false,

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateTrustEntity(
  id: string,
  data: Partial<TrustEntity>,
) {
  return updateDoc(doc(db, "trust_entities", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function getTrustEntity(
  id: string,
) {
  const snap = await getDoc(
    doc(db, "trust_entities", id),
  );

  if (!snap.exists()) {
    return null;
  }

  return {
    id: snap.id,
    ...snap.data(),
  } as TrustEntity;
}

export async function listTrustEntities(
  type?: TrustEntityType,
) {
  const ref = collection(db, "trust_entities");

  const q = type
    ? query(
        ref,
        where("type", "==", type),
        orderBy("createdAt", "desc"),
      )
    : query(
        ref,
        orderBy("createdAt", "desc"),
      );

  const snap = await getDocs(q);

  return snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as TrustEntity[];
}