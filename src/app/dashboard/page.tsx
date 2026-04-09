"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, listenToAuth } from "@/lib/auth";
import { getUserProfile, type UserProfile } from "@/lib/userProfiles";
import { useToast } from "@/components/ToastProvider";
import UserRolePills from "@/components/ui/UserRolePills";

type DashboardStat = {
  label: string;
  value: string;
  hint?: string;
};

type DashboardAction = {
  label: string;
  href: string;
  secondary?: boolean;
};

export default function DashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const initialUser = useMemo(() => getCurrentUser(), []);
  const [uid, setUid] = useState<string | null>(initialUser?.uid ?? null);
  const [authReady, setAuthReady] = useState<boolean>(!!initialUser);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const unsub = listenToAuth((user) => {
      setAuthReady(true);

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
    if (!uid) {
      setLoading(false);
      return;
    }

    async function load(userId: string) {
      setLoading(true);

      try {
        const row = await getUserProfile(userId);
        setProfile(row);
      } catch (e: any) {
        console.error(e);
        showToast({
          tone: "error",
          title: "Failed to load dashboard",
          message: e?.message ?? "Something went wrong.",
        });
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }

    void load(uid);
  }, [uid, showToast]);

  if (!authReady) {
    return (
      <div className="container">
        <div className="small">Checking session…</div>
      </div>
    );
  }

  if (!uid) {
    return (
      <div className="container">
        <div className="small">Redirecting to login…</div>
      </div>
    );
  }

  if (loading || !profile) {
    return (
      <div className="container">
        <div className="small">Loading dashboard…</div>
      </div>
    );
  }

  const accountType = profile.accountType;
  const displayName = profile.displayName?.trim() || profile.email || "User";

  const heroTitle =
    accountType === "dispatcher"
      ? "Dispatcher Dashboard"
      : accountType === "carrier"
      ? "Carrier Dashboard"
      : accountType === "driver"
      ? profile.driverSubtype === "owner_operator"
        ? "Owner-Operator Dashboard"
        : "Driver Dashboard"
      : accountType === "broker"
      ? "Broker Dashboard"
      : "Dashboard";

  const heroSubtitle =
    accountType === "dispatcher"
      ? "Track your trust profile, verification progress, and public reputation signals."
      : accountType === "carrier"
      ? "Manage trust-first discovery, marketplace activity, and dispatcher research."
      : accountType === "driver"
      ? "Review trust signals, monitor risk alerts, and keep your preferred partners organized."
      : accountType === "broker"
      ? "Monitor your trust standing, profile visibility, and risk status across the platform."
      : "Complete your profile and choose an account type to unlock a tailored experience.";

  const stats = getDashboardStats(profile);
  const actions = getDashboardActions(profile);

  return (
    <div className="container">
      <div
        className="card"
        style={{
          padding: 20,
          marginTop: 2,
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
          <div style={{ maxWidth: 760 }}>
            <div className="small" style={{ opacity: 0.78, marginBottom: 8 }}>
              Welcome back
            </div>

            <h1 className="h1" style={{ marginBottom: 8 }}>
              {heroTitle}
            </h1>

            <div className="small" style={{ fontSize: 15, opacity: 0.92 }}>
              {displayName} — {heroSubtitle}
            </div>
          </div>

          <div style={{ minWidth: 240 }}>
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
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="card"
              style={{
                padding: 16,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="small" style={{ opacity: 0.75 }}>
                {stat.label}
              </div>

              <div
                style={{
                  fontSize: 26,
                  fontWeight: 900,
                  lineHeight: 1.1,
                  marginTop: 8,
                }}
              >
                {stat.value}
              </div>

              {stat.hint ? (
                <div className="small" style={{ marginTop: 8, opacity: 0.88 }}>
                  {stat.hint}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 14,
          marginTop: 14,
        }}
      >
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>Recommended actions</div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
              marginTop: 14,
            }}
          >
            {actions.map((action) => (
              <Link
                key={`${action.href}-${action.label}`}
                href={action.href}
                className={action.secondary ? "btn secondary" : "btn"}
                style={{ textAlign: "center" }}
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>Account summary</div>

          <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
            <SummaryRow
              label="Permissions"
              value={
                profile.platformRole === "super_admin"
                  ? "Super Admin"
                  : profile.platformRole === "admin"
                  ? "Admin"
                  : "User"
              }
            />

            <SummaryRow
              label="Account type"
              value={
                profile.accountType === "dispatcher"
                  ? "Dispatcher"
                  : profile.accountType === "carrier"
                  ? "Carrier"
                  : profile.accountType === "driver"
                  ? "Driver"
                  : profile.accountType === "broker"
                  ? "Broker"
                  : "Not selected"
              }
            />

            <SummaryRow
              label="Driver subtype"
              value={
                profile.driverSubtype === "owner_operator"
                  ? "Owner Operator"
                  : profile.driverSubtype === "company_driver"
                  ? "Company Driver"
                  : "—"
              }
            />

            <SummaryRow
              label="Verification"
              value={
                profile.verificationStatus === "verified"
                  ? "Verified"
                  : profile.verificationStatus === "pending"
                  ? "Pending"
                  : "Unverified"
              }
            />

            <SummaryRow
              label="Tier"
              value={
                profile.tier === "tier1"
                  ? "Tier 1"
                  : profile.tier === "tier2"
                  ? "Tier 2"
                  : "Tier 3"
              }
            />

            <SummaryRow
              label="AI risk"
              value={
                profile.aiRiskLevel
                  ? `${String(profile.aiRiskLevel).toUpperCase()} (${profile.aiRiskScore ?? 0})`
                  : "LOW (0)"
              }
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <Link href="/profile" className="btn secondary" style={{ width: "100%", textAlign: "center" }}>
              Edit Profile
            </Link>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 14,
          marginTop: 14,
        }}
      >
        <RolePanel profile={profile} />
        <RiskPanel profile={profile} />
        <GrowthPanel profile={profile} />
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 10,
        alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        paddingBottom: 8,
      }}
    >
      <div className="small" style={{ opacity: 0.75 }}>
        {label}
      </div>
      <div className="small" style={{ fontWeight: 800, textAlign: "right" }}>
        {value}
      </div>
    </div>
  );
}

function RolePanel({ profile }: { profile: UserProfile }) {
  const accountType = profile.accountType;

  const title =
    accountType === "dispatcher"
      ? "Dispatcher focus"
      : accountType === "carrier"
      ? "Carrier focus"
      : accountType === "driver"
      ? "Driver focus"
      : accountType === "broker"
      ? "Broker focus"
      : "Complete your setup";

  const body =
    accountType === "dispatcher"
      ? "Strengthen public trust with verification, a strong tier, and low AI risk. Your visibility will matter more as reviews grow."
      : accountType === "carrier"
      ? "Use the platform to research dispatchers, compare risk signals, and track trustworthy operating partners."
      : accountType === "driver"
      ? "Use trust signals before working with dispatchers or brokers. Save the best contacts and avoid risky setups."
      : accountType === "broker"
      ? "Monitor how your profile appears across broker-focused trust surfaces and keep risk status under control."
      : "Choose an account type in your profile so the platform can personalize your dashboard and workflows.";

  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ fontWeight: 900, fontSize: 18 }}>{title}</div>
      <div className="small" style={{ marginTop: 10, opacity: 0.9 }}>
        {body}
      </div>
      <div style={{ marginTop: 16 }}>
        <Link href="/profile" className="btn secondary">
          {accountType ? "Refine profile setup" : "Choose account type"}
        </Link>
      </div>
    </div>
  );
}

