import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import {
  onDocumentCreated,
  onDocumentDeleted,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions";

initializeApp();

const db = getFirestore();

type AIRiskLevel = "low" | "medium" | "high" | "critical";

type AIRiskResult = {
  score: number;
  level: AIRiskLevel;
  signals: string[];
  confidence: number;
};

function safeNum(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getAccountAgeDays(createdAt: unknown) {
  try {
    if (!createdAt) return 30;

    if (createdAt instanceof Timestamp) {
      const createdMs = createdAt.toMillis();
      return Math.max(1, Math.floor((Date.now() - createdMs) / 86400000));
    }

    const maybe = createdAt as { seconds?: number };
    if (typeof maybe?.seconds === "number") {
      return Math.max(
        1,
        Math.floor((Date.now() - maybe.seconds * 1000) / 86400000)
      );
    }

    return 30;
  } catch {
    return 30;
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function calculateAIRisk(input: {
  avgRating: number;
  reviewCount: number;
  confirmedReports: number;
  openReports: number;
  recentNegativeReviews: number;
  verified: boolean;
  accountAgeDays: number;
}): AIRiskResult {
  const signals: string[] = [];
  let score = 0;

  if (input.openReports >= 1) {
    score += input.openReports * 12;
    signals.push(`${input.openReports} open report${input.openReports > 1 ? "s" : ""}`);
  }

  if (input.confirmedReports >= 1) {
    score += input.confirmedReports * 18;
    signals.push(
      `${input.confirmedReports} confirmed report${input.confirmedReports > 1 ? "s" : ""}`
    );
  }

  if (input.reviewCount >= 2 && input.avgRating > 0 && input.avgRating <= 2.5) {
    score += 20;
    signals.push("very low public rating");
  } else if (input.reviewCount >= 2 && input.avgRating > 0 && input.avgRating <= 3.2) {
    score += 10;
    signals.push("below-average rating");
  }

  if (input.recentNegativeReviews >= 2) {
    score += 14;
    signals.push("multiple negative reviews");
  }

  if (input.reviewCount <= 1) {
    score += 6;
    signals.push("limited review history");
  }

  if (input.accountAgeDays <= 14) {
    score += 12;
    signals.push("new account");
  } else if (input.accountAgeDays <= 45) {
    score += 6;
    signals.push("young account");
  }

  if (input.verified) {
    score -= 8;
    signals.push("verified profile lowers risk");
  }

  score = clamp(Math.round(score), 0, 100);

  let level: AIRiskLevel = "low";
  if (score >= 70) level = "critical";
  else if (score >= 45) level = "high";
  else if (score >= 20) level = "medium";

  let confidence = 0.45;

  if (input.reviewCount >= 3) confidence += 0.12;
  if (input.reviewCount >= 8) confidence += 0.08;
  if (input.openReports >= 1) confidence += 0.1;
  if (input.confirmedReports >= 1) confidence += 0.15;
  if (input.accountAgeDays >= 30) confidence += 0.05;

  confidence = clamp(Number(confidence.toFixed(2)), 0.35, 0.95);

  return {
    score,
    level,
    signals,
    confidence,
  };
}

async function evaluateDispatcher(dispatcherId: string) {
  if (!dispatcherId) return;

  const dispatcherRef = db.collection("dispatchers").doc(dispatcherId);
  const dispatcherSnap = await dispatcherRef.get();

  if (!dispatcherSnap.exists) {
    logger.warn("Dispatcher not found for evaluation", { dispatcherId });
    return;
  }

  const dispatcher = dispatcherSnap.data() || {};

  if (dispatcher.aiOverrideEnabled === true) {
    logger.info("Skipping AI evaluation due to admin override", { dispatcherId });
    return;
  }

  const reviewsSnap = await db
    .collection("reviews")
    .where("dispatcherId", "==", dispatcherId)
    .get();

  const reportsSnap = await db
    .collection("reports")
    .where("dispatcherId", "==", dispatcherId)
    .get();

  let reviewCount = 0;
  let ratingSum = 0;
  let negativeReviewCount = 0;

  for (const doc of reviewsSnap.docs) {
    const data = doc.data() || {};
    const hidden = data.hidden === true;
    if (hidden) continue;

    const rating = safeNum(data.rating, 0);
    if (rating > 0) {
      reviewCount += 1;
      ratingSum += rating;

      if (rating <= 2) {
        negativeReviewCount += 1;
      }
    }
  }

  let openReports = 0;
  let confirmedReports = 0;

  for (const doc of reportsSnap.docs) {
    const data = doc.data() || {};
    const status = String(data.status ?? "open").toLowerCase();

    if (status === "confirmed") {
      confirmedReports += 1;
    } else if (status !== "dismissed" && status !== "resolved") {
      openReports += 1;
    }
  }

  const avgRating =
    reviewCount > 0
      ? Number((ratingSum / reviewCount).toFixed(2))
      : safeNum(dispatcher.rating, 0);

  const ai = calculateAIRisk({
    avgRating,
    reviewCount,
    confirmedReports,
    openReports,
    recentNegativeReviews: negativeReviewCount,
    verified: dispatcher.verified === true,
    accountAgeDays: getAccountAgeDays(dispatcher.createdAt),
  });

  const shouldFlag = ai.level === "high" || ai.level === "critical";

  await dispatcherRef.set(
    {
      reviewCount,
      ratingSum,
      rating: avgRating,
      reportCount: openReports + confirmedReports,
      confirmedReportCount: confirmedReports,

      aiFlagged: shouldFlag,
      aiRiskLevel: ai.level,
      aiRiskScore: ai.score,
      aiSignals: ai.signals,
      aiConfidence: ai.confidence,
      aiLastEvaluatedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  logger.info("Dispatcher AI evaluation complete", {
    dispatcherId,
    score: ai.score,
    level: ai.level,
    flagged: shouldFlag,
    reviewCount,
    openReports,
    confirmedReports,
  });
}

function getDispatcherIdFromReview(data: Record<string, any> | undefined) {
  return String(data?.dispatcherId ?? "").trim();
}

function getDispatcherIdFromReport(data: Record<string, any> | undefined) {
  return String(data?.dispatcherId ?? "").trim();
}

export const onReviewCreatedAutoFlag = onDocumentCreated(
  "reviews/{reviewId}",
  async (event) => {
    const data = event.data?.data() as Record<string, any> | undefined;
    const dispatcherId = getDispatcherIdFromReview(data);

    if (!dispatcherId) {
      logger.warn("Review created without dispatcherId", { reviewId: event.params.reviewId });
      return;
    }

    await evaluateDispatcher(dispatcherId);
  }
);

export const onReviewUpdatedAutoFlag = onDocumentUpdated(
  "reviews/{reviewId}",
  async (event) => {
    const before = event.data?.before.data() as Record<string, any> | undefined;
    const after = event.data?.after.data() as Record<string, any> | undefined;

    const beforeDispatcherId = getDispatcherIdFromReview(before);
    const afterDispatcherId = getDispatcherIdFromReview(after);

    if (beforeDispatcherId) {
      await evaluateDispatcher(beforeDispatcherId);
    }

    if (afterDispatcherId && afterDispatcherId !== beforeDispatcherId) {
      await evaluateDispatcher(afterDispatcherId);
    }
  }
);

export const onReviewDeletedAutoFlag = onDocumentDeleted(
  "reviews/{reviewId}",
  async (event) => {
    const data = event.data?.data() as Record<string, any> | undefined;
    const dispatcherId = getDispatcherIdFromReview(data);

    if (!dispatcherId) {
      logger.warn("Deleted review missing dispatcherId", { reviewId: event.params.reviewId });
      return;
    }

    await evaluateDispatcher(dispatcherId);
  }
);

export const onReportCreatedAutoFlag = onDocumentCreated(
  "reports/{reportId}",
  async (event) => {
    const data = event.data?.data() as Record<string, any> | undefined;
    const dispatcherId = getDispatcherIdFromReport(data);

    if (!dispatcherId) {
      logger.warn("Report created without dispatcherId", { reportId: event.params.reportId });
      return;
    }

    await evaluateDispatcher(dispatcherId);
  }
);

export const onReportUpdatedAutoFlag = onDocumentUpdated(
  "reports/{reportId}",
  async (event) => {
    const before = event.data?.before.data() as Record<string, any> | undefined;
    const after = event.data?.after.data() as Record<string, any> | undefined;

    const beforeDispatcherId = getDispatcherIdFromReport(before);
    const afterDispatcherId = getDispatcherIdFromReport(after);

    if (beforeDispatcherId) {
      await evaluateDispatcher(beforeDispatcherId);
    }

    if (afterDispatcherId && afterDispatcherId !== beforeDispatcherId) {
      await evaluateDispatcher(afterDispatcherId);
    }
  }
);

export const onReportDeletedAutoFlag = onDocumentDeleted(
  "reports/{reportId}",
  async (event) => {
    const data = event.data?.data() as Record<string, any> | undefined;
    const dispatcherId = getDispatcherIdFromReport(data);

    if (!dispatcherId) {
      logger.warn("Deleted report missing dispatcherId", { reportId: event.params.reportId });
      return;
    }

    await evaluateDispatcher(dispatcherId);
  }
);