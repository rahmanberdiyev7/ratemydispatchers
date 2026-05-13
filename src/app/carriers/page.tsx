"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listTrustEntities, type TrustEntity } from "@/lib/trustEntities";
import DispatchGuardBadge from "@/components/DispatchGuardBadge";

export default function CarriersPage() {
  const [rows, setRows] = useState<TrustEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await listTrustEntities("carrier");
        setRows(data);
      } catch (error) {
        console.error("Failed to load carriers", error);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return rows;

    return rows.filter((item) => {
      return (
        item.displayName?.toLowerCase().includes(q) ||
        item.companyName?.toLowerCase().includes(q) ||
        item.mcNumber?.toLowerCase().includes(q) ||
        item.dotNumber?.toLowerCase().includes(q) ||
        item.phone?.toLowerCase().includes(q) ||
        item.email?.toLowerCase().includes(q)
      );
    });
  }, [rows, search]);

  const stats = useMemo(() => {
    return {
      total: rows.length,
      trusted: rows.filter(
        (x) =>
          x.dispatchGuard?.level === "trusted" ||
          x.dispatchGuard?.level === "verified"
      ).length,
      flagged: rows.filter(
        (x) =>
          x.dispatchGuard?.level === "watch" ||
          x.dispatchGuard?.level === "high_risk" ||
          x.dispatchGuard?.level === "critical"
      ).length,
      critical: rows.filter((x) => x.dispatchGuard?.level === "critical")
        .length,
    };
  }, [rows]);

  return (
    <div className="container">
      <div className="card" style={{ padding: 24 }}>
        <div className="row between wrap" style={{ gap: 16 }}>
          <div>
            <h1 className="h1">Carriers</h1>

            <div className="small" style={{ marginTop: 8, maxWidth: 900 }}>
              Search carrier profiles, MC/DOT identity, DispatchGuard Score™,
              reputation signals, and future FMCSA verification data.
            </div>
          </div>

          <Link className="btn secondary" href="/dispatchguard">
            Open DispatchGuard
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
            gap: 12,
            marginTop: 22,
          }}
        >
          <div className="card" style={{ padding: 14 }}>
            <div className="small">Total Carriers</div>
            <div className="h2">{stats.total}</div>
          </div>

          <div className="card" style={{ padding: 14 }}>
            <div className="small">Trusted / Verified</div>
            <div className="h2">{stats.trusted}</div>
          </div>

          <div className="card" style={{ padding: 14 }}>
            <div className="small">Watch / High Risk</div>
            <div className="h2">{stats.flagged}</div>
          </div>

          <div className="card" style={{ padding: 14 }}>
            <div className="small">Critical</div>
            <div className="h2">{stats.critical}</div>
          </div>
        </div>

        <input
          className="input"
          placeholder="Search carriers by name, company, MC, DOT, phone, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginTop: 20 }}
        />
      </div>

      <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
        {loading ? (
          <div className="card" style={{ padding: 18 }}>
            Loading carriers...
          </div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontWeight: 900 }}>No carriers found.</div>
            <div className="small" style={{ marginTop: 6 }}>
              Carrier profiles will appear here after signup or demo seeding.
            </div>
          </div>
        ) : (
          filtered.map((carrier) => (
            <Link
              key={carrier.id}
              href={`/entity/${carrier.id}`}
              className="card"
              style={{
                padding: 18,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div className="row between wrap" style={{ gap: 14 }}>
                <div>
                  <div style={{ fontWeight: 1000, fontSize: 20 }}>
                    {carrier.displayName}
                  </div>

                  <div className="small" style={{ marginTop: 5 }}>
                    CARRIER
                    {carrier.companyName ? ` · ${carrier.companyName}` : ""}
                  </div>
                </div>

                <DispatchGuardBadge
                  level={carrier.dispatchGuard?.level}
                  score={carrier.dispatchGuard?.score}
                />
              </div>

              <div className="row wrap" style={{ gap: 8, marginTop: 14 }}>
                <span className="badge">
                  {carrier.verified ? "Verified" : "Unverified"}
                </span>

                {carrier.mcNumber ? (
                  <span className="badge">MC: {carrier.mcNumber}</span>
                ) : null}

                {carrier.dotNumber ? (
                  <span className="badge">DOT: {carrier.dotNumber}</span>
                ) : null}

                {carrier.phone ? (
                  <span className="badge">{carrier.phone}</span>
                ) : null}

                {carrier.email ? (
                  <span className="badge">{carrier.email}</span>
                ) : null}

                <span className="badge">
                  Reviews: {carrier.dispatchGuard?.reviewCount ?? 0}
                </span>

                <span className="badge">
                  Reports: {carrier.dispatchGuard?.reportsCount ?? 0}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}