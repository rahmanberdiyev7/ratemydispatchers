export type ReputationTier = "tier1" | "tier2" | "tier3" | string | null;

export type RankingInput = {
  verified?: boolean;
  rating?: number;
  reviewCount?: number;
  trustScore?: number;
  riskScore?: number;
  tier?: ReputationTier;
  recentActivityScore?: number; // 0-100
  profileCompleteness?: number; // 0-100
};

export type RankingBreakdown = {
  total: number;
  verifiedBoost: number;
  ratingPoints: number;
  reviewVolumePoints: number;
  trustPoints: number;
  tierPoints: number;
  recentActivityPoints: number;
  completenessPoints: number;
  lowRatingPenalty: number;
  riskPenalty: number;
  confidenceMultiplier: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function safeNum(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getTierPoints(tier?: ReputationTier) {
  if (tier === "tier3") return 16;
  if (tier === "tier2") return 9;
  return 3;
}

function getConfidenceMultiplier(reviewCount: number) {
  if (reviewCount >= 25) return 1.1;
  if (reviewCount >= 10) return 1.06;
  if (reviewCount >= 5) return 1.03;
  return 1;
}

export function calculateRankingScore(input: RankingInput): RankingBreakdown {
  const verified = !!input.verified;
  const rating = clamp(safeNum(input.rating), 0, 5);
  const reviewCount = Math.max(0, safeNum(input.reviewCount));
  const trustScore = clamp(safeNum(input.trustScore), 0, 100);
  const riskScore = clamp(safeNum(input.riskScore), 0, 100);
  const recentActivityScore = clamp(safeNum(input.recentActivityScore), 0, 100);
  const profileCompleteness = clamp(safeNum(input.profileCompleteness), 0, 100);
  const tier = input.tier ?? "tier1";

  const verifiedBoost = verified ? 20 : 0;
  const ratingPoints = rating * 15;
  const reviewVolumePoints = Math.min(reviewCount, 50) * 1.25;
  const trustPoints = trustScore * 0.45;
  const tierPoints = getTierPoints(tier);
  const recentActivityPoints = recentActivityScore * 0.12;
  const completenessPoints = profileCompleteness * 0.08;

  const lowRatingPenalty =
    rating < 2
      ? 26
      : rating < 3
      ? 14
      : rating < 3.5
      ? 6
      : 0;

  const riskPenalty = riskScore * 0.62;
  const confidenceMultiplier = getConfidenceMultiplier(reviewCount);

  const raw =
    verifiedBoost +
    ratingPoints +
    reviewVolumePoints +
    trustPoints +
    tierPoints +
    recentActivityPoints +
    completenessPoints -
    lowRatingPenalty -
    riskPenalty;

  const total = clamp(Math.round(raw * confidenceMultiplier), 0, 999);

  return {
    total,
    verifiedBoost: Math.round(verifiedBoost),
    ratingPoints: Math.round(ratingPoints),
    reviewVolumePoints: Math.round(reviewVolumePoints),
    trustPoints: Math.round(trustPoints),
    tierPoints: Math.round(tierPoints),
    recentActivityPoints: Math.round(recentActivityPoints),
    completenessPoints: Math.round(completenessPoints),
    lowRatingPenalty: Math.round(lowRatingPenalty),
    riskPenalty: Math.round(riskPenalty),
    confidenceMultiplier,
  };
}

export function sortByRankingScore<T>(
  items: T[],
  getInput: (item: T) => RankingInput
): T[] {
  return [...items].sort((a, b) => {
    const scoreA = calculateRankingScore(getInput(a));
    const scoreB = calculateRankingScore(getInput(b));

    if (scoreB.total !== scoreA.total) return scoreB.total - scoreA.total;

    const aRating = safeNum(getInput(a).rating);
    const bRating = safeNum(getInput(b).rating);
    if (bRating !== aRating) return bRating - aRating;

    const aReviews = safeNum(getInput(a).reviewCount);
    const bReviews = safeNum(getInput(b).reviewCount);
    return bReviews - aReviews;
  });
}