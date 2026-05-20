"use client";

import { useEffect, useMemo, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { getCurrentUser, listenToAuth } from "@/lib/auth";
import { createReferralProfile } from "@/lib/referrals";

const TYPES = ["dispatcher", "broker", "carrier", "driver"] as const;

export default function ReferralsPage() {
  const initialUser = useMemo(() => getCurrentUser(), []);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");

  async function load(user: NonNullable<ReturnType<typeof getCurrentUser>>) {
    setEmail(user.email ?? "");

    const snap = await getDoc(doc(db, "referralProfiles", user.uid));

    if (snap.exists()) {
      setCode(String(snap.data().code ?? ""));
    }

    setLoading(false);
  }

  useEffect(() => {
    if (initialUser) {
      void load(initialUser);
      return;
    }

    const unsub = listenToAuth((user) => {
      if (!user) {
        window.location.href = "/login";
        return;
      }

      void load(user);
    });

    return () => unsub();
  }, [initialUser]);

  async function generateCode() {
    const user = auth.currentUser;

    if (!user?.email) {
      alert("Please login first.");
      return;
    }

    const newCode = await createReferralProfile({
      userId: user.uid,
      email: user.email,
      displayName: user.displayName,
    });

    setCode(newCode);
  }

  function linkFor(type: string) {
    return `https://ratemydispatchers.vercel.app/login?ref=${code}&type=${type}`;
  }

  if (loading) {
    return (
      <div className="container">
        <div className="card" style={{ padding: 18 }}>
          Loading referrals...
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card" style={{ padding: 24 }}>
        <h1 className="h1">Referral Center</h1>

        <div className="small" style={{ marginTop: 8 }}>
          Create referral links for dispatchers, brokers, carriers, and drivers.
        </div>

        <div className="row wrap" style={{ gap: 8, marginTop: 16 }}>
          <span className="badge">Signed in: {email}</span>
          {code ? <span className="badge">Code: {code}</span> : null}
        </div>

        {!code ? (
          <button className="btn" style={{ marginTop: 18 }} onClick={generateCode}>
            Generate Referral Code
          </button>
        ) : null}
      </div>

      {code ? (
        <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
          {TYPES.map((type) => (
            <div key={type} className="card" style={{ padding: 18 }}>
              <div style={{ fontWeight: 1000, fontSize: 18 }}>
                {type.toUpperCase()} Referral Link
              </div>

              <input
                className="input"
                readOnly
                value={linkFor(type)}
                style={{ marginTop: 12 }}
              />

              <button
                className="btn secondary"
                style={{ marginTop: 12 }}
                onClick={() => navigator.clipboard.writeText(linkFor(type))}
              >
                Copy Link
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}