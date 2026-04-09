"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { listenToAuth, isAdmin } from "@/lib/auth";
import { useToast } from "@/components/ToastProvider";
import {
  confirmBrokerReport,
  dismissBrokerReport,
  listOpenBrokerReports,
  type BrokerReport,
} from "@/lib/brokers";

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

export default function AdminBrokerReportsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<BrokerReport[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [autoAlert, setAutoAlert] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const rows = await listOpenBrokerReports({ limit: 200 });
      setItems(rows);
    } catch (e: any) {
      console.error(e);
      showToast({
        tone: "error",
        title: "Failed to load broker reports",
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
        const ok = await isAdmin(true);
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

  async function handleConfirm(item: BrokerReport) {
    try {
      setBusyId(item.id);

      await confirmBrokerReport({
        reportId: item.id,
        brokerId: item.brokerId,
        enableCommunityAlert: autoAlert,
      });

      setItems((prev) => prev.filter((x) => x.id !== item.id));

      showToast({
        tone: "success",
        title: "Broker report confirmed",
        message: autoAlert
          ? "Broker report confirmed and community alert enabled."
          : "Broker report confirmed.",
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

  async function handleDismiss(item: BrokerReport) {
    try {
      setBusyId(item.id);

      await dismissBrokerReport(item.id);

      setItems((prev) => prev.filter((x) => x.id !== item.id));

      showToast({
        tone: "success",
        title: "Broker report dismissed",
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
            Admin Broker Reports
          </h1>
          <div className="small" style={{ opacity: 0.92 }}>
            Review dirty broker reports and moderate the broker watchlist.
          </div>
        </div>

        <div className="row wrap" style={{ gap: 10 }}>
          <span className="badge">Open: {count}</span>

          <button className="btn secondary" type="button" onClick={load} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <Link className="btn secondary" href="/broker-watchlist">
            Broker Watchlist
          </Link>
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <label className="row" style={{ gap: 10, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={autoAlert}
            onChange={(e) => setAutoAlert(e.target.checked)}
          />
          <span className="small">
            Enable community alert automatically when confirming a broker report
          </span>
        </label>
      </div>

      {loading ? (
        <div className="small" style={{ marginTop: 16 }}>
          Loading broker reports…
        </div>
      ) : items.length === 0 ? (
        <div className="card" style={{ padding: 16, marginTop: 14 }}>
          <div style={{ fontWeight: 900 }}>No open broker reports</div>
          <div className="small" style={{ marginTop: 6 }}>
            New dirty broker reports will appear here.
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
                    {item.brokerName || "Broker"}
                  </div>

                  <div className="small" style={{ marginTop: 4 }}>
                    Broker ID: {item.brokerId}
                  </div>

                  <div style={{ display: "grid", gap: 6, marginTop: 12 }}>
                    <div className="small">
                      <b>Reason:</b> {item.reason}
                    </div>

                    {item.details ? (
                      <div className="small" style={{ whiteSpace: "pre-wrap" }}>
                        <b>Details:</b> {item.details}
                      </div>
                    ) : null}

                    <div className="small">
                      <b>Status:</b> {item.status}
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
                    {busyId === item.id ? "Working..." : "Confirm Dirty Broker"}
                  </button>

                  <button
                    className="btn secondary"
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => handleDismiss(item)}
                  >
                    {busyId === item.id ? "Working..." : "Dismiss"}
                  </button>

                  <Link className="btn secondary" href={`/brokers/${item.brokerId}`}>
                    View Broker
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