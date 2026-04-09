"use client";

import type { ScamResult } from "@/lib/scamSkeeter";

type ScamRiskLevel = ScamResult["level"];

function palette(level: ScamRiskLevel) {
  if (level === "danger") {
    return {
      background: "linear-gradient(135deg, rgba(120,16,16,.95), rgba(70,8,8,.95))",
      border: "1px solid rgba(255,90,90,.40)",
      color: "#ffd7d7",
      glow: "0 0 0 1px rgba(255,90,90,.08), 0 8px 24px rgba(120,16,16,.28)",
      dot: "#ff6b6b",
      label: "Danger Risk",
    };
  }

  if (level === "warning") {
    return {
      background: "linear-gradient(135deg, rgba(94,62,10,.95), rgba(56,37,8,.95))",
      border: "1px solid rgba(255,191,73,.38)",
      color: "#ffe7b7",
      glow: "0 0 0 1px rgba(255,191,73,.08), 0 8px 24px rgba(94,62,10,.22)",
      dot: "#ffbf49",
      label: "Warning Risk",
    };
  }

  return {
    background: "linear-gradient(135deg, rgba(8,63,39,.95), rgba(7,40,26,.95))",
    border: "1px solid rgba(67,211,128,.34)",
    color: "#d9ffea",
    glow: "0 0 0 1px rgba(67,211,128,.08), 0 8px 24px rgba(8,63,39,.18)",
    dot: "#43d380",
    label: "Safe",
  };
}

export default function ScamRiskBadge({
  score,
  level,
  showScore = true,
}: {
  score: number;
  level: ScamRiskLevel;
  showScore?: boolean;
}) {
  const ui = palette(level);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        minHeight: 34,
        padding: "7px 12px",
        borderRadius: 999,
        background: ui.background,
        border: ui.border,
        color: ui.color,
        boxShadow: ui.glow,
        fontSize: 13,
        fontWeight: 800,
        letterSpacing: ".01em",
        lineHeight: 1,
        width: "fit-content",
        whiteSpace: "nowrap",
      }}
      title={`Scam risk: ${ui.label}${showScore ? ` (${score}/100)` : ""}`}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: ui.dot,
          boxShadow: `0 0 10px ${ui.dot}`,
          flex: "0 0 auto",
        }}
      />

      <span>{ui.label}</span>

      {showScore ? (
        <span
          style={{
            opacity: 0.9,
            fontWeight: 700,
          }}
        >
          • {score}/100
        </span>
      ) : null}
    </span>
  );
}