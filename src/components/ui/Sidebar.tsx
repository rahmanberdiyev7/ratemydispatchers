"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Dashboard", href: "/dashboard" },

  { label: "Dispatchers", href: "/dispatchers" },
  { label: "Brokers", href: "/brokers" },
  { label: "Drivers", href: "/drivers" },

  { label: "DispatchGuard", href: "/watchlist" },
  { label: "Driver Watchlist", href: "/driver-watchlist" },

  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Broker Leaderboard", href: "/brokers/leaderboard" },

  { label: "Marketplace", href: "/marketplace" },
  { label: "My Leads", href: "/my-leads" },
  { label: "My Favorites", href: "/my-favorites" },

  { label: "Notifications", href: "/notifications" },
  { label: "My Profile", href: "/profile" },
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
          Reviews, reputation, leads, marketplace, and DispatchGuard scam-risk
          monitoring for dispatchers, brokers, and drivers.
        </p>
      </div>

      <div className="sidebar-actions">
        <Link className="btn" href="/watchlist">
          DispatchGuard
        </Link>

        <Link className="btn secondary" href="/marketplace">
          Marketplace
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

      <div className="sidebar-auth" style={{ marginTop: 14 }}>
        <div className="small" style={{ marginBottom: 8 }}>
          Quick actions
        </div>

        <Link className="btn secondary" href="/marketplace/new">
          Create Listing
        </Link>

        <Link
          className="btn secondary"
          href="/profile"
          style={{ marginTop: 8 }}
        >
          Update Profile
        </Link>
      </div>
    </aside>
  );
}