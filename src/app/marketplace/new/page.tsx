"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { useToast } from "@/components/ToastProvider";
import {
  createMarketplaceListing,
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

export default function NewMarketplaceListingPage() {
  const router = useRouter();
  const user = useMemo(() => getCurrentUser(), []);
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [pricingType, setPricingType] = useState<MarketplacePricingType>("Weekly");
  const [priceLabel, setPriceLabel] = useState("");
  const [bio, setBio] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [serviceTypes, setServiceTypes] = useState<MarketplaceServiceType[]>([]);
  const [saving, setSaving] = useState(false);

  const previewTags = parseTags(tagsText);

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
        message: "Please sign in before creating a marketplace listing.",
      });
      router.push("/login");
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
      const id = await createMarketplaceListing({
        name: cleanName,
        company: cleanCompany,
        title: cleanTitle,
        serviceTypes,
        pricingType,
        priceLabel: cleanPriceLabel,
        location: cleanLocation,
        bio: cleanBio,
        tags,
      });

      showToast({
        tone: "success",
        title: "Listing created",
        message: "Your marketplace listing is now live.",
      });

      router.push(`/marketplace/${id}`);
    } catch (e: any) {
      console.error(e);
      showToast({
        tone: "error",
        title: "Failed to create listing",
        message: e?.message ?? "Something went wrong.",
      });
    } finally {
      setSaving(false);
    }
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
            Create Marketplace Listing
          </h1>
          <div className="small" style={{ opacity: 0.92 }}>
            Build a clean, trustworthy listing that converts visitors into leads.
          </div>
        </div>

        <div className="row wrap" style={{ gap: 10 }}>
          <Link className="btn secondary" href="/marketplace">
            ← Back to Marketplace
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
            placeholder="Title (example: Flatbed dispatch for serious owner-operators)"
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
            const active = serviceTypes.includes(service);
            return (
              <button
                key={service}
                type="button"
                className={active ? "btn" : "btn secondary"}
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
            placeholder="Tags separated by commas (example: dedicated lanes, high RPM, remote onboarding)"
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
          />
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
        </div>
      </div>

      <div className="row wrap" style={{ gap: 10, marginTop: 14 }}>
        <button className="btn" type="button" onClick={onSubmit} disabled={saving}>
          {saving ? "Creating..." : "Create Listing"}
        </button>

        <Link className="btn secondary" href="/marketplace">
          Cancel
        </Link>
      </div>
    </div>
  );
}