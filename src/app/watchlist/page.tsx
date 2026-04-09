"use client";

import { useState } from "react";
import BrokerWatchlist from "../../components/watchlist/BrokerWatchlist";
import DispatcherWatchlist from "../../components/watchlist/DispatcherWatchlist";

export default function WatchlistPage() {
  const [tab, setTab] = useState<"brokers" | "dispatchers">("brokers");

  return (
    <div className="container">
      <h1 className="h1">Trust & Risk Watchlist</h1>

      <div className="small" style={{ marginTop: 6, opacity: 0.92 }}>
        Monitor public trust and risk signals across brokers and dispatchers.
      </div>

      <div className="row wrap" style={{ gap: 10, marginTop: 14 }}>
        <button
          className={tab === "brokers" ? "btn" : "btn secondary"}
          type="button"
          onClick={() => setTab("brokers")}
        >
          Broker Risk Watchlist
        </button>

        <button
          className={tab === "dispatchers" ? "btn" : "btn secondary"}
          type="button"
          onClick={() => setTab("dispatchers")}
        >
          Dispatcher Risk Watchlist
        </button>
      </div>

      <div style={{ marginTop: 16 }}>
        {tab === "brokers" ? <BrokerWatchlist /> : <DispatcherWatchlist />}
      </div>
    </div>
  );
}