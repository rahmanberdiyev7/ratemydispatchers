"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, listenToAuth } from "@/lib/auth";
import { useToast } from "@/components/ToastProvider";
import {
  getUserProfile,
  requestVerification,
  updateMyProfileRoleData,
  type AccountType,
  type DriverSubtype,
  type UserProfile,
} from "@/lib/userProfiles";
import UserRolePills from "@/components/ui/UserRolePills";

const ACCOUNT_OPTIONS: { value: Exclude<AccountType, null> | ""; label: string }[] = [
  { value: "", label: "General User" },
  { value: "dispatcher", label: "Dispatcher" },
  { value: "carrier", label: "Carrier" },
  { value: "driver", label: "Driver" },
  { value: "broker", label: "Broker" },
];

export default function ProfilePage() {
  const router = useRouter();
  const { showToast } = useToast();

  const initialUser = useMemo(() => getCurrentUser(), []);
  const [uid, setUid] = useState<string | null>(initialUser?.uid ?? null);
  const [authReady, setAuthReady] = useState<boolean>(!!initialUser);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verificationBusy, setVerificationBusy] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [accountType, setAccountType] = useState<AccountType>(null);
  const [driverSubtype, setDriverSubtype] = useState<DriverSubtype>(null);

  useEffect(() => {
    const unsub = listenToAuth((u) => {
      setAuthReady(true);

      if (!u) {
        setUid(null);
        router.push("/login");
        return;
      }

      setUid(u.uid);
    });

    return () => unsub();
  }, [router]);

  async function load(userId: string) {
    setLoading(true);

    try {
      const row = await getUserProfile(userId);
      setProfile(row);

      setDisplayName(row?.displayName ?? "");
      setAccountType(row?.accountType ?? null);
      setDriverSubtype(row?.driverSubtype ?? null);
    } catch (e: any) {
      console.error(e);
      showToast({
        tone: "error",
        title: "Failed to load profile",
        message: e?.message ?? "Something went wrong.",
      });
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!uid) return;
    void load(uid);
  }, [uid]);

  async function onSave() {
    if (!uid) return;

    if (!displayName.trim()) {
      showToast({
        tone: "error",
        title: "Display name required",
      });
      return;
    }

    if (accountType === "driver" && !driverSubtype) {
      showToast({
        tone: "error",
        title: "Choose driver type",
      });
      return;
    }

    setSaving(true);

    try {
      await updateMyProfileRoleData({
        uid,
        displayName: displayName.trim(),
        accountType,
        driverSubtype: accountType === "driver" ? driverSubtype : null,
      });

      await load(uid);

      showToast({
        tone: "success",
        title: "Profile updated",
        message: "Your account type details were saved.",
      });
    } catch (e: any) {
      console.error(e);
      showToast({
        tone: "error",
        title: "Failed to update profile",
        message: e?.message ?? "Something went wrong.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function onRequestVerification() {
    if (!uid || !profile) return;

    if (!profile.accountType) {
      showToast({
        tone: "error",
        title: "Complete your profile first",
        message: "Choose an account type before requesting verification.",
      });
      return;
    }

    if (profile.verificationStatus === "verified") {
      showToast({
        tone: "success",
        title: "Already verified",
      });
      return;
    }

    if (profile.verificationStatus === "pending") {
      showToast({
        tone: "success",
        title: "Verification already pending",
      });
      return;
    }

    setVerificationBusy(true);

    try {
      await requestVerification(uid);
      await load(uid);

      showToast({
        tone: "success",
        title: "Verification requested",
        message: "Your account is now pending review.",
      });
    } catch (e: any) {
      console.error(e);
      showToast({
        tone: "error",
        title: "Failed to request verification",
        message: e?.message ?? "Something went wrong.",
      });
    } finally {
      setVerificationBusy(false);
    }
  }

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
        <div className="small">Loading profile…</div>
      </div>
    );
  }

  const permissionsLabel =
    profile.platformRole === "super_admin"
      ? "Super Admin"
      : profile.platformRole === "admin"
      ? "Admin"
      : "User";

  const accountTypeLabel =
    profile.accountType === "dispatcher"
      ? "Dispatcher"
      : profile.accountType === "carrier"
      ? "Carrier"
      : profile.accountType === "driver"
      ? "Driver"
      : profile.accountType === "broker"
      ? "Broker"
      : "Not selected";

  const driverSubtypeLabel =
    profile.driverSubtype === "owner_operator"
      ? "Owner Operator"
      : profile.driverSubtype === "company_driver"
      ? "Company Driver"
      : "—";

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
            My Profile
          </h1>
          <div className="small" style={{ opacity: 0.92 }}>
            Manage your identity, account type, verification status, and trust profile.
          </div>
        </div>

        <div className="row wrap" style={{ gap: 10 }}>
          <Link className="btn secondary" href="/dashboard">
            Dashboard
          </Link>
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <UserRolePills
          profile={{
            platformRole: profile.platformRole,
            verificationStatus: profile.verificationStatus,
            tier: profile.tier,
            driverType: profile.driverSubtype ?? null,
            accountType: profile.accountType ?? null,
          }}
        />

        <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
          <div className="small">
            <b>Email:</b> {profile.email ?? "—"}
          </div>
          <div className="small">
            <b>UID:</b> {profile.uid}
          </div>
          <div className="small">
            <b>Permissions role:</b> {permissionsLabel}
          </div>
          <div className="small">
            <b>Account type:</b> {accountTypeLabel}
          </div>
          <div className="small">
            <b>Driver subtype:</b> {driverSubtypeLabel}
          </div>
          <div className="small">
            <b>Tier:</b> {profile.tier}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <div className="small" style={{ opacity: 0.9 }}>
          Basic profile
        </div>

        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          <input
            className="input"
            placeholder="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />

          <select
            className="input"
            value={accountType ?? ""}
            onChange={(e) =>
              setAccountType(
                e.target.value === "" ? null : (e.target.value as AccountType)
              )
            }
          >
            {ACCOUNT_OPTIONS.map((opt) => (
              <option key={opt.value || "general"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {accountType === "driver" ? (
            <select
              className="input"
              value={driverSubtype ?? ""}
              onChange={(e) =>
                setDriverSubtype(
                  e.target.value === "" ? null : (e.target.value as DriverSubtype)
                )
              }
            >
              <option value="">Choose driver type</option>
              <option value="owner_operator">Owner Operator</option>
              <option value="company_driver">Company Driver</option>
            </select>
          ) : null}
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <div className="small" style={{ opacity: 0.9 }}>
          Verification
        </div>

        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          <div className="small">
            Verified users receive stronger trust signals and better visibility across the ecosystem.
          </div>

          <div className="row wrap" style={{ gap: 10 }}>
            <button
              className="btn"
              type="button"
              disabled={
                verificationBusy ||
                profile.verificationStatus === "verified" ||
                profile.verificationStatus === "pending"
              }
              onClick={onRequestVerification}
            >
              {verificationBusy
                ? "Submitting..."
                : profile.verificationStatus === "verified"
                ? "Already Verified"
                : profile.verificationStatus === "pending"
                ? "Verification Pending"
                : "Request Verification"}
            </button>
          </div>
        </div>
      </div>

      <div className="row wrap" style={{ gap: 10, marginTop: 14 }}>
        <button className="btn" type="button" disabled={saving} onClick={onSave}>
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </div>
  );
}