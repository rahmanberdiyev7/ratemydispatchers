import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type AdminRole = "super_admin" | "admin" | "moderator";

export type AdminUser = {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  platformRole?: string | null;
};

const SUPER_ADMIN_EMAILS = ["rahmanberdiyev7@gmail.com"];

function clean(value?: string | null) {
  return String(value ?? "").trim().toLowerCase();
}

export function isAdminRole(role?: string | null, email?: string | null) {
  const normalizedRole = clean(role);
  const normalizedEmail = clean(email);

  if (SUPER_ADMIN_EMAILS.includes(normalizedEmail)) return true;

  return (
    normalizedRole === "super_admin" ||
    normalizedRole === "admin" ||
    normalizedRole === "moderator"
  );
}

export function isSuperAdminRole(role?: string | null, email?: string | null) {
  const normalizedRole = clean(role);
  const normalizedEmail = clean(email);

  if (SUPER_ADMIN_EMAILS.includes(normalizedEmail)) return true;

  return normalizedRole === "super_admin";
}

export async function getAdminUser(uid: string): Promise<AdminUser | null> {
  const snap = await getDoc(doc(db, "users", uid));

  if (!snap.exists()) return null;

  const data = snap.data();

  return {
    uid,
    email: typeof data.email === "string" ? data.email : null,
    displayName: typeof data.displayName === "string" ? data.displayName : null,
    platformRole:
      typeof data.platformRole === "string" ? data.platformRole : null,
  };
}