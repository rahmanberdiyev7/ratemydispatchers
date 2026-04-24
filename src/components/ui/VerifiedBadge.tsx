type VerifiedBadgeProps = {
  variant?: "verified" | "tier2" | "tier3";
  compact?: boolean;
  className?: string;
};

export default function VerifiedBadge({
  variant = "verified",
  compact = false,
  className = "",
}: VerifiedBadgeProps) {
  const label =
    variant === "tier3"
      ? "Verified • Tier 3"
      : variant === "tier2"
      ? "Verified • Tier 2"
      : "Verified";

  const styleMap: Record<NonNullable<VerifiedBadgeProps["variant"]>, React.CSSProperties> = {
    verified: {
      background: "rgba(22, 163, 74, 0.16)",
      border: "1px solid rgba(22, 163, 74, 0.42)",
      color: "#86efac",
    },
    tier2: {
      background: "rgba(59, 130, 246, 0.16)",
      border: "1px solid rgba(59, 130, 246, 0.42)",
      color: "#93c5fd",
    },
    tier3: {
      background: "rgba(168, 85, 247, 0.16)",
      border: "1px solid rgba(168, 85, 247, 0.42)",
      color: "#d8b4fe",
    },
  };

  return (
    <span
      className={`badge ${className}`.trim()}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: compact ? "3px 8px" : "5px 10px",
        borderRadius: 999,
        fontSize: compact ? 11 : 12,
        fontWeight: 800,
        lineHeight: 1,
        whiteSpace: "nowrap",
        ...styleMap[variant],
      }}
    >
      {label}
    </span>
  );
}