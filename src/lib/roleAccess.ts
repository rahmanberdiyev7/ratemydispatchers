import type { AccountType, DriverSubtype, UserProfile } from "@/lib/userProfiles";

export type RoleAction =
  | "review_dispatcher"
  | "review_broker"
  | "report_dispatcher"
  | "report_broker"
  | "create_marketplace_listing"
  | "manage_own_profile"
  | "access_admin"
  | "access_ai_flags";

export function isAdminProfile(profile: UserProfile | null | undefined) {
  return (
    profile?.platformRole === "admin" ||
    profile?.platformRole === "super_admin"
  );
}

export function isSuperAdminProfile(profile: UserProfile | null | undefined) {
  return profile?.platformRole === "super_admin";
}

export function isDispatcher(profile: UserProfile | null | undefined) {
  return profile?.accountType === "dispatcher";
}

export function isCarrier(profile: UserProfile | null | undefined) {
  return profile?.accountType === "carrier";
}

export function isBroker(profile: UserProfile | null | undefined) {
  return profile?.accountType === "broker";
}

export function isDriver(profile: UserProfile | null | undefined) {
  return profile?.accountType === "driver";
}

export function isOwnerOperator(profile: UserProfile | null | undefined) {
  return (
    profile?.accountType === "driver" &&
    profile?.driverSubtype === "owner_operator"
  );
}

export function getAccountLabel(
  accountType?: AccountType | null,
  driverSubtype?: DriverSubtype | null
) {
  if (accountType === "dispatcher") return "Dispatcher";
  if (accountType === "carrier") return "Carrier";
  if (accountType === "broker") return "Broker";

  if (accountType === "driver") {
    if (driverSubtype === "owner_operator") return "Owner-Operator";
    if (driverSubtype === "company_driver") return "Company Driver";
    return "Driver";
  }

  return "General User";
}

export function canReviewDispatcher(profile: UserProfile | null | undefined) {
  if (!profile?.accountType) return false;

  return (
    isAdminProfile(profile) ||
    profile.accountType === "carrier" ||
    profile.accountType === "driver"
  );
}

export function canReviewBroker(profile: UserProfile | null | undefined) {
  if (!profile?.accountType) return false;

  return (
    isAdminProfile(profile) ||
    profile.accountType === "carrier" ||
    profile.accountType === "driver"
  );
}

export function canReportDispatcher(profile: UserProfile | null | undefined) {
  if (!profile?.accountType) return false;

  return (
    isAdminProfile(profile) ||
    profile.accountType === "carrier" ||
    profile.accountType === "driver"
  );
}

export function canReportBroker(profile: UserProfile | null | undefined) {
  if (!profile?.accountType) return false;

  return (
    isAdminProfile(profile) ||
    profile.accountType === "carrier" ||
    profile.accountType === "driver"
  );
}

export function canCreateMarketplaceListing(
  profile: UserProfile | null | undefined
) {
  if (!profile?.accountType) return false;

  return (
    isAdminProfile(profile) ||
    profile.accountType === "dispatcher" ||
    profile.accountType === "carrier"
  );
}

export function canManageOwnProfile(profile: UserProfile | null | undefined) {
  return !!profile;
}

export function canAccessAdmin(profile: UserProfile | null | undefined) {
  return isAdminProfile(profile);
}

export function canAccessAIFlags(profile: UserProfile | null | undefined) {
  return isAdminProfile(profile);
}

export function canPerformAction(
  profile: UserProfile | null | undefined,
  action: RoleAction
) {
  if (action === "review_dispatcher") return canReviewDispatcher(profile);
  if (action === "review_broker") return canReviewBroker(profile);
  if (action === "report_dispatcher") return canReportDispatcher(profile);
  if (action === "report_broker") return canReportBroker(profile);
  if (action === "create_marketplace_listing") {
    return canCreateMarketplaceListing(profile);
  }
  if (action === "manage_own_profile") return canManageOwnProfile(profile);
  if (action === "access_admin") return canAccessAdmin(profile);
  if (action === "access_ai_flags") return canAccessAIFlags(profile);

  return false;
}

export function getRoleRestrictionMessage(action: RoleAction) {
  if (action === "review_dispatcher") {
    return "Only carriers, drivers, owner-operators, and admins can review dispatchers.";
  }

  if (action === "review_broker") {
    return "Only carriers, drivers, owner-operators, and admins can review brokers.";
  }

  if (action === "report_dispatcher") {
    return "Only carriers, drivers, owner-operators, and admins can report dispatchers.";
  }

  if (action === "report_broker") {
    return "Only carriers, drivers, owner-operators, and admins can report brokers.";
  }

  if (action === "create_marketplace_listing") {
    return "Only dispatchers, carriers, and admins can create marketplace listings.";
  }

  if (action === "access_admin") {
    return "Admin access required.";
  }

  if (action === "access_ai_flags") {
    return "Admin access required to manage AI flags.";
  }

  return "You do not have permission for this action.";
}