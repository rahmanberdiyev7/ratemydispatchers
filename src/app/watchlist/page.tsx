"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import DispatchGuardBadge from "@/components/DispatchGuardBadge";

type GuardEntity = {
  id: string;
  type: "dispatcher" | "broker" | "driver";
  name: string;
  subtitle?: string;
  score: number;
  level: string;
  reportCount: number;
};

async function loadCollection(
  collectionName: string,
  type: "dispatcher" | "broker" | "driver"
): Promise<GuardEntity[]> {
  const q = query(
    collection(db, collectionName),
    where("dispatchGuardFlagged", "==", true)
  );

  const snap = await getDocs(q);

  return snap.docs.map((docSnap) => {
    const data = docSnap.data();

    return {
      id: docSnap.id,
      type,
      name: String(data.name ?? data.displayName ?? "Unknown"),
      subtitle:
        typeof data.company === "string"
          ? data.company
          : typeof data.email === "string"
          ? data.email
          : "",
      score: Number(data.dispatchGuardScore ?? data.riskScore ?? 0),
      level: String(data.dispatchGuardLevel ?? data.riskLevel ?? "watch"),
      reportCount: Number(
        data.dispatchGuardReportCount ?? data.reportCount ?? 0
      ),
    };
  });
}

export default function WatchlistPage() {
  const [rows, setRows] = useState<GuardEntity[]>([]);
  const [loading, setLoading] = useState(true);

  const stats = useMemo(() => {
    return {
      total: rows.length,
      dispatchers: rows.filter((x) => x.type === "dispatcher").length,
      brokers: rows.filter((x) => x.type === "broker").length,
      drivers: rows.filter((x) => x.type === "driver").length,
      critical: rows.filter((x) => x.level === "critical").length,
    };
  }, [rows]);

  useEffect(() => {
    async function load() {
      try {
        const [dispatchers, brokers, drivers] = await Promise.all([
          loadCollection("dispatchers", "dispatcher"),
          loadCollection("brokers", "broker"),
          loadCollection("drivers", "driver"),
        ]);

        setRows(
          [...dispatchers, ...brokers, ...drivers].sort(
            (a, b) => b.score - a.score
          )
        );
      } catch (error) {
        console.error("Failed to load DispatchGuard watchlist", error);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <div className="container">
      <div className="card" style={{ padding: 24 }}>
        <h1 className="h1">DispatchGuard</h1>

        <div className="small" style={{ marginTop: 8, maxWidth: 900 }}>
          DispatchGuard is the platform-wide risk system for dispatchers,
          brokers, and drivers who may not be trusted to work with. This is
          where scam risk, fraud signals, double brokering concerns, no-show
          patterns, unsafe behavior, and reputation warnings come together.
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12,
            marginTop: 18,
          }}
        >
          <div className="card" style={{ padding: 14 }}>
            <div className="small">Total Flagged</div>
            <div className="h2">{stats.total}</div>
          </div>

          <div className="card" style={{ padding: 14 }}>
            <div className="small">Dispatchers</div>
            <div className="h2">{stats.dispatchers}</div>
          </div>

          <div className="card" style={{ padding: 14 }}>
            <div className="small">Brokers</div>
            <div className="h2">{stats.brokers}</div>
          </div>

          <div className="card" style={{ padding: 14 }}>
            <div className="small">Drivers</div>
            <div className="h2">{stats.drivers}</div>
          </div>

          <div className="card" style={{ padding: 14 }}>
            <div className="small">Critical</div>
            <div className="h2">{stats.critical}</div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
        {loading ? (
          <div className="card" style={{ padding: 18 }}>
            Loading DispatchGuard records...
          </div>
        ) : rows.length === 0 ? (
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontWeight: 900 }}>No DispatchGuard records yet.</div>
            <div className="small" style={{ marginTop: 6 }}>
              Flagged dispatchers, brokers, and drivers will appear here.
            </div>
          </div>
        ) : (
          rows.map((row) => {
            const href =
              row.type === "dispatcher"
                ? `/dispatchers/${row.id}`
                : row.type === "broker"
                ? `/brokers/${row.id}`
                : `/drivers/${row.id}`;

            return (
              <Link
                key={`${row.type}-${row.id}`}
                href={href}
                className="card"
                style={{
                  padding: 18,
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 14,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 1000, fontSize: 18 }}>
                      {row.name}
                    </div>

                    <div className="small" style={{ marginTop: 4 }}>
                      {row.type.toUpperCase()} {row.subtitle ? `· ${row.subtitle}` : ""}
                    </div>
                  </div>

                  <DispatchGuardBadge level={row.level} score={row.score} />
                </div>

                <div className="row wrap" style={{ gap: 8, marginTop: 12 }}>
                  <span className="badge">Reports: {row.reportCount}</span>
                  <span className="badge">Risk Score: {row.score}</span>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}