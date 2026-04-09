"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { listenToAuth, isAdmin } from "@/lib/auth";
import { useToast } from "@/components/ToastProvider";
import {
  listOpenReports,
  dismissReport,
  hideReviewFromReport,
  confirmReport,
  type Report,
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

export default function AdminReportsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Report[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const rows = await listOpenReports({ limit: 200 });
      setItems(rows);
    } catch (e: any) {
      console.error(e);
      showToast({
        tone: "error",
        title: "Failed to load reports",
        message: e?.message ?? "Something went wrong.",
      });
      setItems([]);
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

      try {
        const ok = await isAdmin();
        if (!ok) {
          router.push("/");
          return;
        }

        setReady(true);
        await load();
      } catch (e) {
        console.error(e);
        router.push("/");
      }
    });

    return () => unsub();
  }, [router]);

  const count = useMemo(() => items.length, [items]);

  async function handleConfirm(item: Report) {
    try {
      setBusyId(item.id);
      await confirmReport(item.id, item.dispatcherId);
      setItems((prev) => prev.filter((x) => x.id !== item.id));
      showToast({
        tone: "success",
        title: "Report confirmed",
        message: "Dispatcher scam score increased.",
      });
    } catch (e: any) {
      console.error(e);
      showToast({
        tone: "error",
        title: "Confirm failed",
        message: e?.message ?? "Something went wrong.",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handleDismiss(item: Report) {
    try {
      setBusyId(item.id);
      await dismissReport(item.id);
      setItems((prev) => prev.filter((x) => x.id !== item.id));
      showToast({
        tone: "success",
        title: "Report dismissed",
      });
    } catch (e: any) {
      console.error(e);
      showToast({
        tone: "error",
        title: "Dismiss failed",
        message: e?.message ?? "Something went wrong.",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handleHideReview(item: Report) {
    if (!item.reviewId) {
      showToast({
        tone: "error",
        title: "No review attached",
        message: "This report does not have a review ID to hide.",
      });
      return;
    }

    try {
      setBusyId(item.id);
      await hideReviewFromReport(item.id, item.reviewId);
      setItems((prev) => prev.filter((x) => x.id !== item.id));
      showToast({
        tone: "success",
        title: "Review hidden",
        message: "The review has been hidden and the report closed.",
      });
    } catch (e: any) {
      console.error(e);
      showToast({
        tone: "error",
        title: "Hide failed",
        message: e?.message ?? "Something went wrong.",
      });
    } finally {
      setBusyId(null);
    }
  }

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
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h1 className="h1" style={{ marginBottom: 6 }}>
            Admin Reports
          </h1>
          <div className="small" style={{ opacity: 0.92 }}>
            Review dispatcher safety and scam reports.
          </div>
        </div>

        <div className="row wrap" style={{ gap: 10 }}>
          <span className="badge">Open: {count}</span>
          <button className="btn secondary" type="button" onClick={load} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <Link className="btn secondary" href="/admin/verifications">
            Admin Verifications
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="small" style={{ marginTop: 16 }}>
          Loading reports…
        </div>
      ) : items.length === 0 ? (
        <div className="card" style={{ padding: 16, marginTop: 14 }}>
          <div style={{ fontWeight: 900 }}>No open reports</div>
          <div className="small" style={{ marginTop: 6 }}>
            New reports will appear here.
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          {items.map((item) => (
            <div key={item.id} className="card" style={{ padding: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 14,
                  flexWrap: "wrap",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ fontWeight: 900, fontSize: 18 }}>
                    Dispatcher ID: {item.dispatcherId}
                  </div>

                  <div style={{ display: "grid", gap: 6, marginTop: 12 }}>
                    <div className="small">
                      <b>Reason:</b> {item.reason}
                    </div>
                    <div className="small">
                      <b>Status:</b> {item.status}
                    </div>
                    <div className="small">
                      <b>Review ID:</b> {item.reviewId ?? "—"}
                    </div>
                    <div className="small">
                      <b>Submitted:</b> {fmtTime(item.createdAt)}
                    </div>
                  </div>
                </div>

                <div style={{ minWidth: 220, display: "grid", gap: 10 }}>
                  <button
                    className="btn"
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => handleConfirm(item)}
                  >
                    {busyId === item.id ? "Working..." : "Confirm Scam"}
                  </button>

                  <button
                    className="btn secondary"
                    type="button"
                    disabled={busyId === item.id || !item.reviewId}
                    onClick={() => handleHideReview(item)}
                  >
                    {busyId === item.id ? "Working..." : "Hide review"}
                  </button>

                  <button
                    className="btn secondary"
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => handleDismiss(item)}
                  >
                    {busyId === item.id ? "Working..." : "Dismiss"}
                  </button>

                  <Link className="btn secondary" href={`/dispatchers/${item.dispatcherId}`}>
                    View Dispatcher
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