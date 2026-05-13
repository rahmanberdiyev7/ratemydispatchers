"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getTrustEntity, type TrustEntity } from "@/lib/trustEntities";
import {
  createDispatchGuardReport,
  type DispatchGuardReportType,
  type DispatchGuardSeverity,
} from "@/lib/dispatchGuardReports";

export default function EntityReportPage() {
  const params = useParams();
  const id = String(params.id);

  const [entity, setEntity] = useState<TrustEntity | null>(null);
  const [reportType, setReportType] =
    useState<DispatchGuardReportType>("fraud");
  const [severity, setSeverity] = useState<DispatchGuardSeverity>("medium");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void getTrustEntity(id).then(setEntity);
  }, [id]);

  async function submitReport() {
    const user = getCurrentUser();

    if (!user) {
      alert("Please login first.");
      return;
    }

    if (!entity) {
      alert("Entity not found.");
      return;
    }

    if (!description.trim()) {
      alert("Please describe the issue.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      await createDispatchGuardReport({
        targetEntityId: id,
        targetType: entity.type,
        reportType,
        severity,
        description: description.trim(),
        createdByUserId: user.uid,
      });

      setDescription("");
      setMessage("DispatchGuard report submitted successfully.");
    } catch (error: any) {
      console.error(error);
      setMessage(error?.message ?? "Failed to submit report.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <div className="card" style={{ padding: 24 }}>
        <h1 className="h1">Submit DispatchGuard Report</h1>

        <div className="small" style={{ marginTop: 8 }}>
          Reporting: <b>{entity?.displayName ?? id}</b>
        </div>

        <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
          <select
            className="input"
            value={reportType}
            onChange={(e) => setReportType(e.target.value as DispatchGuardReportType)}
          >
            <option value="fraud">Fraud</option>
            <option value="double_brokering">Double Brokering</option>
            <option value="hostage_load">Hostage Load</option>
            <option value="no_payment">No Payment</option>
            <option value="cargo_theft">Cargo Theft</option>
            <option value="unsafe_driver">Unsafe Driver</option>
            <option value="fake_dispatcher">Fake Dispatcher</option>
            <option value="identity_mismatch">Identity Mismatch</option>
          </select>

          <select
            className="input"
            value={severity}
            onChange={(e) => setSeverity(e.target.value as DispatchGuardSeverity)}
          >
            <option value="low">Low Severity</option>
            <option value="medium">Medium Severity</option>
            <option value="high">High Severity</option>
            <option value="critical">Critical Severity</option>
          </select>

          <textarea
            className="input"
            placeholder="Explain what happened..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ minHeight: 160 }}
          />

          <button className="btn" onClick={submitReport} disabled={busy}>
            {busy ? "Submitting..." : "Submit Report"}
          </button>

          {message ? (
            <div className="card" style={{ padding: 14 }}>
              {message}
            </div>
          ) : null}
        </div>

        <Link className="btn secondary" href={`/entity/${id}`} style={{ marginTop: 18 }}>
          Back to Profile
        </Link>
      </div>
    </div>
  );
}