"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, listenToAuth } from "@/lib/auth";
import { getUserProfile, type UserProfile } from "@/lib/userProfiles";
import {
  canPerformAction,
  getRoleRestrictionMessage,
  type RoleAction,
} from "@/lib/roleAccess";

type RoleGuardProps = {
  action: RoleAction;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export default function RoleGuard({ action, children, fallback }: RoleGuardProps) {
  const router = useRouter();

  const initialUser = useMemo(() => getCurrentUser(), []);
  const [uid, setUid] = useState<string | null>(initialUser?.uid ?? null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const unsub = listenToAuth((user) => {
      if (!user) {
        setUid(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUid(user.uid);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    async function load(userId: string) {
      setLoading(true);

      try {
        const row = await getUserProfile(userId);
        setProfile(row);
      } catch (error) {
        console.error("RoleGuard failed to load profile", error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }

    void load(uid);
  }, [uid]);

  if (loading) {
    return <div className="small">Checking permissions…</div>;
  }

  if (!uid) {
    return (
      fallback ?? (
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900 }}>Login required</div>
          <div className="small" style={{ marginTop: 6 }}>
            You need to log in before using this feature.
          </div>
          <div style={{ marginTop: 12 }}>
            <Link className="btn" href="/login">
              Login
            </Link>
          </div>
        </div>
      )
    );
  }

  if (!profile?.accountType) {
    return (
      fallback ?? (
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900 }}>Complete your profile</div>
          <div className="small" style={{ marginTop: 6 }}>
            Choose your account type before using this feature.
          </div>
          <div style={{ marginTop: 12 }}>
            <Link className="btn" href="/profile">
              Complete Profile
            </Link>
          </div>
        </div>
      )
    );
  }

  if (!canPerformAction(profile, action)) {
    return (
      fallback ?? (
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900 }}>Permission required</div>
          <div className="small" style={{ marginTop: 6 }}>
            {getRoleRestrictionMessage(action)}
          </div>
          <div style={{ marginTop: 12 }}>
            <button className="btn secondary" type="button" onClick={() => router.push("/dashboard")}>
              Go to Dashboard
            </button>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}