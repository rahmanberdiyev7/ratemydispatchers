"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCurrentUser, listenToAuth } from "@/lib/auth";
import {
  listActiveFavoritesByUser,
  getMarketplaceListing,
  removeFavorite,
  type MarketplaceListing,
} from "@/lib/firestore";

type FavoriteItem = MarketplaceListing;

export default function MyFavoritesPage() {
  const router = useRouter();
  const initialUser = useMemo(() => getCurrentUser(), []);

  const [uid, setUid] = useState<string | null>(initialUser?.uid ?? null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = listenToAuth((u) => {
      if (!u) {
        router.push("/login");
        return;
      }
      setUid(u.uid);
    });

    return () => unsub();
  }, [router]);

  async function load() {
    if (!uid) return;

    setLoading(true);
    try {
      const favs = await listActiveFavoritesByUser(uid, { limit: 300 });

      const listings = await Promise.all(
        favs.map(async (f) => {
          try {
            return await getMarketplaceListing(f.listingId);
          } catch {
            return null;
          }
        })
      );

      setItems(
        listings.filter((x): x is MarketplaceListing => !!x && x.active !== false)
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [uid]);

  if (!uid) {
    return (
      <div className="container">
        <div className="small">Redirecting to login…</div>
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
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 className="h1" style={{ marginBottom: 6 }}>
            My Favorites
          </h1>
          <div className="small" style={{ opacity: 0.9 }}>
            Saved marketplace listings you want to revisit later.
          </div>
        </div>

        <div className="row wrap" style={{ gap: 10 }}>
          <Link className="btn secondary" href="/marketplace">
            Marketplace
          </Link>
          <button className="btn secondary" type="button" onClick={load} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="small" style={{ marginTop: 16 }}>
          Loading favorites…
        </div>
      ) : items.length === 0 ? (
        <div className="card" style={{ padding: 16, marginTop: 14 }}>
          <div style={{ fontWeight: 900 }}>No saved listings yet</div>
          <div className="small" style={{ marginTop: 6 }}>
            Save listings from Marketplace to see them here.
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          {items.map((x) => (
            <div key={x.id} className="card" style={{ padding: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 14,
                  flexWrap: "wrap",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div className="row wrap" style={{ gap: 8, alignItems: "center" }}>
                    <div style={{ fontWeight: 950, fontSize: 18 }}>{x.name}</div>
                    {x.verified ? (
                      <span className="badge verified">Verified</span>
                    ) : (
                      <span className="badge">Unverified</span>
                    )}
                  </div>

                  <div className="small" style={{ marginTop: 4 }}>
                    {x.company} • {x.location}
                  </div>

                  <div style={{ fontWeight: 800, marginTop: 10 }}>{x.title}</div>

                  <div className="small" style={{ marginTop: 8 }}>
                    Pricing: <b>{x.priceLabel}</b> • Reviews: <b>{x.reviewCount}</b>
                  </div>
                </div>

                <div className="row wrap" style={{ gap: 10 }}>
                  <Link className="btn secondary" href={`/marketplace/${x.id}`}>
                    View details
                  </Link>

                  <button
                    className="btn"
                    type="button"
                    disabled={busyId === x.id}
                    onClick={async () => {
                      try {
                        setBusyId(x.id);
                        await removeFavorite(x.id);
                        await load();
                      } finally {
                        setBusyId(null);
                      }
                    }}
                  >
                    {busyId === x.id ? "Working..." : "Remove"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}