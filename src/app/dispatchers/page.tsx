"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import UserRolePills from "@/components/ui/UserRolePills";
import { getRankedDispatchers, type RankedDispatcher } from "@/lib/rankedDispatchers";

export default function DispatchersPage() {
  const [items, setItems] = useState<RankedDispatcher[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      try {
        const rows = await getRankedDispatchers(200);
        if (alive) setItems(rows);
      } catch (e) {
        console.error("Failed to load ranked dispatchers", e);
        if (alive) setItems([]);
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

    return items.filter((d) => {
      if (verifiedOnly && !d.computedVerified) return false;
      if (!needle) return true;

      const hay = `${(d as any).name ?? ""} ${(d as any).company ?? ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [items, q, verifiedOnly]);

  return (
    <div className="container">
      <h1 className="h1">Dispatchers</h1>

      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <div className="row wrap" style={{ gap: 10, alignItems: "center" }}>
          <input
            className="input"
            style={{ maxWidth: 360 }}
            placeholder="Search dispatcher or company..."
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

          <div className="small" style={{ marginLeft: "auto", opacity: 0.85 }}>
            Showing {filtered.length}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="small" style={{ marginTop: 16 }}>Loading dispatchers…</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: 16, marginTop: 14 }}>
          <div style={{ fontWeight: 900 }}>No dispatchers found</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
          {filtered.map((d) => (
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
                    paddingRight: 8,
                  }}
                  aria-label={`Open ${(d as any).name ?? "dispatcher"} profile`}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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

                    <div className="small">{(d as any).company ?? "—"}</div>

                    <div className="small" style={{ marginTop: 2 }}>
                      ⭐ {d.computedRating.toFixed(1)} · {d.computedReviewCount} reviews · Trust:{" "}
                      {d.computedTrustScore} · Rank Score: {d.rankingScore}
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