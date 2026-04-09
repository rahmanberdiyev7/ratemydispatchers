"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCurrentUser, listenToAuth } from "@/lib/auth";
import { useToast } from "@/components/ToastProvider";
import {
  listMarketplaceLeadsForOwner,
  listMarketplaceLeadsBySender,
  updateMarketplaceLeadStatus,
  type MarketplaceLead,
  type MarketplaceLeadStatus,
} from "@/lib/firestore";

type ViewMode = "incoming" | "sent";

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

function statusTone(status: MarketplaceLeadStatus) {
  if (status === "new") return "good";
  if (status === "contacted") return "warn";
  return "bad";
}

export default function MyLeadsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const initialUser = useMemo(() => getCurrentUser(), []);
  const [uid, setUid] = useState<string | null>(initialUser?.uid ?? null);
  const [authReady, setAuthReady] = useState<boolean>(!!initialUser);

  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [view, setView] = useState<ViewMode>("incoming");
  const [q, setQ] = useState("");

  const [incoming, setIncoming] = useState<MarketplaceLead[]>([]);
  const [sent, setSent] = useState<MarketplaceLead[]>([]);

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

  async function load(userId: string) {
    setLoading(true);
    try {
      const [incomingRows, sentRows] = await Promise.all([
        listMarketplaceLeadsForOwner(userId, { limit: 300 }),
        listMarketplaceLeadsBySender(userId, { limit: 300 }),
      ]);

      setIncoming(incomingRows ?? []);
      setSent(sentRows ?? []);
    } catch (e: any) {
      console.error(e);
      showToast({
        tone: "error",
        title: "Failed to load leads",
        message: e?.message ?? "Something went wrong.",
      });
      setIncoming([]);
      setSent([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!uid) return;
    load(uid);
  }, [uid]);

  const activeItems = useMemo(() => {
    const rows = view === "incoming" ? incoming : sent;
    const needle = q.trim().toLowerCase();

    if (!needle) return rows;

    return rows.filter((x) => {
      const hay = [
        x.listingName,
        x.listingCompany,
        x.senderName,
        x.senderEmail,
        x.senderPhone ?? "",
        x.senderCompany ?? "",
        x.equipmentType ?? "",
        x.message,
        x.status,
      ]
        .join(" ")
        .toLowerCase();

      return hay.includes(needle);
    });
  }, [view, incoming, sent, q]);

  async function refreshCurrent() {
    if (!uid) return;
    await load(uid);
  }

  async function changeStatus(leadId: string, status: MarketplaceLeadStatus) {
    try {
      setBusyId(leadId);

      await updateMarketplaceLeadStatus(leadId, status);

      showToast({
        tone: "success",
        title: "Lead updated",
        message: `Lead status changed to "${status}".`,
      });

      await refreshCurrent();
    } catch (e: any) {
      console.error(e);
      showToast({
        tone: "error",
        title: "Failed to update lead",
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
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900 }}>Redirecting to login</div>
          <div className="small" style={{ marginTop: 6 }}>
            You need to be signed in to view your leads.
          </div>
        </div>
      </div>
    );
  }

  const incomingNewCount = incoming.filter((x) => x.status === "new").length;
  const sentCount = sent.length;

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
            My Leads
          </h1>
          <div className="small" style={{ opacity: 0.92 }}>
            Manage inbound marketplace leads and track the leads you’ve sent.
          </div>
        </div>

        <div className="row wrap" style={{ gap: 10 }}>
          <Link className="btn secondary" href="/marketplace">
            Marketplace
          </Link>
          <button
            className="btn secondary"
            type="button"
            onClick={refreshCurrent}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
          marginTop: 14,
        }}
      >
        <div className="card pad">
          <div className="small muted">Incoming leads</div>
          <div className="h2" style={{ marginTop: 6 }}>
            {incoming.length}
          </div>
          <div className="small" style={{ marginTop: 8 }}>
            New: <b>{incomingNewCount}</b>
          </div>
        </div>

        <div className="card pad">
          <div className="small muted">Sent leads</div>
          <div className="h2" style={{ marginTop: 6 }}>
            {sentCount}
          </div>
          <div className="small" style={{ marginTop: 8 }}>
            Your outbound marketplace interest.
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <div className="row wrap" style={{ gap: 10, alignItems: "center" }}>
          <button
            className={view === "incoming" ? "btn" : "btn secondary"}
            type="button"
            onClick={() => setView("incoming")}
          >
            Incoming ({incoming.length})
          </button>

          <button
            className={view === "sent" ? "btn" : "btn secondary"}
            type="button"
            onClick={() => setView("sent")}
          >
            Sent ({sent.length})
          </button>

          <input
            className="input"
            style={{ maxWidth: 320, marginLeft: "auto" }}
            placeholder="Search leads..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="small" style={{ marginTop: 16 }}>
          Loading leads…
        </div>
      ) : activeItems.length === 0 ? (
        <div className="card" style={{ padding: 16, marginTop: 14 }}>
          <div style={{ fontWeight: 900 }}>
            {view === "incoming" ? "No incoming leads yet" : "No sent leads yet"}
          </div>
          <div className="small" style={{ marginTop: 6 }}>
            {view === "incoming"
              ? "When users contact your marketplace listings, those leads will appear here."
              : "When you contact marketplace listings, those leads will appear here."}
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          {activeItems.map((lead) => {
            const working = busyId === lead.id;

            return (
              <div key={lead.id} className="card" style={{ padding: 16 }}>
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
                    <div className="row wrap" style={{ gap: 8, alignItems: "center" }}>
                      <div style={{ fontWeight: 900, fontSize: 18 }}>
                        {lead.listingName}
                      </div>
                      <span className={`chip ${statusTone(lead.status)}`}>
                        {lead.status}
                      </span>
                    </div>

                    <div className="small" style={{ marginTop: 4 }}>
                      {lead.listingCompany}
                    </div>

                    <div style={{ marginTop: 12, display: "grid", gap: 6 }}>
                      <div className="small">
                        <b>Name:</b> {lead.senderName}
                      </div>
                      <div className="small">
                        <b>Email:</b> {lead.senderEmail}
                      </div>

                      {lead.senderPhone ? (
                        <div className="small">
                          <b>Phone:</b> {lead.senderPhone}
                        </div>
                      ) : null}

                      {lead.senderCompany ? (
                        <div className="small">
                          <b>Company:</b> {lead.senderCompany}
                        </div>
                      ) : null}

                      {lead.equipmentType ? (
                        <div className="small">
                          <b>Equipment:</b> {lead.equipmentType}
                        </div>
                      ) : null}

                      <div className="small">
                        <b>Submitted:</b> {fmtTime(lead.createdAt)}
                      </div>
                    </div>

                    <div
                      className="small"
                      style={{
                        marginTop: 12,
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.45,
                      }}
                    >
                      <b>Message:</b>
                      <div style={{ marginTop: 6 }}>{lead.message}</div>
                    </div>
                  </div>

                  <div style={{ minWidth: 220, display: "grid", gap: 10 }}>
                    <Link className="btn secondary" href={`/marketplace/${lead.listingId}`}>
                      View listing
                    </Link>

                    {view === "incoming" ? (
                      <>
                        <button
                          className="btn secondary"
                          type="button"
                          disabled={working || lead.status === "contacted"}
                          onClick={() => changeStatus(lead.id, "contacted")}
                        >
                          {working ? "Working..." : "Mark contacted"}
                        </button>

                        <button
                          className="btn secondary"
                          type="button"
                          disabled={working || lead.status === "closed"}
                          onClick={() => changeStatus(lead.id, "closed")}
                        >
                          {working ? "Working..." : "Close lead"}
                        </button>

                        <button
                          className="btn"
                          type="button"
                          disabled={working || lead.status === "new"}
                          onClick={() => changeStatus(lead.id, "new")}
                        >
                          {working ? "Working..." : "Mark new"}
                        </button>
                      </>
                    ) : (
                      <div className="card" style={{ padding: 12 }}>
                        <div className="small">
                          <b>Status:</b> {lead.status}
                        </div>
                        <div className="small" style={{ marginTop: 8 }}>
                          This status is controlled by the listing owner.
                        </div>
                      </div>
                    )}
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