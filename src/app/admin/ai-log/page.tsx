"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listenToAuth, isAdmin } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { listAIAlerts, type AIAlertRecord } from "@/lib/aiAlerts";
import { useToast } from "@/components/ToastProvider";

function formatDate(value: any) {
  try {
    if (!value) return "—";
    if (typeof value?.toDate === "function") {
      return value.toDate().toLocaleString();
    }
    if (typeof value?.seconds === "number") {
      return new Date(value.seconds * 1000).toLocaleString();
    }
    return String(value);
  } catch {
    return "—";
  }
}

export default function AdminAILogPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AIAlertRecord[]>([]);

  async function load() {
    setLoading(true);

    try {
      const data = await listAIAlerts({ limitCount: 200 });
      setRows(data);
    } catch (e: any) {
      console.error(e);
      showToast({
        tone: "error",
        title: "Failed to load AI audit log",
        message: e?.message ?? "Something went wrong.",
      });
      setRows([]);
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
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h1 className="h1" style={{ marginBottom: 6 }}>
            AI Audit Log
          </h1>
          <div className="small" style={{ opacity: 0.92 }}>
            Review AI flag history, admin overrides, and trust-layer changes.
          </div>
        </div>

        <div className="row wrap" style={{ gap: 10 }}>
          <Link className="btn secondary" href="/admin/ai-flags">
            Back to AI Flags
          </Link>
          <button className="btn secondary" type="button" onClick={load} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="small" style={{ marginTop: 16 }}>
          Loading audit log…
        </div>
      ) : rows.length === 0 ? (
        <div className="card" style={{ padding: 16, marginTop: 14 }}>
          <div style={{ fontWeight: 900 }}>No audit entries yet</div>
          <div className="small" style={{ marginTop: 6 }}>
            AI override and trust-layer events will appear here.
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          {rows.map((row) => (
            <div key={row.id} className="card" style={{ padding: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ fontWeight: 900, fontSize: 16 }}>{row.title}</div>

                  <div className="small" style={{ marginTop: 6 }}>
                    {row.message}
                  </div>

                  <div className="row wrap" style={{ gap: 8, marginTop: 10 }}>
                    <span className="badge">Action: {row.action}</span>
                    <span className="badge">Entity: {row.entityType}</span>
                    <span className="badge">Severity: {row.severity}</span>
                  </div>

                  <div className="small" style={{ marginTop: 10 }}>
                    <b>Actor:</b> {row.actorEmail || row.actorUid || "System"}
                  </div>

                  <div className="small" style={{ marginTop: 4 }}>
                    <b>Target:</b> {row.targetEmail || row.targetUid || row.entityId}
                  </div>

                  <div className="small" style={{ marginTop: 4 }}>
                    <b>Created:</b> {formatDate(row.createdAt)}
                  </div>

                  {row.metadata ? (
                    <pre
                      style={{
                        marginTop: 10,
                        padding: 12,
                        borderRadius: 12,
                        overflowX: "auto",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        fontSize: 12,
                      }}
                    >
                      {JSON.stringify(row.metadata, null, 2)}
                    </pre>
                  ) : null}
                </div>

                <div style={{ minWidth: 180 }}>
                  {row.entityType === "dispatcher" ? (
                    <Link className="btn secondary" href={`/dispatchers/${row.entityId}`}>
                      Open Dispatcher
                    </Link>
                  ) : (
                    <span className="badge">No direct link</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}