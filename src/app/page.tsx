import Link from "next/link";

export default function HomePage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <section
        className="card"
        style={{
          padding: 28,
          borderRadius: 28,
          background:
            "linear-gradient(135deg, rgba(32,82,255,0.22), rgba(0,0,0,0.25))",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 1000,
            lineHeight: 0.95,
            letterSpacing: -3,
          }}
        >
          DispatchHub Ecosystem
        </div>

        <div
          style={{
            marginTop: 14,
            fontSize: 20,
            opacity: 0.8,
            maxWidth: 900,
          }}
        >
          Know who to trust before you book the load.
        </div>

        <div
          style={{
            display: "flex",
            gap: 14,
            flexWrap: "wrap",
            marginTop: 26,
          }}
        >
          <Link href="/dispatchers" className="btn">
            Browse Dispatchers
          </Link>

          <Link href="/brokers" className="btn secondary">
            Browse Brokers
          </Link>

          <Link href="/drivers" className="btn secondary">
            Browse Drivers
          </Link>

          <Link href="/dispatchguard" className="btn secondary">
            Trust & Risk Watchlist
          </Link>

          <Link href="/driver-watchlist" className="btn secondary">
            Driver Watchlist
          </Link>
        </div>
      </section>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
          gap: 20,
        }}
      >
        <section className="card">
          <div className="section-title">Dispatcher Intelligence</div>

          <div className="small" style={{ marginTop: 10 }}>
            Research dispatchers before giving them access to your trucks,
            drivers, MC authority, or freight relationships.
          </div>

          <div style={{ marginTop: 18 }}>
            <Link href="/dispatchers" className="btn">
              Open Dispatchers
            </Link>
          </div>
        </section>

        <section className="card">
          <div className="section-title">Broker Reputation</div>

          <div className="small" style={{ marginTop: 10 }}>
            Identify double brokering patterns, payment issues, scams, freight
            risks, and operational red flags.
          </div>

          <div style={{ marginTop: 18 }}>
            <Link href="/brokers" className="btn secondary">
              Open Brokers
            </Link>
          </div>
        </section>

        <section className="card">
          <div className="section-title">Driver Verification</div>

          <div className="small" style={{ marginTop: 10 }}>
            Track risky drivers, owner operators, unsafe behavior, cargo issues,
            and recurring operational incidents.
          </div>

          <div style={{ marginTop: 18 }}>
            <Link href="/drivers" className="btn secondary">
              Open Drivers
            </Link>
          </div>
        </section>
      </div>

      <section className="card">
        <div className="section-title">
          DispatchHub Marketplace Vision
        </div>

        <div
          className="small"
          style={{
            marginTop: 14,
            lineHeight: 1.8,
            maxWidth: 1100,
          }}
        >
          RateMyDispatchers is evolving into the DispatchHub ecosystem — a
          unified logistics intelligence and trust platform connecting carriers,
          dispatchers, brokers, drivers, and recovery networks together.
          <br />
          <br />
          Future ecosystem modules include:
          <br />
          • Dispatcher marketplace
          <br />
          • Broker trust scoring
          <br />
          • AI-powered fraud monitoring
          <br />
          • Carrier recovery network
          <br />
          • Load rescue coordination
          <br />
          • Verified logistics profiles
          <br />
          • Risk intelligence systems
          <br />
          • DispatchHub AI operations layer
        </div>
      </section>
    </div>
  );
}