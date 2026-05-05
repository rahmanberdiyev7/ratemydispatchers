"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AuthRedirectGate from "@/components/auth/AuthRedirectGate";
import { getCurrentUser, listenToAuth } from "@/lib/auth";
import { getUserProfile, type UserProfile } from "@/lib/userProfiles";
import UserRolePills from "@/components/ui/UserRolePills";

type DashboardCard = {
  title: string;
  description: string;
  href: string;
  primary?: boolean;
};

function getAccountTitle(profile: UserProfile) {
  if (profile.accountType === "dispatcher") return "Dispatcher Dashboard";
  if (profile.accountType === "carrier") return "Carrier Dashboard";
  if (profile.accountType === "broker") return "Broker Dashboard";

  if (profile.accountType === "driver") {
    if (profile.driverSubtype === "owner_operator") {
      return "Owner-Operator Dashboard";
    }

    if (profile.driverSubtype === "company_driver") {
      return "Company Driver Dashboard";
    }

    return "Driver Dashboard";
  }

  return "Dashboard";
}

function getAccountSubtitle(profile: UserProfile) {
  if (profile.accountType === "dispatcher") {
    return "Manage your reputation, reviews, trust signals, and verification status.";
  }

  if (profile.accountType === "carrier") {
    return "Research dispatchers and brokers before you work with them.";
  }

  if (profile.accountType === "broker") {
    return "Monitor your broker trust profile, reviews, and public risk signals.";
  }

  if (profile.accountType === "driver") {
    if (profile.driverSubtype === "owner_operator") {
      return "Find trustworthy dispatchers, brokers, and partners as an owner-operator.";
    }

    return "Review dispatchers, monitor risk signals, and manage your trusted contacts.";
  }

  return "Complete your profile to unlock your role-specific dashboard.";
}

function getDashboardCards(profile: UserProfile): DashboardCard[] {
  if (profile.accountType === "dispatcher") {
    return [
      {
        title: "View Dispatcher Directory",
        description: "See how dispatcher profiles appear publicly.",
        href: "/dispatchers",
        primary: true,
      },
      {
        title: "Leaderboard",
        description: "Track top dispatcher rankings and trust signals.",
        href: "/leaderboard",
      },
      {
        title: "Risk Watchlist",
        description: "Monitor dispatcher and broker risk signals.",
        href: "/watchlist",
      },
      {
        title: "Profile & Verification",
        description: "Update your account type, tier, and verification request.",
        href: "/profile",
      },
    ];
  }

  if (profile.accountType === "carrier") {
    return [
      {
        title: "Browse Dispatchers",
        description: "Find and compare dispatchers before working together.",
        href: "/dispatchers",
        primary: true,
      },
      {
        title: "Browse Brokers",
        description: "Review broker trust signals and public profiles.",
        href: "/brokers",
      },
      {
        title: "Trust & Risk Watchlist",
        description: "Check high-risk dispatcher and broker profiles.",
        href: "/watchlist",
      },
      {
        title: "Marketplace",
        description: "Explore marketplace listings and opportunities.",
        href: "/marketplace",
      },
    ];
  }

  if (profile.accountType === "broker") {
    return [
      {
        title: "Broker Directory",
        description: "See how brokers appear in the public trust layer.",
        href: "/brokers",
        primary: true,
      },
      {
        title: "Broker Leaderboard",
        description: "Review broker rankings and public trust scores.",
        href: "/brokers/leaderboard",
      },
      {
        title: "Risk Watchlist",
        description: "Monitor risk watchlist visibility.",
        href: "/watchlist",
      },
      {
        title: "Profile & Verification",
        description: "Keep your broker account information accurate.",
        href: "/profile",
      },
    ];
  }

  if (profile.accountType === "driver") {
    return [
      {
        title: "Browse Dispatchers",
        description: "Find dispatchers with better reviews and safer signals.",
        href: "/dispatchers",
        primary: true,
      },
      {
        title: "Browse Brokers",
        description: "Check broker profiles before accepting loads.",
        href: "/brokers",
      },
      {
        title: "Risk Watchlist",
        description: "Avoid suspicious dispatchers and brokers.",
        href: "/watchlist",
      },
      {
        title: "My Favorites",
        description: "Track preferred dispatchers and partners.",
        href: "/my-favorites",
      },
    ];
  }

  return [
    {
      title: "Complete Profile",
      description: "Choose Dispatcher, Carrier, Broker, or Driver account type.",
      href: "/profile",
      primary: true,
    },
    {
      title: "Browse Dispatchers",
      description: "Explore dispatcher reviews and trust signals.",
      href: "/dispatchers",
    },
    {
      title: "Browse Brokers",
      description: "Explore broker profiles and trust signals.",
      href: "/brokers",
    },
    {
      title: "Watchlist",
      description: "View public risk watchlist signals.",
      href: "/watchlist",
    },
  ];
}

