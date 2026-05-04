"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listenToAuth } from "@/lib/auth";
import { getUserProfile } from "@/lib/userProfiles";

export default function AuthRedirectGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = listenToAuth(async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const profile = await getUserProfile(user.uid);

      if (!profile?.accountType) {
        router.push("/profile");
        return;
      }

      setReady(true);
    });

    return () => unsub();
  }, [router]);

  if (!ready) {
    return (
      <div className="container">
        <div className="small">Checking account setup…</div>
      </div>
    );
  }

  return <>{children}</>;
}