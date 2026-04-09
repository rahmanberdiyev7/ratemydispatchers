"use client";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit as fsLimit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type Broker = {
  id: string;
  name: string;
  company: string;
  mcNumber?: string;
  dotNumber?: string;
  email?: string;
  phone?: string;
  verified?: boolean;
  tier?: "tier1" | "tier2" | "tier3";
  rating?: number;
  ratingSum?: number;
  reviewCount?: number;
  reportCount?: number;
  confirmedReportCount?: number;
  communityAlert?: boolean;
  recentActivityScore?: number;
  profileCompleteness?: number;
  trustScore?: number;
  riskScore?: number;
  createdAt?: any;
  updatedAt?: any;
};

export type BrokerReport = {
  id: string;
  brokerId: string;
  brokerName?: string;
  carrierUserId?: string;
  reason: string;
  details?: string;
  status: "open" | "confirmed" | "dismissed";
  createdAt?: any;
  updatedAt?: any;
};

function mapBroker(docSnap: QueryDocumentSnapshot<DocumentData>): Broker {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name ?? "",
    company: data.company ?? "",
    mcNumber: data.mcNumber ?? "",
    dotNumber: data.dotNumber ?? "",
    email: data.email ?? "",
    phone: data.phone ?? "",
    verified: data.verified === true,
    tier: data.tier ?? "tier1",
    rating: Number(data.rating ?? 0),
    ratingSum: Number(data.ratingSum ?? 0),
    reviewCount: Number(data.reviewCount ?? 0),
    reportCount: Number(data.reportCount ?? 0),
    confirmedReportCount: Number(data.confirmedReportCount ?? 0),
    communityAlert: data.communityAlert === true,
    recentActivityScore: Number(data.recentActivityScore ?? 0),
    profileCompleteness: Number(data.profileCompleteness ?? 0),
    trustScore: Number(data.trustScore ?? 0),
    riskScore: Number(data.riskScore ?? 0),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

function mapBrokerReport(docSnap: QueryDocumentSnapshot<DocumentData>): BrokerReport {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    brokerId: data.brokerId ?? "",
    brokerName: data.brokerName ?? "",
    carrierUserId: data.carrierUserId ?? "",
    reason: data.reason ?? "",
    details: data.details ?? "",
    status: data.status ?? "open",
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function listBrokers(input?: { limit?: number }): Promise<Broker[]> {
  const n = Math.max(1, Math.min(Number(input?.limit ?? 100), 500));
  const qy = query(collection(db, "brokers"), orderBy("updatedAt", "desc"), fsLimit(n));
  const snap = await getDocs(qy);
  return snap.docs.map(mapBroker);
}

export async function getBroker(id: string): Promise<Broker | null> {
  const snap = await getDoc(doc(db, "brokers", id));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    name: data.name ?? "",
    company: data.company ?? "",
    mcNumber: data.mcNumber ?? "",
    dotNumber: data.dotNumber ?? "",
    email: data.email ?? "",
    phone: data.phone ?? "",
    verified: data.verified === true,
    tier: data.tier ?? "tier1",
    rating: Number(data.rating ?? 0),
    ratingSum: Number(data.ratingSum ?? 0),
    reviewCount: Number(data.reviewCount ?? 0),
    reportCount: Number(data.reportCount ?? 0),
    confirmedReportCount: Number(data.confirmedReportCount ?? 0),
    communityAlert: data.communityAlert === true,
    recentActivityScore: Number(data.recentActivityScore ?? 0),
    profileCompleteness: Number(data.profileCompleteness ?? 0),
    trustScore: Number(data.trustScore ?? 0),
    riskScore: Number(data.riskScore ?? 0),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function listOpenBrokerReports(input?: { limit?: number }): Promise<BrokerReport[]> {
  const n = Math.max(1, Math.min(Number(input?.limit ?? 100), 500));
  const qy = query(
    collection(db, "brokerReports"),
    where("status", "==", "open"),
    orderBy("createdAt", "desc"),
    fsLimit(n)
  );
  const snap = await getDocs(qy);
  return snap.docs.map(mapBrokerReport);
}

export async function listReportsForBroker(
  brokerId: string,
  input?: { limit?: number }
): Promise<BrokerReport[]> {
  const n = Math.max(1, Math.min(Number(input?.limit ?? 100), 500));
  const qy = query(
    collection(db, "brokerReports"),
    where("brokerId", "==", brokerId),
    orderBy("createdAt", "desc"),
    fsLimit(n)
  );
  const snap = await getDocs(qy);
  return snap.docs.map(mapBrokerReport);
}

export async function createBrokerReport(input: {
  brokerId: string;
  brokerName?: string;
  carrierUserId?: string;
  reason: string;
  details?: string;
}) {
  return addDoc(collection(db, "brokerReports"), {
    brokerId: input.brokerId,
    brokerName: input.brokerName ?? "",
    carrierUserId: input.carrierUserId ?? "",
    reason: input.reason.trim(),
    details: (input.details ?? "").trim(),
    status: "open",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function confirmBrokerReport(input: {
  reportId: string;
  brokerId: string;
  enableCommunityAlert?: boolean;
}) {
  const reportRef = doc(db, "brokerReports", input.reportId);
  const brokerRef = doc(db, "brokers", input.brokerId);

  await updateDoc(reportRef, {
    status: "confirmed",
    updatedAt: serverTimestamp(),
  });

  await updateDoc(brokerRef, {
    confirmedReportCount: increment(1),
    reportCount: increment(1),
    communityAlert: input.enableCommunityAlert === true ? true : false,
    updatedAt: serverTimestamp(),
  });
}

export async function dismissBrokerReport(reportId: string) {
  const reportRef = doc(db, "brokerReports", reportId);

  await updateDoc(reportRef, {
    status: "dismissed",
    updatedAt: serverTimestamp(),
  });
}

export async function setBrokerCommunityAlert(input: {
  brokerId: string;
  enabled: boolean;
}) {
  const brokerRef = doc(db, "brokers", input.brokerId);

  await updateDoc(brokerRef, {
    communityAlert: input.enabled,
    updatedAt: serverTimestamp(),
  });
}