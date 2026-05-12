"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";

const mainNavItems = [
  { label: "Home", href: "/" },
  { label: "Dashboard", href: "/dashboard" },
];

const reputationItems = [
  { label: "Dispatchers", href: "/dispatchers" },
  { label: "Brokers", href: "/brokers" },
  { label: "Drivers", href: "/drivers" },
];

const guardItems = [
  { label: "DispatchGuard", href: "/watchlist" },
  { label: "Driver Watchlist", href: "/driver-watchlist" },
];

const growthItems = [
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "My Leads", href: "/my-leads" },
];

const accountItems = [
  { label: "My Favorites", href: "/my-favorites" },
  { label: "Notifications", href: "/notifications" },
  { label: "My Profile", href: "/profile" },
];

function NavLink({
  label,
  href,
  pathname,
}: {
  label: string;
  href: string;
  pathname: string | null;
}) {
  const active = href === "/" ? pathname === "/" : pathname?.startsWith(href);

  return (
    <Link
      href={href}
      style={{
        display: "block",
        width: "100%",
        padding: "11px 14px",
        borderRadius: 14,
        textDecoration: "none",
        color: "#ffffff",
        fontWeight: 800,
        fontSize: 14,
        lineHeight: 1.15,
        border: active
          ? "1px solid rgba(90, 165, 255, 0.75)"
          : "1px solid rgba(255,255,255,0.08)",
        background: active
          ? "linear-gradient(135deg, rgba(59,130,246,0.75), rgba(24,38,70,0.65))"
          : "rgba(255,255,255,0.045)",
        boxShadow: active ? "0 10px 26px rgba(37,99,235,0.22)" : "none",
      }}
    >
      {label}
    </Link>
  );
}

function Section({
  title,
  items,
  pathname,
}: {
  title: string;
  items: { label: string; href: string }[];
  pathname: string | null;
}) {
  return (
    <div style={{ marginTop: 18 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          opacity: 0.55,
          marginBottom: 8,
          paddingLeft: 4,
        }}
      >
        {title}
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {items.map((item) => (
          <NavLink
            key={item.href}
            label={item.label}
            href={item.href}
            pathname={pathname}
          />
        ))}
      </div>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const user = auth.currentUser;

  return (
    <aside
      style={{
        width: 230,
        minWidth: 230,
        height: "100vh",
        position: "sticky",
        top: 0,
        overflowY: "auto",
        padding: 16,
        borderRight: "1px solid rgba(255,255,255,0.08)",
        background:
          "linear-gradient(180deg, rgba(15,31,56,0.96), rgba(5,13,28,0.96))",
      }}
    >
      <div
        style={{
          padding: 16,
          borderRadius: 22,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.045)",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            opacity: 0.72,
          }}
        >
          DispatchHub Ecosystem
        </div>

        <div
          style={{
            fontSize: 24,
            fontWeight: 1000,
            lineHeight: 1,
            marginTop: 8,
          }}
        >
          RateMyDispatchers
        </div>

        <p
          style={{
            fontSize: 12,
            lineHeight: 1.55,
            opacity: 0.78,
            marginTop: 12,
            marginBottom: 0,
          }}
        >
          Reviews, reputation, leads, marketplace, and DispatchGuard scam-risk
          monitoring for dispatchers, brokers, and drivers.
        </p>
      </div>

      <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
        <Link className="btn" href="/dispatchguard">
          DispatchGuard
        </Link>

        <Link className="btn secondary" href="/marketplace">
          Marketplace
        </Link>
      </div>

      <div
        style={{
          marginTop: 16,
          padding: 14,
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.04)",
        }}
      >
        {user ? (
          <>
            <div className="small">Signed in as</div>
            <div
              style={{
                fontWeight: 900,
                wordBreak: "break-word",
                fontSize: 13,
                marginTop: 4,
              }}
            >
              {user.email}
            </div>

            <button
              className="btn secondary"
              style={{ marginTop: 12, width: "100%" }}
              onClick={() => auth.signOut()}
            >
              Logout
            </button>
          </>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 10,
              alignItems: "center",
            }}
          >
            <span className="small">Guest</span>
            <Link className="btn secondary" href="/login">
              Login
            </Link>
          </div>
        )}
      </div>

      <Section title="Main" items={mainNavItems} pathname={pathname} />
      <Section title="Reviews & Reputation" items={reputationItems} pathname={pathname} />
      <Section title="Risk Intelligence" items={guardItems} pathname={pathname} />
      <Section title="Growth" items={growthItems} pathname={pathname} />
      <Section title="Account" items={accountItems} pathname={pathname} />

      <div
        style={{
          marginTop: 18,
          paddingTop: 14,
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "grid",
          gap: 8,
        }}
      >
        <div className="small">Quick actions</div>

        <Link className="btn secondary" href="/marketplace/new">
          Create Listing
        </Link>

        <Link className="btn secondary" href="/profile">
          Update Profile
        </Link>
      </div>
    </aside>
  );
}