import type { Broker, BrokerReport } from "@/lib/brokers";
import type { BrokerReview } from "@/lib/brokerReviews";

export type BrokerRiskLevel = "low" | "moderate" | "high" | "critical";

export type BrokerRiskResult = {
  score: number;
  level: BrokerRiskLevel;
  reasons: string[];
  reportCount: number;
  confirmedReportCount: number;
  avgRating: number;
  reviewCount: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function safeNum(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function calculateBrokerRiskScore(input: {
  avgRating: number;
  reviewCount: number;
  reportCount: number;
  confirmedReportCount: number;
  verified: boolean;
  communityAlert?: boolean;
}): BrokerRiskResult {
  let score = 0;
  const reasons: string[] = [];

  if (input.reportCount >= 1) {
    score += input.reportCount * 10;
    reasons.push(`${input.reportCount} open report${input.reportCount > 1 ? "s" : ""}`);
  }

  if (input.confirmedReportCount >= 1) {
    score += input.confirmedReportCount * 18;
    reasons.push(
      `${input.confirmedReportCount} confirmed report${input.confirmedReportCount > 1 ? "s" : ""}`
    );
  }

  if (input.communityAlert) {
    score += 20;
    reasons.push("community alert");
  }

  if (input.avgRating > 0 && input.avgRating < 2) {
    score += 22;
    reasons.push("very low rating");
  } else if (input.avgRating < 3) {
    score += 14;
    reasons.push("low rating");
  } else if (input.avgRating < 3.5) {
    score += 6;
    reasons.push("below-average rating");
  }

  if (input.reviewCount === 0) {
    score += 5;
    reasons.push("no public review history");
  }

  if (input.verified) {
    score -= 8;
  }

  score = clamp(Math.round(score), 0, 100);

  let level: BrokerRiskLevel = "low";
  if (score >= 65) level = "critical";
  else if (score >= 45) level = "high";
  else if (score >= 25) level = "moderate";

  return {
    score,
    level,
    reasons,
    reportCount: input.reportCount,
    confirmedReportCount: input.confirmedReportCount,
    avgRating: input.avgRating,
    reviewCount: input.reviewCount,
  };
}

export function assessBrokerRisk(
  broker: Broker,
  reports?: BrokerReport[],
  reviews?: BrokerReview[]
): BrokerRiskResult {
  const visibleReviews = (reviews ?? []).filter((r) => !r.hidden);
  const reviewCount =
    visibleReviews.length > 0
      ? visibleReviews.length
      : safeNum(broker.reviewCount, 0);

  const avgRating =
    visibleReviews.length > 0
      ? visibleReviews.reduce((sum, r) => sum + safeNum(r.rating, 0), 0) / visibleReviews.length
      : safeNum(broker.rating, 0) ||
        (reviewCount > 0 ? safeNum(broker.ratingSum, 0) / Math.max(reviewCount, 1) : 0);

  const openReportCount =
    reports?.filter((r) => r.status === "open").length ?? safeNum(broker.reportCount, 0);

  const confirmedReportCount = safeNum(broker.confirmedReportCount, 0);

  return calculateBrokerRiskScore({
    avgRating,
    reviewCount,
    reportCount: openReportCount,
    confirmedReportCount,
    verified: broker.verified === true,
    communityAlert: broker.communityAlert === true,
  });
}