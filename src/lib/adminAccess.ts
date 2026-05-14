import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type AdminRole = "super_admin" | "admin" | "moderator";

export type AdminUser = {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  platformRole?: string | null;
};

export function isAdminRole(role?: string | null) {
  return role === "super_admin" || role === "admin" || role === "moderator";
}

export function isSuperAdminRole(role?: string | null) {
  return role === "super_admin";
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