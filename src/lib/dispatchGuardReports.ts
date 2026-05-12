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

export type DispatchGuardReportType =
  | "double_brokering"
  | "hostage_load"
  | "no_payment"
  | "cargo_theft"
  | "unsafe_driver"
  | "fake_dispatcher"
  | "fraud"
  | "identity_mismatch";

export type DispatchGuardSeverity =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type DispatchGuardReport = {
  id?: string;

  targetEntityId: string;

  targetType:
    | "dispatcher"
    | "broker"
    | "driver"
    | "carrier";

  reportType: DispatchGuardReportType;

  severity: DispatchGuardSeverity;

  description: string;

  createdByUserId?: string;

  resolutionStatus?:
    | "open"
    | "under_review"
    | "resolved"
    | "dismissed";

  aiFraudProbability?: number;

  createdAt?: unknown;
};

export async function createDispatchGuardReport(
  input: DispatchGuardReport,
) {
  return addDoc(
    collection(db, "dispatchguard_reports"),
    {
      ...input,

      resolutionStatus:
        input.resolutionStatus ?? "open",

      aiFraudProbability:
        input.aiFraudProbability ?? 0,

      createdAt: serverTimestamp(),
    },
  );
}

export async function listDispatchGuardReports(
  targetEntityId?: string,
) {
  const ref = collection(
    db,
    "dispatchguard_reports",
  );

  const q = targetEntityId
    ? query(
        ref,
        where(
          "targetEntityId",
          "==",
          targetEntityId,
        ),
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
  })) as DispatchGuardReport[];
}