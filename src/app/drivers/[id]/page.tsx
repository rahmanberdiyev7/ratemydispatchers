"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  doc,
  getDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import {
  createDriverReview,
  getDriverAverageRating,
  listDriverReviews,
} from "@/lib/driverReviews";

import {
  createDriverReport,
  listDriverReports,
} from "@/lib/driverRisk";

import { getCurrentUser } from "@/lib/auth";

type DriverData = {
  id: string;
  displayName: string;
  email?: string | null;
  driverSubtype?: string | null;

  reviewCount?: number;
  ratingSum?: number;

  riskLevel?: string;
  riskScore?: number;
};

export default function DriverProfilePage() {
  const params = useParams();
  const id = String(params?.id ?? "");

  const [driver, setDriver] = useState<DriverData | null>(null);

  const [reviews, setReviews] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  const [reportReason, setReportReason] =
    useState("unsafe_behavior");

  const [reportDetails, setReportDetails] =
    useState("");

  const [loading, setLoading] = useState(true);

  const avg = useMemo(() => {
    return getDriverAverageRating(
      driver?.reviewCount,
      driver?.ratingSum
    );
  }, [driver]);

  async function reload() {
    const driverSnap = await getDoc(doc(db, "drivers", id));

    if (driverSnap.exists()) {
      const data = driverSnap.data();

      setDriver({
        id: driverSnap.id,
        displayName: String(data.displayName ?? "Unknown Driver"),
        email:
          typeof data.email === "string"
            ? data.email
            : null,

        driverSubtype:
          typeof data.driverSubtype === "string"
            ? data.driverSubtype
            : null,

        reviewCount: Number(data.reviewCount ?? 0),
        ratingSum: Number(data.ratingSum ?? 0),

        riskLevel:
          typeof data.riskLevel === "string"
            ? data.riskLevel
            : "low",

        riskScore: Number(data.riskScore ?? 0),
      });
    }

    const loadedReviews = await listDriverReviews(id);
    setReviews(loadedReviews);

    const loadedReports = await listDriverReports(id);
    setReports(loadedReports);

    setLoading(false);
  }

  useEffect(() => {
    void reload();
  }, [id]);

  async function submitReview() {
    const user = getCurrentUser();

    if (!user) {
      alert("Please login first.");
      return;
    }

    await createDriverReview({
      driverId: id,
      reviewerUid: user.uid,
      reviewerEmail: user.email,

      reviewerAccountType: "carrier",

      rating,
      title,
      comment,
      wouldWorkAgain: true,
    });

    setTitle("");
    setComment("");

    await reload();
  }

  async function submitReport() {
    const user = getCurrentUser();

    if (!user) {
      alert("Please login first.");
      return;
    }

    await createDriverReport({
      driverId: id,
      reporterUid: user.uid,
      reporterEmail: user.email,

      reporterAccountType: "carrier",

      reason: reportReason as any,
      details: reportDetails,
    });

    setReportDetails("");

    await reload();
  }

  if (loading) {
    return (
      <div className="container">
        <div className="small">Loading driver...</div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="container">
        <div className="card" style={{ padding: 18 }}>
          Driver not found.
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card" style={{ padding: 20 }}>
        <div className="row between">
          <div>
            <h1 className="h1">{driver.displayName}</h1>

            <div className="small">
              {driver.driverSubtype === "owner_operator"
                ? "Owner Operator"
                : "Company Driver"}
            </div>
          </div>

          <div className="badge">
            {driver.riskLevel}
          </div>
        </div>

        <div
          className="row wrap"
          style={{ gap: 10, marginTop: 14 }}
        >
          <div className="badge">
            ⭐ {avg}
          </div>

          <div className="badge">
            Reviews: {driver.reviewCount ?? 0}
          </div>

          <div className="badge">
            Risk Score: {driver.riskScore ?? 0}
          </div>
        </div>
      </div>

      <div
        className="grid"
        style={{
          marginTop: 20,
          gridTemplateColumns: "1fr 1fr",
          gap: 18,
        }}
      >
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontWeight: 900 }}>
            Leave Review
          </div>

          <input
            className="input"
            placeholder="Review title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ marginTop: 14 }}
          />

          <textarea
            className="input"
            placeholder="Comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={{
              marginTop: 10,
              minHeight: 120,
            }}
          />

          <select
            className="input"
            value={rating}
            onChange={(e) =>
              setRating(Number(e.target.value))
            }
            style={{ marginTop: 10 }}
          >
            <option value={5}>5 Stars</option>
            <option value={4}>4 Stars</option>
            <option value={3}>3 Stars</option>
            <option value={2}>2 Stars</option>
            <option value={1}>1 Star</option>
          </select>

          <button
            className="btn"
            style={{ marginTop: 12 }}
            onClick={submitReview}
          >
            Submit Review
          </button>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontWeight: 900 }}>
            Report Driver
          </div>

          <select
            className="input"
            value={reportReason}
            onChange={(e) =>
              setReportReason(e.target.value)
            }
            style={{ marginTop: 14 }}
          >
            <option value="unsafe_behavior">
              Unsafe Behavior
            </option>

            <option value="spam">
              Spam
            </option>

            <option value="fraud">
              Fraud
            </option>

            <option value="late_delivery">
              Late Delivery
            </option>

            <option value="communication_issue">
              Communication Issue
            </option>

            <option value="no_show">
              No Show
            </option>
          </select>

          <textarea
            className="input"
            placeholder="Explain issue..."
            value={reportDetails}
            onChange={(e) =>
              setReportDetails(e.target.value)
            }
            style={{
              marginTop: 10,
              minHeight: 120,
            }}
          />

          <button
            className="btn secondary"
            style={{ marginTop: 12 }}
            onClick={submitReport}
          >
            Submit Report
          </button>
        </div>
      </div>

      <div
        className="grid"
        style={{
          marginTop: 20,
          gridTemplateColumns: "1fr 1fr",
          gap: 18,
        }}
      >
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontWeight: 900 }}>
            Reviews
          </div>

          <div
            style={{
              display: "grid",
              gap: 12,
              marginTop: 14,
            }}
          >
            {reviews.map((review) => (
              <div
                key={review.id}
                style={{
                  padding: 12,
                  borderRadius: 12,
                  border:
                    "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div style={{ fontWeight: 900 }}>
                  {review.title}
                </div>

                <div
                  className="small"
                  style={{ marginTop: 4 }}
                >
                  ⭐ {review.rating}
                </div>

                <div style={{ marginTop: 8 }}>
                  {review.comment}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontWeight: 900 }}>
            Reports
          </div>

          <div
            style={{
              display: "grid",
              gap: 12,
              marginTop: 14,
            }}
          >
            {reports.map((report) => (
              <div
                key={report.id}
                style={{
                  padding: 12,
                  borderRadius: 12,
                  border:
                    "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div style={{ fontWeight: 900 }}>
                  {report.reason}
                </div>

                <div style={{ marginTop: 8 }}>
                  {report.details}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}