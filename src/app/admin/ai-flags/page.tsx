"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { listenToAuth, isAdmin, getCurrentUser } from "@/lib/auth";
import { useToast } from "@/components/ToastProvider";
import {
  listDispatchers,
  listOpenReports,
  type Dispatcher,
  type Report,
} from "@/lib/firestore";
import { calculateAIRisk } from "@/lib/aiRisk";
import {
  clearAIFlagAdminOverride,
  setAIFlagAdminOverride,
} from "@/lib/aiFlagger";
import AIRiskBadge from "@/components/ui/AIRiskBadge";
import UserRolePills from "@/components/ui/UserRolePills";

type DispatcherRiskResult = {
  score: number;
  level: "low" | "medium" | "high" | "critical";
  reasons: string[];
  confidence: number;
  openReports: number;
  confirmedReports: number;
  avgRating: number;
  reviewCount: number;
};

type Row = {
  dispatcher: Dispatcher;
  risk: DispatcherRiskResult;
};

function safeNum(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getOpenReportCount(reports: Report[], dispatcherId: string) {
  return reports.filter((r: any) => r?.dispatcherId === dispatcherId).length;
}

function getAccountAgeDays(createdAt: any) {
  try {
    if (!createdAt) return 30;

    if (typeof createdAt?.toDate === "function") {
      const created = createdAt.toDate().getTime();
      return Math.max(1, Math.floor((Date.now() - created) / 86400000));
    }

    if (typeof createdAt?.seconds === "number") {
      const created = createdAt.seconds * 1000;
      return Math.max(1, Math.floor((Date.now() - created) / 86400000));
    }

    return 30;
  } catch {
    return 30;
  }
}

function getDispatcherRisk(dispatcher: Dispatcher, reports: Report[]): DispatcherRiskResult {
  const d = dispatcher as any;

  const reviewCount = safeNum(d.reviewCount, 0);
  const ratingSum = safeNum(d.ratingSum, 0);
  const avgRating =
    reviewCount > 0 ? ratingSum / reviewCount : safeNum(d.rating, 0);

  const openReports = getOpenReportCount(reports, dispatcher.id);
  const confirmedReports = safeNum(d.confirmedReportCount, 0);

  const recentNegativeReviews =
    avgRating > 0 && avgRating <= 2.5 && reviewCount >= 2 ? 2 : 0;

  const ai = calculateAIRisk({
    avgRating,
    reviewCount,
    confirmedReports,
    openReports,
    recentNegativeReviews,
    verified: !!d.verified,
    accountAgeDays: getAccountAgeDays(d.createdAt),
  });

  return {
    score: ai.score,
    level: ai.level,
    reasons: ai.signals,
    confidence: ai.confidence,
    openReports,
    confirmedReports,
    avgRating,
    reviewCount,
  };
}

export default function AdminAIFlagsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [dispatchers, setDispatchers] = useState<Dispatcher[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [q, setQ] = useState("");
  const [showOnlyOverrides, setShowOnlyOverrides] = useState(false);

  async function load() {
    setLoading(true);

    try {
      const [dispatcherRows, openReportRows] = await Promise.all([
        listDispatchers({ limit: 500 }),
        listOpenReports({ limit: 500 }),
      ]);

      setDispatchers(dispatcherRows ?? []);
      setReports(openReportRows ?? []);
    } catch (e: any) {
      console.error(e);
      showToast({
        tone: "error",
        title: "Failed to load AI flags",
        message: e?.message ?? "Something went wrong.",
      });
      setDispatchers([]);
      setReports([]);
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

  const rows = useMemo<Row[]>(() => {
    const needle = q.trim().toLowerCase();

    return (dispatchers ?? [])
      .map((dispatcher) => ({
        dispatcher,
        risk: getDispatcherRisk(dispatcher, reports),
      }))
      .filter(({ dispatcher, risk }) => {
        const d = dispatcher as any;

        const isRelevant =
          d.aiFlagged === true ||
          d.aiOverrideEnabled === true ||
          risk.level === "high" ||
          risk.level === "critical";

        if (!isRelevant) return false;
        if (showOnlyOverrides && d.aiOverrideEnabled !== true) return false;

        if (!needle) return true;

        const hay = [
          dispatcher.name ?? "",
          dispatcher.company ?? "",
          d.aiRiskLevel ?? "",
          String(d.aiRiskScore ?? risk.score),
          ...(Array.isArray(d.aiSignals) ? d.aiSignals : []),
          d.aiOverrideNote ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return hay.includes(needle);
      })
      .sort((a, b) => {
        const da = a.dispatcher as any;
        const db = b.dispatcher as any;

        const scoreA = safeNum(da.aiRiskScore, a.risk.score);
        const scoreB = safeNum(db.aiRiskScore, b.risk.score);

        return scoreB - scoreA;
      });
  }, [dispatchers, reports, q, showOnlyOverrides]);

  async function forceFlag(dispatcher: Dispatcher, forcedFlagged: boolean) {
    const note =
      window.prompt(
        forcedFlagged
          ? "Why are you forcing this dispatcher to stay AI flagged?"
          : "Why are you clearing this dispatcher from AI flagged state?"
      ) ?? "";

    try {
      setBusyId(dispatcher.id);

      const current = getCurrentUser();
      const d = dispatcher as any;

      await setAIFlagAdminOverride({
        dispatcherId: dispatcher.id,
        forcedFlagged,
        overrideNote: note,
        actorUid: current?.uid,
        actorEmail: current?.email ?? "",
        targetName: d.name ?? "",
        targetEmail: d.email ?? "",
      });

      await load();

      showToast({
        tone: "success",
        title: forcedFlagged ? "AI flag forced on" : "AI flag forced off",
        message: "Admin override saved.",
      });
    } catch (e: any) {
      console.error(e);
      showToast({
        tone: "error",
        title: "Override failed",
        message: e?.message ?? "Something went wrong.",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function clearOverride(dispatcher: Dispatcher) {
    try {
      setBusyId(dispatcher.id);

      const current = getCurrentUser();
      const d = dispatcher as any;

      await clearAIFlagAdminOverride({
        dispatcherId: dispatcher.id,
        actorUid: current?.uid,
        actorEmail: current?.email ?? "",
        targetName: d.name ?? "",
        targetEmail: d.email ?? "",
      });

      await load();

      showToast({
        tone: "success",
        title: "Override cleared",
        message: "Dispatcher will return to normal AI evaluation.",
      });
    } catch (e: any) {
      console.error(e);
      showToast({
        tone: "error",
        title: "Failed to clear override",
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
            Admin AI Flags
          </h1>
          <div className="small" style={{ opacity: 0.92 }}>
            Review AI-flagged dispatchers and manually override flag behavior.
          </div>
        </div>

        <div className="row wrap" style={{ gap: 10 }}>
          <Link className="btn secondary" href="/admin/ai-log">
            Open AI Audit Log
          </Link>
          <button className="btn secondary" type="button" onClick={load} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <div className="row wrap" style={{ gap: 10, alignItems: "center" }}>
          <input
            className="input"
            style={{ maxWidth: 420 }}
            placeholder="Search dispatcher, company, AI notes..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <label className="row" style={{ gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={showOnlyOverrides}
              onChange={(e) => setShowOnlyOverrides(e.target.checked)}
            />
            <span className="small">Only admin overrides</span>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="small" style={{ marginTop: 16 }}>
          Loading AI flags…
        </div>
      ) : rows.length === 0 ? (
        <div className="card" style={{ padding: 16, marginTop: 14 }}>
          <div style={{ fontWeight: 900 }}>No AI flag cases found</div>
          <div className="small" style={{ marginTop: 6 }}>
            High-risk or overridden dispatcher profiles will appear here.
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          {rows.map(({ dispatcher, risk }, index) => {
            const d = dispatcher as any;
            const displayScore = safeNum(d.aiRiskScore, risk.score);
            const displayLevel =
              (d.aiRiskLevel as "low" | "medium" | "high" | "critical" | undefined) ??
              risk.level;

            const displaySignals =
              Array.isArray(d.aiSignals) && d.aiSignals.length > 0
                ? d.aiSignals
                : risk.reasons;

            const overrideEnabled = d.aiOverrideEnabled === true;
            const overrideFlagged = d.aiOverrideFlagged === true;

            return (
              <div key={dispatcher.id} className="card" style={{ padding: 16 }}>
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
                      <span className="chip">#{index + 1}</span>

                      <Link
                        href={`/dispatchers/${dispatcher.id}`}
                        style={{
                          fontWeight: 900,
                          fontSize: 18,
                          textDecoration: "underline",
                          textUnderlineOffset: 3,
                        }}
                      >
                        {dispatcher.name || "Unnamed Dispatcher"}
                      </Link>

                      <UserRolePills
                        profile={{
                          platformRole: "user",
                          verificationStatus: d.verified ? "verified" : "unverified",
                          tier: (d.tier ?? "tier1") as "tier1" | "tier2" | "tier3",
                          driverType: null,
                          accountType: "dispatcher",
                        }}
                      />

                      {d.aiFlagged === true ? (
                        <span
                          className="badge"
                          style={{
                            background: "rgba(255, 68, 68, 0.16)",
                            border: "1px solid rgba(255, 68, 68, 0.34)",
                            color: "#ffb0b0",
                            fontWeight: 800,
                          }}
                        >
                          AI FLAGGED
                        </span>
                      ) : null}

                      {overrideEnabled ? (
                        <span className="badge">ADMIN OVERRIDE</span>
                      ) : null}
                    </div>

                    <div className="small" style={{ marginTop: 4 }}>
                      {dispatcher.company || "—"}
                    </div>

                    <div className="row wrap" style={{ gap: 8, marginTop: 10 }}>
                      <AIRiskBadge level={displayLevel} score={displayScore} />
                      <span className="badge">
                        Confidence: {(risk.confidence * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div className="small" style={{ marginTop: 10 }}>
                      Confirmed reports: {risk.confirmedReports} · Open reports: {risk.openReports} ·
                      Reviews: {risk.reviewCount} · Avg rating:{" "}
                      {risk.reviewCount ? risk.avgRating.toFixed(1) : "—"}
                    </div>

                    <div className="small" style={{ marginTop: 10, opacity: 0.95, color: "#ffcc66" }}>
                      AI Signals:{" "}
                      {displaySignals.length ? displaySignals.join(" • ") : "No strong AI signals"}
                    </div>

                    {overrideEnabled ? (
                      <div className="small" style={{ marginTop: 10 }}>
                        <b>Override state:</b>{" "}
                        {overrideFlagged ? "Forced flagged" : "Forced cleared"}
                        {d.aiOverrideNote ? (
                          <>
                            <br />
                            <b>Admin note:</b> {d.aiOverrideNote}
                          </>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <div style={{ minWidth: 240, display: "grid", gap: 10 }}>
                    <button
                      className="btn"
                      type="button"
                      disabled={busyId === dispatcher.id}
                      onClick={() => forceFlag(dispatcher, true)}
                    >
                      {busyId === dispatcher.id ? "Working..." : "Force AI Flag"}
                    </button>

                    <button
                      className="btn secondary"
                      type="button"
                      disabled={busyId === dispatcher.id}
                      onClick={() => forceFlag(dispatcher, false)}
                    >
                      {busyId === dispatcher.id ? "Working..." : "Force Clear Flag"}
                    </button>

                    <button
                      className="btn secondary"
                      type="button"
                      disabled={busyId === dispatcher.id || !overrideEnabled}
                      onClick={() => clearOverride(dispatcher)}
                    >
                      {busyId === dispatcher.id ? "Working..." : "Clear Override"}
                    </button>

                    <Link className="btn secondary" href={`/dispatchers/${dispatcher.id}`}>
                      View Profile
                    </Link>
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