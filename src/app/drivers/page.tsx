"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import {
  getDriverAverageRating,
} from "@/lib/driverReviews";

type DriverRow = {
  id: string;
  displayName: string;
  email?: string | null;

  driverSubtype?: string | null;

  reviewCount?: number;
  ratingSum?: number;

  riskLevel?: string;
  riskScore?: number;

  verificationStatus?: string;
};

export default function DriversPage() {
  const [rows, setRows] = useState<DriverRow[]>([]);
  const [loading, setLoading] = useState(true);

  const stats = useMemo(() => {
    return {
      total: rows.length,
      highRisk: rows.filter(
        (x) => x.riskLevel === "high" || x.riskLevel === "critical"
      ).length,
    };
  }, [rows]);

  useEffect(() => {
    async function load() {
      try {
        const q = query(
          collection(db, "drivers"),
          orderBy("displayName", "asc")
        );

        const snap = await getDocs(q);

        const data = snap.docs.map((docSnap) => {
          const data = docSnap.data();

          return {
            id: docSnap.id,
            displayName: String(data.displayName ?? "Unknown Driver"),
            email:
              typeof data.email === "string" ? data.email : null,

            driverSubtype:
              typeof data.driverSubtype === "string"
                ? data.driverSubtype
                : null,

            reviewCount: Number(data.reviewCount ?? 0),
            ratingSum: Number(data.ratingSum ?? 0),

            riskLevel:
              typeof data.riskLevel === "string"
                ? data.riskLevel
                : "low",

            riskScore: Number(data.riskScore ?? 0),

            verificationStatus:
              typeof data.verificationStatus === "string"
                ? data.verificationStatus
                : "unverified",
          };
        });

        setRows(data);
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
          <h1 className="h1">Drivers</h1>

          <div className="small" style={{ marginTop: 6 }}>
            Owner-operators and company drivers across the ecosystem.
          </div>
        </div>

        <Link href="/driver-watchlist" className="btn secondary">
          Driver Watchlist
        </Link>
      </div>

      <div
        className="grid"
        style={{
          marginTop: 18,
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
        }}
      >
        <div className="card" style={{ padding: 16 }}>
          <div className="small">Total Drivers</div>
          <div className="h2">{stats.total}</div>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div className="small">High Risk Drivers</div>
          <div className="h2">{stats.highRisk}</div>
        </div>
      </div>

      <div
        className="grid"
        style={{
          marginTop: 20,
          gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
        }}
      >
        {loading ? (
          <div className="small">Loading drivers...</div>
        ) : rows.length === 0 ? (
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontWeight: 900 }}>No drivers found.</div>
          </div>
        ) : (
          rows.map((row) => {
            const avg = getDriverAverageRating(
              row.reviewCount,
              row.ratingSum
            );

            return (
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
                  <div>
                    <div
                      style={{
                        fontWeight: 900,
                        fontSize: 18,
                      }}
                    >
                      {row.displayName}
                    </div>

                    <div
                      className="small"
                      style={{ marginTop: 4 }}
                    >
                      {row.driverSubtype === "owner_operator"
                        ? "Owner Operator"
                        : row.driverSubtype === "company_driver"
                        ? "Company Driver"
                        : "Driver"}
                    </div>
                  </div>

                  <div
                    className="badge"
                    style={{
                      background:
                        row.riskLevel === "critical"
                          ? "rgba(255,0,0,0.18)"
                          : row.riskLevel === "high"
                          ? "rgba(255,120,0,0.18)"
                          : row.riskLevel === "medium"
                          ? "rgba(255,200,0,0.18)"
                          : "rgba(0,255,120,0.12)",
                    }}
                  >
                    {row.riskLevel ?? "low"}
                  </div>
                </div>

                <div
                  className="row wrap"
                  style={{ gap: 8, marginTop: 14 }}
                >
                  <div className="badge">
                    ⭐ {avg}
                  </div>

                  <div className="badge">
                    {row.reviewCount ?? 0} reviews
                  </div>

                  <div className="badge">
                    Risk Score: {row.riskScore ?? 0}
                  </div>
                </div>

                <div
                  className="small"
                  style={{ marginTop: 12 }}
                >
                  Verification:{" "}
                  <b>{row.verificationStatus ?? "unverified"}</b>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}