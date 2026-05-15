"use client";

import { useEffect, useMemo, useState } from "react";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { getCurrentUser, listenToAuth } from "@/lib/auth";
import type { AccountType, DriverSubtype } from "@/lib/userProfiles";

type Requirement = {
  key: string;
  label: string;
  description: string;
};

const REQUIREMENTS: Record<string, Requirement[]> = {
  carrier: [
    { key: "mc_dot", label: "MC / DOT Authority", description: "Provide your MC and DOT information." },
    { key: "insurance", label: "Insurance COI", description: "Upload or paste a link to your certificate of insurance." },
    { key: "w9", label: "W-9", description: "Provide W-9 proof for business verification." },
    { key: "company_email", label: "Company Email / Domain", description: "Verify your company contact identity." },
  ],
  broker: [
    { key: "broker_authority", label: "Broker Authority", description: "Provide broker authority or FMCSA broker proof." },
    { key: "bond", label: "Broker Bond", description: "Provide bond/trust verification proof." },
    { key: "mc_number", label: "MC Number", description: "Provide your broker MC number." },
    { key: "company_domain", label: "Company Domain", description: "Verify official email/domain ownership." },
  ],
  dispatcher: [
    { key: "business_docs", label: "Business Documents", description: "Provide LLC/company docs if available." },
    { key: "dispatcher_agreement", label: "Dispatcher Agreement", description: "Provide proof of dispatcher relationship or service agreement." },
    { key: "identity", label: "Identity Verification", description: "Provide identity verification proof." },
  ],
  driver: [
    { key: "cdl", label: "CDL", description: "Provide CDL verification proof." },
    { key: "identity", label: "Identity Verification", description: "Provide identity verification proof." },
    { key: "med_card", label: "Medical Card", description: "Optional but recommended." },
  ],
};

function labelAccountType(accountType: AccountType, driverSubtype: DriverSubtype) {
  if (accountType === "driver") {
    if (driverSubtype === "owner_operator") return "Driver — Owner Operator";
    if (driverSubtype === "company_driver") return "Driver — Company Driver";
    return "Driver";
  }

  if (accountType === "carrier") return "Carrier";
  if (accountType === "broker") return "Broker";
  if (accountType === "dispatcher") return "Dispatcher";

  return "Unknown";
}

