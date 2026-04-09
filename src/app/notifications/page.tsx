"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCurrentUser, listenToAuth } from "@/lib/auth";
import { useToast } from "@/components/ToastProvider";
import {
  listNotificationsByUser,
  markNotificationRead,
  markAllNotificationsRead,
  type AppNotification,
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

export default function NotificationsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const initialUser = useMemo(() => getCurrentUser(), []);
  const [uid, setUid] = useState<string | null>(initialUser?.uid ?? null);
  const [authReady, setAuthReady] = useState<boolean>(!!initialUser);

  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = listenToAuth((u) => {
      setAuthReady(true);

      if (!u) {
        setUid(null);
        router.push("/login");
        return;
      }

      setUid(u.uid);
    });

    return () => unsub();
  }, [router]);

  async function load(userId?: string | null) {
    const targetUid = userId ?? uid;
    if (!targetUid) return;

    setLoading(true);
    try {
      const rows = await listNotificationsByUser(targetUid, { limit: 200 });
      setItems(rows ?? []);
    } catch (e: any) {
      console.error(e);
      showToast({
        tone: "error",
        title: "Failed to load notifications",
        message: e?.message ?? "Something went wrong.",
      });
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!uid) return;
    load(uid);
  }, [uid]);

  async function handleMarkAllRead() {
    try {
      setBusy(true);
      await markAllNotificationsRead();
      await load();
      showToast({
        tone: "success",
        title: "Notifications updated",
        message: "All notifications were marked as read.",
      });
    } catch (e: any) {
      console.error(e);
      showToast({
        tone: "error",
        title: "Failed to update notifications",
        message: e?.message ?? "Something went wrong.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleMarkOneRead(id: string) {
    try {
      setBusyId(id);
      await markNotificationRead(id);
      await load();
      showToast({
        tone: "success",
        title: "Notification marked read",
      });
    } catch (e: any) {
      console.error(e);
      showToast({
        tone: "error",
        title: "Failed to update notification",
        message: e?.message ?? "Something went wrong.",
      });
    } finally {
      setBusyId(null);
    }
  }

  if (!authReady) {
    return (
      <div className="container">
        <div className="small">Checking session…</div>
      </div>
    );
  }

  if (!uid) {
    return (
      <div className="container">
        <div className="small">Redirecting to login…</div>
      </div>
    );
  }

  const unreadCount = items.filter((x) => !x.read).length;

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
            Notifications
          </h1>
          <div className="small" style={{ opacity: 0.9 }}>
            Keep track of new leads, claim updates, and system activity.
          </div>
        </div>

        <div className="row wrap" style={{ gap: 10 }}>
          <span className="badge">Unread: {unreadCount}</span>

          <button
            className="btn secondary"
            type="button"
            disabled={busy || unreadCount === 0}
            onClick={handleMarkAllRead}
          >
            {busy ? "Working..." : "Mark all read"}
          </button>

          <button
            className="btn secondary"
            type="button"
            onClick={() => load()}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="small" style={{ marginTop: 16 }}>
          Loading notifications…
        </div>
      ) : items.length === 0 ? (
        <div className="card" style={{ padding: 16, marginTop: 14 }}>
          <div style={{ fontWeight: 900 }}>No notifications yet</div>
          <div className="small" style={{ marginTop: 6 }}>
            When you receive leads or claim decisions, they’ll appear here.
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
          {items.map((n) => {
            const working = busyId === n.id;

            return (
              <div
                key={n.id}
                className="card"
                style={{
                  padding: 14,
                  border: !n.read ? "1px solid rgba(79,109,245,0.45)" : undefined,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "grid", gap: 6, flex: 1 }}>
                    <div className="row wrap" style={{ gap: 8, alignItems: "center" }}>
                      <div style={{ fontWeight: 900 }}>{n.title}</div>
                      {!n.read ? (
                        <span className="badge verified">New</span>
                      ) : (
                        <span className="badge">Read</span>
                      )}
                    </div>

                    <div className="small" style={{ whiteSpace: "pre-wrap" }}>
                      {n.body}
                    </div>

                    <div className="small" style={{ opacity: 0.8 }}>
                      {fmtTime(n.createdAt)}
                    </div>
                  </div>

                  <div className="row wrap" style={{ gap: 10 }}>
                    {n.href ? (
                      <Link
                        className="btn secondary"
                        href={n.href}
                        onClick={async () => {
                          if (!n.read) {
                            try {
                              await markNotificationRead(n.id);
                            } catch {}
                          }
                        }}
                      >
                        Open
                      </Link>
                    ) : null}

                    {!n.read ? (
                      <button
                        className="btn"
                        type="button"
                        disabled={working}
                        onClick={() => handleMarkOneRead(n.id)}
                      >
                        {working ? "Working..." : "Mark read"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}