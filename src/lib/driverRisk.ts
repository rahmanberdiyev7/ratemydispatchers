import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type DriverRiskLevel = "low" | "medium" | "high" | "critical";

export type DriverReportReason =
  | "spam"
  | "no_show"
  | "fraud"
  | "unsafe_behavior"
  | "communication_issue"
  | "late_delivery"
  | "other";

export type DriverReport = {
  id: string;
  driverId: string;
  reporterUid: string;
  reporterEmail?: string | null;
  reporterAccountType?: string | null;
  reason: DriverReportReason;
  details: string;
  confirmed: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type CreateDriverReportInput = {
  driverId: string;
  reporterUid: string;
  reporterEmail?: string | null;
  reporterAccountType?: string | null;
  reason: DriverReportReason;
  details: string;
};

export function calculateDriverRiskScore(input: {
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
  score += confirmedReportCount * 20;

  if (reviewCount >= 3 && avgRating < 3) score += 18;
  if (reviewCount >= 5 && avgRating < 2.5) score += 25;

  return Math.min(100, Math.max(0, Math.round(score)));
}

export function getDriverRiskLevel(score: number): DriverRiskLevel {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}

export async function createDriverReport(input: CreateDriverReportInput) {
  if (!input.driverId) throw new Error("Driver ID is required.");
  if (!input.reporterUid) throw new Error("Reporter UID is required.");

  const reportRef = await addDoc(collection(db, "driverReports"), {
    driverId: input.driverId,
    reporterUid: input.reporterUid,
    reporterEmail: input.reporterEmail ?? null,
    reporterAccountType: input.reporterAccountType ?? null,
    reason: input.reason,
    details: input.details.trim(),
    confirmed: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const driverRef = doc(db, "drivers", input.driverId);
  const driverSnap = await getDoc(driverRef);

  if (driverSnap.exists()) {
    const data = driverSnap.data();

    const nextReportCount = Number(data.reportCount ?? 0) + 1;
    const confirmedReportCount = Number(data.confirmedReportCount ?? 0);
    const reviewCount = Number(data.reviewCount ?? 0);
    const ratingSum = Number(data.ratingSum ?? 0);

    const riskScore = calculateDriverRiskScore({
      reportCount: nextReportCount,
      confirmedReportCount,
      reviewCount,
      ratingSum,
    });

    await updateDoc(driverRef, {
      reportCount: increment(1),
      riskScore,
      riskLevel: getDriverRiskLevel(riskScore),
      updatedAt: serverTimestamp(),
    });
  }

  return reportRef.id;
}

export async function listDriverReports(driverId: string): Promise<DriverReport[]> {
  const q = query(
    collection(db, "driverReports"),
    where("driverId", "==", driverId),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);

  return snap.docs.map((row) => {
    const data = row.data();

    return {
      id: row.id,
      driverId: String(data.driverId ?? ""),
      reporterUid: String(data.reporterUid ?? ""),
      reporterEmail:
        typeof data.reporterEmail === "string" ? data.reporterEmail : null,
      reporterAccountType:
        typeof data.reporterAccountType === "string"
          ? data.reporterAccountType
          : null,
      reason: (data.reason ?? "other") as DriverReportReason,
      details: String(data.details ?? ""),
      confirmed: Boolean(data.confirmed),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  });
}