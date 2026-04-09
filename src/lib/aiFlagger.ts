"use client";

import {
  doc,
  updateDoc,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { calculateAIRisk } from "@/lib/aiRisk";
import { createAIAlert } from "@/lib/aiAlerts";
import type { Dispatcher, Report } from "@/lib/firestore";

function safeNum(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getOpenReportCount(reports: Report[], dispatcherId: string) {
  return reports.filter((r: any) => r?.dispatcherId === dispatcherId).length;
}

function getAccountAgeDays(createdAt: any) {
  try {
    if (!createdAt) return 30;

    if (typeof createdAt?.toDate === "function") {
      const created = createdAt.toDate().getTime();
      return Math.max(1, Math.floor((Date.now() - created) / 86400000));
    }

    if (typeof createdAt?.seconds === "number") {
      const created = createdAt.seconds * 1000;
      return Math.max(1, Math.floor((Date.now() - created) / 86400000));
    }

    return 30;
  } catch {
    return 30;
  }
}

export async function runAIAutoFlagging(
  dispatchers: Dispatcher[],
  reports: Report[]
) {
  const updates: Promise<any>[] = [];

  for (const dispatcher of dispatchers) {
    const d = dispatcher as DocumentData;

    const adminOverrideEnabled = d.aiOverrideEnabled === true;
    if (adminOverrideEnabled) continue;

    const reviewCount = safeNum(d.reviewCount, 0);
    const ratingSum = safeNum(d.ratingSum, 0);

    const avgRating =
      reviewCount > 0 ? ratingSum / reviewCount : safeNum(d.rating, 0);

    const openReports = getOpenReportCount(reports, dispatcher.id);
    const confirmedReports = safeNum(d.confirmedReportCount, 0);

    const recentNegativeReviews =
      avgRating > 0 && avgRating <= 2.5 && reviewCount >= 2 ? 2 : 0;

    const ai = calculateAIRisk({
      avgRating,
      reviewCount,
      confirmedReports,
      openReports,
      recentNegativeReviews,
      verified: !!d.verified,
      accountAgeDays: getAccountAgeDays(d.createdAt),
    });

    const shouldFlag = ai.level === "high" || ai.level === "critical";

    const ref = doc(db, "dispatchers", dispatcher.id);

    updates.push(
      updateDoc(ref, {
        aiFlagged: shouldFlag,
        aiRiskLevel: ai.level,
        aiRiskScore: ai.score,
        aiSignals: ai.signals,
        aiConfidence: ai.confidence,
        aiLastEvaluatedAt: serverTimestamp(),
      })
    );
  }

  await Promise.allSettled(updates);
}

export async function setAIFlagAdminOverride(input: {
  dispatcherId: string;
  forcedFlagged: boolean;
  overrideNote?: string;
  actorUid?: string;
  actorEmail?: string;
  targetName?: string;
  targetEmail?: string;
}) {
  const ref = doc(db, "dispatchers", input.dispatcherId);

  await updateDoc(ref, {
    aiOverrideEnabled: true,
    aiFlagged: input.forcedFlagged,
    aiOverrideFlagged: input.forcedFlagged,
    aiOverrideSource: "admin",
    aiOverrideNote: (input.overrideNote ?? "").trim(),
    aiOverrideUpdatedAt: serverTimestamp(),
  });

  await createAIAlert({
    entityType: "dispatcher",
    entityId: input.dispatcherId,
    action: input.forcedFlagged ? "ai_flagged" : "ai_unflagged",
    title: input.forcedFlagged ? "Admin forced AI flag" : "Admin cleared AI flag",
    message: input.forcedFlagged
      ? `Admin manually forced AI flag on dispatcher ${input.targetName ?? input.dispatcherId}.`
      : `Admin manually cleared AI flag for dispatcher ${input.targetName ?? input.dispatcherId}.`,
    severity: input.forcedFlagged ? "high" : "warning",
    actorUid: input.actorUid,
    actorEmail: input.actorEmail,
    targetUid: input.dispatcherId,
    targetEmail: input.targetEmail,
    metadata: {
      overrideEnabled: true,
      forcedFlagged: input.forcedFlagged,
      overrideNote: (input.overrideNote ?? "").trim(),
    },
  });
}

export async function clearAIFlagAdminOverride(input: {
  dispatcherId: string;
  actorUid?: string;
  actorEmail?: string;
  targetName?: string;
  targetEmail?: string;
}) {
  const ref = doc(db, "dispatchers", input.dispatcherId);

  await updateDoc(ref, {
    aiOverrideEnabled: false,
    aiOverrideFlagged: false,
    aiOverrideSource: "",
    aiOverrideNote: "",
    aiOverrideUpdatedAt: serverTimestamp(),
  });

  await createAIAlert({
    entityType: "dispatcher",
    entityId: input.dispatcherId,
    action: "ai_override_disabled",
    title: "Admin cleared AI override",
    message: `Admin removed manual AI override for dispatcher ${input.targetName ?? input.dispatcherId}.`,
    severity: "info",
    actorUid: input.actorUid,
    actorEmail: input.actorEmail,
    targetUid: input.dispatcherId,
    targetEmail: input.targetEmail,
    metadata: {
      overrideEnabled: false,
    },
  });
}