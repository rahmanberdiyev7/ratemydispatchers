"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import { db } from "@/lib/firebase";
import {
  getDispatcher,
  listReviewsForDispatcher,
  createReport,
  type Dispatcher,
  type Review,
} from "@/lib/firestore";
import { getCurrentUser } from "@/lib/auth";
import { useToast } from "@/components/ToastProvider";
import TrustBadge from "@/components/TrustBadge";
import ScamRiskBadge from "@/components/ScamRiskBadge";
import VerifiedBadge from "../../../components/ui/VerifiedBadge";
import { calculateScamScore } from "@/lib/scamSkeeter";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function avgFromReviews(reviews: Review[]) {
  if (!reviews.length) return 0;
  const sum = reviews.reduce((acc, r) => acc + Number(r.rating ?? 0), 0);
  return sum / reviews.length;
}

function avgFromDispatcher(d: Dispatcher | null) {
  if (!d) return 0;
  const rc = Number(d.reviewCount ?? 0);
  const rs = Number(d.ratingSum ?? 0);
  if (!rc) return 0;
  return rs / rc;
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

export default function DispatcherProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();

  const id = useMemo(() => {
    const raw = params?.id;
    return typeof raw === "string" ? raw : "";
  }, [params]);

  const [dispatcher, setDispatcher] = useState<Dispatcher | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);

  const [shareState, setShareState] = useState<"idle" | "copied" | "failed">("idle");

  const user = useMemo(() => getCurrentUser(), []);

  async function refresh() {
    if (!id) return;

    setLoading(true);
    try {
      const d = await getDispatcher(id);
      setDispatcher(d);

      if (d) {
        const r = await listReviewsForDispatcher(id, { limit: 200 });
        setReviews((r ?? []).filter((x: any) => !x.hidden));
      } else {
        setReviews([]);
      }
    } catch (e) {
      console.error(e);
      setDispatcher(null);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [id]);

  const liveReviewCount = reviews.length > 0 ? reviews.length : Number(dispatcher?.reviewCount ?? 0);
  const liveAvg =
    reviews.length > 0 ? avgFromReviews(reviews) : avgFromDispatcher(dispatcher);

  const reportCount = Number(dispatcher?.reportCount ?? 0);
  const recentNegativeReviews = reviews.filter((r) => Number(r.rating ?? 0) <= 2).length;

  const scam = calculateScamScore({
    avgRating: liveAvg,
    reviewCount: liveReviewCount,
    reportCount,
    recentNegativeReviews,
    verified: !!dispatcher?.verified,
  });

  async function onPost() {
    if (!user) {
      showToast({
        tone: "error",
        title: "Login required",
        message: "Please sign in before posting a review.",
      });
      return;
    }

    if (!dispatcher) {
      showToast({
        tone: "error",
        title: "Dispatcher not found",
      });
      return;
    }

    const clean = comment.trim();
    if (!clean) {
      showToast({
        tone: "error",
        title: "Review required",
        message: "Write a short review first.",
      });
      return;
    }

    setPosting(true);
    try {
      await addDoc(collection(db, "reviews"), {
        dispatcherId: dispatcher.id,
        rating,
        comment: clean,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        hidden: false,
      });

      setComment("");
      setRating(5);

      await refresh();

      showToast({
        tone: "success",
        title: "Review posted",
        message: "Your review has been added.",
      });
    } catch (e: any) {
      console.error(e);
      showToast({
        tone: "error",
        title: "Failed to post review",
        message: e?.message ?? "Missing or insufficient permissions.",
      });
    } finally {
      setPosting(false);
    }
  }

  async function onReport(r: Review) {
    if (!user) {
      showToast({
        tone: "error",
        title: "Login required",
        message: "Please sign in before reporting a review.",
      });
      return;
    }

    const reason = window.prompt("Why are you reporting this dispatcher or review?")?.trim();
    if (!reason) return;

    try {
      await createReport({
        dispatcherId: id,
        reviewId: r.id,
        reason,
      });

      showToast({
        tone: "success",
        title: "Report submitted",
        message: "Admins will review it.",
      });
    } catch (e: any) {
      console.error(e);
      showToast({
        tone: "error",
        title: "Failed to submit report",
        message: e?.message ?? "Something went wrong.",
      });
    }
  }

  async function copyLink() {
    setShareState("idle");
    try {
      const origin =
        typeof window !== "undefined" && window.location?.origin ? window.location.origin : "";
      const link = `${origin}/dispatchers/${id}`;
      await navigator.clipboard.writeText(link);
      setShareState("copied");
      setTimeout(() => setShareState("idle"), 1200);
    } catch {
      setShareState("failed");
      setTimeout(() => setShareState("idle"), 1200);
    }
  }

  if (!id) {
    return (
      <div className="container">
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900 }}>Missing dispatcher id</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container">
        <div className="small">Loading…</div>
      </div>
    );
  }

  if (!dispatcher) {
    return (
      <div className="container">
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900 }}>Dispatcher not found</div>
          <div style={{ marginTop: 12 }}>
            <Link className="btn secondary" href="/dispatchers">
              ← Back to Dispatchers
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="row wrap" style={{ justifyContent: "space-between", gap: 10 }}>
        <button className="btn secondary" type="button" onClick={() => router.push("/dispatchers")}>
          ← Back
        </button>

        <div className="row wrap" style={{ gap: 10 }}>
          <button className="btn secondary" type="button" onClick={copyLink}>
            {shareState === "copied"
              ? "Link copied ✓"
              : shareState === "failed"
              ? "Copy failed"
              : "Copy link"}
          </button>

          <Link href={`/verify-dispatcher/${dispatcher.id}`} className="btn secondary">
            Request verification
          </Link>

          <Link href={`/claim/${dispatcher.id}`} className="btn">
            Claim this profile
          </Link>
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 14,
            flexWrap: "wrap",
            alignItems: "start",
          }}
        >
          <div style={{ minWidth: 260, flex: 1 }}>
            <div
              style={{
                fontWeight: 950,
                fontSize: 30,
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
              }}
            >
              {dispatcher.name}
            </div>

            <div className="small" style={{ marginTop: 6 }}>
              {dispatcher.company}
            </div>

            <div className="row wrap" style={{ gap: 10, marginTop: 10 }}>
              <span className="badge">
                <Stars rating={liveAvg || 0} />
                <span style={{ marginLeft: 8 }}>{liveReviewCount ? liveAvg.toFixed(1) : "—"}</span>
              </span>

              <span className="badge">{liveReviewCount} reviews</span>

              {dispatcher.verified ? (
                <VerifiedBadge variant="verified" compact />
              ) : (
                <span className="badge">Unverified</span>
              )}
            </div>

            <div className="row wrap" style={{ gap: 10, marginTop: 12 }}>
              <ScamRiskBadge score={scam.score} level={scam.level} />
              {scam.reasons.length ? (
                <div className="small" style={{ opacity: 0.9, alignSelf: "center" }}>
                  {scam.reasons.join(" • ")}
                </div>
              ) : (
                <div className="small" style={{ opacity: 0.9, alignSelf: "center" }}>
                  No major scam signals detected.
                </div>
              )}
            </div>
          </div>

          <div style={{ minWidth: 280, display: "grid", gap: 10 }}>
            <div className="small" style={{ opacity: 0.95 }}>
              Reputation
            </div>

            <TrustBadge
              verified={dispatcher.verified}
              reviewCount={liveReviewCount}
              ratingSum={Math.round(liveAvg * liveReviewCount)}
              size="md"
              showScore
              showBadgeLabel
            />
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <div className="row wrap" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 className="h2" style={{ margin: 0 }}>
            Leave a review
          </h2>
          <div className="small" style={{ opacity: 0.9 }}>
            {user ? <>Signed in</> : <>Login required to post</>}
          </div>
        </div>

        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          <div className="row wrap" style={{ gap: 10, alignItems: "center" }}>
            <div className="small" style={{ fontWeight: 800 }}>
              Rating
            </div>

            <select
              className="input"
              style={{ width: 220 }}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
              disabled={!user}
            >
              <option value={5}>★★★★★ (5)</option>
              <option value={4}>★★★★☆ (4)</option>
              <option value={3}>★★★☆☆ (3)</option>
              <option value={2}>★★☆☆☆ (2)</option>
              <option value={1}>★☆☆☆☆ (1)</option>
            </select>

            <span className="badge">
              <Stars rating={rating} />
            </span>
          </div>

          <textarea
            className="input"
            style={{ minHeight: 120, paddingTop: 10 }}
            placeholder="Write your review…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={!user}
          />

          <div className="row wrap" style={{ justifyContent: "space-between", gap: 10 }}>
            <div className="small" style={{ opacity: 0.85 }}>
              Be specific. Avoid personal information.
            </div>

            <button className="btn" type="button" onClick={onPost} disabled={!user || posting}>
              {posting ? "Posting..." : "Post review"}
            </button>
          </div>
        </div>
      </div>

      <h2 className="h2" style={{ marginTop: 18 }}>
        Reviews
      </h2>

      <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
        {reviews.map((r) => (
          <div key={r.id} className="card" style={{ padding: 14 }}>
            <div className="row wrap" style={{ justifyContent: "space-between", alignItems: "start", gap: 10 }}>
              <div style={{ display: "grid", gap: 6, flex: 1 }}>
                <div className="row wrap" style={{ gap: 10 }}>
                  <span className="badge">
                    <Stars rating={Number(r.rating || 0)} />
                    <span style={{ marginLeft: 8 }}>{r.rating}/5</span>
                  </span>
                </div>

                <div className="small" style={{ whiteSpace: "pre-wrap" }}>
                  {r.comment}
                </div>
              </div>

              <button className="btn secondary" type="button" onClick={() => onReport(r)}>
                Report
              </button>
            </div>
          </div>
        ))}

        {reviews.length === 0 ? (
          <div className="small" style={{ opacity: 0.9 }}>
            No reviews yet. Be the first.
          </div>
        ) : null}
      </div>
    </div>
  );
}