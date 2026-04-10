"use client";

import VerifiedBadge from "@/components/ui/VerifiedBadge";

export default function ScamSkeeterPage() {
  // Mock data (replace later with real data)
  const data = [
    {
      id: "1",
      name: "John Dispatcher",
      verified: true,
    },
    {
      id: "2",
      name: "Mike Carrier",
      verified: false,
    },
  ];

  return (
    <div className="container">
      <h1 className="h1">Scam Skeeter</h1>

      <div className="card" style={{ marginTop: 16 }}>
        {data.map((d) => (
          <div
            key={d.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: 12,
              borderBottom: "1px solid #222",
            }}
          >
            <div>{d.name}</div>

            <div>
              {d.verified ? (
                <VerifiedBadge />
              ) : (
                <span className="badge">Unverified</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}