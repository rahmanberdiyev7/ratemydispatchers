"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listBrokers, type Broker } from "@/lib/brokers";
import {
  listReportsForBroker,
  type BrokerReport,
} from "@/lib/brokers";
import {
  listBrokerReviewsForBroker,
  type BrokerReview,
} from "@/lib/brokerReviews";
import { assessBrokerRisk } from "@/lib/brokerRisk";

export default function BrokerLeaderboardPage() {
  const [items, setItems] = useState<
    Array<{
      broker: Broker;
      reports: BrokerReport[];
      reviews: BrokerReview[];
    }>
  >([]);

  const [loading, setLoading] = useState(true);

  const [sort, setSort] = useState<
    "best" | "worst" | "risk" | "reviews"
  >("best");

  async function load() {
    setLoading(true);

    try {
      const brokers = await listBrokers();

      const enriched = await Promise.all(
        brokers.map(async (b) => {
          const [reports, reviews] = await Promise.all([
            listReportsForBroker(b.id),
            listBrokerReviewsForBroker(b.id),
          ]);

          return { broker: b, reports, reviews };
        })
      );

      setItems(enriched);
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

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const riskA = assessBrokerRisk(
        a.broker,
        a.reports,
        a.reviews
      );
      const riskB = assessBrokerRisk(
        b.broker,
        b.reports,
        b.reviews
      );

      const avgA =
        a.reviews.length > 0
          ? a.reviews.reduce((s, r) => s + r.rating, 0) /
            a.reviews.length
          : 0;

      const avgB =
        b.reviews.length > 0
          ? b.reviews.reduce((s, r) => s + r.rating, 0) /
            b.reviews.length
          : 0;

      if (sort === "best") return avgB - avgA;
      if (sort === "worst") return avgA - avgB;
      if (sort === "risk") return riskB.score - riskA.score;
      if (sort === "reviews")
        return b.reviews.length - a.reviews.length;

      return 0;
    });
  }, [items, sort]);

  return (
    <div className="container">
      <h1 className="h1">Broker Leaderboard</h1>

      <div className="row wrap" style={{ gap: 10 }}>
        <button className="btn" onClick={() => setSort("best")}>
          Best Rated
        </button>
        <button className="btn" onClick={() => setSort("worst")}>
          Worst Rated
        </button>
        <button className="btn" onClick={() => setSort("risk")}>
          Highest Risk
        </button>
        <button className="btn" onClick={() => setSort("reviews")}>
          Most Reviews
        </button>
      </div>

      {loading ? (
        <div className="small">Loading…</div>
      ) : (
        <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
          {sorted.map(({ broker, reports, reviews }) => {
            const risk = assessBrokerRisk(
              broker,
              reports,
              reviews
            );

            const avg =
              reviews.length > 0
                ? (
                    reviews.reduce((s, r) => s + r.rating, 0) /
                    reviews.length
                  ).toFixed(1)
                : "—";

            return (
              <Link
                key={broker.id}
                href={`/brokers/${broker.id}`}
                className="card"
                style={{
                  padding: 16,
                  display: "block",
                }}
              >
                <div style={{ fontWeight: 900 }}>
                  {broker.name}
                </div>

                <div className="small">
                  Rating: {avg} ⭐ · {reviews.length} reviews
                </div>

                <div className="small">
                  Risk: {risk.score} · {risk.level}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}