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
    value: "dispatcher",
    label: "Dispatcher",
    description: "Build reputation, get reviewed, and manage trust profile.",
  },
  {
    value: "carrier",
    label: "Carrier",
    description: "Review dispatchers and brokers before working with them.",
  },
  {
    value: "broker",
    label: "Broker",
    description: "Monitor your broker trust profile and public visibility.",
  },
  {
    value: "driver",
    label: "Driver",
    description: "Find trusted dispatchers and avoid risky relationships.",
  },
];

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

  const [accountType, setAccountType] = useState<AccountType>(null);
  const [driverSubtype, setDriverSubtype] = useState<DriverSubtype>(null);

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

        await setDoc(
          doc(db, "users", credential.user.uid),
          {
            uid: credential.user.uid,
            email: credential.user.email,
            displayName: displayName.trim(),

            platformRole: "user",
            accountType,
            driverSubtype: accountType === "driver" ? driverSubtype : null,

            verificationStatus: "unverified",
            tier: "tier1",

            aiFlagged: false,
            aiOverride: false,
            aiRiskLevel: "low",
            aiRiskScore: 0,
            aiSignals: [],

            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

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
      alert(error?.message ?? "Authentication failed.");
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
    <div className="container" style={{ maxWidth: 760, margin: "40px auto" }}>
      <div className="card" style={{ padding: 24 }}>
        <h1 className="h1" style={{ marginBottom: 8 }}>
          {mode === "signup" ? "Create your account" : "Login"}
        </h1>

        <div className="small" style={{ opacity: 0.88 }}>
          {mode === "signup"
            ? "Choose your account type so RateMyDispatchers can personalize your dashboard."
            : "Access your RateMyDispatchers account."}
        </div>

        <form onSubmit={handleAuth} style={{ display: "grid", gap: 12, marginTop: 18 }}>
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

          <input
            className="input"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {mode === "signup" ? (
            <div className="card" style={{ padding: 14 }}>
              <div style={{ fontWeight: 900 }}>Choose account type</div>
              <div className="small" style={{ marginTop: 4, opacity: 0.82 }}>
                You can change this later from your profile.
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

                  <div className="row wrap" style={{ gap: 10, marginTop: 10 }}>
                    <button
                      type="button"
                      className={
                        driverSubtype === "owner_operator" ? "btn" : "btn secondary"
                      }
                      onClick={() => setDriverSubtype("owner_operator")}
                    >
                      Owner-Operator
                    </button>

                    <button
                      type="button"
                      className={
                        driverSubtype === "company_driver" ? "btn" : "btn secondary"
                      }
                      onClick={() => setDriverSubtype("company_driver")}
                    >
                      Company Driver
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <button className="btn" type="submit" disabled={busy}>
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