function RiskPanel({ profile }: { profile: UserProfile }) {
  const aiLevel = String(profile.aiRiskLevel ?? "low");
  const aiScore = typeof profile.aiRiskScore === "number" ? profile.aiRiskScore : 0;

  const tone =
    aiLevel === "critical" || aiLevel === "high"
      ? "#ffb0b0"
      : aiLevel === "medium"
      ? "#ffd27a"
      : "#9fd8ff";

  const text =
    aiLevel === "critical" || aiLevel === "high"
      ? "Your trust or moderation layer needs attention. Review your profile and reduce risk signals."
      : aiLevel === "medium"
      ? "You have some cautionary signals. Strengthening your trust profile would help."
      : "Your current AI risk posture looks stable.";

  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ fontWeight: 900, fontSize: 18 }}>Risk posture</div>
      <div style={{ marginTop: 10, fontSize: 28, fontWeight: 900, color: tone }}>
        {aiLevel.toUpperCase()}
      </div>
      <div className="small" style={{ marginTop: 6 }}>
        Risk score: {aiScore}
      </div>
      <div className="small" style={{ marginTop: 10, opacity: 0.9 }}>
        {text}
      </div>
      <div style={{ marginTop: 16 }}>
        <Link href="/watchlist" className="btn secondary">
          Open Watchlist
        </Link>
      </div>
    </div>
  );
}

