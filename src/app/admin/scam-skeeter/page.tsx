"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { listenToAuth, isAdmin } from "@/lib/auth";
import { useToast } from "@/components/ToastProvider";
import {
  listDispatchers,
  listOpenReports,
  type Dispatcher,
  type Report,
} from "@/lib/firestore";
import ScamRiskBadge from "@/components/ScamRiskBadge";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import { calculateScamScore, type ScamResult } from "@/lib/scamSkeeter";

type RiskFilter = "all" | ScamResult["level"];

function getDispatcherAvg(dispatcher: Dispatcher) {
  const reviewCount = Number(dispatcher.reviewCount ?? 0);
  const ratingSum = Number(dispatcher.ratingSum ?? 0);
  if (!reviewCount) return 0;
  return ratingSum / reviewCount;
}

function buildOpenReportCountMap(reports: Report[]) {
  const map: Record<string, number> = {};

  for (const report of reports) {
    const dispatcherId = report.dispatcherId;
    if (!dispatcherId) continue;
    map[dispatcherId] = (map[dispatcherId] ?? 0) + 1;
  }

  return map;
}

type RankedDispatcher = {
  dispatcher: Dispatcher;
  risk: ScamResult;
  avgRating: number;
  reviewCount: number;
  openReports: number;
  confirmedReportCount: number;
  communityAlert: boolean;
};

