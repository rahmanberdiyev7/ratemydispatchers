"use client";

type AIRiskLevel = "low" | "medium" | "high" | "critical";

type Props = {
  level: AIRiskLevel;
  score: number;
};

function getTone(level: AIRiskLevel) {
  if (level === "critical") {
    return {
      background: "rgba(255, 77, 77, 0.18)",
      border: "1px solid rgba(255, 77, 77, 0.45)",
      color: "#ff9a9a",
    };
  }

  if (level === "high") {
    return {
      background: "rgba(255, 149, 0, 0.18)",
      border: "1px solid rgba(255, 149, 0, 0.45)",
      color: "#ffcc80",
    };
  }

  if (level === "medium") {
    return {
      background: "rgba(255, 214, 10, 0.18)",
      border: "1px solid rgba(255, 214, 10, 0.45)",
      color: "#ffe082",
    };
  }

  return {
    background: "rgba(52, 199, 89, 0.18)",
    border: "1px solid rgba(52, 199, 89, 0.45)",
    color: "#98f5b1",
  };
}

function getLabel(level: AIRiskLevel) {
  if (level === "critical") return "AI Risk Critical";
  if (level === "high") return "AI Risk High";
  if (level === "medium") return "AI Risk Medium";
  return "AI Risk Low";
}

export default function AIRiskBadge({ level, score }: Props) {
  const tone = getTone(level);

  return (
    <span
      className="badge"
      style={{
        background: tone.background,
        border: tone.border,
        color: tone.color,
        fontWeight: 800,
      }}
      title={`AI risk score: ${score}`}
    >
      {getLabel(level)} · {score}
    </span>
  );
}