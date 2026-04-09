"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCurrentUser, getPlatformRole, listenToAuth, isAdmin } from "@/lib/auth";
import { useToast } from "@/components/ToastProvider";
import {
  listUserProfiles,
  updateUserRoleTierVerification,
  overrideAIFlag,
  type AccountType,
  type DriverSubtype,
  type PlatformRole,
  type UserProfile,
  type UserTier,
  type VerificationStatus,
} from "@/lib/userProfiles";
import UserRolePills from "@/components/ui/UserRolePills";

const PLATFORM_ROLE_OPTIONS: PlatformRole[] = [
  "super_admin",
  "admin",
  "user",
];

const ACCOUNT_TYPE_OPTIONS: Array<{ value: "" | Exclude<AccountType, null>; label: string }> = [
  { value: "", label: "None / General User" },
  { value: "dispatcher", label: "Dispatcher" },
  { value: "carrier", label: "Carrier" },
  { value: "driver", label: "Driver" },
  { value: "broker", label: "Broker" },
];

const VERIFICATION_OPTIONS: Array<{ value: VerificationStatus; label: string }> = [
  { value: "unverified", label: "Unverified" },
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
];

const TIER_OPTIONS: Array<{ value: UserTier; label: string }> = [
  { value: "tier1", label: "Tier 1" },
  { value: "tier2", label: "Tier 2" },
  { value: "tier3", label: "Tier 3" },
];

const DRIVER_SUBTYPE_OPTIONS: Array<{ value: "" | Exclude<DriverSubtype, null>; label: string }> = [
  { value: "", label: "None" },
  { value: "owner_operator", label: "Owner Operator" },
  { value: "company_driver", label: "Company Driver" },
];