function GrowthPanel({ profile }: { profile: UserProfile }) {
  const verified = profile.verificationStatus === "verified";
  const pending = profile.verificationStatus === "pending";

  const title = verified
    ? "Trust advantage active"
    : pending
    ? "Verification in progress"
    : "Unlock more trust";

  const text = verified
    ? "Your verified status gives stronger public confidence and better positioning across trust surfaces."
    : pending
    ? "Your verification request is pending review. Keep your profile accurate while it is being processed."
    : "Request verification to improve your trust signals, profile credibility, and visibility.";

  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ fontWeight: 900, fontSize: 18 }}>{title}</div>
      <div className="small" style={{ marginTop: 10, opacity: 0.9 }}>
        {text}
      </div>
      <div style={{ marginTop: 16 }}>
        <Link href="/profile" className="btn secondary">
          {verified ? "View profile" : pending ? "Review profile" : "Request verification"}
        </Link>
      </div>
    </div>
  );
}

function getDashboardStats(profile: UserProfile): DashboardStat[] {
  const verifiedText =
    profile.verificationStatus === "verified"
      ? "Verified"
      : profile.verificationStatus === "pending"
      ? "Pending"
      : "Unverified";

  const aiScore = typeof profile.aiRiskScore === "number" ? String(profile.aiRiskScore) : "0";
  const aiLevel = String(profile.aiRiskLevel ?? "low").toUpperCase();

  const base: DashboardStat[] = [
    {
      label: "Verification",
      value: verifiedText,
      hint: "Trust signal used across the platform.",
    },
    {
      label: "Tier",
      value:
        profile.tier === "tier1"
          ? "Tier 1"
          : profile.tier === "tier2"
          ? "Tier 2"
          : "Tier 3",
      hint: "Internal trust level for visibility and confidence.",
    },
    {
      label: "AI Risk",
      value: aiLevel,
      hint: `Current risk score: ${aiScore}`,
    },
  ];

  if (profile.accountType === "dispatcher") {
    return [
      ...base,
      {
        label: "Dispatcher profile",
        value: "Active",
        hint: "Keep trust signals clean and verification strong.",
      },
    ];
  }

  if (profile.accountType === "carrier") {
    return [
      ...base,
      {
        label: "Carrier mode",
        value: "Research",
        hint: "Use trust layers to compare dispatchers and brokers.",
      },
    ];
  }

  if (profile.accountType === "driver") {
    return [
      ...base,
      {
        label: "Driver type",
        value:
          profile.driverSubtype === "owner_operator"
            ? "Owner-Op"
            : profile.driverSubtype === "company_driver"
            ? "Company Driver"
            : "Driver",
        hint: "Your dashboard should reflect how you operate.",
      },
    ];
  }

  if (profile.accountType === "broker") {
    return [
      ...base,
      {
        label: "Broker profile",
        value: "Monitored",
        hint: "Watch your trust standing and risk status.",
      },
    ];
  }

  return [
    ...base,
    {
      label: "Account setup",
      value: "Incomplete",
      hint: "Choose an account type for a more targeted dashboard.",
    },
  ];
}

function getDashboardActions(profile: UserProfile): DashboardAction[] {
  if (profile.accountType === "dispatcher") {
    return [
      { label: "Open Dispatchers", href: "/dispatchers" },
      { label: "Open Leaderboard", href: "/leaderboard", secondary: true },
      { label: "Open Watchlist", href: "/watchlist", secondary: true },
      { label: "Edit Profile", href: "/profile", secondary: true },
    ];
  }

  if (profile.accountType === "carrier") {
    return [
      { label: "Browse Dispatchers", href: "/dispatchers" },
      { label: "Browse Brokers", href: "/brokers", secondary: true },
      { label: "Marketplace", href: "/marketplace", secondary: true },
      { label: "Trust & Risk Watchlist", href: "/watchlist", secondary: true },
    ];
  }

  if (profile.accountType === "driver") {
    return [
      { label: "Browse Dispatchers", href: "/dispatchers" },
      { label: "Browse Brokers", href: "/brokers", secondary: true },
      { label: "My Favorites", href: "/my-favorites", secondary: true },
      { label: "Watchlist", href: "/watchlist", secondary: true },
    ];
  }

  if (profile.accountType === "broker") {
    return [
      { label: "Open Brokers", href: "/brokers" },
      { label: "Broker Leaderboard", href: "/brokers/leaderboard", secondary: true },
      { label: "Watchlist", href: "/watchlist", secondary: true },
      { label: "Edit Profile", href: "/profile", secondary: true },
    ];
  }

  return [
    { label: "Complete Profile", href: "/profile" },
    { label: "Browse Dispatchers", href: "/dispatchers", secondary: true },
    { label: "Browse Brokers", href: "/brokers", secondary: true },
    { label: "Open Watchlist", href: "/watchlist", secondary: true },
  ];
}