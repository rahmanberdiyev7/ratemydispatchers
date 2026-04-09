"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  createBrokerReport,
  getBroker,
  listReportsForBroker,
  type Broker,
  type BrokerReport,
} from "@/lib/brokers";
import {
  createBrokerReview,
  listBrokerReviewsForBroker,
  type BrokerReview,
} from "@/lib/brokerReviews";
import { assessBrokerRisk } from "@/lib/brokerRisk";
import { useToast } from "@/components/ToastProvider";
import UserRolePills from "@/components/ui/UserRolePills";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function avgFromReviews(reviews: BrokerReview[]) {
  const visible = reviews.filter((r) => !r.hidden);
  if (!visible.length) return 0;
  const sum = visible.reduce((acc, r) => acc + Number(r.rating ?? 0), 0);
  return sum / visible.length;
}

function Stars({ rating }: { rating: number }) {
  const rounded = clamp(Math.round(rating), 0, 5);
  return (
    <span aria-label={`${rating.toFixed(1)} out of 5`} title={`${rating.toFixed(1)}/5`}>
      {"★★★★★".slice(0, rounded)}
      {"☆☆☆☆☆".slice(0, 5 - rounded)}
    </span>
  );
}

export default function BrokerProfilePage() {
  const params = useParams();
  const { showToast } = useToast();

  const id = useMemo(() => {
    const raw = params?.id;
    return typeof raw === "string" ? raw : "";
  }, [params]);

  const [broker, setBroker] = useState<Broker | null>(null);
  const [reports, setReports] = useState<BrokerReport[]>([]);
  const [reviews, setReviews] = useState<BrokerReview[]>([]);
  const [loading, setLoading] = useState(true);

  const [reviewRating, setReviewRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);

  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [reporting, setReporting] = useState(false);

  async function load() {
    if (!id) return;
    setLoading(true);

    try {
      const [brokerRow, reportRows, reviewRows] = await Promise.all([
        getBroker(id),
        listReportsForBroker(id, { limit: 100 }),
        listBrokerReviewsForBroker(id, { limit: 100 }),
      ]);

      setBroker(brokerRow);
      setReports(reportRows);
      setReviews(reviewRows);
    } catch (e) {
      console.error(e);
      setBroker(null);
      setReports([]);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function onSubmitReport() {
    if (!broker) return;

    const user = getCurrentUser();
    const cleanReason = reason.trim();
    const cleanDetails = details.trim();

    if (!cleanReason) {
      showToast({
        tone: "error",
        title: "Reason required",
        message: "Write a short reason first.",
      });
      return;
    }

    setReporting(true);
    try {
      await createBrokerReport({
        brokerId: broker.id,
        brokerName: broker.name,
        carrierUserId: user?.uid ?? "",
        reason: cleanReason,
        details: cleanDetails,
      });

      setReason("");
      setDetails("");
      await load();

      showToast({
        tone: "success",
        title: "Broker report submitted",
        message: "Your dirty broker report was submitted for review.",
      });
    } catch (e: any) {
      console.error(e);
      showToast({
        tone: "error",
        title: "Failed to submit report",
        message: e?.message ?? "Something went wrong.",
      });
    } finally {
      setReporting(false);
    }
  }

  async function onSubmitReview() {
    if (!broker) return;

    const user = getCurrentUser();
    if (!user) {
      showToast({
        tone: "error",
        title: "Login required",
        message: "Please sign in before posting a broker review.",
      });
      return;
    }

    const cleanComment = reviewComment.trim();
    if (!cleanComment) {
      showToast({
        tone: "error",
        title: "Review required",
        message: "Write your broker review first.",
      });
      return;
    }

    setReviewSaving(true);
    try {
      await createBrokerReview({
        brokerId: broker.id,
        rating: reviewRating,
        comment: cleanComment,
        createdBy: user.uid,
      });

      setReviewComment("");
      setReviewRating(5);
      await load();

      showToast({
        tone: "success",
        title: "Broker review posted",
        message: "Your review has been added.",
      });
    } catch (e: any) {
      console.error(e);
      showToast({
        tone: "error",
        title: "Failed to post review",
        message: e?.message ?? "Something went wrong.",
      });
    } finally {
      setReviewSaving(false);
    }
  }

  if (!id) {
    return (
      <div className="container">
        <div className="card" style={{ padding: 16 }}>
          Missing broker id
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container">
        <div className="small">Loading broker…</div>
      </div>
    );
  }

  if (!broker) {
    return (
      <div className="container">
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900 }}>Broker not found</div>
          <div style={{ marginTop: 12 }}>
            <Link href="/brokers" className="btn secondary">
              Back to Brokers
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const visibleReviews = reviews.filter((r) => !r.hidden);
  const avgRating = avgFromReviews(visibleReviews);
  const risk = assessBrokerRisk(broker, reports, reviews);

  return (
    <div className="container">
      <div className="row wrap" style={{ justifyContent: "space-between", gap: 10 }}>
        <Link href="/brokers" className="btn secondary">
          ← Back
        </Link>

        <Link href="/broker-watchlist" className="btn secondary">
          Broker Watchlist
        </Link>
      </div>

      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 14,
            flexWrap: "wrap",
            alignItems: "flex-start",
          }}
        >
          <div style={{ minWidth: 260, flex: 1 }}>
            <div style={{ fontWeight: 950, fontSize: 30, letterSpacing: "-0.02em", lineHeight: 1.15 }}>
              {broker.name}
            </div>

            <div className="small" style={{ marginTop: 6 }}>
              {broker.company}
            </div>

            <div className="row wrap" style={{ gap: 10, marginTop: 10 }}>
              <UserRolePills
                profile={{
                  platformRole: "broker",
                  verificationStatus: broker.verified ? "verified" : "unverified",
                  tier: (broker.tier as any) ?? "tier1",
                  driverType: null,
                }}
              />

              <span className="badge">
                <Stars rating={avgRating || 0} />
                <span style={{ marginLeft: 8 }}>
                  {visibleReviews.length ? avgRating.toFixed(1) : "—"}
                </span>
              </span>

              <span className="badge">{visibleReviews.length} reviews</span>
            </div>

            <div className="small" style={{ marginTop: 12 }}>
              MC: {broker.mcNumber || "—"} · DOT: {broker.dotNumber || "—"}
            </div>

            <div className="small" style={{ marginTop: 6 }}>
              Risk: {risk.score}/100 · Level: {risk.level}
            </div>

            <div className="small" style={{ marginTop: 6 }}>
              {risk.reasons.length ? risk.reasons.join(" • ") : "No major dirty broker signals detected."}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <h2 className="h2" style={{ margin: 0 }}>
          Leave a broker review
        </h2>

        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          <select
            className="input"
            style={{ width: 220 }}
            value={reviewRating}
            onChange={(e) => setReviewRating(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
          >
            <option value={5}>★★★★★ (5)</option>
            <option value={4}>★★★★☆ (4)</option>
            <option value={3}>★★★☆☆ (3)</option>
            <option value={2}>★★☆☆☆ (2)</option>
            <option value={1}>★☆☆☆☆ (1)</option>
          </select>

          <textarea
            className="input"
            style={{ minHeight: 120, paddingTop: 10 }}
            placeholder="Write your review about this broker…"
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
          />

          <div className="row wrap" style={{ justifyContent: "space-between", gap: 10 }}>
            <div className="small" style={{ opacity: 0.85 }}>
              Reviews should be factual and business-related.
            </div>

            <button className="btn" type="button" onClick={onSubmitReview} disabled={reviewSaving}>
              {reviewSaving ? "Posting..." : "Post review"}
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <h2 className="h2" style={{ margin: 0 }}>
          Report this broker
        </h2>

        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          <input
            className="input"
            placeholder="Reason (double brokering, non-payment, hostage load, etc.)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <textarea
            className="input"
            style={{ minHeight: 120, paddingTop: 10 }}
            placeholder="Add details..."
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />

          <div className="row wrap" style={{ justifyContent: "space-between", gap: 10 }}>
            <div className="small" style={{ opacity: 0.85 }}>
              Reports should be factual and business-related.
            </div>

            <button className="btn" type="button" onClick={onSubmitReport} disabled={reporting}>
              {reporting ? "Submitting..." : "Submit dirty broker report"}
            </button>
          </div>
        </div>
      </div>

      <h2 className="h2" style={{ marginTop: 18 }}>
        Broker Reviews
      </h2>

      <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
        {visibleReviews.map((r) => (
          <div key={r.id} className="card" style={{ padding: 14 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <div className="badge" style={{ width: "fit-content" }}>
                <Stars rating={Number(r.rating || 0)} />
                <span style={{ marginLeft: 8 }}>{r.rating}/5</span>
              </div>

              <div className="small" style={{ whiteSpace: "pre-wrap" }}>
                {r.comment}
              </div>
            </div>
          </div>
        ))}

        {visibleReviews.length === 0 ? (
          <div className="small" style={{ opacity: 0.9 }}>
            No reviews yet. Be the first.
          </div>
        ) : null}
      </div>

      <h2 className="h2" style={{ marginTop: 18 }}>
        Reports history
      </h2>

      <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
        {reports.length === 0 ? (
          <div className="small">No reports yet.</div>
        ) : (
          reports.map((r) => (
            <div key={r.id} className="card" style={{ padding: 12 }}>
              <div className="small">
                <b>{r.reason}</b> · {r.status}
              </div>
              {r.details ? (
                <div className="small" style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>
                  {r.details}
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}