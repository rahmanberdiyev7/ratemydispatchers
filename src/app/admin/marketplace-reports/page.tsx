"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { listenToAuth, isAdmin } from "@/lib/auth";
import {
  listOpenMarketplaceReviewReports,
  dismissMarketplaceReviewReport,
  hideMarketplaceReviewFromReport,
  type MarketplaceReviewReport,
} from "@/lib/firestore";

function fmtTime(ts: any) {
  try {
    if (!ts) return "";
    if (typeof ts?.toDate === "function") return ts.toDate().toLocaleString();
    if (typeof ts?.seconds === "number") return new Date(ts.seconds * 1000).toLocaleString();
    return "";
  } catch {
    return "";
  }
}

export default function AdminMarketplaceReportsPage() {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<MarketplaceReviewReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const rows = await listOpenMarketplaceReviewReports({ limit: 100 });
      setItems(rows);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const unsub = listenToAuth(async (u) => {
      if (!u) {
        router.push("/login");
        return;
      }

      const ok = await isAdmin(true);
      if (!ok) {
        router.push("/");
        return;
      }

      setReady(true);
      await load();
    });

    return () => unsub();
  }, [router]);

  if (!ready) {
    return (
      <div className="container">
        <div className="small">Checking admin access…</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 className="h1" style={{ marginBottom: 6 }}>
            Admin Marketplace Review Reports
          </h1>
          <div className="small" style={{ opacity: 0.9 }}>
            Moderate reported marketplace reviews.
          </div>
        </div>

        <div className="row wrap" style={{ gap: 10 }}>
          <Link className="btn secondary" href="/">
            Home
          </Link>
          <button className="btn secondary" onClick={load} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
        {items.map((r) => (
          <div key={r.id} className="card" style={{ padding: 14 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "flex-start",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ fontWeight: 900 }}>Reason: {r.reason}</div>
                <div className="small">Listing ID: {r.listingId}</div>
                <div className="small">Review ID: {r.reviewId}</div>
                <div className="small">Created: {fmtTime(r.createdAt)}</div>
              </div>

              <div className="row wrap" style={{ gap: 10 }}>
                <button
                  className="btn secondary"
                  disabled={busyId === r.id}
                  onClick={async () => {
                    try {
                      setBusyId(r.id);
                      await dismissMarketplaceReviewReport(r.id);
                      await load();
                    } finally {
                      setBusyId(null);
                    }
                  }}
                >
                  Dismiss
                </button>

                <button
                  className="btn"
                  disabled={busyId === r.id}
                  onClick={async () => {
                    try {
                      setBusyId(r.id);
                      await hideMarketplaceReviewFromReport(r.id, r.reviewId);
                      await load();
                    } finally {
                      setBusyId(null);
                    }
                  }}
                >
                  Hide Review
                </button>
              </div>
            </div>
          </div>
        ))}

        {!loading && items.length === 0 ? (
          <div className="small">No open marketplace review reports.</div>
        ) : null}
      </div>
    </div>
  );
}