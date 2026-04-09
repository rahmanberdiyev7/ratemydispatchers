"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useCallback } from "react";
import { BRAND } from "@/lib/brand";
import { listenToAuth, logout, getCurrentUser, isAdmin } from "@/lib/auth";
import { countUnreadNotifications } from "@/lib/firestore";
import ThemeSwitcher from "@/components/ui/ThemeSwitcher";

type NavItem = {
  label: string;
  href: string;
  adminOnly?: boolean;
  badge?: "notifications";
};

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [admin, setAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [unreadCount, setUnreadCount] = useState(0);

  const navItems: NavItem[] = useMemo(
    () => [
      { label: "Home", href: "/" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "Dispatchers", href: "/dispatchers" },
      { label: "Leaderboard", href: "/leaderboard" },
      { label: "Brokers", href: "/brokers" },
      { label: "Broker Leaderboard", href: "/brokers/leaderboard" },
      { label: "Trust & Risk Watchlist", href: "/watchlist" },
      { label: "Marketplace", href: "/marketplace" },
      { label: "My Leads", href: "/my-leads" },
      { label: "My Favorites", href: "/my-favorites" },
      { label: "Notifications", href: "/notifications", badge: "notifications" },
      { label: "My Profile", href: "/profile" },

      { label: "Admin Users", href: "/admin/users", adminOnly: true },
      { label: "Admin Claims", href: "/admin/claims", adminOnly: true },
      { label: "Admin Reports", href: "/admin/reports", adminOnly: true },
      { label: "Admin Verifications", href: "/admin/verifications", adminOnly: true },
      { label: "Admin Broker Reports", href: "/admin/broker-reports", adminOnly: true },
      { label: "Admin AI Flags", href: "/admin/ai-flags", adminOnly: true },
      { label: "Admin Debug", href: "/admin/debug", adminOnly: true },
      { label: "Scam Skeeter", href: "/admin/scam-skeeter", adminOnly: true },
    ],
    []
  );

  const refreshUnread = useCallback(async (uid: string | null) => {
    if (!uid) {
      setUnreadCount(0);
      return;
    }

    try {
      const count = await countUnreadNotifications(uid);
      setUnreadCount(count);
    } catch (e) {
      console.error("refreshUnread failed", e);
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initial = getCurrentUser();
    setUserEmail(initial?.email ?? null);

    const unsub = listenToAuth(async (u) => {
      if (!mounted) return;

      setUserEmail(u?.email ?? null);
      setChecking(true);

      try {
        if (!u) {
          if (!mounted) return;
          setAdmin(false);
          setUnreadCount(0);
          return;
        }

        const ok = await isAdmin();
        if (!mounted) return;

        setAdmin(ok);
        await refreshUnread(u.uid);
      } catch (e) {
        console.error("Sidebar auth sync failed", e);
        if (!mounted) return;
        setAdmin(false);
        setUnreadCount(0);
      } finally {
        if (mounted) setChecking(false);
      }
    });

    (async () => {
      try {
        if (initial) {
          const ok = await isAdmin();
          if (!mounted) return;

          setAdmin(ok);
          await refreshUnread(initial.uid);
        }
      } catch (e) {
        console.error("Sidebar initial load failed", e);
        if (!mounted) return;
        setAdmin(false);
        setUnreadCount(0);
      } finally {
        if (mounted) setChecking(false);
      }
    })();

    return () => {
      mounted = false;
      unsub();
    };
  }, [refreshUnread]);

  async function onLogout() {
    try {
      await logout();
      router.push("/login");
    } catch (e) {
      console.error("Logout failed", e);
    }
  }

  async function copyInviteLink() {
    setCopyState("idle");

    try {
      const origin =
        typeof window !== "undefined" && window.location?.origin
          ? window.location.origin
          : "";

      const link = `${origin}/dispatchers`;
      await navigator.clipboard.writeText(link);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1400);
    } catch (e) {
      console.error("copyInviteLink failed", e);
      setCopyState("failed");
      window.setTimeout(() => setCopyState("idle"), 1400);
    }
  }

  return (
    <aside className="sidebar">
      <div className="card pad sidebarCard">
        <div className="brand">{BRAND.ecosystem}</div>

        <div
          style={{
            fontWeight: 900,
            fontSize: 22,
            marginTop: 8,
            letterSpacing: "-0.02em",
            lineHeight: 1.08,
          }}
        >
          {BRAND.product}
        </div>

        <div className="tagline">
          Reviews, rankings, leads, favorites, marketplace trust signals, and risk monitoring — all in one place.
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
          <Link className="btn" href="/dispatchers">
            Dispatchers
          </Link>
          <Link className="btn secondary" href="/brokers">
            Brokers
          </Link>
        </div>

        <div className="hr" />

        <div
          className="row"
          style={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}
        >
          <div className="small">
            {userEmail ? (
              <>
                Signed in as <b>{userEmail}</b>
              </>
            ) : (
              <>Guest</>
            )}

            {checking ? (
              <span style={{ marginLeft: 8, opacity: 0.8 }}>• checking…</span>
            ) : admin ? (
              <span className="chip" style={{ marginLeft: 8 }}>
                Admin
              </span>
            ) : null}
          </div>

          {userEmail ? (
            <button className="btn ghost" onClick={onLogout} title="Logout" type="button">
              Logout
            </button>
          ) : (
            <Link className="btn ghost" href="/login">
              Login
            </Link>
          )}
        </div>

        <div className="hr" />

        <nav className="nav" aria-label="Sidebar navigation">
          {navItems
            .filter((item) => !item.adminOnly || admin)
            .map((item) => {
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={active ? "active" : ""}
                  aria-current={active ? "page" : undefined}
                >
                  <span>{item.label}</span>

                  {item.badge === "notifications" && unreadCount > 0 ? (
                    <span className="badge verified">{unreadCount}</span>
                  ) : null}
                </Link>
              );
            })}
        </nav>

        <div className="hr" />

        <div style={{ display: "grid", gap: 10 }}>
          <div className="small">Quick actions</div>

          <button className="btn secondary" onClick={copyInviteLink} type="button">
            {copyState === "copied"
              ? "Invite link copied ✓"
              : copyState === "failed"
              ? "Copy failed"
              : "Copy invite link"}
          </button>

          <Link className="btn secondary" href="/marketplace/new">
            Create listing
          </Link>
        </div>

        <div className="hr" />

        <ThemeSwitcher />

        <div className="hr" />

        <div className="footerNote">
          © {new Date().getFullYear()} {BRAND.product} — DispatchHub Ecosystem
        </div>
      </div>
    </aside>
  );
}