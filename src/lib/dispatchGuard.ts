import {
  addDoc,
  collection,
  doc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type DispatchGuardEntityType = "dispatcher" | "broker" | "driver";

export type DispatchGuardLevel = "clear" | "watch" | "high_risk" | "critical";

export type DispatchGuardReason =
  | "spam"
  | "fraud"
  | "double_brokering"
  | "payment_issue"
  | "unsafe_behavior"
  | "no_show"
  | "communication_issue"
  | "identity_issue"
  | "fake_documents"
  | "cargo_issue"
  | "late_delivery"
  | "other";

export type DispatchGuardRecord = {
  id: string;

  entityType: DispatchGuardEntityType;
  entityId: string;
  entityName: string;

  level: DispatchGuardLevel;
  reason: DispatchGuardReason;
  details: string;

  reporterUid: string;
  reporterEmail?: string | null;
  reporterAccountType?: string | null;

  confirmed: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type CreateDispatchGuardReportInput = {
  entityType: DispatchGuardEntityType;
  entityId: string;
  entityName: string;

  reason: DispatchGuardReason;
  details: string;

  reporterUid: string;
  reporterEmail?: string | null;
  reporterAccountType?: string | null;
};

function getCollectionName(entityType: DispatchGuardEntityType) {
  if (entityType === "dispatcher") return "dispatchers";
  if (entityType === "broker") return "brokers";
  return "drivers";
}

export function calculateDispatchGuardScore(input: {
  reportCount?: number;
  confirmedReportCount?: number;
  reviewCount?: number;
  ratingSum?: number;
}) {
  const reportCount = Number(input.reportCount ?? 0);
  const confirmedReportCount = Number(input.confirmedReportCount ?? 0);
  const reviewCount = Number(input.reviewCount ?? 0);
  const ratingSum = Number(input.ratingSum ?? 0);

  const avgRating = reviewCount ? ratingSum / reviewCount : 0;

  let score = 0;

  score += reportCount * 12;
  score += confirmedReportCount * 25;

  if (reviewCount >= 3 && avgRating < 3) score += 15;
  if (reviewCount >= 5 && avgRating < 2.5) score += 25;
  if (reviewCount >= 8 && avgRating < 2) score += 35;

  return Math.min(100, Math.max(0, Math.round(score)));
}

export function getDispatchGuardLevel(score: number): DispatchGuardLevel {
  if (score >= 80) return "critical";
  if (score >= 60) return "high_risk";
  if (score >= 30) return "watch";
  return "clear";
}

export function getDispatchGuardLabel(level?: DispatchGuardLevel | string | null) {
  if (level === "critical") return "Critical";
  if (level === "high_risk") return "High Risk";
  if (level === "watch") return "Watch";
  return "Clear";
}

export function getDispatchGuardColor(level?: DispatchGuardLevel | string | null) {
  if (level === "critical") return "rgba(255, 0, 64, 0.22)";
  if (level === "high_risk") return "rgba(255, 120, 0, 0.22)";
  if (level === "watch") return "rgba(255, 210, 0, 0.18)";
  return "rgba(0, 255, 140, 0.14)";
}

export function getDispatchGuardBorder(level?: DispatchGuardLevel | string | null) {
  if (level === "critical") return "1px solid rgba(255, 0, 64, 0.55)";
  if (level === "high_risk") return "1px solid rgba(255, 120, 0, 0.55)";
  if (level === "watch") return "1px solid rgba(255, 210, 0, 0.45)";
  return "1px solid rgba(0, 255, 140, 0.28)";
}

export async function createDispatchGuardReport(
  input: CreateDispatchGuardReportInput
) {
  if (!input.entityType) throw new Error("Entity type is required.");
  if (!input.entityId) throw new Error("Entity ID is required.");
  if (!input.reporterUid) throw new Error("Reporter UID is required.");

  const entityCollection = getCollectionName(input.entityType);
  const entityRef = doc(db, entityCollection, input.entityId);

  const reportRef = await addDoc(collection(db, "dispatchGuardReports"), {
    entityType: input.entityType,
    entityId: input.entityId,
    entityName: input.entityName || "Unknown",

    reason: input.reason,
    details: input.details.trim(),

    reporterUid: input.reporterUid,
    reporterEmail: input.reporterEmail ?? null,
    reporterAccountType: input.reporterAccountType ?? null,

    confirmed: false,

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const nextScore = calculateDispatchGuardScore({
    reportCount: 1,
    confirmedReportCount: 0,
  });

  await updateDoc(entityRef, {
    dispatchGuardReportCount: increment(1),
    dispatchGuardScore: increment(nextScore),
    dispatchGuardLevel: getDispatchGuardLevel(nextScore),
    dispatchGuardFlagged: true,
    updatedAt: serverTimestamp(),
  });

  return reportRef.id;
}

export async function listDispatchGuardReports(
  entityType?: DispatchGuardEntityType
): Promise<DispatchGuardRecord[]> {
  const base = entityType
    ? query(
        collection(db, "dispatchGuardReports"),
        where("entityType", "==", entityType),
        orderBy("createdAt", "desc")
      )
    : query(
        collection(db, "dispatchGuardReports"),
        orderBy("createdAt", "desc")
      );

  const snap = await getDocs(base);

  return snap.docs.map((row) => {
    const data = row.data();

    return {
      id: row.id,

      entityType: (data.entityType ?? "dispatcher") as DispatchGuardEntityType,
      entityId: String(data.entityId ?? ""),
      entityName: String(data.entityName ?? "Unknown"),

      level: (data.level ?? "watch") as DispatchGuardLevel,
      reason: (data.reason ?? "other") as DispatchGuardReason,
      details: String(data.details ?? ""),

      reporterUid: String(data.reporterUid ?? ""),
      reporterEmail:
        typeof data.reporterEmail === "string" ? data.reporterEmail : null,
      reporterAccountType:
        typeof data.reporterAccountType === "string"
          ? data.reporterAccountType
          : null,

      confirmed: Boolean(data.confirmed),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  });
}