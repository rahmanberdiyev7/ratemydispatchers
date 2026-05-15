"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";

const mainNavItems = [
  { label: "Home", href: "/" },
  { label: "Dashboard", href: "/dashboard" },
];

const trustNetworkItems = [
  { label: "Dispatchers", href: "/dispatchers" },
  { label: "Brokers", href: "/brokers" },
  { label: "Carriers", href: "/carriers" },
  { label: "Drivers", href: "/drivers" },
];

const dispatchGuardItems = [
  { label: "DispatchGuard Intelligence", href: "/dispatchguard" },
  { label: "Identity Shield", href: "/dispatchguard/identity-shield" },
  { label: "Risk Watchlist", href: "/watchlist" },
  { label: "Verification Center", href: "/verify" },
];

const marketplaceItems = [
  { label: "Marketplace", href: "/marketplace" },
  { label: "Leads", href: "/my-leads" },
  { label: "Leaderboard", href: "/leaderboard" },
];

const accountItems = [
  { label: "Favorites", href: "/my-favorites" },
  { label: "Notifications", href: "/notifications" },
  { label: "Profile", href: "/profile" },
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
        position: "relative",
        display: "block",
        width: "100%",
        padding: "10px 12px",
        borderRadius: 14,
        textDecoration: "none",
        color: active ? "#ffffff" : "rgba(245,247,251,0.78)",
        fontWeight: active ? 900 : 750,
        fontSize: 14,
        lineHeight: 1.15,
        border: "none",
        outline: "none",
        background: active
          ? "linear-gradient(135deg, rgba(77,163,255,0.72), rgba(47,124,246,0.22))"
          : "transparent",
        boxShadow: active
          ? "0 12px 30px rgba(47,124,246,0.24), inset 0 1px 0 rgba(255,255,255,0.18)"
          : "none",
        transition:
          "background 160ms ease, color 160ms ease, transform 160ms ease, box-shadow 160ms ease",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = "rgba(255,255,255,0.045)";
          e.currentTarget.style.color = "#ffffff";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "rgba(245,247,251,0.78)";
        }
      }}
    >
      {active ? (
        <span
          style={{
            position: "absolute",
            left: -8,
            top: "50%",
            transform: "translateY(-50%)",
            width: 3,
            height: 22,
            borderRadius: 999,
            background: "rgba(77,163,255,0.95)",
            boxShadow: "0 0 18px rgba(77,163,255,0.9)",
          }}
        />
      ) : null}

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
    <div style={{ marginTop: 20 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 950,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          color: "rgba(245,247,251,0.42)",
          marginBottom: 9,
          paddingLeft: 6,
        }}
      >
        {title}
      </div>

      <div style={{ display: "grid", gap: 5 }}>
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
      className="rmdSidebar"
      style={{
        width: 238,
        minWidth: 238,
        height: "100vh",
        position: "sticky",
        top: 0,
        overflowY: "auto",
        overflowX: "hidden",
        padding: "22px 16px 22px 18px",
        border: "none",
        outline: "none",
        background:
          "linear-gradient(180deg, rgba(10,20,38,0.72), rgba(5,12,24,0.44) 58%, rgba(5,12,24,0.18))",
        boxShadow:
          "32px 0 70px rgba(0,0,0,0.12), inset -1px 0 0 rgba(255,255,255,0.035)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at 20% 8%, rgba(77,163,255,0.13), transparent 32%), radial-gradient(circle at 80% 42%, rgba(47,124,246,0.08), transparent 34%)",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            padding: "0 4px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.045)",
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 950,
              letterSpacing: 1.8,
              textTransform: "uppercase",
              color: "rgba(245,247,251,0.52)",
            }}
          >
            DispatchHub Ecosystem
          </div>

          <div
            style={{
              fontSize: 23,
              fontWeight: 1000,
              lineHeight: 0.95,
              marginTop: 8,
              letterSpacing: "-0.04em",
              color: "#ffffff",
            }}
          >
            RateMyDispatchers
          </div>

          <p
            style={{
              fontSize: 12,
              lineHeight: 1.55,
              color: "rgba(245,247,251,0.66)",
              marginTop: 12,
              marginBottom: 0,
            }}
          >
            DispatchGuard trust intelligence for brokers, carriers,
            dispatchers, and drivers.
          </p>
        </div>

        <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
          <Link
            href="/dispatchguard"
            style={{
              minHeight: 42,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
              borderRadius: 999,
              color: "#ffffff",
              fontWeight: 900,
              background:
                "linear-gradient(135deg, rgba(77,163,255,0.95), rgba(47,124,246,0.76))",
              boxShadow: "0 14px 34px rgba(47,124,246,0.28)",
            }}
          >
            DispatchGuard
          </Link>

          <Link
            href="/marketplace"
            style={{
              minHeight: 42,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
              borderRadius: 999,
              color: "rgba(255,255,255,0.92)",
              fontWeight: 850,
              background: "rgba(255,255,255,0.045)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            Marketplace
          </Link>
        </div>

        <div
          style={{
            marginTop: 16,
            padding: "14px 4px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.045)",
          }}
        >
          {user ? (
            <>
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(245,247,251,0.52)",
                  marginBottom: 4,
                }}
              >
                Signed in as
              </div>

              <div
                style={{
                  fontWeight: 900,
                  wordBreak: "break-word",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.9)",
                  lineHeight: 1.35,
                }}
              >
                {user.email}
              </div>

              <button
                style={{
                  marginTop: 12,
                  width: "100%",
                  minHeight: 40,
                  border: "none",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.055)",
                  color: "#ffffff",
                  fontWeight: 850,
                  cursor: "pointer",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
                }}
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
              <span style={{ fontSize: 12, color: "rgba(245,247,251,0.56)" }}>
                Guest
              </span>

              <Link
                href="/login"
                style={{
                  padding: "10px 16px",
                  borderRadius: 999,
                  textDecoration: "none",
                  color: "#ffffff",
                  fontWeight: 850,
                  background: "rgba(255,255,255,0.055)",
                }}
              >
                Login
              </Link>
            </div>
          )}
        </div>

        <Section title="Main" items={mainNavItems} pathname={pathname} />
        <Section
          title="Trust Network"
          items={trustNetworkItems}
          pathname={pathname}
        />
        <Section
          title="DispatchGuard"
          items={dispatchGuardItems}
          pathname={pathname}
        />
        <Section
          title="Marketplace"
          items={marketplaceItems}
          pathname={pathname}
        />
        <Section title="Account" items={accountItems} pathname={pathname} />

        <div
          style={{
            marginTop: 20,
            padding: "16px 4px 0",
            borderTop: "1px solid rgba(255,255,255,0.045)",
            display: "grid",
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 950,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              color: "rgba(245,247,251,0.42)",
            }}
          >
            Quick actions
          </div>

          <Link
            href="/marketplace/new"
            style={{
              minHeight: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
              borderRadius: 999,
              color: "rgba(255,255,255,0.9)",
              fontWeight: 850,
              background: "rgba(255,255,255,0.045)",
            }}
          >
            Create Listing
          </Link>

          <Link
            href="/profile"
            style={{
              minHeight: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
              borderRadius: 999,
              color: "rgba(255,255,255,0.9)",
              fontWeight: 850,
              background: "rgba(255,255,255,0.045)",
            }}
          >
            Update Profile
          </Link>
        </div>
      </div>
    </aside>
  );
}