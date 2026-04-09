"use client";

type VerifiedBadgeProps = {
  compact?: boolean;
  className?: string;
};

export default function VerifiedBadge({
  compact = false,
  className = "",
}: VerifiedBadgeProps) {
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: compact ? 6 : 8,
        padding: compact ? "5px 10px" : "6px 12px",
        borderRadius: 999,
        background:
          "linear-gradient(180deg, rgba(255,220,90,1) 0%, rgba(241,191,36,1) 100%)",
        color: "#1b1606",
        fontWeight: 900,
        fontSize: compact ? 12 : 13,
        lineHeight: 1,
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.45), 0 6px 16px rgba(241,191,36,0.22)",
        border: "1px solid rgba(255,210,70,0.95)",
        whiteSpace: "nowrap",
      }}
      title="Verified"
      aria-label="Verified"
    >
      <span
        aria-hidden="true"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: compact ? 16 : 18,
          height: compact ? 16 : 18,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.45)",
          fontSize: compact ? 10 : 11,
          fontWeight: 900,
        }}
      >
        ✓
      </span>
      <span>Verified</span>
    </span>
  );
}