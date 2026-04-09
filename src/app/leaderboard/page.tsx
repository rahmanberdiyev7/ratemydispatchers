"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import UserRolePills from "@/components/ui/UserRolePills";
import { getRankedDispatchers, type RankedDispatcher } from "@/lib/rankedDispatchers";

export default function LeaderboardPage() {
  const [items, setItems] = useState<RankedDispatcher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      try {
        const rows = await getRankedDispatchers(200);
        if (alive) setItems(rows);
      } catch (e) {
        console.error("Failed to load leaderboard", e);
        if (alive) setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="container">
      <h1 className="h1">Leaderboard</h1>

      {loading ? (
        <div className="small" style={{ marginTop: 16 }}>Loading leaderboard…</div>
      ) : items.length === 0 ? (
        <div className="card" style={{ padding: 16, marginTop: 14 }}>
          <div style={{ fontWeight: 900 }}>No dispatchers found</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
          {items.map((d, index) => (
            <div key={d.id} className="card" style={{ padding: 16 }}>
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
                  href={`/dispatchers/${d.id}`}
                  style={{
                    flex: 1,
                    minWidth: 260,
                    color: "inherit",
                    textDecoration: "none",
                    display: "block",
                    borderRadius: 16,
                  }}
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

                      <span style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>
                        {(d as any).name ?? "Unnamed Dispatcher"}
                      </span>

                      <UserRolePills
                        profile={{
                          platformRole: "dispatcher",
                          verificationStatus: d.computedVerified ? "verified" : "unverified",
                          tier: d.computedTier,
                          driverType: null,
                        }}
                      />
                    </div>

                    <div className="small" style={{ marginTop: 4 }}>
                      {(d as any).company ?? "—"}
                    </div>

                    <div className="small" style={{ marginTop: 6 }}>
                      ⭐ {d.computedRating.toFixed(1)} · {d.computedReviewCount} reviews · Trust:{" "}
                      {d.computedTrustScore} · Risk: {d.computedRiskScore} · Rank Score: {d.rankingScore}
                    </div>
                  </div>
                </Link>

                <div style={{ display: "flex", alignItems: "center", minWidth: 180 }}>
                  <Link
                    href={`/dispatchers/${d.id}`}
                    className="btn secondary"
                    style={{ width: "100%", textAlign: "center" }}
                  >
                    View profile
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