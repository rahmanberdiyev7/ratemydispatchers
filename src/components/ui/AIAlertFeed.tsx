"use client";

import Link from "next/link";
import type { AIAlert } from "@/lib/aiAlerts";
import { getAIAlertLevelLabel } from "@/lib/aiAlerts";

type Props = {
  alerts: AIAlert[];
};

export default function AIAlertFeed({ alerts }: Props) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontWeight: 900 }}>AI Alert Feed</div>
        <div className="small" style={{ marginTop: 8 }}>
          No active AI alerts right now.
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontWeight: 900 }}>AI Alert Feed</div>

      <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
        {alerts.map((alert) => {
          const content = (
            <div
              style={{
                padding: 12,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              <div className="row wrap" style={{ gap: 8 }}>
                <span className="badge">{getAIAlertLevelLabel(alert.level)}</span>
                <span style={{ fontWeight: 900 }}>{alert.title}</span>
              </div>

              <div className="small" style={{ marginTop: 6 }}>
                {alert.message}
              </div>
            </div>
          );

          return alert.href ? (
            <Link key={alert.id} href={alert.href} style={{ textDecoration: "none" }}>
              {content}
            </Link>
          ) : (
            <div key={alert.id}>{content}</div>
          );
        })}
      </div>
    </div>
  );
}