function getAccountTypeLabel(profile: UserProfile) {
  if (profile.accountType === "dispatcher") return "Dispatcher";
  if (profile.accountType === "carrier") return "Carrier";
  if (profile.accountType === "broker") return "Broker";

  if (profile.accountType === "driver") {
    if (profile.driverSubtype === "owner_operator") return "Owner-Operator";
    if (profile.driverSubtype === "company_driver") return "Company Driver";
    return "Driver";
  }

  return "Not selected";
}

function getVerificationLabel(profile: UserProfile) {
  if (profile.verificationStatus === "verified") return "Verified";
  if (profile.verificationStatus === "pending") return "Pending";
  return "Unverified";
}

function getTierLabel(profile: UserProfile) {
  if (profile.tier === "tier3") return "Tier 3";
  if (profile.tier === "tier2") return "Tier 2";
  return "Tier 1";
}

function DashboardInner() {
  const router = useRouter();

  const initialUser = useMemo(() => getCurrentUser(), []);
  const [uid, setUid] = useState<string | null>(initialUser?.uid ?? null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = listenToAuth((user) => {
      if (!user) {
        setUid(null);
        router.push("/login");
        return;
      }

      setUid(user.uid);
    });

    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!uid) return;

    async function loadProfile(userId: string) {
      setLoading(true);

      try {
        const row = await getUserProfile(userId);
        setProfile(row);
      } catch (error) {
        console.error("Failed to load dashboard profile", error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }

    void loadProfile(uid);
  }, [uid]);

  if (loading || !profile) {
    return (
      <div className="container">
        <div className="small">Loading dashboard…</div>
      </div>
    );
  }

  const cards = getDashboardCards(profile);

  return (
    <div className="container">
      <div
        className="card"
        style={{
          padding: 22,
          display: "grid",
          gap: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 14,
            flexWrap: "wrap",
            alignItems: "flex-start",
          }}
        >
          <div>
            <h1 className="h1" style={{ marginBottom: 8 }}>
              {getAccountTitle(profile)}
            </h1>

            <div className="small" style={{ opacity: 0.92, fontSize: 15 }}>
              {getAccountSubtitle(profile)}
            </div>
          </div>

          <UserRolePills
            profile={{
              platformRole: profile.platformRole,
              verificationStatus: profile.verificationStatus,
              tier: profile.tier,
              driverType: profile.driverSubtype ?? null,
              accountType: profile.accountType ?? null,
            }}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: 12,
            marginTop: 4,
          }}
        >
          <div className="card" style={{ padding: 14 }}>
            <div className="small" style={{ opacity: 0.75 }}>
              Account Type
            </div>
            <div style={{ fontWeight: 900, fontSize: 20, marginTop: 6 }}>
              {getAccountTypeLabel(profile)}
            </div>
          </div>

          <div className="card" style={{ padding: 14 }}>
            <div className="small" style={{ opacity: 0.75 }}>
              Verification
            </div>
            <div style={{ fontWeight: 900, fontSize: 20, marginTop: 6 }}>
              {getVerificationLabel(profile)}
            </div>
          </div>

          <div className="card" style={{ padding: 14 }}>
            <div className="small" style={{ opacity: 0.75 }}>
              Trust Tier
            </div>
            <div style={{ fontWeight: 900, fontSize: 20, marginTop: 6 }}>
              {getTierLabel(profile)}
            </div>
          </div>

          <div className="card" style={{ padding: 14 }}>
            <div className="small" style={{ opacity: 0.75 }}>
              AI Risk
            </div>
            <div style={{ fontWeight: 900, fontSize: 20, marginTop: 6 }}>
              {profile.aiRiskLevel ? String(profile.aiRiskLevel).toUpperCase() : "LOW"}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          marginTop: 16,
        }}
      >
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="card"
            style={{
              padding: 18,
              textDecoration: "none",
              color: "inherit",
              border: card.primary
                ? "1px solid rgba(110, 168, 255, 0.42)"
                : "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 17 }}>{card.title}</div>
            <div className="small" style={{ marginTop: 8, opacity: 0.88 }}>
              {card.description}
            </div>
            <div style={{ marginTop: 14 }}>
              <span className={card.primary ? "btn" : "btn secondary"}>
                Open
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthRedirectGate>
      <DashboardInner />
    </AuthRedirectGate>
  );
}