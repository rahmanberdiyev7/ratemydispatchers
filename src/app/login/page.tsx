"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { getCurrentUser, listenToAuth } from "@/lib/auth";
import type { AccountType, DriverSubtype } from "@/lib/userProfiles";

const ACCOUNT_TYPES: Array<{
  value: Exclude<AccountType, null>;
  label: string;
  description: string;
}> = [
  {
    value: "broker",
    label: "Broker",
    description:
      "Protect your identity, monitor impersonation alerts, and build verified trust.",
  },
  {
    value: "carrier",
    label: "Carrier",
    description:
      "Check brokers, dispatchers, and drivers before booking, hiring, or trusting.",
  },
  {
    value: "dispatcher",
    label: "Dispatcher",
    description:
      "Build reputation, get reviewed, and prove operational trustworthiness.",
  },
  {
    value: "driver",
    label: "Driver",
    description:
      "Create your driver profile as an owner-operator or company driver.",
  },
];

function accountLabel(accountType: AccountType, driverSubtype: DriverSubtype) {
  if (accountType === "broker") return "Broker";
  if (accountType === "carrier") return "Carrier";
  if (accountType === "dispatcher") return "Dispatcher";

  if (accountType === "driver") {
    if (driverSubtype === "owner_operator") return "Driver — Owner Operator";
    if (driverSubtype === "company_driver") return "Driver — Company Driver";
    return "Driver";
  }

  return "Not selected";
}

function friendlyAuthError(codeOrMessage: string) {
  if (codeOrMessage.includes("auth/email-already-in-use")) {
    return "This email already has an account. Please login instead.";
  }

  if (codeOrMessage.includes("auth/invalid-credential")) {
    return "Invalid email or password.";
  }

  if (codeOrMessage.includes("auth/weak-password")) {
    return "Password should be at least 6 characters.";
  }

  if (codeOrMessage.includes("auth/invalid-email")) {
    return "Please enter a valid email address.";
  }

  if (codeOrMessage.includes("permission-denied")) {
    return "Firebase blocked this action. Check Firestore rules for users and trust_entities.";
  }

  return codeOrMessage || "Authentication failed.";
}

async function getRedirectPath(uid: string) {
  const snap = await getDoc(doc(db, "users", uid));

  if (!snap.exists()) return "/profile";

  const data = snap.data();

  if (!data.accountType) return "/profile";

  return "/dashboard";
}

