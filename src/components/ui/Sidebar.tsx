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
      className={active ? "sidebarLink sidebarLinkActive" : "sidebarLink"}
    >
      {active ? <span className="sidebarActiveBar" /> : null}
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
    <section className="sidebarSection">
      <div className="sidebarSectionTitle">{title}</div>

      <div className="sidebarNavGroup">
        {items.map((item) => (
          <NavLink
            key={item.href}
            label={item.label}
            href={item.href}
            pathname={pathname}
          />
        ))}
      </div>
    </section>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const user = auth.currentUser;

  return (
    <aside className="rmdSidebar">
      <div className="sidebarGlow sidebarGlowOne" />
      <div className="sidebarGlow sidebarGlowTwo" />

      <div className="sidebarInner">
        <div className="sidebarBrand">
          <div className="sidebarEyebrow">DispatchHub Ecosystem</div>
          <div className="sidebarLogo">RateMyDispatchers</div>
          <p className="sidebarText">
            DispatchGuard trust intelligence for brokers, carriers,
            dispatchers, and drivers.
          </p>
        </div>

        <div className="sidebarPrimaryActions">
          <Link href="/dispatchguard" className="sidebarPrimaryButton">
            DispatchGuard
          </Link>

          <Link href="/marketplace" className="sidebarSecondaryButton">
            Marketplace
          </Link>
        </div>

        <div className="sidebarAuth">
          {user ? (
            <>
              <div className="sidebarMuted">Signed in as</div>

              <div className="sidebarEmail">{user.email}</div>

              <button className="sidebarLogout" onClick={() => auth.signOut()}>
                Logout
              </button>
            </>
          ) : (
            <div className="sidebarGuestRow">
              <span className="sidebarMuted">Guest</span>

              <Link href="/login" className="sidebarLoginButton">
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

        <div className="sidebarQuickActions">
          <div className="sidebarSectionTitle">Quick actions</div>

          <Link href="/marketplace/new" className="sidebarPillButton">
            Create Listing
          </Link>

          <Link href="/profile" className="sidebarPillButton">
            Update Profile
          </Link>
        </div>
      </div>
    </aside>
  );
}