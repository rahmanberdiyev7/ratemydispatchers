"use client";

import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";

const adminCards = [
  {
    title: "DispatchGuard Reports",
    text: "Review fraud, double brokering, safety, payment, and operational risk reports.",
    href: "/admin/reports",
  },
  {
    title: "Identity Shield",
    text: "Review impersonation alerts, fake emails, fake phones, fake domains, and fake load-board activity.",
    href: "/admin/identity-shield",
  },
  {
    title: "Users",
    text: "Review user accounts, roles, verification status, and account types.",
    href: "/admin/users",
  },
  {
    title: "Trust Entities",
    text: "Review brokers, carriers, dispatchers, and drivers in the unified DispatchGuard trust graph.",
    href: "/dispatchguard",
  },
];

export default function AdminHomePage() {
  return (
    <AdminGuard>
      <div className="container">
        <div className="card" style={{ padding: 24 }}>
          <h1 className="h1">Admin Command Center</h1>

          <div className="small" style={{ marginTop: 10, maxWidth: 900 }}>
            Manage DispatchGuard™, Identity Shield, user roles, reports,
            verification, and trust infrastructure.
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
            gap: 14,
            marginTop: 18,
          }}
        >
          {adminCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="card"
              style={{
                padding: 18,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div style={{ fontWeight: 1000, fontSize: 20 }}>
                {card.title}
              </div>

              <div className="small" style={{ marginTop: 8, lineHeight: 1.6 }}>
                {card.text}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AdminGuard>
  );
}