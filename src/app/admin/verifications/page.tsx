"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { listenToAuth, isAdmin } from "@/lib/auth";
import { useToast } from "@/components/ToastProvider";
import {
  listPendingVerificationRequests,
  approveVerificationRequest,
  rejectVerificationRequest,
  type DispatcherVerificationRequest,
} from "@/lib/dispatcherVerification";

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

export default function AdminVerificationsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<DispatcherVerificationRequest[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const rows = await listPendingVerificationRequests({ limit: 100 });
      setItems(rows);
    } catch (e: any) {
      console.error(e);
      showToast({
        tone: "error",
        title: "Failed to load verification requests",
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

  async function handleApprove(item: DispatcherVerificationRequest) {
    try {
      setBusyId(item.id);
      await approveVerificationRequest(item.id, item.dispatcherId);
      setItems((prev) => prev.filter((x) => x.id !== item.id));
      showToast({
        tone: "success",
        title: "Verification approved",
        message: `${item.dispatcherName ?? "Dispatcher"} is now verified.`,
      });
    } catch (e: any) {
      console.error(e);
      showToast({
        tone: "error",
        title: "Approval failed",
        message: e?.message ?? "Something went wrong.",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(item: DispatcherVerificationRequest) {
    try {
      setBusyId(item.id);
      await rejectVerificationRequest(item.id);
      setItems((prev) => prev.filter((x) => x.id !== item.id));
      showToast({
        tone: "success",
        title: "Request rejected",
      });
    } catch (e: any) {
      console.error(e);
      showToast({
        tone: "error",
        title: "Reject failed",
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
            Admin Verifications
          </h1>
          <div className="small" style={{ opacity: 0.92 }}>
            Review dispatcher verification requests.
          </div>
        </div>

        <div className="row wrap" style={{ gap: 10 }}>
          <span className="badge">Pending: {count}</span>
          <button className="btn secondary" type="button" onClick={load} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <Link className="btn secondary" href="/admin/claims">
            Admin Claims
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="small" style={{ marginTop: 16 }}>
          Loading requests…
        </div>
      ) : items.length === 0 ? (
        <div className="card" style={{ padding: 16, marginTop: 14 }}>
          <div style={{ fontWeight: 900 }}>No pending verification requests</div>
          <div className="small" style={{ marginTop: 6 }}>
            New requests will appear here.
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
                    {item.dispatcherName ?? "Dispatcher"}
                  </div>

                  <div className="small" style={{ marginTop: 4 }}>
                    {item.company ?? "—"}
                  </div>

                  <div style={{ display: "grid", gap: 6, marginTop: 12 }}>
                    <div className="small">
                      <b>Email:</b> {item.email ?? "—"}
                    </div>
                    <div className="small">
                      <b>Phone:</b> {item.phone ?? "—"}
                    </div>
                    <div className="small">
                      <b>MC:</b> {item.mcNumber ?? "—"}
                    </div>
                    <div className="small">
                      <b>DOT:</b> {item.dotNumber ?? "—"}
                    </div>
                    <div className="small">
                      <b>Submitted:</b> {fmtTime(item.createdAt)}
                    </div>
                  </div>

                  {item.notes ? (
                    <div className="small" style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>
                      <b>Notes:</b>
                      <div style={{ marginTop: 6 }}>{item.notes}</div>
                    </div>
                  ) : null}
                </div>

                <div style={{ minWidth: 220, display: "grid", gap: 10 }}>
                  <button
                    className="btn"
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => handleApprove(item)}
                  >
                    {busyId === item.id ? "Working..." : "Approve"}
                  </button>

                  <button
                    className="btn secondary"
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => handleReject(item)}
                  >
                    {busyId === item.id ? "Working..." : "Reject"}
                  </button>

                  <Link className="btn secondary" href={`/dispatchers/${item.dispatcherId}`}>
                    View Profile
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