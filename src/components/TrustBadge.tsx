"use client";

import { calculateRankingScore } from "@/lib/reputation";

type TrustBadgeProps = {
  verified?: boolean;
  reviewCount?: number;
  ratingSum?: number;
  trustScore?: number;
  riskScore?: number;
  tier?: "tier1" | "tier2" | "tier3" | string | null;
  recentActivityScore?: number;
  profileCompleteness?: number;
  size?: "sm" | "md";
  showScore?: boolean;
  showBadgeLabel?: boolean;
};

function getTierLabel(tier?: string | null) {
  if (tier === "tier3") return "Tier 3";
  if (tier === "tier2") return "Tier 2";
  return "Tier 1";
}

function getTierStyles(tier?: string | null) {
  if (tier === "tier3") {
    return {
      background: "linear-gradient(180deg, rgba(117,255,214,0.2) 0%, rgba(56,189,248,0.16) 100%)",
      border: "1px solid rgba(103,232,249,0.45)",
      color: "#dffcff",
    };
  }

  if (tier === "tier2") {
    return {
      background: "linear-gradient(180deg, rgba(129,140,248,0.18) 0%, rgba(99,102,241,0.12) 100%)",
      border: "1px solid rgba(129,140,248,0.35)",
      color: "#eef2ff",
    };
  }

  return {
    background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)",
    border: "1px solid rgba(255,255,255,0.14)",
    color: "#f5f7ff",
  };
}

function getBadgeLabel(score: number, verified?: boolean) {
  if (verified && score >= 120) return "Elite Trusted";
  if (verified && score >= 90) return "Verified Trusted";
  if (score >= 110) return "Top Ranked";
  if (score >= 80) return "Strong Reputation";
  if (score >= 55) return "Rising";
  return "New";
}

export default function TrustBadge({
  verified,
  reviewCount = 0,
  ratingSum = 0,
  trustScore = 0,
  riskScore = 0,
  tier = "tier1",
  recentActivityScore = 0,
  profileCompleteness = 0,
  size = "sm",
  showScore = true,
  showBadgeLabel = true,
}: TrustBadgeProps) {
  const avgRating = reviewCount > 0 ? ratingSum / reviewCount : 0;

  const rep = calculateRankingScore({
    verified,
    rating: avgRating,
    reviewCount,
    trustScore,
    riskScore,
    tier,
    recentActivityScore,
    profileCompleteness,
  });

  const fontSize = size === "md" ? 13 : 12;
  const pad = size === "md" ? "7px 11px" : "6px 10px";
  const tierStyles = getTierStyles(tier);
  const badgeLabel = getBadgeLabel(rep.total, verified);

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      <span
        className="badge"
        style={{
          fontSize,
          padding: pad,
          ...tierStyles,
        }}
        title={`Tier: ${getTierLabel(tier)}`}
      >
        {getTierLabel(tier)}
      </span>

      {showBadgeLabel ? (
        <span
          className="badge"
          style={{ fontSize, padding: pad }}
          title={`Badge: ${badgeLabel}`}
        >
          {badgeLabel}
        </span>
      ) : null}

      {showScore ? (
        <span
          className="badge"
          style={{ fontSize, padding: pad }}
          title={`Ranking score: ${rep.total}`}
        >
          Trust Score: <b style={{ marginLeft: 6 }}>{rep.total}</b>
        </span>
      ) : null}
    </div>
  );
}