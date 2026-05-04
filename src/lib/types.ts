export type PlatformRole =
  | "dispatcher"
  | "carrier"
  | "broker"
  | "driver";

export type DriverSubtype =
  | "owner_operator"
  | "company_driver"
  | null;

export interface UserProfile {
  uid: string;
  email: string;

  platformRole: PlatformRole;
  driverSubtype: DriverSubtype;

  createdAt: any;
}