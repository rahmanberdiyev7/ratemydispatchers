import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "./firebase";

export type AIFlaggedProfile = {
  id: string;
  name?: string;
  company?: string;
  aiRiskScore: number;
  aiRiskLevel: "low" | "medium" | "high" | "critical";
  aiSignals: string[];
  aiFlagged: boolean;
  aiOverridden: boolean;
  aiOverrideReason?: string;
  createdAt?: any;
};

export async function listAIFlaggedDispatchers(): Promise<AIFlaggedProfile[]> {
  const q = query(
    collection(db, "dispatchers"),
    where("aiFlagged", "==", true),
    orderBy("aiRiskScore", "desc"),
    limit(100)
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as any),
  }));
}

export async function forceFlagDispatcher(id: string) {
  await updateDoc(doc(db, "dispatchers", id), {
    aiFlagged: true,
    aiOverridden: false,
    updatedAt: new Date(),
  });
}

export async function clearFlagDispatcher(id: string) {
  await updateDoc(doc(db, "dispatchers", id), {
    aiFlagged: false,
    aiOverridden: true,
    updatedAt: new Date(),
  });
}

export async function overrideAIFlag(
  id: string,
  reason: string
) {
  await updateDoc(doc(db, "dispatchers", id), {
    aiOverridden: true,
    aiOverrideReason: reason,
    updatedAt: new Date(),
  });
}