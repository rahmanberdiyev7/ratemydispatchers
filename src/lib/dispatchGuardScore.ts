import {
  DispatchGuardSeverity,
} from "@/lib/dispatchGuardReports";

export function calculateDispatchGuardScore({
  verified,
  reviews,
  reports,
  criticalReports,
  highReports,
  mediumReports,
  lowReports,
}: {
  verified?: boolean;

  reviews?: number;
  reports?: number;

  criticalReports?: number;
  highReports?: number;
  mediumReports?: number;
  lowReports?: number;
}) {
  let score = 100;

  if (verified) {
    score += 10;
  }

  score += (reviews ?? 0) * 0.5;

  score -= (reports ?? 0) * 2;

  score -= (criticalReports ?? 0) * 25;

  score -= (highReports ?? 0) * 15;

  score -= (mediumReports ?? 0) * 8;

  score -= (lowReports ?? 0) * 3;

  if (score > 100) {
    score = 100;
  }

  if (score < 0) {
    score = 0;
  }

  return Math.round(score);
}

export function getDispatchGuardLevel(
  score: number,
) {
  if (score >= 90) {
    return "trusted";
  }

  if (score >= 75) {
    return "verified";
  }

  if (score >= 55) {
    return "watch";
  }

  if (score >= 35) {
    return "high_risk";
  }

  return "critical";
}