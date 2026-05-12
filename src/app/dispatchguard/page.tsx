"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import {
  listTrustEntities,
  TrustEntity,
} from "@/lib/trustEntities";

import DispatchGuardBadge from "@/components/DispatchGuardBadge";

export default function DispatchGuardPage() {
  const [loading, setLoading] =
    useState(true);

  const [entities, setEntities] =
    useState<TrustEntity[]>([]);

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState<
      | "all"
      | "dispatcher"
      | "broker"
      | "driver"
      | "carrier"
    >("all");

  useEffect(() => {
    async function load() {
      try {
        const rows =
          await listTrustEntities();

        setEntities(rows);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const filtered = useMemo(() => {
    return entities.filter((x) => {
      const matchesType =
        filter === "all"
          ? true
          : x.type === filter;

      const q = search.toLowerCase();

      const matchesSearch =
        !q ||
        x.displayName
          ?.toLowerCase()
          .includes(q) ||
        x.companyName
          ?.toLowerCase()
          .includes(q) ||
        x.mcNumber
          ?.toLowerCase()
          .includes(q) ||
        x.dotNumber
          ?.toLowerCase()
          .includes(q) ||
        x.phone
          ?.toLowerCase()
          .includes(q) ||
        x.email
          ?.toLowerCase()
          .includes(q);

      return (
        matchesType &&
        matchesSearch
      );
    });
  }, [entities, filter, search]);

  const stats = useMemo(() => {
    return {
      total: entities.length,

      dispatchers:
        entities.filter(
          (x) =>
            x.type ===
            "dispatcher",
        ).length,

      brokers:
        entities.filter(
          (x) =>
            x.type === "broker",
        ).length,

      drivers:
        entities.filter(
          (x) =>
            x.type === "driver",
        ).length,

      carriers:
        entities.filter(
          (x) =>
            x.type === "carrier",
        ).length,

      highRisk:
        entities.filter(
          (x) =>
            x.dispatchGuard
              ?.level ===
              "high_risk" ||
            x.dispatchGuard
              ?.level ===
              "critical",
        ).length,
    };
  }, [entities]);

  return (
    <div className="container">
      <div
        className="card"
        style={{
          padding: 28,
        }}
      >
        <h1 className="h1">
          DispatchGuard™
        </h1>

        <div
          className="small"
          style={{
            marginTop: 10,
            lineHeight: 1.8,
            maxWidth: 1100,
          }}
        >
          DispatchGuard™ is the
          operational trust
          infrastructure layer for
          freight logistics.
          <br />
          <br />
          Search and verify:
          <br />
          • Dispatchers
          <br />
          • Brokers
          <br />
          • Drivers
          <br />
          • Carriers
          <br />
          <br />
          DispatchGuard combines:
          <br />
          • Reviews
          <br />
          • Scam reports
          <br />
          • Identity Shield alerts
          <br />
          • Fraud intelligence
          <br />
          • Reputation history
          <br />
          • AI-assisted risk analysis
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(180px,1fr))",
            gap: 12,
            marginTop: 24,
          }}
        >
          <div
            className="card"
            style={{
              padding: 14,
            }}
          >
            <div className="small">
              Total Entities
            </div>

            <div className="h2">
              {stats.total}
            </div>
          </div>

          <div
            className="card"
            style={{
              padding: 14,
            }}
          >
            <div className="small">
              Dispatchers
            </div>

            <div className="h2">
              {stats.dispatchers}
            </div>
          </div>

          <div
            className="card"
            style={{
              padding: 14,
            }}
          >
            <div className="small">
              Brokers
            </div>

            <div className="h2">
              {stats.brokers}
            </div>
          </div>

          <div
            className="card"
            style={{
              padding: 14,
            }}
          >
            <div className="small">
              Drivers
            </div>

            <div className="h2">
              {stats.drivers}
            </div>
          </div>

          <div
            className="card"
            style={{
              padding: 14,
            }}
          >
            <div className="small">
              Carriers
            </div>

            <div className="h2">
              {stats.carriers}
            </div>
          </div>

          <div
            className="card"
            style={{
              padding: 14,
            }}
          >
            <div className="small">
              High Risk
            </div>

            <div className="h2">
              {stats.highRisk}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "2fr 1fr",
            gap: 12,
            marginTop: 24,
          }}
        >
          <input
            className="input"
            placeholder="Search by company, MC, DOT, phone, email..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value,
              )
            }
          />

          <select
            className="input"
            value={filter}
            onChange={(e) =>
              setFilter(
                e.target
                  .value as any,
              )
            }
          >
            <option value="all">
              All Entities
            </option>

            <option value="dispatcher">
              Dispatchers
            </option>

            <option value="broker">
              Brokers
            </option>

            <option value="driver">
              Drivers
            </option>

            <option value="carrier">
              Carriers
            </option>
          </select>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: 12,
          marginTop: 20,
        }}
      >
        {loading ? (
          <div
            className="card"
            style={{
              padding: 18,
            }}
          >
            Loading
            DispatchGuard™...
          </div>
        ) : filtered.length ===
          0 ? (
          <div
            className="card"
            style={{
              padding: 18,
            }}
          >
            No matching entities
            found.
          </div>
        ) : (
          filtered.map((entity) => (
            <div
              key={entity.id}
              className="card"
              style={{
                padding: 18,
              }}
            >
              <div
                className="row between"
                style={{
                  gap: 16,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 1000,
                    }}
                  >
                    {
                      entity.displayName
                    }
                  </div>

                  <div
                    className="small"
                    style={{
                      marginTop: 6,
                    }}
                  >
                    {entity.type.toUpperCase()}
                    {entity.companyName
                      ? ` · ${entity.companyName}`
                      : ""}
                  </div>
                </div>

                <DispatchGuardBadge
                  level={
                    entity
                      .dispatchGuard
                      ?.level
                  }
                  score={
                    entity
                      .dispatchGuard
                      ?.score
                  }
                />
              </div>

              <div
                className="row wrap"
                style={{
                  gap: 10,
                  marginTop: 16,
                }}
              >
                {entity.mcNumber ? (
                  <div className="badge">
                    MC:{" "}
                    {
                      entity.mcNumber
                    }
                  </div>
                ) : null}

                {entity.dotNumber ? (
                  <div className="badge">
                    DOT:{" "}
                    {
                      entity.dotNumber
                    }
                  </div>
                ) : null}

                {entity.phone ? (
                  <div className="badge">
                    {
                      entity.phone
                    }
                  </div>
                ) : null}

                {entity.email ? (
                  <div className="badge">
                    {
                      entity.email
                    }
                  </div>
                ) : null}

                <div className="badge">
                  Reviews:{" "}
                  {entity
                    .dispatchGuard
                    ?.reviewCount ??
                    0}
                </div>

                <div className="badge">
                  Reports:{" "}
                  {entity
                    .dispatchGuard
                    ?.reportsCount ??
                    0}
                </div>
              </div>

              <div
                className="row wrap"
                style={{
                  gap: 10,
                  marginTop: 16,
                }}
              >
                <Link
                  href={`/entity/${entity.id}`}
                  className="btn"
                >
                  Open Profile
                </Link>

                <Link
                  href={`/entity/${entity.id}/report`}
                  className="btn secondary"
                >
                  Submit Report
                </Link>

                <Link
                  href={`/entity/${entity.id}/reviews`}
                  className="btn secondary"
                >
                  Reviews
                </Link>

                <Link
                  href={`/entity/${entity.id}/identity-shield`}
                  className="btn secondary"
                >
                  Identity Shield
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}