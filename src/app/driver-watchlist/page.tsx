"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

type WatchRow = {
  id: string;
  displayName: string;
  riskLevel?: string;
  riskScore?: number;
  reportCount?: number;
};

export default function DriverWatchlistPage() {
  const [rows, setRows] = useState<WatchRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const q = query(
          collection(db, "drivers"),
          where("riskScore", ">=", 30)
        );

        const snap = await getDocs(q);

        setRows(
          snap.docs.map((docSnap) => {
            const data = docSnap.data();

            return {
              id: docSnap.id,
              displayName: String(
                data.displayName ?? "Unknown Driver"
              ),
              riskLevel:
                typeof data.riskLevel === "string"
                  ? data.riskLevel
                  : "medium",
              riskScore: Number(data.riskScore ?? 0),
              reportCount: Number(data.reportCount ?? 0),
            };
          })
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <div className="container">
      <div className="row between">
        <div>
          <h1 className="h1">Driver Watchlist</h1>

          <div className="small" style={{ marginTop: 6 }}>
            Drivers flagged through risk signals and reports.
          </div>
        </div>

        <Link href="/drivers" className="btn secondary">
          Back to Drivers
        </Link>
      </div>

      <div
        className="grid"
        style={{
          marginTop: 20,
          gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
        }}
      >
        {loading ? (
          <div className="small">Loading watchlist...</div>
        ) : rows.length === 0 ? (
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontWeight: 900 }}>
              No risky drivers found.
            </div>
          </div>
        ) : (
          rows.map((row) => (
            <Link
              key={row.id}
              href={`/drivers/${row.id}`}
              className="card"
              style={{
                padding: 18,
                textDecoration: "none",
              }}
            >
              <div className="row between">
                <div
                  style={{
                    fontWeight: 900,
                    fontSize: 18,
                  }}
                >
                  {row.displayName}
                </div>

                <div
                  className="badge"
                  style={{
                    background:
                      row.riskLevel === "critical"
                        ? "rgba(255,0,0,0.18)"
                        : row.riskLevel === "high"
                        ? "rgba(255,120,0,0.18)"
                        : "rgba(255,200,0,0.18)",
                  }}
                >
                  {row.riskLevel}
                </div>
              </div>

              <div
                className="row wrap"
                style={{ gap: 8, marginTop: 14 }}
              >
                <div className="badge">
                  Risk Score: {row.riskScore ?? 0}
                </div>

                <div className="badge">
                  Reports: {row.reportCount ?? 0}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}