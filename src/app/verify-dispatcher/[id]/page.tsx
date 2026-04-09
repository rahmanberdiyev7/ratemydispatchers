"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDispatcher, type Dispatcher } from "@/lib/firestore";
import { useToast } from "@/components/ToastProvider";
import { createDispatcherVerificationRequest } from "@/lib/dispatcherVerification";

export default function VerifyDispatcherPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();

  const id = useMemo(() => {
    const raw = params?.id;
    return typeof raw === "string" ? raw : "";
  }, [params]);

  const user = useMemo(() => getCurrentUser(), []);

  const [dispatcher, setDispatcher] = useState<Dispatcher | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [mcNumber, setMcNumber] = useState("");
  const [dotNumber, setDotNumber] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function load() {
      if (!id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const row = await getDispatcher(id);
        setDispatcher(row);
      } catch (e) {
        console.error(e);
        setDispatcher(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  async function onSubmit() {
    if (!user) {
      showToast({
        tone: "error",
        title: "Login required",
        message: "Please sign in before requesting verification.",
      });
      router.push("/login");
      return;
    }

    if (!dispatcher) {
      showToast({
        tone: "error",
        title: "Dispatcher not found",
      });
      return;
    }

    if (!email.trim() && !phone.trim()) {
      showToast({
        tone: "error",
        title: "Missing contact info",
        message: "Add at least an email or phone number.",
      });
      return;
    }

    setSaving(true);
    try {
      await createDispatcherVerificationRequest({
        dispatcherId: dispatcher.id,
        dispatcherName: dispatcher.name,
        company: dispatcher.company,
        email,
        phone,
        mcNumber,
        dotNumber,
        notes,
      });

      showToast({
        tone: "success",
        title: "Verification request submitted",
        message: "An admin will review it soon.",
      });

      router.push(`/dispatchers/${dispatcher.id}`);
    } catch (e: any) {
      console.error(e);
      showToast({
        tone: "error",
        title: "Failed to submit request",
        message: e?.message ?? "Something went wrong.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="small">Loading dispatcher…</div>
      </div>
    );
  }

  if (!id || !dispatcher) {
    return (
      <div className="container">
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900 }}>Dispatcher not found</div>
          <div className="small" style={{ marginTop: 6 }}>
            The dispatcher profile could not be loaded.
          </div>
          <div style={{ marginTop: 12 }}>
            <Link className="btn secondary" href="/dispatchers">
              ← Back to Dispatchers
            </Link>
          </div>
        </div>
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
            Request Verification
          </h1>
          <div className="small" style={{ opacity: 0.92 }}>
            Submit business details for <b>{dispatcher.name}</b>.
          </div>
        </div>

        <div className="row wrap" style={{ gap: 10 }}>
          <Link className="btn secondary" href={`/dispatchers/${dispatcher.id}`}>
            ← Back to Profile
          </Link>
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <div style={{ fontWeight: 900 }}>{dispatcher.name}</div>
        <div className="small" style={{ marginTop: 4 }}>
          {dispatcher.company}
        </div>

        <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
          <input
            className="input"
            placeholder="Business email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="input"
            placeholder="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <input
            className="input"
            placeholder="MC number (optional)"
            value={mcNumber}
            onChange={(e) => setMcNumber(e.target.value)}
          />

          <input
            className="input"
            placeholder="DOT number (optional)"
            value={dotNumber}
            onChange={(e) => setDotNumber(e.target.value)}
          />

          <textarea
            className="input"
            style={{ minHeight: 120 }}
            placeholder="Notes for admin review"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      <div className="row wrap" style={{ gap: 10, marginTop: 14 }}>
        <button className="btn" type="button" onClick={onSubmit} disabled={saving}>
          {saving ? "Submitting..." : "Submit Verification Request"}
        </button>

        <Link className="btn secondary" href={`/dispatchers/${dispatcher.id}`}>
          Cancel
        </Link>
      </div>
    </div>
  );
}