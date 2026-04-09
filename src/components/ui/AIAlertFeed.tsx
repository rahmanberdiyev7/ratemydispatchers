"use client";

import Link from "next/link";
import type { AIAlert } from "@/lib/aiAlerts";

type Props = {
  alerts: AIAlert[];
  loading?: boolean;
};

function toneStyles(severity: AIAlert["severity"]) {
  if (severity === "critical") {
    return {
      border: "1px solid rgba(255, 107, 107, 0.35)",
      background: "rgba(255, 107, 107, 0.10)",
      badgeBg: "rgba(255, 107, 107, 0.18)",
      badgeColor: "#ffb4b4",
      badgeBorder: "rgba(255, 107, 107, 0.35)",
    };
  }

  if (severity === "warning") {
    return {
      border: "1px solid rgba(255, 159, 67, 0.35)",
      background: "rgba(255, 159, 67, 0.10)",
      badgeBg: "rgba(255, 159, 67, 0.18)",
      badgeColor: "#ffd09a",
      badgeBorder: "rgba(255, 159, 67, 0.35)",
    };
  }

  return {
    border: "1px solid rgba(77, 163, 255, 0.28)",
    background: "rgba(77, 163, 255, 0.08)",
    badgeBg: "rgba(77, 163, 255, 0.16)",
    badgeColor: "#b8d8ff",
    badgeBorder: "rgba(77, 163, 255, 0.32)",
  };
}

export default function AIAlertFeed({ alerts, loading }: Props) {
  return (
    <section className="premiumShowcase">
      <div className="premiumShowcaseHeader">
        <div>
          <div className="premiumEyebrow">Realtime system events</div>
          <h2 className="premiumSectionTitle">AI Alerts</h2>
        </div>

        <Link href="/watchlist" className="btn secondary">
          Open watchlist
        </Link>
      </div>

      {loading ? (
        <div className="small" style={{ marginTop: 16 }}>
          Loading AI alerts…
        </div>
      ) : alerts.length === 0 ? (
        <div className="card" style={{ padding: 16, marginTop: 16 }}>
          <div style={{ fontWeight: 900 }}>No AI alerts right now</div>
          <div className="small" style={{ marginTop: 6 }}>
            The system will surface new trust and risk events here.
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
          {alerts.slice(0, 5).map((alert) => {
            const tone = toneStyles(alert.severity);

            return (
              <div
                key={alert.id}
                className="card"
                style={{
                  padding: 16,
                  border: tone.border,
                  background: tone.background,
                }}
              >
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
                    <div
                      className="row wrap"
                      style={{ gap: 8, alignItems: "center" }}
                    >
                      <span
                        className="badge"
                        style={{
                          background: tone.badgeBg,
                          color: tone.badgeColor,
                          border: `1px solid ${tone.badgeBorder}`,
                        }}
                      >
                        {alert.severity.toUpperCase()}
                      </span>

                      <div style={{ fontWeight: 900 }}>{alert.title}</div>
                    </div>

                    <div className="small" style={{ marginTop: 6 }}>
                      <b>{alert.dispatcherName}</b> · {alert.company}
                    </div>

                    <div className="small" style={{ marginTop: 8 }}>
                      {alert.message}
                    </div>

                    <div className="small" style={{ marginTop: 8 }}>
                      Risk score: {alert.score} · {alert.createdAtLabel}
                    </div>
                  </div>

                  <div style={{ minWidth: 180, display: "grid", gap: 10 }}>
                    <Link
                      href={`/dispatchers/${alert.dispatcherId}`}
                      className="btn secondary"
                    >
                      View profile
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}