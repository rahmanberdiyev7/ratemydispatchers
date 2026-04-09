// src/app/login/page.tsx
"use client";

import { useEffect, useState } from "react";
import { loginWithEmail, signupWithEmail, loginWithGoogle, listenToAuth } from "@/lib/auth";
import { BRAND } from "@/lib/brand";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    return listenToAuth((u) => {
      if (u) router.push("/dispatchers");
    });
  }, [router]);

  async function handleLogin() {
    setMsg(null);
    try {
      await loginWithEmail(email, password);
      router.push("/dispatchers");
    } catch (e: any) {
      setMsg(e?.message ?? "Login failed");
    }
  }

  async function handleSignup() {
    setMsg(null);
    try {
      await signupWithEmail(email, password);
      router.push("/dispatchers");
    } catch (e: any) {
      setMsg(e?.message ?? "Signup failed");
    }
  }

  async function handleGoogle() {
    setMsg(null);
    try {
      await loginWithGoogle();
      router.push("/dispatchers");
    } catch (e: any) {
      setMsg(e?.message ?? "Google login failed");
    }
  }

  return (
    <div className="container">
      <div className="card pad" style={{ maxWidth: 560 }}>
        <div className="muted small">{BRAND.product}</div>
        <h1 className="h2" style={{ marginTop: 8 }}>
          Login
        </h1>
        <div className="muted" style={{ marginTop: 8 }}>
          Sign in to post reviews and submit verification claims.
        </div>

        <div className="grid" style={{ marginTop: 14 }}>
          <div>
            <div className="muted small" style={{ marginBottom: 6 }}>
              Email
            </div>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
          </div>

          <div>
            <div className="muted small" style={{ marginBottom: 6 }}>
              Password
            </div>
            <input
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
            />
          </div>

          <div className="row wrap" style={{ marginTop: 6 }}>
            <button className="btn" onClick={handleLogin} type="button">
              Sign In
            </button>
            <button className="btn secondary" onClick={handleSignup} type="button">
              Create Account
            </button>
            <button className="btn secondary" onClick={handleGoogle} type="button">
              Continue with Google
            </button>
          </div>

          {msg ? (
            <div className="card" style={{ padding: 12, background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.18)" }}>
              <div style={{ fontWeight: 800 }}>Error</div>
              <div className="muted small" style={{ marginTop: 4 }}>
                {msg}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}