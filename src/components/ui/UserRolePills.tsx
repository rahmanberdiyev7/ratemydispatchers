"use client";

import type {
  AccountType,
  DriverSubtype,
  PlatformRole,
  UserTier,
  VerificationStatus,
} from "@/lib/userProfiles";

type Props = {
  profile: {
    platformRole: PlatformRole;
    verificationStatus: VerificationStatus;
    tier: UserTier;
    driverType?: DriverSubtype | null;
    accountType?: AccountType | null;
  };
};

function prettyAccountType(accountType?: AccountType | null) {
  if (accountType === "dispatcher") return "Dispatcher";
  if (accountType === "carrier") return "Carrier";
  if (accountType === "driver") return "Driver";
  if (accountType === "broker") return "Broker";
  return null;
}

function prettyDriverType(driverType?: DriverSubtype | null) {
  if (driverType === "owner_operator") return "Owner Operator";
  if (driverType === "company_driver") return "Company Driver";
  return null;
}

export default function UserRolePills({ profile }: Props) {
  const accountTypeLabel = prettyAccountType(profile.accountType);
  const driverTypeLabel = prettyDriverType(profile.driverType);

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        alignItems: "center",
      }}
    >
      <span className="badge">
        {profile.verificationStatus === "verified"
          ? "Verified"
          : profile.verificationStatus === "pending"
          ? "Pending"
          : "Unverified"}
      </span>

      {accountTypeLabel ? <span className="badge">{accountTypeLabel}</span> : null}

      <span className="badge">
        {profile.tier === "tier1"
          ? "Tier 1"
          : profile.tier === "tier2"
          ? "Tier 2"
          : "Tier 3"}
      </span>

      {driverTypeLabel ? <span className="badge">{driverTypeLabel}</span> : null}

      {(profile.platformRole === "admin" || profile.platformRole === "super_admin") ? (
        <span className="badge">
          {profile.platformRole === "super_admin" ? "Super Admin" : "Admin"}
        </span>
      ) : null}
    </div>
  );
}