export default function LoginPage() {
  const router = useRouter();

  const initialUser = useMemo(() => getCurrentUser(), []);
  const [authReady, setAuthReady] = useState(false);

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [busy, setBusy] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [accountType, setAccountType] = useState<AccountType>(null);
  const [driverSubtype, setDriverSubtype] = useState<DriverSubtype>(null);

  const signupReady =
    mode === "login" ||
    (!!displayName.trim() &&
      !!accountType &&
      !!password.trim() &&
      !!confirmPassword.trim() &&
      password === confirmPassword &&
      (accountType !== "driver" || !!driverSubtype));

  useEffect(() => {
    if (initialUser) {
      void getRedirectPath(initialUser.uid).then((path) => router.push(path));
      return;
    }

    const unsub = listenToAuth(async (user) => {
      setAuthReady(true);

      if (user) {
        const path = await getRedirectPath(user.uid);
        router.push(path);
      }
    });

    return () => unsub();
  }, [initialUser, router]);

  async function createUserAndTrustEntity(input: {
    uid: string;
    userEmail: string | null;
    userDisplayName: string;
    selectedAccountType: Exclude<AccountType, null>;
    selectedDriverSubtype: DriverSubtype;
  }) {
    const baseDispatchGuard = {
      score: 85,
      level: "verified",
      reportsCount: 0,
      reviewCount: 0,
      riskSignals: 0,
    };

    await setDoc(
      doc(db, "users", input.uid),
      {
        uid: input.uid,
        email: input.userEmail,
        displayName: input.userDisplayName,

        platformRole: "user",
        accountType: input.selectedAccountType,
        driverSubtype:
          input.selectedAccountType === "driver"
            ? input.selectedDriverSubtype
            : null,

        verificationStatus: "unverified",
        tier: "tier1",

        aiFlagged: false,
        aiOverride: false,
        aiRiskLevel: "low",
        aiRiskScore: 0,
        aiSignals: [],

        trustEntityId: input.uid,

        dispatchGuardScore: 85,
        dispatchGuardLevel: "verified",
        dispatchGuardFlagged: false,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    await setDoc(
      doc(db, "trust_entities", input.uid),
      {
        uid: input.uid,

        type: input.selectedAccountType,
        displayName: input.userDisplayName,

        companyName: "",
        mcNumber: "",
        dotNumber: "",
        phone: "",
        email: input.userEmail ?? "",

        driverSubtype:
          input.selectedAccountType === "driver"
            ? input.selectedDriverSubtype
            : null,

        verified: false,
        verificationStatus: "unverified",

        dispatchGuard: baseDispatchGuard,

        dispatchGuardScore: 85,
        dispatchGuardLevel: "verified",
        dispatchGuardFlagged: false,

        identityShield: {
          activeAlerts: 0,
          confirmedImpersonations: 0,
          fakePhones: [],
          fakeEmails: [],
          fakeDomains: [],
        },

        profileImageUrl: "",
        companyLogoUrl: "",

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  async function handleAuth(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email.trim()) {
      alert("Email is required.");
      return;
    }

    if (!password.trim()) {
      alert("Password is required.");
      return;
    }

    if (mode === "signup") {
      if (!displayName.trim()) {
        alert("Display name is required.");
        return;
      }

      if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
      }

      if (!accountType) {
        alert("Please choose your account type.");
        return;
      }

      if (accountType === "driver" && !driverSubtype) {
        alert("Please choose your driver type.");
        return;
      }
    }

    setBusy(true);

    try {
      if (mode === "signup") {
        const credential = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

        await updateProfile(credential.user, {
          displayName: displayName.trim(),
        });

        await createUserAndTrustEntity({
          uid: credential.user.uid,
          userEmail: credential.user.email,
          userDisplayName: displayName.trim(),
          selectedAccountType: accountType as Exclude<AccountType, null>,
          selectedDriverSubtype: driverSubtype,
        });

        router.push("/dashboard");
        return;
      }

      const credential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const path = await getRedirectPath(credential.user.uid);
      router.push(path);
    } catch (error: any) {
      console.error(error);
      alert(friendlyAuthError(error?.code || error?.message));
    } finally {
      setBusy(false);
    }
  }

  if (!authReady && !initialUser) {
    return (
      <div className="container">
        <div className="small">Loading login…</div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 820, margin: "40px auto" }}>
      <div className="card" style={{ padding: 24 }}>
        <h1 className="h1" style={{ marginBottom: 8 }}>
          {mode === "signup" ? "Create your account" : "Login"}
        </h1>

        <div className="small" style={{ opacity: 0.88 }}>
          {mode === "signup"
            ? "Choose your user type so DispatchGuard can personalize your trust, reputation, and risk experience."
            : "Access your RateMyDispatchers / DispatchGuard account."}
        </div>

        <form
          onSubmit={handleAuth}
          style={{ display: "grid", gap: 12, marginTop: 18 }}
        >
          {mode === "signup" ? (
            <input
              className="input"
              placeholder="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          ) : null}

          <input
            className="input"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div style={{ display: "grid", gap: 8 }}>
            <input
              className="input"
              placeholder="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {mode === "signup" ? (
              <input
                className="input"
                placeholder="Confirm password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            ) : null}

            <button
              type="button"
              className="btn secondary"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? "Hide Password" : "Show Password"}
            </button>
          </div>

          {mode === "signup" ? (
            <div className="card" style={{ padding: 14 }}>
              <div style={{ fontWeight: 900 }}>Choose your user type</div>
              <div className="small" style={{ marginTop: 4, opacity: 0.82 }}>
                Brokers, carriers, dispatchers, and drivers each get their own
                trust experience.
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 10,
                  marginTop: 14,
                }}
              >
                {ACCOUNT_TYPES.map((item) => {
                  const active = accountType === item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      className={active ? "btn" : "btn secondary"}
                      style={{
                        textAlign: "left",
                        justifyContent: "flex-start",
                        alignItems: "flex-start",
                        display: "grid",
                        gap: 4,
                        padding: 14,
                        height: "auto",
                        border: active
                          ? "2px solid rgba(77, 163, 255, 0.95)"
                          : "1px solid rgba(255,255,255,0.12)",
                        background: active
                          ? "rgba(77, 163, 255, 0.18)"
                          : undefined,
                        transform: active ? "scale(1.02)" : "scale(1)",
                      }}
                      onClick={() => {
                        setAccountType(item.value);

                        if (item.value !== "driver") {
                          setDriverSubtype(null);
                        }
                      }}
                    >
                      <span style={{ fontWeight: 900 }}>{item.label}</span>
                      <span style={{ fontSize: 12, opacity: 0.85 }}>
                        {item.description}
                      </span>
                    </button>
                  );
                })}
              </div>

              {accountType === "driver" ? (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontWeight: 900 }}>Driver type</div>
                  <div className="small" style={{ marginTop: 4, opacity: 0.82 }}>
                    Choose whether you are an owner-operator or company driver.
                  </div>

                  <div className="row wrap" style={{ gap: 10, marginTop: 10 }}>
                    <button
                      type="button"
                      className={
                        driverSubtype === "owner_operator"
                          ? "btn"
                          : "btn secondary"
                      }
                      onClick={() => setDriverSubtype("owner_operator")}
                    >
                      Owner Operator
                    </button>

                    <button
                      type="button"
                      className={
                        driverSubtype === "company_driver"
                          ? "btn"
                          : "btn secondary"
                      }
                      onClick={() => setDriverSubtype("company_driver")}
                    >
                      Company Driver
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="small" style={{ marginTop: 14, opacity: 0.9 }}>
                Selected: <b>{accountLabel(accountType, driverSubtype)}</b>
              </div>
            </div>
          ) : null}

          <button className="btn" type="submit" disabled={busy || !signupReady}>
            {busy
              ? "Please wait..."
              : mode === "signup"
              ? "Create Account"
              : "Login"}
          </button>

          <button
            className="btn secondary"
            type="button"
            disabled={busy}
            onClick={() => {
              setMode(mode === "signup" ? "login" : "signup");
              setAccountType(null);
              setDriverSubtype(null);
              setConfirmPassword("");
            }}
          >
            {mode === "signup"
              ? "Already have an account? Login"
              : "New here? Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}