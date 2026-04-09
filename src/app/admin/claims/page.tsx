"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { listenToAuth, isAdmin } from "@/lib/auth";
import { BRAND } from "@/lib/brand";
import {
  listClaimRequests,
  approveClaim,
  rejectClaim,
  type ClaimRequest,
} from "@/lib/firestore";

function fmtTime(ts: any) {
  // Firestore Timestamp best-effort
  try {
    if (!ts) return "";
    if (typeof ts?.toDate === "function") return ts.toDate().toLocaleString();
    if (typeof ts?.seconds === "number") return new Date(ts.seconds * 1000).toLocaleString();
    return "";
  } catch {
    return "";
  }
}

export default function AdminClaimsPage() {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [claims, setClaims] = useState<ClaimRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const pending = useMemo(
    () => claims.filter((c) => (c.status ?? "pending") === "pending"),
    [claims]
  );

  async function loadClaims() {
    setLoading(true);
    setError(null);
    try {
      const rows = await listClaimRequests({ limit: 100 });
      setClaims(rows);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load claim requests");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const unsub = listenToAuth(async (u) => {
      try {
        setError(null);

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
        await loadClaims();
      } catch (e: any) {
        setError(e?.message ?? "Error");
      }
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onApprove(c: ClaimRequest) {
    if (!c?.id || !c?.dispatcherId) return;
    setBusyId(c.id);
    setError(null);
    try {
      await approveClaim(c.id, c.dispatcherId);
      setClaims((prev) => prev.map((x) => (x.id === c.id ? { ...x, status: "approved" } : x)));
      // remove from pending list immediately (UX)
      setClaims((prev) => prev.filter((x) => x.id !== c.id));
    } catch (e: any) {
      setError(e?.message ?? "Failed to approve claim");
    } finally {
      setBusyId(null);
    }
  }

  async function onReject(c: ClaimRequest) {
    if (!c?.id) return;
    setBusyId(c.id);
    setError(null);
    try {
      await rejectClaim(c.id);
      setClaims((prev) => prev.map((x) => (x.id === c.id ? { ...x, status: "rejected" } : x)));
      // remove from pending list immediately (UX)
      setClaims((prev) => prev.filter((x) => x.id !== c.id));
    } catch (e: any) {
      setError(e?.message ?? "Failed to reject claim");
    } finally {
      setBusyId(null);
    }
  }

  if (!ready) {
    return (
      <div className="container">
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>{BRAND.product} Admin</div>
          <div className="small" style={{ marginTop: 6 }}>
            Checking admin access…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="space" style={{ alignItems: "flex-end" }}>
        <div>
          <h1 className="h2" style={{ margin: 0 }}>
            Admin — Claim Requests
          </h1>
          <div className="small" style={{ marginTop: 6 }}>
            Approve will mark the dispatcher as <b>Verified</b>.
          </div>
        </div>

        <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          <button className="btn secondary" type="button" onClick={() => router.push("/")}>
            ← Home
          </button>
          <button className="btn" type="button" onClick={loadClaims} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="card" style={{ padding: 12, marginTop: 12 }}>
          <div style={{ fontWeight: 900 }}>Error</div>
          <div className="small" style={{ marginTop: 6 }}>
            {error}
          </div>
        </div>
      ) : null}

      <div className="card" style={{ padding: 16, marginTop: 12 }}>
        <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
          <div>
            <div className="small">Pending</div>
            <div style={{ fontWeight: 950, fontSize: 24 }}>{pending.length}</div>
          </div>

          <div>
            <div className="small">Showing</div>
            <div style={{ fontWeight: 950, fontSize: 24 }}>{pending.length ? pending.length : 0}</div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
        {loading ? <div className="small">Loading…</div> : null}

        {!loading && pending.length === 0 ? (
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 900 }}>No pending claims</div>
            <div className="small" style={{ marginTop: 6 }}>
              You’re all caught up.
            </div>
          </div>
        ) : null}

        {pending.map((c) => {
          const busy = busyId === c.id;

          return (
            <div key={c.id} className="card" style={{ padding: 14 }}>
              <div className="space" style={{ alignItems: "flex-start" }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontWeight: 950, fontSize: 16, letterSpacing: "-0.01em" }}>
                    {c.dispatcherName ? c.dispatcherName : "Dispatcher"}{" "}
                    <span className="small" style={{ opacity: 0.8 }}>
                      • {c.company ?? "—"}
                    </span>
                  </div>

                  <div className="small" style={{ opacity: 0.9 }}>
                    <b>Dispatcher ID:</b> {c.dispatcherId}
                  </div>

                  <div className="small" style={{ opacity: 0.9 }}>
                    <b>Requested by UID:</b> {c.createdBy}
                  </div>

                  <div className="small" style={{ opacity: 0.9 }}>
                    <b>Email:</b> {c.email ?? "—"}{" "}
                    <span style={{ margin: "0 8px", opacity: 0.6 }}>•</span>
                    <b>Phone:</b> {c.phone ?? "—"}
                  </div>

                  <div className="small" style={{ opacity: 0.9 }}>
                    <b>Role:</b> {c.role ?? "—"}
                  </div>

                  <div className="small" style={{ opacity: 0.9, whiteSpace: "pre-wrap" }}>
                    <b>Notes:</b> {c.notes ?? "—"}
                  </div>

                  <div className="row" style={{ gap: 10, flexWrap: "wrap", marginTop: 6 }}>
                    <span className="badge">Status: {c.status ?? "pending"}</span>
                    {c.createdAt ? <span className="badge">Created: {fmtTime(c.createdAt)}</span> : null}
                  </div>
                </div>

                <div style={{ display: "grid", gap: 8, minWidth: 180 }}>
                  <button className="btn" disabled={busy} onClick={() => onApprove(c)} type="button">
                    {busy ? "Working..." : "Approve"}
                  </button>
                  <button
                    className="btn secondary"
                    disabled={busy}
                    onClick={() => onReject(c)}
                    type="button"
                  >
                    {busy ? "Working..." : "Reject"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}