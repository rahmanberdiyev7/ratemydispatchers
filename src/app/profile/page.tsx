"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { getCurrentUser, listenToAuth } from "@/lib/auth";
import type { AccountType, DriverSubtype } from "@/lib/userProfiles";
import DispatchGuardBadge from "@/components/DispatchGuardBadge";

const ACCOUNT_TYPES: Array<{
  value: Exclude<AccountType, null>;
  label: string;
}> = [
  { value: "dispatcher", label: "Dispatcher" },
  { value: "carrier", label: "Carrier" },
  { value: "broker", label: "Broker" },
  { value: "driver", label: "Driver" },
];

function labelAccountType(accountType: AccountType, driverSubtype: DriverSubtype) {
  if (accountType === "driver") {
    if (driverSubtype === "owner_operator") return "Driver — Owner Operator";
    if (driverSubtype === "company_driver") return "Driver — Company Driver";
    return "Driver";
  }

  if (accountType === "carrier") return "Carrier";
  if (accountType === "broker") return "Broker";
  if (accountType === "dispatcher") return "Dispatcher";

  return "Not selected";
}

export default function ProfilePage() {
  const router = useRouter();
  const initialUser = useMemo(() => getCurrentUser(), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [uid, setUid] = useState("");
  const [email, setEmail] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [accountType, setAccountType] = useState<AccountType>(null);
  const [driverSubtype, setDriverSubtype] = useState<DriverSubtype>(null);

  const [companyName, setCompanyName] = useState("");
  const [mcNumber, setMcNumber] = useState("");
  const [dotNumber, setDotNumber] = useState("");
  const [phone, setPhone] = useState("");

  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [companyLogoUrl, setCompanyLogoUrl] = useState("");

  const [platformRole, setPlatformRole] = useState("user");
  const [verificationStatus, setVerificationStatus] = useState("unverified");
  const [tier, setTier] = useState("tier1");

  const [dispatchGuardScore, setDispatchGuardScore] = useState(85);
  const [dispatchGuardLevel, setDispatchGuardLevel] = useState("verified");

  useEffect(() => {
    async function loadUser(user: NonNullable<ReturnType<typeof getCurrentUser>>) {
      setUid(user.uid);
      setEmail(user.email ?? "");
      setDisplayName(user.displayName ?? "");

      const userSnap = await getDoc(doc(db, "users", user.uid));
      const entitySnap = await getDoc(doc(db, "trust_entities", user.uid));

      const userData = userSnap.exists() ? userSnap.data() : {};
      const entityData = entitySnap.exists() ? entitySnap.data() : {};

      setDisplayName(
        String(userData.displayName ?? entityData.displayName ?? user.displayName ?? "")
      );

      setAccountType(
        (userData.accountType ?? entityData.type ?? null) as AccountType
      );

      setDriverSubtype(
        (userData.driverSubtype ?? entityData.driverSubtype ?? null) as DriverSubtype
      );

      setCompanyName(String(entityData.companyName ?? userData.companyName ?? ""));
      setMcNumber(String(entityData.mcNumber ?? userData.mcNumber ?? ""));
      setDotNumber(String(entityData.dotNumber ?? userData.dotNumber ?? ""));
      setPhone(String(entityData.phone ?? userData.phone ?? ""));

      setProfileImageUrl(
        String(entityData.profileImageUrl ?? userData.profileImageUrl ?? "")
      );

      setCompanyLogoUrl(
        String(entityData.companyLogoUrl ?? userData.companyLogoUrl ?? "")
      );

      setPlatformRole(String(userData.platformRole ?? "user"));
      setVerificationStatus(
        String(userData.verificationStatus ?? entityData.verificationStatus ?? "unverified")
      );
      setTier(String(userData.tier ?? "tier1"));

      const dg = entityData.dispatchGuard as
        | { score?: number; level?: string }
        | undefined;

      setDispatchGuardScore(
        Number(dg?.score ?? entityData.dispatchGuardScore ?? userData.dispatchGuardScore ?? 85)
      );

      setDispatchGuardLevel(
        String(dg?.level ?? entityData.dispatchGuardLevel ?? userData.dispatchGuardLevel ?? "verified")
      );

      setLoading(false);
    }

    if (initialUser) {
      void loadUser(initialUser);
      return;
    }

    const unsub = listenToAuth((user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      void loadUser(user);
    });

    return () => unsub();
  }, [initialUser, router]);

  async function saveProfile() {
    const user = auth.currentUser;

    if (!user) {
      alert("Please login first.");
      return;
    }

    if (!displayName.trim()) {
      alert("Display name is required.");
      return;
    }

    if (!accountType) {
      alert("Please select account type.");
      return;
    }

    if (accountType === "driver" && !driverSubtype) {
      alert("Please select driver type.");
      return;
    }

    setSaving(true);

    try {
      await updateProfile(user, {
        displayName: displayName.trim(),
        photoURL: profileImageUrl.trim() || undefined,
      });

      const normalizedAccountType = accountType;
      const normalizedDriverSubtype =
        normalizedAccountType === "driver" ? driverSubtype : null;

      const dispatchGuard = {
        score: dispatchGuardScore,
        level: dispatchGuardLevel,
        reportsCount: 0,
        reviewCount: 0,
        riskSignals: 0,
      };

      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          email: user.email ?? email,
          displayName: displayName.trim(),

          accountType: normalizedAccountType,
          driverSubtype: normalizedDriverSubtype,

          companyName: companyName.trim(),
          mcNumber: mcNumber.trim(),
          dotNumber: dotNumber.trim(),
          phone: phone.trim(),

          profileImageUrl: profileImageUrl.trim(),
          companyLogoUrl: companyLogoUrl.trim(),

          platformRole,
          verificationStatus,
          tier,

          trustEntityId: user.uid,

          dispatchGuardScore,
          dispatchGuardLevel,
          dispatchGuardFlagged:
            dispatchGuardLevel === "watch" ||
            dispatchGuardLevel === "high_risk" ||
            dispatchGuardLevel === "critical",

          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      await setDoc(
        doc(db, "trust_entities", user.uid),
        {
          uid: user.uid,

          type: normalizedAccountType,
          displayName: displayName.trim(),

          companyName: companyName.trim(),
          mcNumber: mcNumber.trim(),
          dotNumber: dotNumber.trim(),
          phone: phone.trim(),
          email: user.email ?? email,

          driverSubtype: normalizedDriverSubtype,

          verified: verificationStatus === "verified",
          verificationStatus,

          dispatchGuard,
          dispatchGuardScore,
          dispatchGuardLevel,
          dispatchGuardFlagged:
            dispatchGuardLevel === "watch" ||
            dispatchGuardLevel === "high_risk" ||
            dispatchGuardLevel === "critical",

          identityShield: {
            activeAlerts: 0,
            confirmedImpersonations: 0,
            fakePhones: [],
            fakeEmails: [],
            fakeDomains: [],
          },

          profileImageUrl: profileImageUrl.trim(),
          companyLogoUrl: companyLogoUrl.trim(),

          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      alert("Profile saved successfully.");
    } catch (error: any) {
      console.error(error);
      alert(error?.message ?? "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="card" style={{ padding: 18 }}>
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card" style={{ padding: 24 }}>
        <div className="row between wrap" style={{ gap: 16 }}>
          <div>
            <h1 className="h1">My Profile</h1>

            <div className="small" style={{ marginTop: 8 }}>
              Manage your DispatchGuard identity, public profile, and trust
              entity information.
            </div>
          </div>

          <DispatchGuardBadge level={dispatchGuardLevel} score={dispatchGuardScore} />
        </div>

        <div className="row wrap" style={{ gap: 8, marginTop: 16 }}>
          <span className="badge">Email: {email}</span>
          <span className="badge">Role: {platformRole}</span>
          <span className="badge">Verification: {verificationStatus}</span>
          <span className="badge">Tier: {tier}</span>
          <span className="badge">
            Type: {labelAccountType(accountType, driverSubtype)}
          </span>
        </div>
      </div>

      <div className="card" style={{ padding: 24, marginTop: 18 }}>
        <h2 className="h2">Account Type</h2>

        <div className="small" style={{ marginTop: 8 }}>
          Choose the user type that best represents this account.
        </div>

        <div className="row wrap" style={{ gap: 10, marginTop: 16 }}>
          {ACCOUNT_TYPES.map((item) => (
            <button
              key={item.value}
              className={accountType === item.value ? "btn" : "btn secondary"}
              type="button"
              onClick={() => {
                setAccountType(item.value);

                if (item.value !== "driver") {
                  setDriverSubtype(null);
                }
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {accountType === "driver" ? (
          <div style={{ marginTop: 18 }}>
            <div style={{ fontWeight: 900 }}>Driver type</div>

            <div className="row wrap" style={{ gap: 10, marginTop: 10 }}>
              <button
                className={
                  driverSubtype === "owner_operator" ? "btn" : "btn secondary"
                }
                type="button"
                onClick={() => setDriverSubtype("owner_operator")}
              >
                Owner Operator
              </button>

              <button
                className={
                  driverSubtype === "company_driver" ? "btn" : "btn secondary"
                }
                type="button"
                onClick={() => setDriverSubtype("company_driver")}
              >
                Company Driver
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
          gap: 18,
          marginTop: 18,
        }}
      >
        <div className="card" style={{ padding: 24 }}>
          <h2 className="h2">Public Identity</h2>

          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            <input
              className="input"
              placeholder="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />

            <input
              className="input"
              placeholder="Company name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />

            <input
              className="input"
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <input
              className="input"
              placeholder="Profile image URL"
              value={profileImageUrl}
              onChange={(e) => setProfileImageUrl(e.target.value)}
            />

            <input
              className="input"
              placeholder="Company logo URL"
              value={companyLogoUrl}
              onChange={(e) => setCompanyLogoUrl(e.target.value)}
            />
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <h2 className="h2">MC / DOT</h2>

          <div className="small" style={{ marginTop: 8 }}>
            These fields prepare DispatchGuard for FMCSA verification.
          </div>

          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            <input
              className="input"
              placeholder="MC Number"
              value={mcNumber}
              onChange={(e) => setMcNumber(e.target.value)}
            />

            <input
              className="input"
              placeholder="DOT Number"
              value={dotNumber}
              onChange={(e) => setDotNumber(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 24, marginTop: 18 }}>
        <h2 className="h2">DispatchGuard Identity</h2>

        <div className="small" style={{ marginTop: 8, lineHeight: 1.7 }}>
          This profile is connected to the unified DispatchGuard trust engine.
          Reports, reviews, Identity Shield alerts, verification, and future
          FMCSA data will connect to this trust entity.
        </div>

        <div className="row wrap" style={{ gap: 10, marginTop: 16 }}>
          <button className="btn" onClick={saveProfile} disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </button>

          <button
            className="btn secondary"
            type="button"
            onClick={() => router.push(`/entity/${uid}`)}
          >
            View Public Profile
          </button>

          <button
            className="btn secondary"
            type="button"
            onClick={() => router.push("/dispatchguard")}
          >
            Open DispatchGuard
          </button>
        </div>
      </div>
    </div>
  );
}