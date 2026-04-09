export type AIRiskLevel = "low" | "medium" | "high" | "critical";

export type AIRiskResult = {
  score: number;
  level: AIRiskLevel;
  signals: string[];
  confidence: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function calculateAIRisk(input: {
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