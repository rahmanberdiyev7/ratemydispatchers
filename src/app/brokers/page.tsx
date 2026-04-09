"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listBrokers, type Broker } from "@/lib/brokers";
import { assessBrokerRisk } from "@/lib/brokerRisk";
import UserRolePills from "@/components/ui/UserRolePills";

export default function BrokersPage() {
  const [items, setItems] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [watchlistOnly, setWatchlistOnly] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      try {
        const rows = await listBrokers({ limit: 200 });
        if (!alive) return;
        setItems(rows);
      } catch (e) {
        console.error("Failed to load brokers", e);
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

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();

    return items
      .filter((broker) => {
        const risk = assessBrokerRisk(broker);

        if (watchlistOnly && !(risk.level === "high" || risk.level === "critical")) {
          return false;
        }

        if (!needle) return true;

        const hay = `${broker.name ?? ""} ${broker.company ?? ""} ${broker.mcNumber ?? ""}`.toLowerCase();
        return hay.includes(needle);
      })
      .sort((a, b) => {
        const ar = assessBrokerRisk(a);
        const br = assessBrokerRisk(b);

        if (br.score !== ar.score) return br.score - ar.score;
        return (a.name ?? "").localeCompare(b.name ?? "");
      });
  }, [items, q, watchlistOnly]);

  return (
    <div className="container">
      <h1 className="h1">Brokers</h1>

      <div className="card" style={{ padding: 16, marginTop: 14 }}>
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
              checked={watchlistOnly}
              onChange={(e) => setWatchlistOnly(e.target.checked)}
            />
            <span className="small">Dirty brokers only</span>
          </label>

          <Link href="/broker-watchlist" className="btn secondary">
            Open Watchlist
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="small" style={{ marginTop: 16 }}>Loading brokers…</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: 16, marginTop: 14 }}>
          <div style={{ fontWeight: 900 }}>No brokers found</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
          {filtered.map((broker) => {
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
                        MC: {broker.mcNumber || "—"} · Risk Score: {risk.score}
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