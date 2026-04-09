"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { useToast } from "@/components/ToastProvider";
import {
  getMarketplaceListing,
  updateMarketplaceListing,
  type MarketplaceListing,
  type MarketplacePricingType,
  type MarketplaceServiceType,
} from "@/lib/firestore";

const SERVICE_OPTIONS: MarketplaceServiceType[] = [
  "Dry Van",
  "Flatbed",
  "Reefer",
  "Power Only",
  "Box Truck",
  "Hotshot",
];

const PRICING_OPTIONS: MarketplacePricingType[] = ["Weekly", "Percentage", "Custom"];

function parseTags(input: string) {
  return input
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export default function EditMarketplaceListingPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();

  const id = useMemo(() => {
    const raw = params?.id;
    return typeof raw === "string" ? raw : "";
  }, [params]);

  const user = useMemo(() => getCurrentUser(), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [listing, setListing] = useState<MarketplaceListing | null>(null);

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [pricingType, setPricingType] = useState<MarketplacePricingType>("Weekly");
  const [priceLabel, setPriceLabel] = useState("");
  const [bio, setBio] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [serviceTypes, setServiceTypes] = useState<MarketplaceServiceType[]>([]);
  const [active, setActive] = useState(true);

  const previewTags = parseTags(tagsText);

  useEffect(() => {
    async function load() {
      if (!id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const row = await getMarketplaceListing(id);
        setListing(row);

        if (!row) return;

        setName(row.name ?? "");
        setCompany(row.company ?? "");
        setTitle(row.title ?? "");
        setLocation(row.location ?? "");
        setPricingType((row.pricingType as MarketplacePricingType) ?? "Weekly");
        setPriceLabel(row.priceLabel ?? "");
        setBio(row.bio ?? "");
        setTagsText((row.tags ?? []).join(", "));
        setServiceTypes((row.serviceTypes ?? []) as MarketplaceServiceType[]);
        setActive(row.active !== false);
      } catch (e) {
        console.error(e);
        setListing(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  function toggleService(service: MarketplaceServiceType) {
    setServiceTypes((prev) =>
      prev.includes(service) ? prev.filter((x) => x !== service) : [...prev, service]
    );
  }

  async function onSubmit() {
    if (!user) {
      showToast({
        tone: "error",
        title: "Login required",
        message: "Please sign in before editing a marketplace listing.",
      });
      router.push("/login");
      return;
    }

    if (!listing) {
      showToast({
        tone: "error",
        title: "Listing not found",
      });
      return;
    }

    if (listing.createdBy !== user.uid) {
      showToast({
        tone: "error",
        title: "Access denied",
        message: "You can only edit your own listing.",
      });
      return;
    }

    const cleanName = name.trim();
    const cleanCompany = company.trim();
    const cleanTitle = title.trim();
    const cleanLocation = location.trim();
    const cleanPriceLabel = priceLabel.trim();
    const cleanBio = bio.trim();
    const tags = parseTags(tagsText);

    if (!cleanName) {
      showToast({ tone: "error", title: "Missing listing name" });
      return;
    }
    if (!cleanCompany) {
      showToast({ tone: "error", title: "Missing company name" });
      return;
    }
    if (!cleanTitle) {
      showToast({ tone: "error", title: "Missing listing title" });
      return;
    }
    if (!cleanLocation) {
      showToast({ tone: "error", title: "Missing location" });
      return;
    }
    if (!cleanPriceLabel) {
      showToast({ tone: "error", title: "Missing pricing info" });
      return;
    }
    if (!cleanBio) {
      showToast({ tone: "error", title: "Missing listing bio" });
      return;
    }
    if (serviceTypes.length === 0) {
      showToast({ tone: "error", title: "Choose at least one service type" });
      return;
    }

    setSaving(true);
    try {
      await updateMarketplaceListing(id, {
        name: cleanName,
        company: cleanCompany,
        title: cleanTitle,
        serviceTypes,
        pricingType,
        priceLabel: cleanPriceLabel,
        location: cleanLocation,
        bio: cleanBio,
        tags,
        active,
      });

      showToast({
        tone: "success",
        title: "Listing updated",
        message: "Your marketplace listing changes have been saved.",
      });

      router.push(`/marketplace/${id}`);
    } catch (e: any) {
      console.error(e);
      showToast({
        tone: "error",
        title: "Failed to update listing",
        message: e?.message ?? "Something went wrong.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="small">Loading listing…</div>
      </div>
    );
  }

  if (!id || !listing) {
    return (
      <div className="container">
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900 }}>Listing not found</div>
          <div className="small" style={{ marginTop: 6 }}>
            This listing may have been removed.
          </div>
          <div style={{ marginTop: 12 }}>
            <Link className="btn secondary" href="/marketplace">
              ← Back to Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container">
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900 }}>Login required</div>
          <div className="small" style={{ marginTop: 6 }}>
            Please sign in to edit this listing.
          </div>
          <div style={{ marginTop: 12 }}>
            <Link className="btn secondary" href="/login">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (listing.createdBy !== user.uid) {
    return (
      <div className="container">
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900 }}>Access denied</div>
          <div className="small" style={{ marginTop: 6 }}>
            You can only edit your own listing.
          </div>
          <div style={{ marginTop: 12 }}>
            <Link className="btn secondary" href={`/marketplace/${id}`}>
              ← Back to Listing
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
            Edit Marketplace Listing
          </h1>
          <div className="small" style={{ opacity: 0.92 }}>
            Update your listing details, services, pricing, and visibility.
          </div>
        </div>

        <div className="row wrap" style={{ gap: 10 }}>
          <Link className="btn secondary" href={`/marketplace/${id}`}>
            ← Back to Listing
          </Link>
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <div className="small" style={{ opacity: 0.9 }}>Basic info</div>

        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          <input
            className="input"
            placeholder="Listing name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="input"
            placeholder="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
          <input
            className="input"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className="input"
            placeholder="Location / service area"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <div className="small" style={{ opacity: 0.9 }}>Services</div>

        <div className="row wrap" style={{ gap: 10, marginTop: 12 }}>
          {SERVICE_OPTIONS.map((service) => {
            const activeService = serviceTypes.includes(service);
            return (
              <button
                key={service}
                type="button"
                className={activeService ? "btn" : "btn secondary"}
                onClick={() => toggleService(service)}
              >
                {service}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <div className="small" style={{ opacity: 0.9 }}>Pricing</div>

        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          <select
            className="input"
            value={pricingType}
            onChange={(e) => setPricingType(e.target.value as MarketplacePricingType)}
          >
            {PRICING_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <input
            className="input"
            placeholder='Price label (example: "10% of gross" or "$500/week")'
            value={priceLabel}
            onChange={(e) => setPriceLabel(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <div className="small" style={{ opacity: 0.9 }}>Details</div>

        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          <textarea
            className="input"
            style={{ minHeight: 150 }}
            placeholder="Bio / offer details / why carriers should choose you"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />

          <input
            className="input"
            placeholder="Tags separated by commas"
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
          />

          <label className="row" style={{ gap: 8, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            <span className="small">Listing is active</span>
          </label>
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <div className="small" style={{ opacity: 0.9 }}>Preview summary</div>

        <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
          <div><b>Name:</b> {name || "—"}</div>
          <div><b>Company:</b> {company || "—"}</div>
          <div><b>Title:</b> {title || "—"}</div>
          <div><b>Location:</b> {location || "—"}</div>
          <div><b>Pricing:</b> {pricingType} • {priceLabel || "—"}</div>
          <div><b>Services:</b> {serviceTypes.length ? serviceTypes.join(", ") : "—"}</div>
          <div><b>Tags:</b> {previewTags.length ? previewTags.join(", ") : "—"}</div>
          <div><b>Status:</b> {active ? "Active" : "Inactive"}</div>
        </div>
      </div>

      <div className="row wrap" style={{ gap: 10, marginTop: 14 }}>
        <button className="btn" type="button" onClick={onSubmit} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>

        <Link className="btn secondary" href={`/marketplace/${id}`}>
          Cancel
        </Link>
      </div>
    </div>
  );
}