"use client";

import { useEffect, useState } from "react";
import {
  getCurrentUser,
  getPlatformRole,
  isAdmin,
  isSuperAdmin,
} from "@/lib/auth";
import { getUserProfile } from "@/lib/userProfiles";

type DebugState = {
  uid: string;
  email: string;
  platformRole: string;
  isAdminResult: string;
  isSuperAdminResult: string;
  rawProfile: string;
};

export default function AdminDebugPage() {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<DebugState>({
    uid: "",
    email: "",
    platformRole: "",
    isAdminResult: "",
    isSuperAdminResult: "",
    rawProfile: "",
  });
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const user = getCurrentUser();

      if (!user) {
        setState({
          uid: "",
          email: "",
          platformRole: "",
          isAdminResult: "false",
          isSuperAdminResult: "false",
          rawProfile: "No authenticated user found.",
        });
        return;
      }

      const [role, adminOk, superAdminOk, profile] = await Promise.all([
        getPlatformRole(),
        isAdmin(true),
        isSuperAdmin(),
        getUserProfile(user.uid),
      ]);

      setState({
        uid: user.uid,
        email: user.email ?? "",
        platformRole: role,
        isAdminResult: String(adminOk),
        isSuperAdminResult: String(superAdminOk),
        rawProfile: JSON.stringify(profile, null, 2),
      });
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="container">
      <h1 className="h1" style={{ marginBottom: 8 }}>
        Admin Debug
      </h1>

      <div className="small" style={{ opacity: 0.9, marginBottom: 16 }}>
        Use this page to verify your current logged-in account and admin role.
      </div>

      <div className="card" style={{ padding: 16 }}>
        {loading ? (
          <div className="small">Loading admin debug info…</div>
        ) : error ? (
          <div className="small" style={{ color: "#ff9f9f" }}>
            {error}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <b>UID:</b> {state.uid || "—"}
            </div>

            <div>
              <b>Email:</b> {state.email || "—"}
            </div>

            <div>
              <b>Platform Role:</b> {state.platformRole || "—"}
            </div>

            <div>
              <b>isAdmin(true):</b> {state.isAdminResult}
            </div>

            <div>
              <b>isSuperAdmin():</b> {state.isSuperAdminResult}
            </div>

            <div>
              <b>Raw Firestore Profile:</b>
              <pre
                style={{
                  marginTop: 10,
                  padding: 12,
                  borderRadius: 12,
                  overflowX: "auto",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {state.rawProfile}
              </pre>
            </div>

            <div className="row wrap" style={{ gap: 10 }}>
              <button className="btn" type="button" onClick={() => void load()}>
                Refresh Debug Info
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}