"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Dashboard", href: "/dashboard" },

  { label: "Dispatchers", href: "/dispatchers" },
  { label: "Leaderboard", href: "/leaderboard" },

  { label: "Brokers", href: "/brokers" },
  { label: "Broker Leaderboard", href: "/brokers/leaderboard" },

  { label: "Drivers", href: "/drivers" },
  { label: "Driver Watchlist", href: "/driver-watchlist" },

  { label: "Trust & Risk Watchlist", href: "/watchlist" },

  { label: "Marketplace", href: "/marketplace" },
  { label: "My Leads", href: "/my-leads" },
  { label: "My Favorites", href: "/my-favorites" },
  { label: "Notifications", href: "/notifications" },
  { label: "Profile", href: "/profile" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const user = auth.currentUser;

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-kicker">DISPATCHHUB ECOSYSTEM</div>
        <div className="brand-title">RateMyDispatchers</div>
        <p className="brand-subtitle">
          Reviews, rankings, leads, favorites, marketplace trust signals, and
          risk monitoring — all in one place.
        </p>
      </div>

      <div className="sidebar-actions">
        <Link className="btn" href="/dispatchers">
          Dispatchers
        </Link>

        <Link className="btn secondary" href="/brokers">
          Brokers
        </Link>
      </div>

      <div className="sidebar-auth">
        {user ? (
          <>
            <div className="small">Signed in as</div>
            <div style={{ fontWeight: 900, wordBreak: "break-word" }}>
              {user.email}
            </div>

            <button
              className="btn secondary"
              style={{ marginTop: 12 }}
              onClick={() => auth.signOut()}
            >
              Logout
            </button>
          </>
        ) : (
          <div className="row between">
            <span className="small">Guest</span>
            <Link className="btn secondary" href="/login">
              Login
            </Link>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname?.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? "nav-link active" : "nav-link"}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}