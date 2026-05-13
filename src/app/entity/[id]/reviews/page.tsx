"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getTrustEntity, type TrustEntity } from "@/lib/trustEntities";

export default function EntityReviewsPage() {
  const params = useParams();
  const id = String(params.id);

  const [entity, setEntity] = useState<TrustEntity | null>(null);

  useEffect(() => {
    void getTrustEntity(id).then(setEntity);
  }, [id]);

  return (
    <div className="container">
      <div className="card" style={{ padding: 24 }}>
        <h1 className="h1">Reviews</h1>

        <div className="small" style={{ marginTop: 8 }}>
          {entity?.displayName ?? "Entity"} review history.
        </div>

        <div className="card" style={{ padding: 18, marginTop: 18 }}>
          <div style={{ fontWeight: 900 }}>No reviews connected yet.</div>

          <div className="small" style={{ marginTop: 8 }}>
            Next step will connect this page to unified review records.
          </div>
        </div>

        <Link className="btn secondary" href={`/entity/${id}`} style={{ marginTop: 18 }}>
          Back to Profile
        </Link>
      </div>
    </div>
  );
}