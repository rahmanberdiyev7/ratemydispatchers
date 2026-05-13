"use client";

import { useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const demoEntities = [
  {
    id: "demo_dispatcher_1",
    type: "dispatcher",
    displayName: "Alex Prime Dispatch",
    companyName: "Prime Dispatch Solutions",
    email: "alex@primedispatch.demo",
    phone: "555-201-9001",
    mcNumber: "",
    dotNumber: "",
    verified: true,
    dispatchGuard: {
      score: 91,
      level: "trusted",
      reportsCount: 0,
      reviewCount: 18,
      riskSignals: 0,
    },
  },
  {
    id: "demo_dispatcher_2",
    type: "dispatcher",
    displayName: "Fast Lane Dispatch",
    companyName: "Fast Lane Logistics Support",
    email: "ops@fastlanedispatch.demo",
    phone: "555-301-1200",
    mcNumber: "",
    dotNumber: "",
    verified: false,
    dispatchGuard: {
      score: 52,
      level: "high_risk",
      reportsCount: 4,
      reviewCount: 7,
      riskSignals: 3,
    },
  },
  {
    id: "demo_broker_1",
    type: "broker",
    displayName: "NorthStar Freight Brokerage",
    companyName: "NorthStar Freight LLC",
    email: "loads@northstarfreight.demo",
    phone: "555-410-8821",
    mcNumber: "MC-123456",
    dotNumber: "DOT-7654321",
    verified: true,
    dispatchGuard: {
      score: 88,
      level: "verified",
      reportsCount: 1,
      reviewCount: 24,
      riskSignals: 1,
    },
  },
  {
    id: "demo_broker_2",
    type: "broker",
    displayName: "Blue River Loads",
    companyName: "Blue River Brokerage",
    email: "dispatch@blueriverloads.demo",
    phone: "555-602-8890",
    mcNumber: "MC-889901",
    dotNumber: "DOT-4401200",
    verified: false,
    dispatchGuard: {
      score: 31,
      level: "critical",
      reportsCount: 9,
      reviewCount: 5,
      riskSignals: 7,
    },
  },
  {
    id: "demo_carrier_1",
    type: "carrier",
    displayName: "Delo Trans Demo Carrier",
    companyName: "Delo Trans Inc",
    email: "safety@delotrans.demo",
    phone: "555-777-1400",
    mcNumber: "MC-777777",
    dotNumber: "DOT-7777777",
    verified: true,
    dispatchGuard: {
      score: 94,
      level: "trusted",
      reportsCount: 0,
      reviewCount: 31,
      riskSignals: 0,
    },
  },
  {
    id: "demo_driver_1",
    type: "driver",
    displayName: "Mike Owner Operator",
    companyName: "Independent Owner Operator",
    email: "mike.oo@drivers.demo",
    phone: "555-222-3300",
    mcNumber: "",
    dotNumber: "",
    driverSubtype: "owner_operator",
    verified: true,
    dispatchGuard: {
      score: 82,
      level: "verified",
      reportsCount: 1,
      reviewCount: 12,
      riskSignals: 1,
    },
  },
  {
    id: "demo_driver_2",
    type: "driver",
    displayName: "Sam Company Driver",
    companyName: "Regional Fleet Driver",
    email: "sam.driver@drivers.demo",
    phone: "555-444-9090",
    mcNumber: "",
    dotNumber: "",
    driverSubtype: "company_driver",
    verified: false,
    dispatchGuard: {
      score: 43,
      level: "high_risk",
      reportsCount: 5,
      reviewCount: 4,
      riskSignals: 4,
    },
  },
];

const demoIdentityAlerts = [
  {
    id: "demo_identity_1",
    realEntityType: "broker",
    realEntityId: "demo_broker_1",
    realEntityName: "NorthStar Freight Brokerage",
    fakeEmail: "northstarfreight.loads@gmail.com",
    fakePhone: "555-000-1212",
    fakeDomain: "northstar-loads-demo.com",
    loadBoardSource: "dat",
    status: "open",
    details:
      "Possible fake DAT posting using a similar broker name and Gmail address.",
  },
  {
    id: "demo_identity_2",
    realEntityType: "carrier",
    realEntityId: "demo_carrier_1",
    realEntityName: "Delo Trans Demo Carrier",
    fakeEmail: "delotransdispatch@gmail.com",
    fakePhone: "555-000-7777",
    fakeDomain: "delo-trans-loads-demo.com",
    loadBoardSource: "truckstop",
    status: "open",
    details:
      "Suspicious contact pretending to represent carrier operations.",
  },
  {
    id: "demo_identity_3",
    realEntityType: "dispatcher",
    realEntityId: "demo_dispatcher_1",
    realEntityName: "Alex Prime Dispatch",
    fakeEmail: "alexprimedispatch.fake@gmail.com",
    fakePhone: "555-999-8888",
    fakeDomain: "",
    loadBoardSource: "other",
    status: "open",
    details:
      "Fake dispatcher identity using similar name and alternate phone number.",
  },
];

export default function DemoSeedPage() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function seedDemoData() {
    setBusy(true);
    setMessage("");

    try {
      for (const entity of demoEntities) {
        await setDoc(
          doc(db, "trust_entities", entity.id),
          {
            ...entity,
            demo: true,
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      for (const alert of demoIdentityAlerts) {
        await setDoc(
          doc(db, "identity_shield_reports", alert.id),
          {
            ...alert,
            demo: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      setMessage("Demo profiles and Identity Shield alerts created successfully.");
    } catch (error: any) {
      console.error(error);
      setMessage(error?.message ?? "Failed to create demo data.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <div className="card" style={{ padding: 24 }}>
        <h1 className="h1">Demo Seed</h1>

        <div className="small" style={{ marginTop: 10, maxWidth: 900 }}>
          This creates clearly marked demo profiles for brokers, carriers,
          dispatchers, drivers, and DispatchGuard Identity Shield alerts.
        </div>

        <button
          className="btn"
          style={{ marginTop: 18 }}
          onClick={seedDemoData}
          disabled={busy}
        >
          {busy ? "Creating demo data..." : "Create Demo Profiles"}
        </button>

        {message ? (
          <div className="card" style={{ padding: 14, marginTop: 18 }}>
            {message}
          </div>
        ) : null}
      </div>
    </div>
  );
}