export default function AdminScamSkeeterPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);

  const [dispatchers, setDispatchers] = useState<Dispatcher[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  const [q, setQ] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");

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
        title: "Failed to load Scam Skeeter",
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

  const openReportMap = useMemo(() => buildOpenReportCountMap(reports), [reports]);

  const ranked = useMemo<RankedDispatcher[]>(() => {
    const needle = q.trim().toLowerCase();

    const rows: RankedDispatcher[] = dispatchers.map((dispatcher) => {
      const avgRating = getDispatcherAvg(dispatcher);
      const reviewCount = Number(dispatcher.reviewCount ?? 0);
      const openReports = Number(openReportMap[dispatcher.id] ?? 0);
      const confirmedReportCount = Number((dispatcher as any).confirmedReportCount ?? 0);
      const reportCount = Math.max(
        Number((dispatcher as any).reportCount ?? 0),
        confirmedReportCount + openReports
      );
      const communityAlert = (dispatcher as any).communityAlert === true;

      const risk = calculateScamScore({
        avgRating,
        reviewCount,
        reportCount,
        recentNegativeReviews: avgRating <= 2.5 && reviewCount >= 2 ? 2 : 0,
        verified: !!dispatcher.verified,
      });

      return {
        dispatcher,
        risk,
        avgRating,
        reviewCount,
        openReports,
        confirmedReportCount,
        communityAlert,
      };
    });

    return rows
      .filter((row) => {
        if (riskFilter !== "all" && row.risk.level !== riskFilter) return false;
        if (!needle) return true;

        const hay =
          `${row.dispatcher.name ?? ""} ${row.dispatcher.company ?? ""} ${row.risk.level} ${row.risk.score}`
            .toLowerCase();

        return hay.includes(needle);
      })
      .sort((a, b) => {
        if (b.risk.score !== a.risk.score) return b.risk.score - a.risk.score;
        if (b.confirmedReportCount !== a.confirmedReportCount) {
          return b.confirmedReportCount - a.confirmedReportCount;
        }
        if (b.openReports !== a.openReports) return b.openReports - a.openReports;
        return b.reviewCount - a.reviewCount;
      });
  }, [dispatchers, openReportMap, q, riskFilter]);

  const totals = useMemo(() => {
    let danger = 0;
    let warning = 0;
    let safe = 0;

    for (const dispatcher of dispatchers) {
      const avgRating = getDispatcherAvg(dispatcher);
      const reviewCount = Number(dispatcher.reviewCount ?? 0);
      const openReports = Number(openReportMap[dispatcher.id] ?? 0);
      const confirmedReportCount = Number((dispatcher as any).confirmedReportCount ?? 0);
      const reportCount = Math.max(
        Number((dispatcher as any).reportCount ?? 0),
        confirmedReportCount + openReports
      );

      const risk = calculateScamScore({
        avgRating,
        reviewCount,
        reportCount,
        recentNegativeReviews: avgRating <= 2.5 && reviewCount >= 2 ? 2 : 0,
        verified: !!dispatcher.verified,
      });

      if (risk.level === "danger") danger++;
      else if (risk.level === "warning") warning++;
      else safe++;
    }

    return { danger, warning, safe };
  }, [dispatchers, openReportMap]);

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
            Scam Skeeter
          </h1>
          <div className="small" style={{ opacity: 0.92 }}>
            Internal fraud-risk dashboard based on reports, verification,
            and reputation signals.
          </div>
        </div>

        <div className="row wrap" style={{ gap: 10 }}>
          <Link className="btn secondary" href="/admin/reports">
            Admin Reports
          </Link>
          <button
            className="btn secondary"
            type="button"
            onClick={load}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          marginTop: 14,
        }}
      >
        <div className="card pad">
          <div className="small muted">Danger</div>
          <div className="h2" style={{ marginTop: 6 }}>{totals.danger}</div>
        </div>

        <div className="card pad">
          <div className="small muted">Warning</div>
          <div className="h2" style={{ marginTop: 6 }}>{totals.warning}</div>
        </div>

        <div className="card pad">
          <div className="small muted">Safe</div>
          <div className="h2" style={{ marginTop: 6 }}>{totals.safe}</div>
        </div>

        <div className="card pad">
          <div className="small muted">Open reports</div>
          <div className="h2" style={{ marginTop: 6 }}>{reports.length}</div>
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>Filters</div>

        <div className="row wrap" style={{ gap: 10 }}>
          <input
            className="input"
            style={{ maxWidth: 320 }}
            placeholder="Search dispatcher or company..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <select
            className="input"
            style={{ width: 220 }}
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value as RiskFilter)}
          >
            <option value="all">All risk levels</option>
            <option value="danger">Danger</option>
            <option value="warning">Warning</option>
            <option value="safe">Safe</option>
          </select>

          <div className="small" style={{ marginLeft: "auto", opacity: 0.9 }}>
            Showing <b>{ranked.length}</b> dispatchers
          </div>
        </div>
      </div>

      {loading ? (
        <div className="small" style={{ marginTop: 16 }}>Loading Scam Skeeter…</div>
      ) : ranked.length === 0 ? (
        <div className="card" style={{ padding: 16, marginTop: 14 }}>
          <div style={{ fontWeight: 900 }}>No matching dispatchers</div>
          <div className="small" style={{ marginTop: 6 }}>
            Try clearing filters or adding more dispatcher data.
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          {ranked.map(({ dispatcher: d, risk, avgRating, reviewCount, openReports, confirmedReportCount, communityAlert }, index) => (
            <div key={d.id} className="card" style={{ padding: 16 }}>
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
                    <div style={{ fontWeight: 900, fontSize: 18 }}>
                      {d.name || "Dispatcher"}
                    </div>

                    {d.verified ? (
                      <VerifiedBadge variant="verified" compact />
                    ) : (
                      <span className="badge">Unverified</span>
                    )}
                  </div>

                  <div className="small" style={{ marginTop: 4 }}>
                    {d.company || "—"}
                  </div>

                  <div className="row wrap" style={{ gap: 8, marginTop: 12 }}>
                    <span className="badge">
                      Confirmed reports: {confirmedReportCount}
                    </span>

                    <span className="badge">
                      Open reports: {openReports}
                    </span>

                    <span className="badge">
                      Reviews: {reviewCount}
                    </span>

                    <span className="badge">
                      Avg rating: {reviewCount ? avgRating.toFixed(1) : "—"}
                    </span>

                    {communityAlert ? (
                      <span className="chip bad">Community Alert</span>
                    ) : null}
                  </div>

                  <div className="small" style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>
                    <b>Why flagged:</b>
                    <div style={{ marginTop: 6 }}>
                      {risk.reasons.length
                        ? risk.reasons.join(", ")
                        : "No major scam signals detected."}
                    </div>
                  </div>
                </div>

                <div style={{ minWidth: 260, display: "grid", gap: 10 }}>
                  <ScamRiskBadge score={risk.score} level={risk.level} />

                  <Link className="btn secondary" href={`/dispatchers/${d.id}`}>
                    View profile
                  </Link>

                  <Link className="btn secondary" href="/admin/reports">
                    Open admin reports
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