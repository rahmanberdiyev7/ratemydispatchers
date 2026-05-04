"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const [role, setRole] = useState<string>("");
  const [driverType, setDriverType] = useState<string>("");

  const router = useRouter();

  async function handleSubmit() {
    const user = auth.currentUser;
    if (!user) return;

    if (!role) {
      alert("Select account type");
      return;
    }

    if (role === "driver" && !driverType) {
      alert("Select driver type");
      return;
    }

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,

      platformRole: role,
      driverSubtype: role === "driver" ? driverType : null,

      createdAt: serverTimestamp(),
    });

    // redirect based on role
    if (role === "dispatcher") router.push("/dashboard/dispatcher");
    if (role === "carrier") router.push("/dashboard/carrier");
    if (role === "broker") router.push("/dashboard/broker");
    if (role === "driver") router.push("/dashboard/driver");
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Select Account Type</h2>

      <div style={{ marginTop: 20 }}>
        <button onClick={() => setRole("dispatcher")}>Dispatcher</button>
        <button onClick={() => setRole("carrier")}>Carrier</button>
        <button onClick={() => setRole("broker")}>Broker</button>
        <button onClick={() => setRole("driver")}>Driver</button>
      </div>

      {role === "driver" && (
        <div style={{ marginTop: 20 }}>
          <button onClick={() => setDriverType("owner_operator")}>
            Owner Operator
          </button>
          <button onClick={() => setDriverType("company_driver")}>
            Company Driver
          </button>
        </div>
      )}

      <div style={{ marginTop: 30 }}>
        <button onClick={handleSubmit}>Continue</button>
      </div>
    </div>
  );
}