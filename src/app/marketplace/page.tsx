"use client";

import Link from "next/link";
import UserRolePills from "@/components/ui/UserRolePills";

type MarketplaceItem = {
  id: string;
  title: string;
  company?: string;
  verified?: boolean;
  tier?: "tier1" | "tier2" | "tier3";
  reviews?: number;
  trustScore?: number;
  rankScore?: number;
};

const LISTINGS: MarketplaceItem[] = [
  {
    id: "mp-1",
    title: "Experienced Flatbed Dispatcher",
    company: "Delo Trans",
    verified: true,
    tier: "tier1",
    reviews: 12,
    trustScore: 97,
    rankScore: 99,
  },
  {
    id: "mp-2",
    title: "Owner-Operator Focused Dispatch Support",
    company: "Prime Dispatch",
    verified: true,
    tier: "tier1",
    reviews: 8,
    trustScore: 91,
    rankScore: 94,
  },
  {
    id: "mp-3",
    title: "General Freight Dispatcher",
    company: "Fast Lane Logistics",
    verified: false,
    tier: "tier2",
    reviews: 4,
    trustScore: 74,
    rankScore: 79,
  },
];

export default function MarketplacePage() {
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
            Marketplace
          </h1>
          <div className="small" style={{ opacity: 0.92 }}>
            Browse listings with trust signals, verification, and ranking details.
          </div>
        </div>

        <div className="row wrap" style={{ gap: 10 }}>
          <Link className="btn secondary" href="/marketplace/new">
            Create Listing
          </Link>
        </div>
      </div>

      <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
        {LISTINGS.map((item) => (
          <div key={item.id} className="card" style={{ padding: 16 }}>
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
                <div style={{ fontWeight: 900, fontSize: 18 }}>{item.title}</div>

                <div className="small" style={{ marginTop: 4 }}>
                  {item.company}
                </div>

                <div style={{ marginTop: 10 }}>
                  <UserRolePills
                    profile={{
                      platformRole: "user",
                      accountType: "dispatcher",
                      verificationStatus: item.verified ? "verified" : "unverified",
                      tier: (item.tier ?? "tier1") as "tier1" | "tier2" | "tier3",
                      driverType: null,
                    }}
                  />
                </div>

                <div className="small" style={{ marginTop: 10 }}>
                  ★ {item.rating ?? item.trustScore ?? 0} · {item.reviews ?? 0} reviews · Trust:{" "}
                  {item.trustScore ?? 0} · Rank Score: {item.rankScore ?? 0}
                </div>
              </div>

              <div>
                <Link className="btn secondary" href={`/marketplace/${item.id}`}>
                  Open listing
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}