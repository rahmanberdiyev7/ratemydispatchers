"use client";

import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import AdminGuard from "@/components/AdminGuard";
import { db } from "@/lib/firebase";

export default function AdminIdentityShieldPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const q = query(
          collection(db, "identity_shield_reports"),
          orderBy("createdAt", "desc")
        );

        const snap = await getDocs(q);

        setRows(
          snap.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }))
        );
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
          <h1 className="h1">Identity Shield Admin</h1>

          <div className="small" style={{ marginTop: 8, maxWidth: 900 }}>
            Review impersonation reports across brokers, carriers,
            dispatchers, and drivers.
          </div>
        </div>

        <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
          {loading ? (
            <div className="card" style={{ padding: 18 }}>
              Loading Identity Shield alerts...
            </div>
          ) : rows.length === 0 ? (
            <div className="card" style={{ padding: 18 }}>
              No Identity Shield alerts yet.
            </div>
          ) : (
            rows.map((row) => (
              <div key={row.id} className="card" style={{ padding: 18 }}>
                <div className="row between wrap" style={{ gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 1000, fontSize: 18 }}>
                      {row.realEntityName ?? "Unknown Entity"}
                    </div>

                    <div className="small" style={{ marginTop: 5 }}>
                      {row.realEntityType ?? "entity"} · {row.realEntityId}
                    </div>
                  </div>

                  <span className="badge">{row.status ?? "open"}</span>
                </div>

                <div className="row wrap" style={{ gap: 8, marginTop: 12 }}>
                  {row.fakeEmail ? (
                    <span className="badge">Fake Email: {row.fakeEmail}</span>
                  ) : null}

                  {row.fakePhone ? (
                    <span className="badge">Fake Phone: {row.fakePhone}</span>
                  ) : null}

                  {row.fakeDomain ? (
                    <span className="badge">
                      Fake Domain: {row.fakeDomain}
                    </span>
                  ) : null}

                  {row.loadBoardSource ? (
                    <span className="badge">
                      Source: {row.loadBoardSource}
                    </span>
                  ) : null}
                </div>

                {row.details ? (
                  <div className="small" style={{ marginTop: 12, lineHeight: 1.7 }}>
                    {row.details}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>
    </AdminGuard>
  );
}