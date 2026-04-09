"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  listDispatchers,
  listOpenReports,
  type Dispatcher,
  type Report,
} from "@/lib/firestore";
import { calculateAIRisk } from "@/lib/aiRisk";
import UserRolePills from "../ui/UserRolePills";
import AIRiskBadge from "../ui/AIRiskBadge";

type DispatcherRiskResult = {
  score: number;
  level: "low" | "medium" | "high" | "critical";
  reasons: string[];
  confidence: number;
  openReports: number;
  confirmedReports: number;
  avgRating: number;
  reviewCount: number;
  communityAlert: boolean;
};

type WatchlistRow = {
  dispatcher: Dispatcher;
  risk: DispatcherRiskResult;
};

function safeNum(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getOpenReportCount(reports: Report[], dispatcherId: string) {
  return reports.filter((r: any) => r?.dispatcherId === dispatcherId).length;
}

function getAccountAgeDays(createdAt: any) {
  try {
    if (!createdAt) return 30;

    if (typeof createdAt?.toDate === "function") {
      const created = createdAt.toDate().getTime();
      return Math.max(1, Math.floor((Date.now() - created) / 86400000));
    }

    if (typeof createdAt?.seconds === "number") {
      const created = createdAt.seconds * 1000;
      return Math.max(1, Math.floor((Date.now() - created) / 86400000));
    }

    return 30;
  } catch {
    return 30;
  }
}

function getDispatcherRisk(dispatcher: Dispatcher, reports: Report[]): DispatcherRiskResult {
  const d = dispatcher as any;

  const reviewCount = safeNum(d.reviewCount, 0);
  const ratingSum = safeNum(d.ratingSum, 0);
  const avgRating =
    reviewCount > 0 ? ratingSum / reviewCount : safeNum(d.rating, 0);

  const openReports = getOpenReportCount(reports, dispatcher.id);
  const confirmedReports = safeNum(d.confirmedReportCount, 0);
  const communityAlert = d.communityAlert === true;

  const recentNegativeReviews =
    avgRating > 0 && avgRating <= 2.5 && reviewCount >= 2 ? 2 : 0;

  const ai = calculateAIRisk({
    avgRating,
    reviewCount,
    confirmedReports,
    openReports,
    recentNegativeReviews,
    verified: !!d.verified,
    accountAgeDays: getAccountAgeDays(d.createdAt),
  });

  return {
    score: ai.score,
    level: ai.level,
    reasons: ai.signals,
    confidence: ai.confidence,
    openReports,
    confirmedReports,
    avgRating,
    reviewCount,
    communityAlert,
  };
}

export default function DispatcherWatchlist() {
  const [dispatchers, setDispatchers] = useState<Dispatcher[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);

    try {
      const [dispatcherRows, openReportRows] = await Promise.all([
        listDispatchers({ limit: 500 }),
        listOpenReports({ limit: 500 }),
      ]);

      setDispatchers(dispatcherRows ?? []);
      setReports(openReportRows ?? []);
    } catch (e) {
      console.error("Failed to load dispatcher watchlist", e);
      setDispatchers([]);
      setReports([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const rows = useMemo<WatchlistRow[]>(() => {
    const needle = q.trim().toLowerCase();

    return (dispatchers ?? [])
      .map((dispatcher) => {
        const risk = getDispatcherRisk(dispatcher, reports);
        return { dispatcher, risk };
      })
      .filter(({ dispatcher, risk }) => {
        const d = dispatcher as any;

        const isFlagged =
          d.aiFlagged === true ||
          risk.communityAlert ||
          risk.level === "high" ||
          risk.level === "critical";

        if (!isFlagged) return false;
        if (verifiedOnly && !d.verified) return false;

        if (!needle) return true;

        const hay = [
          dispatcher.name ?? "",
          dispatcher.company ?? "",
          risk.level,
          String(risk.score),
          d.aiRiskLevel ?? "",
          ...(Array.isArray(d.aiSignals) ? d.aiSignals : []),
        ]
          .join(" ")
          .toLowerCase();

        return hay.includes(needle);
      })
      .sort((a, b) => {
        const da = a.dispatcher as any;
        const db = b.dispatcher as any;

        const aStoredScore = safeNum(da.aiRiskScore, a.risk.score);
        const bStoredScore = safeNum(db.aiRiskScore, b.risk.score);

        if (bStoredScore !== aStoredScore) {
          return bStoredScore - aStoredScore;
        }

        if (b.risk.score !== a.risk.score) {
          return b.risk.score - a.risk.score;
        }

        if (b.risk.openReports !== a.risk.openReports) {
          return b.risk.openReports - a.risk.openReports;
        }

        return b.risk.confirmedReports - a.risk.confirmedReports;
      });
  }, [dispatchers, reports, q, verifiedOnly]);

  if (loading) {
    return <div className="small">Loading dispatcher watchlist…</div>;
  }

  if (rows.length === 0) {
    return (
      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontWeight: 900 }}>No high-risk dispatchers right now</div>
        <div className="small" style={{ marginTop: 6 }}>
          This list updates as reports and AI risk signals change.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="card" style={{ padding: 16 }}>
        <div className="row wrap" style={{ gap: 10, alignItems: "center" }}>
          <input
            className="input"
            style={{ maxWidth: 360 }}
            placeholder="Search dispatcher or company..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <label className="row" style={{ gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
            />
            <span className="small">Verified only</span>
          </label>

          <button className="btn secondary" type="button" onClick={load}>
            Refresh
          </button>

          <div className="small" style={{ marginLeft: "auto", opacity: 0.85 }}>
            Showing {rows.length}
          </div>
        </div>
      </div>

      {rows.map(({ dispatcher, risk }, index) => {
        const d = dispatcher as any;
        const displayScore = safeNum(d.aiRiskScore, risk.score);
        const displayLevel =
          (d.aiRiskLevel as "low" | "medium" | "high" | "critical" | undefined) ??
          risk.level;

        const displaySignals =
          Array.isArray(d.aiSignals) && d.aiSignals.length > 0
            ? d.aiSignals
            : risk.reasons;

        return (
          <div key={dispatcher.id} className="card" style={{ padding: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "stretch",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <Link
                href={`/dispatchers/${dispatcher.id}`}
                style={{
                  flex: 1,
                  minWidth: 260,
                  color: "inherit",
                  textDecoration: "none",
                  display: "block",
                  borderRadius: 16,
                }}
                aria-label={`Open ${dispatcher.name ?? "dispatcher"} profile`}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                      fontWeight: 900,
                      fontSize: 16,
                    }}
                  >
                    <span>#{index + 1}</span>

                    <span
                      style={{
                        textDecoration: "underline",
                        textUnderlineOffset: 3,
                      }}
                    >
                      {dispatcher.name || "Unnamed Dispatcher"}
                    </span>

                    <UserRolePills
                      profile={{
                        platformRole: "dispatcher",
                        verificationStatus: d.verified ? "verified" : "unverified",
                        tier: (d.tier ?? "tier1") as "tier1" | "tier2" | "tier3",
                        driverType: null,
                      }}
                    />

                    {d.aiFlagged === true ? (
                      <span
                        className="badge"
                        style={{
                          background: "rgba(255, 68, 68, 0.16)",
                          border: "1px solid rgba(255, 68, 68, 0.34)",
                          color: "#ffb0b0",
                          fontWeight: 800,
                        }}
                      >
                        AI FLAGGED
                      </span>
                    ) : null}
                  </div>

                  <div className="small" style={{ marginTop: 4 }}>
                    {dispatcher.company || "—"}
                  </div>

                  <div
                    className="row wrap"
                    style={{ gap: 8, alignItems: "center", marginTop: 8 }}
                  >
                    <AIRiskBadge level={displayLevel} score={displayScore} />

                    <span className="badge">
                      Confidence: {(risk.confidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="small" style={{ marginTop: 8 }}>
                    Confirmed reports: {risk.confirmedReports} · Open reports: {risk.openReports} ·
                    Reviews: {risk.reviewCount} · Avg rating:{" "}
                    {risk.reviewCount ? risk.avgRating.toFixed(1) : "—"}
                  </div>

                  <div
                    className="small"
                    style={{ marginTop: 8, opacity: 0.95, color: "#ffcc66" }}
                  >
                    AI Signals:{" "}
                    {displaySignals.length
                      ? displaySignals.join(" • ")
                      : "No strong AI signals"}
                  </div>
                </div>
              </Link>

              <div style={{ display: "flex", alignItems: "center", minWidth: 200 }}>
                <Link
                  href={`/dispatchers/${dispatcher.id}`}
                  className="btn secondary"
                  style={{ width: "100%", textAlign: "center" }}
                >
                  View dispatcher
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}