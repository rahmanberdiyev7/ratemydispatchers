// src/app/claim/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getDispatcher, type Dispatcher, createClaimRequest } from "@/lib/firestore";
import { getCurrentUser } from "@/lib/auth";

export default function ClaimPage() {
  const params = useParams<{ id: string }>();
  const dispatcherId = params.id;

  const [dispatcher, setDispatcher] = useState<Dispatcher | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [notes, setNotes] = useState("");

  const user = useMemo(() => getCurrentUser(), []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const d = await getDispatcher(dispatcherId);
        setDispatcher(d);
      } finally {
        setLoading(false);
      }
    })();
  }, [dispatcherId]);

  async function onSubmit() {
    if (!user) return alert("Login required to submit a claim request.");
    if (!dispatcher) return;

    setSaving(true);
    try {
      await createClaimRequest({
        dispatcherId: dispatcher.id,
        dispatcherName: dispatcher.name,
        company: dispatcher.company,
        email: email.trim(),
        phone: phone.trim(),
        role: role.trim(),
        notes: notes.trim(),
      });

      alert("Claim request submitted. An admin will review it.");
      setEmail("");
      setPhone("");
      setRole("");
      setNotes("");
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "Failed to submit claim");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="container muted">Loading…</div>;
  if (!dispatcher) return <div className="container muted">Dispatcher not found.</div>;

  return (
    <div className="container">
      <h1 className="h1">Claim Profile</h1>
      <p className="muted">
        You’re requesting to claim: <b>{dispatcher.name}</b> ({dispatcher.company})
      </p>

      <div className="card" style={{ marginTop: 12 }}>
        <h2 className="h2">Your info</h2>

        <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
          <input className="input" placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input" placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input className="input" placeholder="Role / relationship (optional)" value={role} onChange={(e) => setRole(e.target.value)} />
          <textarea className="input" style={{ minHeight: 90 }} placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />

          <button className="btn" disabled={saving} onClick={onSubmit}>
            {saving ? "Submitting…" : "Submit claim request"}
          </button>

          {!user ? <div className="muted small">Login required to submit.</div> : null}
        </div>
      </div>
    </div>
  );
}