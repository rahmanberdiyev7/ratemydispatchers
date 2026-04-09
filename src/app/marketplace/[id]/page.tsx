"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { useToast } from "@/components/ToastProvider";
import {
  getMarketplaceListing,
  createMarketplaceLead,
  createMarketplaceReview,
  listMarketplaceReviewsForListing,
  createMarketplaceReviewReport,
  type MarketplaceListing,
  type MarketplaceReview,
} from "@/lib/firestore";
import TrustBadge from "@/components/TrustBadge";

function Stars({ rating }: { rating: number }) {
  const safe = Number.isFinite(rating) ? rating : 0;
  const rounded = Math.max(0, Math.min(5, Math.round(safe)));
  return (
    <span aria-label={`${safe.toFixed(1)} out of 5`} title={`${safe.toFixed(1)}/5`}>
      {"★★★★★".slice(0, rounded)}
      {"☆☆☆☆☆".slice(0, 5 - rounded)}
    </span>
  );
}

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

export default function MarketplaceListingDetailPage() {
  const params = useParams();
  const { showToast } = useToast();

  const id = useMemo(() => {
    const raw = params?.id;
    return typeof raw === "string" ? raw : "";
  }, [params]);

  const user = useMemo(() => getCurrentUser(), []);

  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [reviews, setReviews] = useState<MarketplaceReview[]>([]);
  const [loading, setLoading] = useState(true);

  const [shareState, setShareState] = useState<"idle" | "copied" | "failed">("idle");

  const [leadOpen, setLeadOpen] = useState(false);
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [senderCompany, setSenderCompany] = useState("");
  const [equipmentType, setEquipmentType] = useState("");
  const [message, setMessage] = useState("");
  const [leadSaving, setLeadSaving] = useState(false);

  const [reviewRating, setReviewRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);

  function resetLeadForm() {
    setLeadOpen(false);
    setSenderName("");
    setSenderEmail("");
    setSenderPhone("");
    setSenderCompany("");
    setEquipmentType("");
    setMessage("");
    setLeadSaving(false);
  }

  async function load() {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [row, rowReviews] = await Promise.all([
        getMarketplaceListing(id),
        listMarketplaceReviewsForListing(id, { limit: 200 }),
      ]);
      setListing(row);
      setReviews(rowReviews ?? []);
    } catch (e: any) {
      console.error(e);
      setListing(null);
      setReviews([]);
      showToast({
        tone: "error",
        title: "Failed to load listing",
        message: e?.message ?? "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function copyLink() {
    setShareState("idle");
    try {
      const origin =
        typeof window !== "undefined" && window.location?.origin
          ? window.location.origin
          : "";
      const link = `${origin}/marketplace/${id}`;
      await navigator.clipboard.writeText(link);
      setShareState("copied");
      setTimeout(() => setShareState("idle"), 1200);
    } catch {
      setShareState("failed");
      setTimeout(() => setShareState("idle"), 1200);
    }
  }

  async function submitLead() {
    if (!user) {
      showToast({
        tone: "error",
        title: "Login required",
        message: "Please sign in before sending a lead.",
      });
      return;
    }

    if (!listing) return;

    if (!senderName.trim()) {
      showToast({ tone: "error", title: "Enter your name" });
      return;
    }

    if (!senderEmail.trim()) {
      showToast({ tone: "error", title: "Enter your email" });
      return;
    }

    if (!message.trim()) {
      showToast({ tone: "error", title: "Enter your message" });
      return;
    }

    setLeadSaving(true);
    try {
      await createMarketplaceLead({
        listingId: listing.id,
        senderName: senderName.trim(),
        senderEmail: senderEmail.trim(),
        senderPhone: senderPhone.trim(),
        senderCompany: senderCompany.trim(),
        equipmentType: equipmentType.trim(),
        message: message.trim(),
      });

      showToast({
        tone: "success",
        title: "Lead sent",
        message: "Your message was sent successfully.",
      });

      resetLeadForm();
    } catch (e: any) {
      console.error(e);
      showToast({
        tone: "error",
        title: "Failed to send lead",
        message: e?.message ?? "Something went wrong.",
      });
    } finally {
      setLeadSaving(false);
    }
  }

  async function submitReview() {
    if (!user) {
      showToast({
        tone: "error",
        title: "Login required",
        message: "Please sign in before leaving a review.",
      });
      return;
    }

    if (!listing) return;

    if (!reviewComment.trim()) {
      showToast({ tone: "error", title: "Write a review first" });
      return;
    }

    setReviewSaving(true);
    try {
      await createMarketplaceReview({
        listingId: listing.id,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });

      setReviewComment("");
      setReviewRating(5);

      showToast({
        tone: "success",
        title: "Review submitted",
      });

      await load();
    } catch (e: any) {
      console.error(e);
      showToast({
        tone: "error",
        title: "Failed to submit review",
        message: e?.message ?? "Something went wrong.",
      });
    } finally {
      setReviewSaving(false);
    }
  }

  async function reportReview(review: MarketplaceReview) {
    if (!user) {
      showToast({
        tone: "error",
        title: "Login required",
        message: "Please sign in before reporting a review.",
      });
      return;
    }

    const reason = window.prompt("Why are you reporting this review?")?.trim();
    if (!reason) return;

    try {
      await createMarketplaceReviewReport({
        listingId: id,
        reviewId: review.id,
        reason,
      });

      showToast({
        tone: "success",
        title: "Report submitted",
        message: "We’ll review this report.",
      });
    } catch (e: any) {
      console.error(e);
      showToast({
        tone: "error",
        title: "Failed to report review",
        message: e?.message ?? "Something went wrong.",
      });
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="small">Loading listing…</div>
      </div>
    );
  }

  if (!id || !listing || listing.active === false) {
    return (
      <div className="container">
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900 }}>Listing not found</div>
          <div className="small" style={{ marginTop: 6 }}>
            This listing may have been removed or deactivated.
          </div>

          <div className="row wrap" style={{ gap: 10, marginTop: 12 }}>
            <Link className="btn secondary" href="/marketplace">
              ← Back to Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const ownedByUser = !!user && listing.createdBy === user.uid;

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
        <div className="row wrap" style={{ gap: 10 }}>
          <Link className="btn secondary" href="/marketplace">
            ← Back to Marketplace
          </Link>
        </div>

        <div className="row wrap" style={{ gap: 10 }}>
          <button className="btn secondary" type="button" onClick={copyLink}>
            {shareState === "copied"
              ? "Link copied ✓"
              : shareState === "failed"
              ? "Copy failed"
              : "Copy link"}
          </button>

          {ownedByUser ? (
            <Link className="btn secondary" href={`/marketplace/${listing.id}/edit`}>
              Edit listing
            </Link>
          ) : null}

          <button className="btn" type="button" onClick={() => setLeadOpen(true)}>
            Contact
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 18, marginTop: 14 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: 1, minWidth: 260 }}>
            <div className="row wrap" style={{ gap: 8, alignItems: "center" }}>
              <div
                style={{
                  fontWeight: 950,
                  fontSize: 30,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.1,
                }}
              >
                {listing.name}
              </div>

              {listing.verified ? (
                <span className="badge verified">Verified</span>
              ) : (
                <span className="badge">Unverified</span>
              )}
            </div>

            <div className="small" style={{ marginTop: 6 }}>
              {listing.company} • {listing.location}
            </div>

            <div style={{ fontWeight: 800, marginTop: 14, fontSize: 18 }}>
              {listing.title}
            </div>

            <div className="small" style={{ marginTop: 10, whiteSpace: "pre-wrap", maxWidth: 900 }}>
              {listing.bio}
            </div>

            <div style={{ marginTop: 14 }}>
              <TrustBadge
                verified={listing.verified}
                reviewCount={0}
                ratingSum={0}
                hasMarketplaceListing={true}
                marketplaceReviewCount={Number(listing.reviewCount ?? 0)}
                marketplaceRating={Number(listing.rating ?? 0)}
                size="md"
                showScore
                showBadgeLabel
              />
            </div>

            <div className="row wrap" style={{ gap: 8, marginTop: 14 }}>
              {(listing.serviceTypes ?? []).map((s) => (
                <span key={s} className="badge">
                  {s}
                </span>
              ))}
              {(listing.tags ?? []).map((t) => (
                <span key={t} className="badge">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div style={{ minWidth: 280, display: "grid", gap: 12 }}>
            <div className="row wrap" style={{ gap: 8 }}>
              <span className="badge">
                <Stars rating={Number(listing.rating ?? 0)} />
                <span style={{ marginLeft: 8 }}>{Number(listing.rating ?? 0).toFixed(1)}</span>
              </span>

              <span className="badge">{Number(listing.reviewCount ?? 0)} reviews</span>
            </div>

            <div className="card" style={{ padding: 14 }}>
              <div className="small">
                <b>Pricing model:</b> {listing.pricingType}
              </div>
              <div className="small" style={{ marginTop: 8 }}>
                <b>Pricing:</b> {listing.priceLabel}
              </div>
              {listing.createdAt ? (
                <div className="small" style={{ marginTop: 8, opacity: 0.85 }}>
                  Listed: {fmtTime(listing.createdAt)}
                </div>
              ) : null}
            </div>

            <button className="btn" type="button" onClick={() => setLeadOpen(true)}>
              Contact this dispatcher
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "baseline",
          }}
        >
          <h2 className="h2" style={{ margin: 0 }}>
            Leave a marketplace review
          </h2>
          <div className="small">{user ? "Signed in" : "Login required"}</div>
        </div>

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
            style={{ minHeight: 120 }}
            placeholder="Write your review about this marketplace service…"
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
          />

          <div className="row wrap" style={{ justifyContent: "space-between", gap: 10 }}>
            <div className="small" style={{ opacity: 0.9 }}>
              Review the listing itself: clarity, professionalism, trust, and fit.
            </div>

            <button className="btn" type="button" disabled={reviewSaving} onClick={submitReview}>
              {reviewSaving ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "baseline",
          }}
        >
          <h2 className="h2" style={{ margin: 0 }}>
            Marketplace Reviews
          </h2>
          <div className="small">{reviews.length} total</div>
        </div>

        {reviews.length === 0 ? (
          <div className="small" style={{ marginTop: 12 }}>
            No marketplace reviews yet.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {reviews.map((review) => (
              <div key={review.id} className="card" style={{ padding: 14 }}>
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
                    <div className="badge" style={{ width: "fit-content" }}>
                      <Stars rating={review.rating} />
                      <span style={{ marginLeft: 8 }}>{review.rating}/5</span>
                    </div>

                    <div className="small" style={{ whiteSpace: "pre-wrap" }}>
                      {review.comment}
                    </div>

                    <div className="small" style={{ opacity: 0.8 }}>
                      {fmtTime(review.createdAt)}
                    </div>
                  </div>

                  <button
                    className="btn secondary"
                    type="button"
                    onClick={() => reportReview(review)}
                  >
                    Report
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {leadOpen ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 18,
            zIndex: 1000,
          }}
        >
          <div className="card" style={{ width: "100%", maxWidth: 680, padding: 18 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                alignItems: "flex-start",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontWeight: 950, fontSize: 20 }}>Contact Dispatcher</div>
                <div className="small" style={{ marginTop: 6 }}>
                  Sending lead to <b>{listing.name}</b> • {listing.company}
                </div>
              </div>

              <button className="btn secondary" type="button" onClick={resetLeadForm}>
                Close
              </button>
            </div>

            <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
              <input
                className="input"
                placeholder="Your name"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
              />

              <input
                className="input"
                placeholder="Your email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
              />

              <div className="row wrap" style={{ gap: 10 }}>
                <input
                  className="input"
                  style={{ flex: 1, minWidth: 220 }}
                  placeholder="Phone (optional)"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                />

                <input
                  className="input"
                  style={{ flex: 1, minWidth: 220 }}
                  placeholder="Company (optional)"
                  value={senderCompany}
                  onChange={(e) => setSenderCompany(e.target.value)}
                />
              </div>

              <input
                className="input"
                placeholder="Equipment type (optional)"
                value={equipmentType}
                onChange={(e) => setEquipmentType(e.target.value)}
              />

              <textarea
                className="input"
                style={{ minHeight: 120 }}
                placeholder="Message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />

              <div className="row wrap" style={{ justifyContent: "space-between", gap: 10 }}>
                <div className="small" style={{ opacity: 0.9 }}>
                  Your lead will appear in the dispatcher's My Leads page.
                </div>

                <button className="btn" type="button" disabled={leadSaving} onClick={submitLead}>
                  {leadSaving ? "Sending..." : "Send Lead"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}