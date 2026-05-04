"use client";

import Link from "next/link";
import AuthRedirectGate from "@/components/auth/AuthRedirectGate";

export default function DashboardPage() {
  return (
    <AuthRedirectGate>
      <div className="container">
        <h1 className="h1">Dashboard</h1>

        <div className="small" style={{ marginTop: 8, opacity: 0.9 }}>
          Your account is set up. Choose where you want to go next.
        </div>

        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            marginTop: 18,
          }}
        >
          <Link className="card" style={{ padding: 18, textDecoration: "none" }} href="/dispatchers">
            <div style={{ fontWeight: 900 }}>Dispatchers</div>
            <div className="small" style={{ marginTop: 6 }}>
              Browse dispatcher profiles and reviews.
            </div>
          </Link>

          <Link className="card" style={{ padding: 18, textDecoration: "none" }} href="/brokers">
            <div style={{ fontWeight: 900 }}>Brokers</div>
            <div className="small" style={{ marginTop: 6 }}>
              Browse broker trust signals.
            </div>
          </Link>

          <Link className="card" style={{ padding: 18, textDecoration: "none" }} href="/watchlist">
            <div style={{ fontWeight: 900 }}>Risk Watchlist</div>
            <div className="small" style={{ marginTop: 6 }}>
              Check broker and dispatcher risk alerts.
            </div>
          </Link>

          <Link className="card" style={{ padding: 18, textDecoration: "none" }} href="/profile">
            <div style={{ fontWeight: 900 }}>My Profile</div>
            <div className="small" style={{ marginTop: 6 }}>
              Update account type and verification.
            </div>
          </Link>
        </div>
      </div>
    </AuthRedirectGate>
  );
}