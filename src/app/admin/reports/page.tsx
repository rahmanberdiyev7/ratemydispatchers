"use client";

import { useEffect, useState } from "react";
import AdminGuard from "@/components/AdminGuard";
import { listDispatchGuardReports } from "@/lib/dispatchGuardReports";

export default function AdminReportsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await listDispatchGuardReports();
        setRows(data);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <AdminGuard>
      <div className="container">
        <div className="card" style={{ padding: 24 }}>
          <h1 className="h1">DispatchGuard Reports</h1>

          <div className="small" style={{ marginTop: 8 }}>
            Review submitted risk reports before they affect public trust.
          </div>
        </div>

        <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
          {loading ? (
            <div className="card" style={{ padding: 18 }}>
              Loading reports...
            </div>
          ) : rows.length === 0 ? (
            <div className="card" style={{ padding: 18 }}>
              No reports yet.
            </div>
          ) : (
            rows.map((row) => (
              <div key={row.id} className="card" style={{ padding: 18 }}>
                <div className="row between wrap" style={{ gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 1000, fontSize: 18 }}>
                      {row.reportType ?? "Report"}
                    </div>

                    <div className="small" style={{ marginTop: 5 }}>
                      Target: {row.targetType} · {row.targetEntityId}
                    </div>
                  </div>

                  <span className="badge">{row.severity ?? "medium"}</span>
                </div>

                <div className="small" style={{ marginTop: 12, lineHeight: 1.7 }}>
                  {row.description ?? "No description"}
                </div>

                <div className="row wrap" style={{ gap: 8, marginTop: 12 }}>
                  <span className="badge">
                    Status: {row.resolutionStatus ?? "open"}
                  </span>
                  <span className="badge">
                    AI Risk: {row.aiFraudProbability ?? 0}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminGuard>
  );
}