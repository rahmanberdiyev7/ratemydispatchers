import type {
  AccountType,
  DriverSubtype,
  PlatformRole,
  UserProfile,
  UserTier,
  VerificationStatus,
} from "@/lib/userProfiles";

export function permissionRoleLabel(role?: PlatformRole | null) {
  if (role === "super_admin") return "Super Admin";
  if (role === "admin") return "Admin";
  return "User";
}

export function accountTypeLabel(accountType?: AccountType | null) {
  if (accountType === "dispatcher") return "Dispatcher";
  if (accountType === "carrier") return "Carrier";
  if (accountType === "driver") return "Driver";
  if (accountType === "broker") return "Broker";
  return "User";
}

export function verificationLabel(status?: VerificationStatus | null) {
  if (status === "verified") return "Verified";
  if (status === "pending") return "Pending";
  return "Unverified";
}

export function tierLabel(tier?: UserTier | null) {
  if (tier === "tier3") return "Tier 3";
  if (tier === "tier2") return "Tier 2";
  return "Tier 1";
}

export function driverTypeLabel(driverType?: DriverSubtype | null) {
  if (driverType === "owner_operator") return "Owner-Operator";
  if (driverType === "company_driver") return "Company Driver";
  return "Driver";
}

export function getVerifiedBadgeVariant(
  profile: Pick<UserProfile, "verificationStatus" | "tier">
) {
  if (profile.verificationStatus !== "verified") return null;
  if (profile.tier === "tier3") return "tier3" as const;
  if (profile.tier === "tier2") return "tier2" as const;
  return "verified" as const;
}

export function getPublicIdentityLabel(
  profile: Pick<UserProfile, "accountType" | "driverSubtype">
) {
  if (profile.accountType === "driver") {
    return driverTypeLabel(profile.driverSubtype);
  }

  return accountTypeLabel(profile.accountType);
}

export function isPrivilegedRole(role?: PlatformRole | null) {
  return role === "admin" || role === "super_admin";
}

export function isAdminRole(role?: PlatformRole | null) {
  return role === "admin";
}

export function isSuperAdminRole(role?: PlatformRole | null) {
  return role === "super_admin";
}