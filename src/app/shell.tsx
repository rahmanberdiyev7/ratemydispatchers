// src/app/shell.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../lib/firebase";

export default function Shell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  return (
    <div className="appShell">
      <aside className="sidebar">
        <div className="card">
          <div className="chip">DispatchHub Ecosystem</div>
          <div className="brand">
            <span className="brandA">RateMy</span>
            <span className="brandB">Dispatchers</span>
          </div>
          <p className="muted">
            Browse dispatchers and leave reviews. (Login required to post.)
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="btn" href="/dispatchers">
              Go to Dispatchers →
            </Link>
            <Link className="btn" href="/login">
              Login
            </Link>
          </div>
        </div>

        <div className="card" style={{ marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div className="chip">🌙 Dark</div>
            <div className="muted small">{user ? user.email : "Guest"}</div>
          </div>

          <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
            <Link className="navBtn" href="/">
              Home
            </Link>
            <Link className="navBtn" href="/dispatchers">
              Dispatchers
            </Link>
            <Link className="navBtn" href="/admin/claims">
              Admin
            </Link>
          </div>
        </div>

        <div className="muted small" style={{ marginTop: 14 }}>
          © 2026 RateMyDispatchers — DispatchHub Ecosystem
        </div>
      </aside>

      <main className="appMain">{children}</main>
    </div>
  );
}