export default function VerifyPage() {
  const initialUser = useMemo(() => getCurrentUser(), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [uid, setUid] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [accountType, setAccountType] = useState<AccountType>(null);
  const [driverSubtype, setDriverSubtype] = useState<DriverSubtype>(null);

  const [mcNumber, setMcNumber] = useState("");
  const [dotNumber, setDotNumber] = useState("");
  const [companyName, setCompanyName] = useState("");

  const [notes, setNotes] = useState("");
  const [documentLinks, setDocumentLinks] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadUser(user: NonNullable<ReturnType<typeof getCurrentUser>>) {
      setUid(user.uid);
      setEmail(user.email ?? "");

      const userSnap = await getDoc(doc(db, "users", user.uid));
      const entitySnap = await getDoc(doc(db, "trust_entities", user.uid));

      const userData = userSnap.exists() ? userSnap.data() : {};
      const entityData = entitySnap.exists() ? entitySnap.data() : {};

      setDisplayName(String(userData.displayName ?? entityData.displayName ?? user.displayName ?? ""));
      setAccountType((userData.accountType ?? entityData.type ?? null) as AccountType);
      setDriverSubtype((userData.driverSubtype ?? entityData.driverSubtype ?? null) as DriverSubtype);

      setMcNumber(String(userData.mcNumber ?? entityData.mcNumber ?? ""));
      setDotNumber(String(userData.dotNumber ?? entityData.dotNumber ?? ""));
      setCompanyName(String(userData.companyName ?? entityData.companyName ?? ""));

      setLoading(false);
    }

    if (initialUser) {
      void loadUser(initialUser);
      return;
    }

    const unsub = listenToAuth((user) => {
      if (!user) {
        window.location.href = "/login";
        return;
      }

      void loadUser(user);
    });

    return () => unsub();
  }, [initialUser]);

  const requirements = accountType ? REQUIREMENTS[accountType] ?? [] : [];

  async function submitVerification() {
    const user = auth.currentUser;

    if (!user) {
      alert("Please login first.");
      return;
    }

    if (!accountType) {
      alert("Account type is missing. Complete your profile first.");
      return;
    }

    const missingRequired = requirements.filter((item) => {
      if (item.key === "med_card") return false;
      return !documentLinks[item.key]?.trim();
    });

    if (missingRequired.length > 0) {
      alert(`Missing required proof: ${missingRequired.map((x) => x.label).join(", ")}`);
      return;
    }

    setSaving(true);

    try {
      await setDoc(
        doc(db, "verificationRequests", user.uid),
        {
          userId: user.uid,
          email: user.email ?? email,
          displayName,
          accountType,
          driverSubtype: accountType === "driver" ? driverSubtype : null,

          companyName: companyName.trim(),
          mcNumber: mcNumber.trim(),
          dotNumber: dotNumber.trim(),

          documentLinks,
          notes: notes.trim(),

          status: "pending",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      await setDoc(
        doc(db, "users", user.uid),
        {
          verificationStatus: "pending",
          companyName: companyName.trim(),
          mcNumber: mcNumber.trim(),
          dotNumber: dotNumber.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      await setDoc(
        doc(db, "trust_entities", user.uid),
        {
          verificationStatus: "pending",
          companyName: companyName.trim(),
          mcNumber: mcNumber.trim(),
          dotNumber: dotNumber.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      alert("Verification request submitted for admin review.");
    } catch (error: any) {
      console.error(error);
      alert(error?.message ?? "Failed to submit verification.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="card" style={{ padding: 18 }}>Loading verification center...</div>
      </div>
    );
  }

  if (!accountType) {
    return (
      <div className="container">
        <div className="card" style={{ padding: 24 }}>
          <h1 className="h1">Verification Center</h1>
          <div className="small" style={{ marginTop: 10 }}>
            Please complete your profile and choose your account type before requesting verification.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card" style={{ padding: 24 }}>
        <h1 className="h1">Verification Center</h1>

        <div className="small" style={{ marginTop: 10, lineHeight: 1.7 }}>
          Submit supporting documents so DispatchGuard can verify your account type and public trust identity.
        </div>

        <div className="row wrap" style={{ gap: 8, marginTop: 16 }}>
          <span className="badge">Account: {labelAccountType(accountType, driverSubtype)}</span>
          <span className="badge">Email: {email}</span>
          <span className="badge">User ID: {uid}</span>
        </div>
      </div>

      <div className="card" style={{ padding: 24, marginTop: 18 }}>
        <h2 className="h2">Business / Identity Details</h2>

        <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
          <input
            className="input"
            placeholder="Company / Business Name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />

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

      <div className="card" style={{ padding: 24, marginTop: 18 }}>
        <h2 className="h2">Required Verification Proof</h2>

        <div className="small" style={{ marginTop: 8 }}>
          Paste document links for now. Later we will add secure file upload.
        </div>

        <div style={{ display: "grid", gap: 14, marginTop: 18 }}>
          {requirements.map((item) => (
            <div key={item.key} className="card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 1000 }}>{item.label}</div>
              <div className="small" style={{ marginTop: 6 }}>{item.description}</div>

              <input
                className="input"
                placeholder={`Paste link for ${item.label}`}
                value={documentLinks[item.key] ?? ""}
                onChange={(e) =>
                  setDocumentLinks((prev) => ({
                    ...prev,
                    [item.key]: e.target.value,
                  }))
                }
                style={{ marginTop: 12 }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 24, marginTop: 18 }}>
        <h2 className="h2">Additional Notes</h2>

        <textarea
          className="input"
          placeholder="Anything admin should know while reviewing your verification?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{ marginTop: 16, minHeight: 140 }}
        />

        <button className="btn" onClick={submitVerification} disabled={saving} style={{ marginTop: 16 }}>
          {saving ? "Submitting..." : "Submit Verification Request"}
        </button>
      </div>
    </div>
  );
}