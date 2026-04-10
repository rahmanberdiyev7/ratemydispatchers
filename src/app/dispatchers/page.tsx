"use client";

import Link from "next/link";
import UserRolePills from "@/components/ui/UserRolePills";

type DispatcherListItem = {
  id: string;
  name: string;
  company?: string;
  verified?: boolean;
  tier?: "tier1" | "tier2" | "tier3";
  rating?: number;
  reviewCount?: number;
};

const DISPATCHERS: DispatcherListItem[] = [
  {
    id: "disp-1",
    name: "Sam Alm",
    company: "Delo Trans",
    verified: true,
    tier: "tier1",
    rating: 5,
    reviewCount: 12,
  },
  {
    id: "disp-2",
    name: "Mike Turner",
    company: "Fast Lane Logistics",
    verified: false,
    tier: "tier2",
    rating: 4.2,
    reviewCount: 6,
  },
  {
    id: "disp-3",
    name: "Anna Reed",
    company: "Prime Dispatch",
    verified: true,
    tier: "tier1",
    rating: 4.8,
    reviewCount: 18,
  },
];

export default function DispatchersPage() {
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
            Dispatchers
          </h1>
          <div className="small" style={{ opacity: 0.92 }}>
            Browse dispatcher profiles, verification signals, and trust indicators.
          </div>
        </div>

        <div className="row wrap" style={{ gap: 10 }}>
          <Link className="btn secondary" href="/leaderboard">
            Leaderboard
          </Link>
        </div>
      </div>

      <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
        {DISPATCHERS.map((d, index) => (
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
                  <span className="chip">#{index + 1}</span>
                  <span>{d.name}</span>
                </div>

                <div className="small" style={{ marginTop: 6 }}>
                  {d.company || "—"}
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

                <div className="small" style={{ marginTop: 12 }}>
                  Rating: {typeof d.rating === "number" ? d.rating.toFixed(1) : "—"} · Reviews:{" "}
                  {d.reviewCount ?? 0}
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