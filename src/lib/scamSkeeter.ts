export type ScamSignalInput = {
  avgRating: number;
  reviewCount: number;
  reportCount: number;
  recentNegativeReviews: number;
  verified: boolean;
};

export type ScamResult = {
  score: number;
  level: "safe" | "warning" | "danger";
  reasons: string[];
};

export function calculateScamScore(input: ScamSignalInput): ScamResult {
  let score = 0;
  const reasons: string[] = [];

  if (input.avgRating < 2.5 && input.reviewCount >= 3) {
    score += 40;
    reasons.push("Low rating");
  }

  if (input.reportCount >= 3) {
    score += 30;
    reasons.push("Multiple reports");
  }

  if (input.recentNegativeReviews >= 2) {
    score += 20;
    reasons.push("Recent negative reviews");
  }

  if (!input.verified) {
    score += 10;
    reasons.push("Unverified dispatcher");
  }

  score = Math.min(score, 100);

  let level: ScamResult["level"] = "safe";
  if (score >= 60) level = "danger";
  else if (score >= 30) level = "warning";

  return {
    score,
    level,
    reasons,
  };
}