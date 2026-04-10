"use client";

import Link from "next/link";
import UserRolePills from "@/components/ui/UserRolePills";

type LeaderboardItem = {
  id: string;
  name: string;
  company?: string;
  verified?: boolean;
  tier?: "tier1" | "tier2" | "tier3";
  computedRating: number;
  computedReviewCount: number;
  computedTrustScore: number;
  computedRiskScore: number;
};

const ITEMS: LeaderboardItem[] = [
  {
    id: "disp-1",
    name: "Sam Alm",
    company: "Delo Trans",
    verified: true,
    tier: "tier1",
    computedRating: 5,
    computedReviewCount: 12,
    computedTrustScore: 98,
    computedRiskScore: 3,
  },
  {
    id: "disp-2",
    name: "Anna Reed",
    company: "Prime Dispatch",
    verified: true,
    tier: "tier1",
    computedRating: 4.8,
    computedReviewCount: 18,
    computedTrustScore: 95,
    computedRiskScore: 5,
  },
  {
    id: "disp-3",
    name: "Mike Turner",
    company: "Fast Lane Logistics",
    verified: false,
    tier: "tier2",
    computedRating: 4.2,
    computedReviewCount: 6,
    computedTrustScore: 82,
    computedRiskScore: 12,
  },
];

export default function LeaderboardPage() {
  return (
    <div className="container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h1 className="h1" style={{ marginBottom: 6 }}>
            Leaderboard
          </h1>
          <div className="small" style={{ opacity: 0.92 }}>
            Top ranked dispatchers based on trust, reviews, and risk signals.
          </div>
        </div>

        <div className="row wrap" style={{ gap: 10 }}>
          <Link className="btn secondary" href="/dispatchers">
            All Dispatchers
          </Link>
        </div>
      </div>

      <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
        {ITEMS.map((d, index) => (
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
                <div
                  className="row wrap"
                  style={{
                    gap: 8,
                    alignItems: "center",
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
                    {d.name || "Unnamed Dispatcher"}
                  </span>
                </div>

                <div style={{ marginTop: 12 }}>
                  <UserRolePills
                    profile={{
                      platformRole: "user",
                      accountType: "dispatcher",
                      verificationStatus: d.verified ? "verified" : "unverified",
                      tier: (d.tier ?? "tier1") as "tier1" | "tier2" | "tier3",
                      driverType: null,
                    }}
                  />
                </div>

                <div className="small" style={{ marginTop: 10 }}>
                  {d.company || "—"}
                </div>

                <div className="small" style={{ marginTop: 10 }}>
                  ★ {d.computedRating.toFixed(1)} · {d.computedReviewCount} reviews · Trust:{" "}
                  {d.computedTrustScore} · Risk: {d.computedRiskScore}
                </div>
              </div>

              <div>
                <Link className="btn secondary" href={`/dispatchers/${d.id}`}>
                  View profile
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}