export default function AdminUsersPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyUid, setBusyUid] = useState<string | null>(null);

  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<PlatformRole>("user");

  const [items, setItems] = useState<UserProfile[]>([]);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);

    try {
      const rows = await listUserProfiles();
      setItems(rows);
    } catch (e: any) {
      console.error(e);
      showToast({
        tone: "error",
        title: "Failed to load users",
        message: e?.message ?? "Something went wrong.",
      });
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const unsub = listenToAuth(async (u) => {
      if (!u) {
        router.push("/login");
        return;
      }

      const ok = await isAdmin(true);
      if (!ok) {
        router.push("/");
        return;
      }

      const role = await getPlatformRole();
      const current = getCurrentUser();

      setCurrentUid(current?.uid ?? u.uid);
      setCurrentRole(role);
      setReady(true);

      await load();
    });

    return () => unsub();
  }, [router]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;

    return items.filter((u) => {
      const hay = [
        u.email ?? "",
        u.displayName ?? "",
        u.platformRole ?? "",
        u.accountType ?? "",
        u.driverSubtype ?? "",
        u.verificationStatus ?? "",
        u.tier ?? "",
        u.aiOverrideReason ?? "",
        u.aiRiskLevel ?? "",
        ...(u.aiSignals ?? []),
      ]
        .join(" ")
        .toLowerCase();

      return hay.includes(needle);
    });
  }, [items, q]);

  async function saveUser(input: {
    uid: string;
    platformRole: PlatformRole;
    accountType: AccountType;
    driverSubtype: DriverSubtype;
    verificationStatus: VerificationStatus;
    tier: UserTier;
    originalPlatformRole: PlatformRole;
  }) {
    if (currentRole !== "super_admin") {
      if (
        input.originalPlatformRole === "super_admin" ||
        input.platformRole === "super_admin"
      ) {
        showToast({
          tone: "error",
          title: "Only super admin can manage super admin role",
        });
        return;
      }
    }

    if (
      currentRole === "super_admin" &&
      input.uid === currentUid &&
      input.platformRole !== "super_admin"
    ) {
      showToast({
        tone: "error",
        title: "You cannot demote your own super admin account",
      });
      return;
    }

    try {
      setBusyUid(input.uid);

      await updateUserRoleTierVerification({
        uid: input.uid,
        platformRole: input.platformRole,
        verificationStatus: input.verificationStatus,
        tier: input.tier,
        accountType: input.accountType,
        driverSubtype: input.accountType === "driver" ? input.driverSubtype : null,
      });

      await load();

      showToast({
        tone: "success",
        title: "User updated",
        message: "Permissions, account type, verification, and tier saved.",
      });
    } catch (e: any) {
      console.error(e);
      showToast({
        tone: "error",
        title: "Failed to update user",
        message: e?.message ?? "Something went wrong.",
      });
    } finally {
      setBusyUid(null);
    }
  }

  async function saveAIOverride(input: {
    uid: string;
    aiFlagged: boolean;
    aiOverrideReason: string;
  }) {
    try {
      setBusyUid(input.uid);

      await overrideAIFlag({
        uid: input.uid,
        aiFlagged: input.aiFlagged,
        aiOverrideReason: input.aiOverrideReason,
      });

      await load();

      showToast({
        tone: "success",
        title: "AI override saved",
        message: input.aiFlagged
          ? "User is now manually AI flagged."
          : "AI flag has been manually cleared.",
      });
    } catch (e: any) {
      console.error(e);
      showToast({
        tone: "error",
        title: "Failed to save AI override",
        message: e?.message ?? "Something went wrong.",
      });
    } finally {
      setBusyUid(null);
    }
  }

  if (!ready) {
    return (
      <div className="container">
        <div className="small">Checking admin access…</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h1 className="h1" style={{ marginBottom: 6 }}>
            Admin Users
          </h1>

          <div className="small" style={{ opacity: 0.92 }}>
            Manage permissions, account type, driver subtype, verification, tier, and AI override controls.
          </div>
        </div>

        <div className="row wrap" style={{ gap: 10 }}>
          <Link className="btn secondary" href="/admin/claims">
            Admin Claims
          </Link>

          <button
            className="btn secondary"
            type="button"
            onClick={load}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <input
          className="input"
          style={{ maxWidth: 440 }}
          placeholder="Search users, account types, AI signals, or notes..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="small" style={{ marginTop: 16 }}>Loading users…</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: 16, marginTop: 14 }}>
          <div style={{ fontWeight: 900 }}>No users found</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          {filtered.map((u) => (
            <AdminUserCard
              key={u.uid}
              user={u}
              busy={busyUid === u.uid}
              currentRole={currentRole}
              currentUid={currentUid}
              onSave={saveUser}
              onSaveAIOverride={saveAIOverride}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AdminUserCard({
  user,
  busy,
  currentRole,
  currentUid,
  onSave,
  onSaveAIOverride,
}: {
  user: UserProfile;
  busy: boolean;
  currentRole: PlatformRole;
  currentUid: string | null;
  onSave: (input: {
    uid: string;
    platformRole: PlatformRole;
    accountType: AccountType;
    driverSubtype: DriverSubtype;
    verificationStatus: VerificationStatus;
    tier: UserTier;
    originalPlatformRole: PlatformRole;
  }) => Promise<void>;
  onSaveAIOverride: (input: {
    uid: string;
    aiFlagged: boolean;
    aiOverrideReason: string;
  }) => Promise<void>;
}) {
  const [platformRole, setPlatformRole] = useState<PlatformRole>(user.platformRole);
  const [accountType, setAccountType] = useState<AccountType>(user.accountType ?? null);
  const [driverSubtype, setDriverSubtype] = useState<DriverSubtype>(user.driverSubtype ?? null);
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>(user.verificationStatus);
  const [tier, setTier] = useState<UserTier>(user.tier);

  const [aiFlagged, setAiFlagged] = useState<boolean>(user.aiFlagged === true);
  const [aiOverrideReason, setAiOverrideReason] = useState<string>(
    user.aiOverrideReason ?? ""
  );

  const isProtectedSuperAdmin =
    user.platformRole === "super_admin" && currentRole !== "super_admin";

  const isOwnSuperAdminRow =
    currentRole === "super_admin" &&
    currentUid === user.uid &&
    user.platformRole === "super_admin";

  return (
    <div className="card" style={{ padding: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 14,
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>
            {user.displayName || "Unnamed User"}
          </div>

          <div className="small" style={{ marginTop: 4 }}>
            {user.email || "No email"}
          </div>

          <div className="small" style={{ marginTop: 4 }}>
            UID: {user.uid}
          </div>

          <div className="small" style={{ marginTop: 8 }}>
            <b>Permissions:</b> {platformRole}
          </div>

          <div className="small" style={{ marginTop: 4 }}>
            <b>Account type:</b> {accountType ?? "none"}
          </div>

          <div className="small" style={{ marginTop: 4 }}>
            <b>Driver subtype:</b> {driverSubtype ?? "none"}
          </div>

          <div style={{ marginTop: 12 }}>
            <UserRolePills
              profile={{
                platformRole,
                verificationStatus,
                tier,
                driverType: driverSubtype ?? null,
                accountType: accountType ?? null,
              }}
            />
          </div>

          <div className="row wrap" style={{ gap: 8, marginTop: 12 }}>
            {user.aiFlagged ? (
              <span
                className="badge"
                style={{
                  background: "rgba(255, 68, 68, 0.16)",
                  border: "1px solid rgba(255, 68, 68, 0.34)",
                  color: "#ffb0b0",
                  fontWeight: 800,
                }}
              >
                AI FLAGGED
              </span>
            ) : (
              <span className="badge">AI not flagged</span>
            )}

            {user.aiOverride ? (
              <span className="badge">Manual override</span>
            ) : null}

            {user.aiRiskLevel ? (
              <span className="badge">AI level: {user.aiRiskLevel}</span>
            ) : null}

            {typeof user.aiRiskScore === "number" ? (
              <span className="badge">AI score: {user.aiRiskScore}</span>
            ) : null}
          </div>

          {user.aiSignals && user.aiSignals.length > 0 ? (
            <div className="small" style={{ marginTop: 10 }}>
              <b>AI signals:</b> {user.aiSignals.join(" • ")}
            </div>
          ) : null}

          {isProtectedSuperAdmin ? (
            <div className="small" style={{ marginTop: 10, opacity: 0.85 }}>
              Only super admin can modify this account.
            </div>
          ) : null}

          {isOwnSuperAdminRow ? (
            <div className="small" style={{ marginTop: 10, opacity: 0.85 }}>
              Your super admin role is protected from self-demotion.
            </div>
          ) : null}
        </div>

        <div style={{ minWidth: 360, display: "grid", gap: 10 }}>
          <select
            className="input"
            value={platformRole}
            onChange={(e) => setPlatformRole(e.target.value as PlatformRole)}
            disabled={busy || isProtectedSuperAdmin}
          >
            {PLATFORM_ROLE_OPTIONS.filter(
              (x) => currentRole === "super_admin" || x !== "super_admin"
            ).map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>

          <select
            className="input"
            value={accountType ?? ""}
            onChange={(e) =>
              setAccountType(
                e.target.value === "" ? null : (e.target.value as AccountType)
              )
            }
            disabled={busy || isProtectedSuperAdmin}
          >
            {ACCOUNT_TYPE_OPTIONS.map((x) => (
              <option key={x.value || "none"} value={x.value}>
                {x.label}
              </option>
            ))}
          </select>

          <select
            className="input"
            value={driverSubtype ?? ""}
            onChange={(e) =>
              setDriverSubtype(
                e.target.value === "" ? null : (e.target.value as DriverSubtype)
              )
            }
            disabled={busy || isProtectedSuperAdmin || accountType !== "driver"}
          >
            {DRIVER_SUBTYPE_OPTIONS.map((x) => (
              <option key={x.value || "none"} value={x.value}>
                {x.label}
              </option>
            ))}
          </select>

          <select
            className="input"
            value={verificationStatus}
            onChange={(e) => setVerificationStatus(e.target.value as VerificationStatus)}
            disabled={busy || isProtectedSuperAdmin}
          >
            {VERIFICATION_OPTIONS.map((x) => (
              <option key={x.value} value={x.value}>
                {x.label}
              </option>
            ))}
          </select>

          <select
            className="input"
            value={tier}
            onChange={(e) => setTier(e.target.value as UserTier)}
            disabled={busy || isProtectedSuperAdmin}
          >
            {TIER_OPTIONS.map((x) => (
              <option key={x.value} value={x.value}>
                {x.label}
              </option>
            ))}
          </select>

          <button
            className="btn"
            type="button"
            disabled={busy || isProtectedSuperAdmin}
            onClick={() =>
              onSave({
                uid: user.uid,
                platformRole,
                accountType,
                driverSubtype,
                verificationStatus,
                tier,
                originalPlatformRole: user.platformRole,
              })
            }
          >
            {busy ? "Saving..." : "Save User"}
          </button>

          <div
            className="card"
            style={{
              padding: 12,
              marginTop: 4,
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 10 }}>AI override controls</div>

            <label className="row" style={{ gap: 8, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={aiFlagged}
                onChange={(e) => setAiFlagged(e.target.checked)}
                disabled={busy || isProtectedSuperAdmin}
              />
              <span className="small">Force AI flagged state</span>
            </label>

            <textarea
              className="input"
              style={{ marginTop: 10, minHeight: 90 }}
              placeholder="Override reason..."
              value={aiOverrideReason}
              onChange={(e) => setAiOverrideReason(e.target.value)}
              disabled={busy || isProtectedSuperAdmin}
            />

            <button
              className="btn secondary"
              type="button"
              style={{ marginTop: 10 }}
              disabled={busy || isProtectedSuperAdmin}
              onClick={() =>
                onSaveAIOverride({
                  uid: user.uid,
                  aiFlagged,
                  aiOverrideReason,
                })
              }
            >
              {busy ? "Saving..." : "Save AI Override"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}