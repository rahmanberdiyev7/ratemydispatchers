import type {
  PlatformRole,
  UserTier,
  VerificationStatus,
  DriverType,
  UserProfile,
} from "@/lib/userProfiles";

export function roleLabel(role: PlatformRole) {
  if (role === "super_admin") return "Super Admin";
  if (role === "admin") return "Admin";
  if (role === "dispatcher") return "Dispatcher";
  if (role === "carrier") return "Carrier";
  if (role === "driver") return "Driver";
  if (role === "broker") return "Broker";
  return "User";
}

export function verificationLabel(status: VerificationStatus) {
  if (status === "verified") return "Verified";
  if (status === "pending") return "Pending Verification";
  if (status === "rejected") return "Rejected";
  return "Unverified";
}

export function tierLabel(tier: UserTier) {
  if (tier === "tier3") return "Tier 3";
  if (tier === "tier2") return "Tier 2";
  return "Tier 1";
}

export function driverTypeLabel(driverType?: DriverType | null) {
  if (driverType === "owner_operator") return "Owner-Operator";
  if (driverType === "company_driver") return "Company Driver";
  return "Driver";
}

export function getVerifiedBadgeVariant(profile: Pick<UserProfile, "verificationStatus" | "tier">) {
  if (profile.verificationStatus !== "verified") return null;
  if (profile.tier === "tier3") return "tier3" as const;
  if (profile.tier === "tier2") return "tier2" as const;
  return "verified" as const;
}