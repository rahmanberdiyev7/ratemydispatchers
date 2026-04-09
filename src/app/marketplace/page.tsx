"use client";

import Link from "next/link";
import UserRolePills from "@/components/ui/UserRolePills";
import { calculateRankingScore } from "@/lib/reputation";

type Listing = {
  id: string;
  title: string;
  company: string;
  verified: boolean;
  tier: "tier1" | "tier2" | "tier3";
  rating: number;
  reviews: number;
  trustScore: number;
  riskScore: number;
  recentActivityScore: number;
  profileCompleteness: number;
};

const LISTINGS: Listing[] = [
  {
    id: "m1",
    title: "Power only dispatch support",
    company: "Delo",
    verified: true,
    tier: "tier1",
    rating: 4.3,
    reviews: 3,
    trustScore: 54,
    riskScore: 30,
    recentActivityScore: 78,
    profileCompleteness: 92,
  },
  {
    id: "m2",
    title: "Flatbed specialist dispatch",
    company: "Prime Route Logistics",
    verified: true,
    tier: "tier3",
    rating: 4.6,
    reviews: 28,
    trustScore: 81,
    riskScore: 12,
    recentActivityScore: 91,
    profileCompleteness: 98,
  },
];

export default function MarketplacePage() {
  return (
    <div className="container">
      <h1 className="h1">Marketplace</h1>

      <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
        {LISTINGS.map((item) => {
          const score = calculateRankingScore({
            verified: item.verified,
            rating: item.rating,
            reviewCount: item.reviews,
            trustScore: item.trustScore,
            riskScore: item.riskScore,
            tier: item.tier,
            recentActivityScore: item.recentActivityScore,
            profileCompleteness: item.profileCompleteness,
          });

          return (
            <div key={item.id} className="card" style={{ padding: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontWeight: 900, fontSize: 18 }}>{item.title}</div>

                  <div className="small" style={{ marginTop: 4 }}>
                    {item.company}
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <UserRolePills
                      profile={{
                        platformRole: "dispatcher",
                        verificationStatus: item.verified ? "verified" : "unverified",
                        tier: item.tier,
                        driverType: null,
                      }}
                    />
                  </div>

                  <div className="small" style={{ marginTop: 8 }}>
                    ⭐ {item.rating} · {item.reviews} reviews · Trust: {item.trustScore} ·
                    Rank Score: {score.total}
                  </div>
                </div>

                <Link href="/dispatchers" className="btn secondary">
                  View dispatcher
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}