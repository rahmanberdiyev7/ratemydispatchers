"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listBrokers, type Broker } from "@/lib/brokers";
import { listReportsForBroker, type BrokerReport } from "@/lib/brokers";
import { listBrokerReviewsForBroker, type BrokerReview } from "@/lib/brokerReviews";
import { assessBrokerRisk } from "@/lib/brokerRisk";
import UserRolePills from "@/components/ui/UserRolePills";

type WatchlistRow = {
  broker: Broker;
  reports: BrokerReport[];
  reviews: BrokerReview[];
  risk: ReturnType<typeof assessBrokerRisk>;
};

function isHighRiskScore(score: number) {
  return score >= 45;
}

export default function BrokerWatchlist() {
  const [items, setItems] = useState<WatchlistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);

    try {
      const brokers = await listBrokers({ limit: 200 });

      const rows = await Promise.all(
        brokers.map(async (broker) => {
          const [reports, reviews] = await Promise.all([
            listReportsForBroker(broker.id, { limit: 100 }),
            listBrokerReviewsForBroker(broker.id, { limit: 100 }),
          ]);

          const risk = assessBrokerRisk(broker, reports, reviews);

          return {
            broker,
            reports,
            reviews,
            risk,
          };
        })
      );

      setItems(rows);
    } catch (e) {
      console.error("Failed to load broker watchlist", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();

    return items
      .filter(({ broker, risk }) => {
        const isFlagged =
          (broker as any).communityAlert === true || isHighRiskScore(risk.score);

        if (!isFlagged) return false;
        if (verifiedOnly && !(broker as any).verified) return false;

        if (!needle) return true;

        const hay =
          `${broker.name ?? ""} ${broker.company ?? ""} ${broker.mcNumber ?? ""} ${risk.level} ${risk.score}`.toLowerCase();

        return hay.includes(needle);
      })
      .sort((a, b) => b.risk.score - a.risk.score);
  }, [items, q, verifiedOnly]);

  if (loading) {
    return <div className="small">Loading broker watchlist…</div>;
  }

  if (rows.length === 0) {
    return (
      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontWeight: 900 }}>No high-risk brokers right now</div>
        <div className="small" style={{ marginTop: 6 }}>
          This list updates as reports and broker risk signals change.
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
            placeholder="Search broker, company, MC..."
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

      {rows.map(({ broker, risk }, index) => (
        <div key={broker.id} className="card" style={{ padding: 16 }}>
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
              href={`/brokers/${broker.id}`}
              style={{
                flex: 1,
                minWidth: 260,
                color: "inherit",
                textDecoration: "none",
                display: "block",
                borderRadius: 16,
              }}
              aria-label={`Open ${broker.name ?? "broker"} profile`}
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
                    {broker.name || "Unnamed Broker"}
                  </span>

                  <UserRolePills
                    profile={{
                      platformRole: "user",
                      accountType: "broker",
                      verificationStatus: (broker as any).verified ? "verified" : "unverified",
                      tier: (((broker as any).tier ?? "tier1") as "tier1" | "tier2" | "tier3"),
                      driverType: null,
                    }}
                  />
                </div>

                <div className="small" style={{ marginTop: 4 }}>
                  {broker.company || "—"}
                </div>

                <div className="small" style={{ marginTop: 6 }}>
                  Risk Score: {risk.score} · Level: {risk.level}
                </div>

                <div className="small" style={{ marginTop: 6 }}>
                  Confirmed reports: {risk.confirmedReportCount} · Open reports: {risk.reportCount} ·
                  Reviews: {risk.reviewCount} · Avg rating:{" "}
                  {risk.reviewCount ? risk.avgRating.toFixed(1) : "—"}
                </div>

                <div className="small" style={{ marginTop: 6, opacity: 0.92 }}>
                  {risk.reasons.length
                    ? risk.reasons.join(" • ")
                    : "No public explanation available."}
                </div>
              </div>
            </Link>

            <div style={{ display: "flex", alignItems: "center", minWidth: 200 }}>
              <Link
                href={`/brokers/${broker.id}`}
                className="btn secondary"
                style={{ width: "100%", textAlign: "center" }}
              >
                View broker
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}