"use client";

import Link from "next/link";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { getTrustEntity, type TrustEntity } from "@/lib/trustEntities";

type IdentityShieldAlert = {
  id: string;
  realEntityType?: string;
  realEntityId?: string;
  realEntityName?: string;
  fakeEmail?: string;
  fakePhone?: string;
  fakeDomain?: string;
  loadBoardSource?: string;
  status?: string;
  details?: string;
};

export default function EntityIdentityShieldPage() {
  const params = useParams();
  const id = String(params.id);

  const [entity, setEntity] = useState<TrustEntity | null>(null);
  const [alerts, setAlerts] = useState<IdentityShieldAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const found = await getTrustEntity(id);
        setEntity(found);

        const q = query(
          collection(db, "identity_shield_reports"),
          where("realEntityId", "==", id),
          orderBy("createdAt", "desc")
        );

        const snap = await getDocs(q);

        setAlerts(
          snap.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<IdentityShieldAlert, "id">),
          }))
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [id]);

  return (
    <div className="container">
      <div className="card" style={{ padding: 24 }}>
        <h1 className="h1">Identity Shield</h1>

        <div className="small" style={{ marginTop: 8, lineHeight: 1.7 }}>
          Identity Shield protects legitimate brokers, carriers, dispatchers,
          and drivers from impersonation, fake emails, fake phone numbers, fake
          domains, and suspicious load-board activity.
        </div>

        <div className="small" style={{ marginTop: 12 }}>
          Profile: <b>{entity?.displayName ?? id}</b>
        </div>
      </div>

      <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
        {loading ? (
          <div className="card" style={{ padding: 18 }}>
            Loading Identity Shield alerts...
          </div>
        ) : alerts.length === 0 ? (
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontWeight: 900 }}>No impersonation alerts found.</div>
            <div className="small" style={{ marginTop: 6 }}>
              This does not guarantee no risk. It means no alert has been filed
              yet for this profile.
            </div>
          </div>
        ) : (
          alerts.map((alert) => (
            <div className="card" key={alert.id} style={{ padding: 18 }}>
              <div className="row between wrap" style={{ gap: 12 }}>
                <div style={{ fontWeight: 1000, fontSize: 18 }}>
                  Possible Impersonation Alert
                </div>

                <span className="badge">{alert.status ?? "open"}</span>
              </div>

              <div className="row wrap" style={{ gap: 8, marginTop: 12 }}>
                {alert.fakeEmail ? <span className="badge">Fake Email: {alert.fakeEmail}</span> : null}
                {alert.fakePhone ? <span className="badge">Fake Phone: {alert.fakePhone}</span> : null}
                {alert.fakeDomain ? <span className="badge">Fake Domain: {alert.fakeDomain}</span> : null}
                {alert.loadBoardSource ? <span className="badge">Source: {alert.loadBoardSource}</span> : null}
              </div>

              {alert.details ? (
                <div className="small" style={{ marginTop: 12, lineHeight: 1.7 }}>
                  {alert.details}
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>

      <Link className="btn secondary" href={`/entity/${id}`} style={{ marginTop: 18 }}>
        Back to Profile
      </Link>
    </div>
  );
}