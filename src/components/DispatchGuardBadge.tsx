type Props = {
  level?: string | null;
  score?: number | null;
};

function getBackground(level?: string | null) {
  if (level === "critical") {
    return "rgba(255,0,64,0.18)";
  }

  if (level === "high_risk") {
    return "rgba(255,140,0,0.18)";
  }

  if (level === "watch") {
    return "rgba(255,220,0,0.14)";
  }

  return "rgba(0,255,140,0.12)";
}

function getBorder(level?: string | null) {
  if (level === "critical") {
    return "1px solid rgba(255,0,64,0.45)";
  }

  if (level === "high_risk") {
    return "1px solid rgba(255,140,0,0.45)";
  }

  if (level === "watch") {
    return "1px solid rgba(255,220,0,0.35)";
  }

  return "1px solid rgba(0,255,140,0.25)";
}

function getLabel(level?: string | null) {
  if (level === "critical") {
    return "Critical";
  }

  if (level === "high_risk") {
    return "High Risk";
  }

  if (level === "watch") {
    return "Watch";
  }

  return "Clear";
}

export default function DispatchGuardBadge({
  level,
  score,
}: Props) {
  return (
    <div
      style={{
        background: getBackground(level),
        border: getBorder(level),
        borderRadius: 999,
        padding: "8px 14px",
        fontWeight: 900,
        fontSize: 13,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span>
        DispatchGuard: {getLabel(level)}
      </span>

      {typeof score === "number" && (
        <span
          style={{
            opacity: 0.8,
            fontWeight: 700,
          }}
        >
          {score}
        </span>
      )}
    </div>
  );
}