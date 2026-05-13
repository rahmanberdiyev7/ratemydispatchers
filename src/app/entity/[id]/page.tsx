"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getTrustEntity, type TrustEntity } from "@/lib/trustEntities";
import DispatchGuardBadge from "@/components/DispatchGuardBadge";

export default function EntityProfilePage() {
  const params = useParams();
  const id = String(params.id);

  const [entity, setEntity] = useState<TrustEntity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const row = await getTrustEntity(id);
        setEntity(row);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [id]);

  if (loading) {
    return (
      <div className="container">
        <div className="card" style={{ padding: 18 }}>
          Loading entity...
        </div>
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="container">
        <div className="card" style={{ padding: 18 }}>
          Entity not found.
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card" style={{ padding: 24 }}>
        <div className="row between wrap" style={{ gap: 16 }}>
          <div>
            <h1 className="h1">{entity.displayName}</h1>

            <div className="small" style={{ marginTop: 8 }}>
              {entity.type?.toUpperCase()}
              {entity.companyName ? ` · ${entity.companyName}` : ""}
            </div>
          </div>

          <DispatchGuardBadge
            level={entity.dispatchGuard?.level}
            score={entity.dispatchGuard?.score}
          />
        </div>

        <div className="row wrap" style={{ gap: 10, marginTop: 18 }}>
          <span className="badge">
            Verification: {entity.verified ? "Verified" : "Unverified"}
          </span>

          {entity.mcNumber ? <span className="badge">MC: {entity.mcNumber}</span> : null}
          {entity.dotNumber ? <span className="badge">DOT: {entity.dotNumber}</span> : null}
          {entity.phone ? <span className="badge">{entity.phone}</span> : null}
          {entity.email ? <span className="badge">{entity.email}</span> : null}

          <span className="badge">
            Reviews: {entity.dispatchGuard?.reviewCount ?? 0}
          </span>

          <span className="badge">
            Reports: {entity.dispatchGuard?.reportsCount ?? 0}
          </span>

          <span className="badge">
            Risk Signals: {entity.dispatchGuard?.riskSignals ?? 0}
          </span>
        </div>

        <div className="row wrap" style={{ gap: 10, marginTop: 22 }}>
          <Link className="btn" href={`/entity/${id}/reviews`}>
            Reviews
          </Link>

          <Link className="btn secondary" href={`/entity/${id}/report`}>
            Submit Report
          </Link>

          <Link className="btn secondary" href={`/entity/${id}/identity-shield`}>
            Identity Shield
          </Link>

          <Link className="btn secondary" href="/dispatchguard">
            Back to DispatchGuard
          </Link>
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginTop: 18 }}>
        <div className="section-title">DispatchGuard™ Intelligence Summary</div>

        <div className="small" style={{ marginTop: 10, lineHeight: 1.8 }}>
          This profile is part of the unified DispatchGuard™ trust engine.
          Reviews, fraud reports, verification data, impersonation alerts, and
          future FMCSA signals will all connect here.
        </div>
      </div>
    </div>
  );
}