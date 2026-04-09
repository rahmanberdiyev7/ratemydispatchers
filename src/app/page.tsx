"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="container">
      <div
        style={{
          padding: 20,
          borderRadius: 16,
          background: "linear-gradient(135deg, #0f172a, #1e293b)",
        }}
      >
        <h1 className="h1">DispatchHub Ecosystem</h1>

        <div className="small" style={{ marginTop: 8 }}>
          Know who to trust before you book the load.
        </div>

        <div className="row wrap" style={{ gap: 10, marginTop: 16 }}>
          <Link href="/dispatchers" className="btn">
            Browse Dispatchers
          </Link>

          <Link href="/brokers" className="btn secondary">
            Browse Brokers
          </Link>

          <Link href="/watchlist" className="btn secondary">
            Trust & Risk Watchlist
          </Link>
        </div>
      </div>
    </div>
  );
}