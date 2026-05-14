"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentUser, listenToAuth } from "@/lib/auth";
import { getAdminUser, isAdminRole } from "@/lib/adminAccess";

type Props = {
  children: ReactNode;
};

export default function AdminGuard({ children }: Props) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  async function check(uid: string) {
    const adminUser = await getAdminUser(uid);
    setEmail(adminUser?.email ?? null);
    setAllowed(isAdminRole(adminUser?.platformRole, adminUser?.email));
    setLoading(false);
  }

  useEffect(() => {
    const current = getCurrentUser();

    if (current) {
      void check(current.uid);
      return;
    }

    const unsub = listenToAuth((user) => {
      if (!user) {
        setAllowed(false);
        setLoading(false);
        return;
      }

      void check(user.uid);
    });

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="container">
        <div className="card" style={{ padding: 18 }}>
          Checking admin access...
        </div>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="container">
        <div className="card" style={{ padding: 24 }}>
          <h1 className="h1">Admin Access Required</h1>

          <div className="small" style={{ marginTop: 10 }}>
            {email
              ? `${email} does not have admin permissions.`
              : "Please login with an admin account."}
          </div>

          <Link href="/login" className="btn" style={{ marginTop: 18 }}>
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}