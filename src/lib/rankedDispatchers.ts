import { listDispatchers, type Dispatcher } from "@/lib/firestore";
import { calculateRankingScore } from "@/lib/reputation";

export type RankedDispatcher = Dispatcher & {
  computedVerified: boolean;
  computedTier: "tier1" | "tier2" | "tier3";
  computedRating: number;
  computedReviewCount: number;
  computedTrustScore: number;
  computedRiskScore: number;
  computedRecentActivityScore: number;
  computedProfileCompleteness: number;
  rankingScore: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function safeNum(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getAverageRating(dispatcher: Dispatcher) {
  const rating = safeNum((dispatcher as any).rating, NaN);
  if (Number.isFinite(rating)) return clamp(rating, 0, 5);

  const reviewCount = safeNum((dispatcher as any).reviewCount, 0);
  const ratingSum = safeNum((dispatcher as any).ratingSum, 0);
  if (reviewCount > 0) return clamp(ratingSum / reviewCount, 0, 5);

  return 0;
}

function getReviewCount(dispatcher: Dispatcher) {
  return Math.max(0, safeNum((dispatcher as any).reviewCount, 0));
}

function getVerified(dispatcher: Dispatcher) {
  return (dispatcher as any).verified === true;
}

function getTier(dispatcher: Dispatcher): "tier1" | "tier2" | "tier3" {
  const tier = (dispatcher as any).tier;
  if (tier === "tier3" || tier === "tier2") return tier;
  return "tier1";
}

function getTrustScore(dispatcher: Dispatcher) {
  const direct = safeNum((dispatcher as any).trustScore, NaN);
  if (Number.isFinite(direct)) return clamp(direct, 0, 100);

  const rating = getAverageRating(dispatcher);
  const reviews = getReviewCount(dispatcher);

  const derived = rating * 12 + Math.min(reviews, 20) * 1.5 + (getVerified(dispatcher) ? 8 : 0);
  return clamp(Math.round(derived), 0, 100);
}

function getRiskScore(dispatcher: Dispatcher) {
  const direct = safeNum((dispatcher as any).riskScore, NaN);
  if (Number.isFinite(direct)) return clamp(direct, 0, 100);

  const communityAlert = (dispatcher as any).communityAlert === true;
  const reportCount = Math.max(
    safeNum((dispatcher as any).reportCount, 0),
    safeNum((dispatcher as any).confirmedReportCount, 0)
  );
  const rating = getAverageRating(dispatcher);

  let risk = reportCount * 10;
  if (communityAlert) risk += 25;
  if (rating > 0 && rating < 2) risk += 24;
  else if (rating < 3) risk += 14;
  else if (rating < 3.5) risk += 6;

  if (getVerified(dispatcher)) risk -= 8;

  return clamp(Math.round(risk), 0, 100);
}

function getRecentActivityScore(dispatcher: Dispatcher) {
  const direct = safeNum((dispatcher as any).recentActivityScore, NaN);
  if (Number.isFinite(direct)) return clamp(direct, 0, 100);

  const reviews = getReviewCount(dispatcher);
  return clamp(reviews * 8, 0, 100);
}

function getProfileCompleteness(dispatcher: Dispatcher) {
  const direct = safeNum((dispatcher as any).profileCompleteness, NaN);
  if (Number.isFinite(direct)) return clamp(direct, 0, 100);

  let score = 30;
  if ((dispatcher as any).name) score += 20;
  if ((dispatcher as any).company) score += 20;
  if ((dispatcher as any).email) score += 10;
  if ((dispatcher as any).phone) score += 10;
  if ((dispatcher as any).equipment) score += 10;

  return clamp(score, 0, 100);
}

export function enrichDispatcher(dispatcher: Dispatcher): RankedDispatcher {
  const computedVerified = getVerified(dispatcher);
  const computedTier = getTier(dispatcher);
  const computedRating = getAverageRating(dispatcher);
  const computedReviewCount = getReviewCount(dispatcher);
  const computedTrustScore = getTrustScore(dispatcher);
  const computedRiskScore = getRiskScore(dispatcher);
  const computedRecentActivityScore = getRecentActivityScore(dispatcher);
  const computedProfileCompleteness = getProfileCompleteness(dispatcher);

  const rank = calculateRankingScore({
    verified: computedVerified,
    rating: computedRating,
    reviewCount: computedReviewCount,
    trustScore: computedTrustScore,
    riskScore: computedRiskScore,
    tier: computedTier,
    recentActivityScore: computedRecentActivityScore,
    profileCompleteness: computedProfileCompleteness,
  });

  return {
    ...dispatcher,
    computedVerified,
    computedTier,
    computedRating,
    computedReviewCount,
    computedTrustScore,
    computedRiskScore,
    computedRecentActivityScore,
    computedProfileCompleteness,
    rankingScore: rank.total,
  };
}

export async function getRankedDispatchers(limit = 100): Promise<RankedDispatcher[]> {
  const rows = await listDispatchers({ limit });
  return (rows ?? []).map(enrichDispatcher).sort((a, b) => {
    if (b.rankingScore !== a.rankingScore) return b.rankingScore - a.rankingScore;
    if (b.computedRating !== a.computedRating) return b.computedRating - a.computedRating;
    return b.computedReviewCount - a.computedReviewCount;
  });
}