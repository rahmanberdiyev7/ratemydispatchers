"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listDispatchers, type Dispatcher } from "@/lib/firestore";
import ScamRiskBadge from "@/components/ScamRiskBadge";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import { calculateScamScore } from "@/lib/scamSkeeter";

function getDispatcherAvg(d: Dispatcher) {
  const reviewCount = Number(d.reviewCount ?? 0);
  const ratingSum = Number(d.ratingSum ?? 0);
  if (!reviewCount) return 0;
  return ratingSum / reviewCount;
}

export default function ScamWatchlistPage() {
  const [items, setItems] = useState<Dispatcher[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const rows = await listDispatchers({ limit: 500 });
      setItems(rows ?? []);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(() => {
    return [...items]
      .map((d) => {
        const avgRating = getDispatcherAvg(d);
        const reviewCount = Number(d.reviewCount ?? 0);
        const reportCount = Math.max(
          Number((d as any).reportCount ?? 0),
          Number((d as any).confirmedReportCount ?? 0)
        );

        const risk = calculateScamScore({
          avgRating,
          reviewCount,
          reportCount,
          recentNegativeReviews: avgRating <= 2.5 && reviewCount >= 2 ? 2 : 0,
          verified: !!d.verified,
        });

        return {
          dispatcher: d,
          avgRating,
          reviewCount,
          risk,
          confirmedReportCount: Number((d as any).confirmedReportCount ?? 0),
          communityAlert: (d as any).communityAlert === true,
        };
      })
      .filter(({ risk, confirmedReportCount, communityAlert }) => {
        return communityAlert || confirmedReportCount > 0 || risk.level !== "safe";
      })
      .sort((a, b) => {
        if (b.risk.score !== a.risk.score) return b.risk.score - a.risk.score;
        if (b.confirmedReportCount !== a.confirmedReportCount) {
          return b.confirmedReportCount - a.confirmedReportCount;
        }
        return b.reviewCount - a.reviewCount;
      });
  }, [items]);

  return (
    <div className="container">
      <div className="card" style={{ padding: 18 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 14,
            flexWrap: "wrap",
            alignItems: "flex-start",
          }}
        >
          <div style={{ maxWidth: 760 }}>
            <div className="small" style={{ fontWeight: 800 }}>
              RateMyDispatchers
            </div>

            <h1 className="h1" style={{ marginTop: 6, marginBottom: 8 }}>
              Scam Watchlist
            </h1>

            <div className="muted">
              Community safety feed for dispatchers with stronger risk signals
              based on reports, verification status, and reputation patterns.
            </div>
          </div>

          <div className="row wrap" style={{ gap: 10 }}>
            <Link className="btn secondary" href="/dispatchers">
              Dispatchers
            </Link>
            <Link className="btn secondary" href="/leaderboard">
              Leaderboard
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="small" style={{ marginTop: 16 }}>Loading watchlist…</div>
      ) : visible.length === 0 ? (
        <div className="card" style={{ padding: 16, marginTop: 14 }}>
          <div style={{ fontWeight: 900 }}>No major scam signals right now</div>
          <div className="small" style={{ marginTop: 6 }}>
            This watchlist updates as community risk signals change.
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          {visible.map(({ dispatcher: d, risk, avgRating, reviewCount, confirmedReportCount, communityAlert }, idx) => (
            <div key={d.id} className="card" style={{ padding: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 14,
                  flexWrap: "wrap",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div className="row wrap" style={{ gap: 8, alignItems: "center" }}>
                    <span className="chip">#{idx + 1}</span>
                    <div style={{ fontWeight: 900, fontSize: 18 }}>
                      {d.name || "Dispatcher"}
                    </div>

                    {dispatcher.verified ? (
                      <VerifiedBadge />
                    ) : (
                      <span className="badge">Unverified</span>
                    )}
                  </div>

                  <div className="small" style={{ marginTop: 4 }}>
                    {d.company || "—"}
                  </div>

                  <div className="row wrap" style={{ gap: 8, marginTop: 12 }}>
                    <span className="badge">
                      Avg rating: {reviewCount ? avgRating.toFixed(1) : "—"}
                    </span>

                    <span className="badge">
                      Reviews: {reviewCount}
                    </span>

                    <span className="badge">
                      Confirmed reports: {confirmedReportCount}
                    </span>

                    {communityAlert ? (
                      <span className="chip bad">Community Alert</span>
                    ) : null}
                  </div>

                  <div className="small" style={{ marginTop: 12 }}>
                    {risk.reasons.length
                      ? risk.reasons.join(", ")
                      : "No public explanation available."}
                  </div>
                </div>

                <div style={{ minWidth: 240, display: "grid", gap: 10 }}>
                  <ScamRiskBadge score={risk.score} level={risk.level} />
                  <Link className="btn secondary" href={`/dispatchers/${d.id}`}>
                    View dispatcher
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}