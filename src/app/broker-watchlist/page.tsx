"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listBrokers, type Broker } from "@/lib/brokers";
import { assessBrokerRisk } from "@/lib/brokerRisk";
import UserRolePills from "@/components/ui/UserRolePills";

export default function BrokerWatchlistPage() {
  const [items, setItems] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      try {
        const rows = await listBrokers({ limit: 200 });
        if (!alive) return;
        setItems(rows);
      } catch (e) {
        console.error("Failed to load broker watchlist", e);
        if (!alive) return;
        setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const risky = useMemo(() => {
    return [...items]
      .filter((broker) => {
        const risk = assessBrokerRisk(broker);
        return risk.level === "high" || risk.level === "critical" || broker.communityAlert === true;
      })
      .sort((a, b) => assessBrokerRisk(b).score - assessBrokerRisk(a).score);
  }, [items]);

  return (
    <div className="container">
      <div className="row wrap" style={{ justifyContent: "space-between", gap: 10 }}>
        <h1 className="h1">Dirty Broker Watchlist</h1>
        <Link href="/brokers" className="btn secondary">
          All Brokers
        </Link>
      </div>

      {loading ? (
        <div className="small" style={{ marginTop: 16 }}>Loading watchlist…</div>
      ) : risky.length === 0 ? (
        <div className="card" style={{ padding: 16, marginTop: 14 }}>
          <div style={{ fontWeight: 900 }}>No high-risk brokers right now</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
          {risky.map((broker, index) => {
            const risk = assessBrokerRisk(broker);

            return (
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
                          {broker.name || "Unnamed Broker"}
                        </span>

                        <UserRolePills
                          profile={{
                            platformRole: "broker",
                            verificationStatus: broker.verified ? "verified" : "unverified",
                            tier: (broker.tier as any) ?? "tier1",
                            driverType: null,
                          }}
                        />
                      </div>

                      <div className="small" style={{ marginTop: 4 }}>
                        {broker.company || "—"}
                      </div>

                      <div className="small" style={{ marginTop: 6 }}>
                        Risk Score: {risk.score} · {risk.level}
                      </div>

                      <div className="small" style={{ marginTop: 6 }}>
                        {risk.reasons.length ? risk.reasons.join(" • ") : "No public explanation."}
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
            );
          })}
        </div>
      )}
    </div>
  );
}