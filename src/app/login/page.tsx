"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { getUserProfile } from "@/lib/userProfiles";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleAuth() {
    setLoading(true);

    try {
      let userCredential;

      if (isSignup) {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
      } else {
        userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
      }

      const user = userCredential.user;

      // 🔥 check profile
      const profile = await getUserProfile(user.uid);

      if (!profile || !profile.accountType) {
        router.push("/profile");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <h1 className="h1">{isSignup ? "Sign Up" : "Login"}</h1>

      <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
        <input
          className="input"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="input"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="btn" onClick={handleAuth} disabled={loading}>
          {loading ? "Loading..." : isSignup ? "Create Account" : "Login"}
        </button>

        <button
          className="btn secondary"
          onClick={() => setIsSignup(!isSignup)}
        >
          {isSignup ? "Already have an account?" : "Create account"}
        </button>
      </div>
    </div>
  );
}