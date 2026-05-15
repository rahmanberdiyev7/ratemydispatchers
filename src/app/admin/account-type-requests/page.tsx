"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import AdminGuard from "@/components/AdminGuard";
import { db } from "@/lib/firebase";
import type {
  AccountTypeChangeRequest,
  AccountTypeChangeRequestStatus,
} from "@/lib/accountTypeChangeRequests";
import type { AccountType, DriverSubtype } from "@/lib/userProfiles";

function labelAccountType(
  accountType: AccountType,
  driverSubtype?: DriverSubtype
) {
  if (accountType === "driver") {
    if (driverSubtype === "owner_operator") return "Driver — Owner Operator";
    if (driverSubtype === "company_driver") return "Driver — Company Driver";
    return "Driver";
  }

  if (accountType === "carrier") return "Carrier";
  if (accountType === "broker") return "Broker";
  if (accountType === "dispatcher") return "Dispatcher";

  return "Unknown";
}

export default function AdminAccountTypeRequestsPage() {
  const [rows, setRows] = useState<AccountTypeChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function loadRequests() {
    setLoading(true);

    try {
      const q = query(
        collection(db, "accountTypeChangeRequests"),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(q);

      setRows(
        snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<AccountTypeChangeRequest, "id">),
        }))
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRequests();
  }, []);

  async function updateRequestStatus(
    request: AccountTypeChangeRequest,
    status: AccountTypeChangeRequestStatus
  ) {
    if (!request.id) return;

    setBusyId(request.id);

    try {
      if (status === "approved") {
        await updateDoc(doc(db, "users", request.userId), {
          accountType: request.requestedAccountType,
          driverSubtype:
            request.requestedAccountType === "driver"
              ? request.requestedDriverSubtype ?? null
              : null,
          accountTypeLocked: true,
          updatedAt: serverTimestamp(),
        });

        await updateDoc(doc(db, "trust_entities", request.userId), {
          type: request.requestedAccountType,
          driverSubtype:
            request.requestedAccountType === "driver"
              ? request.requestedDriverSubtype ?? null
              : null,
          updatedAt: serverTimestamp(),
        });
      }

      await updateDoc(doc(db, "accountTypeChangeRequests", request.id), {
        status,
        updatedAt: serverTimestamp(),
      });

      await loadRequests();
    } catch (error: any) {
      console.error(error);
      alert(error?.message ?? "Failed to update request.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminGuard>
      <div className="container">
        <div className="card" style={{ padding: 24 }}>
          <h1 className="h1">Account Type Requests</h1>

          <div className="small" style={{ marginTop: 8, maxWidth: 900 }}>
            Review account type change requests. Approved changes update both
            the user profile and the connected DispatchGuard trust entity.
          </div>
        </div>

        <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
          {loading ? (
            <div className="card" style={{ padding: 18 }}>
              Loading account type requests...
            </div>
          ) : rows.length === 0 ? (
            <div className="card" style={{ padding: 18 }}>
              No account type change requests yet.
            </div>
          ) : (
            rows.map((row) => (
              <div key={row.id} className="card" style={{ padding: 18 }}>
                <div className="row between wrap" style={{ gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 1000, fontSize: 18 }}>
                      {row.displayName ?? "Unnamed User"}
                    </div>

                    <div className="small" style={{ marginTop: 5 }}>
                      {row.userEmail ?? "No email"} · User ID: {row.userId}
                    </div>
                  </div>

                  <span className="badge">Status: {row.status}</span>
                </div>

                <div className="row wrap" style={{ gap: 8, marginTop: 12 }}>
                  <span className="badge">
                    Current:{" "}
                    {labelAccountType(
                      row.currentAccountType,
                      row.currentDriverSubtype
                    )}
                  </span>

                  <span className="badge">
                    Requested:{" "}
                    {labelAccountType(
                      row.requestedAccountType,
                      row.requestedDriverSubtype
                    )}
                  </span>
                </div>

                <div className="card" style={{ padding: 14, marginTop: 12 }}>
                  <div style={{ fontWeight: 900 }}>Reason</div>

                  <div className="small" style={{ marginTop: 6, lineHeight: 1.7 }}>
                    {row.reason || "No reason provided."}
                  </div>
                </div>

                {row.status === "pending" ? (
                  <div className="row wrap" style={{ gap: 10, marginTop: 14 }}>
                    <button
                      className="btn"
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => updateRequestStatus(row, "approved")}
                    >
                      {busyId === row.id ? "Processing..." : "Approve"}
                    </button>

                    <button
                      className="btn secondary"
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => updateRequestStatus(row, "denied")}
                    >
                      Deny
                    </button>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>
    </AdminGuard>
  );
}