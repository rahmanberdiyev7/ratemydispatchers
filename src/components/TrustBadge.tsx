type TrustBadgeProps = {
  verified?: boolean;
  reviewCount?: number;
  ratingSum?: number;
  hasMarketplaceListing?: boolean;
  marketplaceReviewCount?: number;
  marketplaceRating?: number;
  marketplaceRanking?: number;
  size?: "sm" | "md" | "lg";
  showScore?: boolean;
  showBadgeLabel?: boolean;
};

function calculateTrustScore(input: TrustBadgeProps) {
  let score = 50;

  if (input.verified) score += 20;

  const reviewCount = Number(input.reviewCount ?? 0);
  const ratingSum = Number(input.ratingSum ?? 0);
  const avgRating = reviewCount > 0 ? ratingSum / reviewCount : 0;

  if (reviewCount >= 10) score += 15;
  else if (reviewCount >= 5) score += 10;
  else if (reviewCount >= 1) score += 5;

  if (avgRating >= 4.5) score += 15;
  else if (avgRating >= 4) score += 10;
  else if (avgRating >= 3.5) score += 5;

  if (input.hasMarketplaceListing) score += 5;

  const marketplaceReviewCount = Number(input.marketplaceReviewCount ?? 0);
  const marketplaceRating = Number(input.marketplaceRating ?? 0);

  if (marketplaceReviewCount >= 5) score += 5;
  if (marketplaceRating >= 4.5) score += 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export default function TrustBadge({
  verified = false,
  reviewCount = 0,
  ratingSum = 0,
  hasMarketplaceListing = false,
  marketplaceReviewCount = 0,
  marketplaceRating = 0,
  marketplaceRanking = 0,
  size = "md",
  showScore = true,
  showBadgeLabel = true,
}: TrustBadgeProps) {
  const score = calculateTrustScore({
    verified,
    reviewCount,
    ratingSum,
    hasMarketplaceListing,
    marketplaceReviewCount,
    marketplaceRating,
    marketplaceRanking,
  });

  const label =
    score >= 90
      ? "Elite Trust"
      : score >= 75
      ? "High Trust"
      : score >= 60
      ? "Trusted"
      : "Building Trust";

  const fontSize = size === "sm" ? 11 : size === "lg" ? 14 : 12;
  const padding = size === "sm" ? "4px 8px" : size === "lg" ? "7px 12px" : "5px 10px";

  return (
    <span
      className="badge"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding,
        borderRadius: 999,
        fontSize,
        fontWeight: 900,
        background: "rgba(59, 130, 246, 0.14)",
        border: "1px solid rgba(59, 130, 246, 0.35)",
        color: "#bfdbfe",
        whiteSpace: "nowrap",
      }}
    >
      {showBadgeLabel ? label : "Trust"}
      {showScore ? ` · ${score}` : ""}
    </span>
  );
}