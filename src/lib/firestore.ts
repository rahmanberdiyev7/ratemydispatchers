"use client";

import { auth, db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  orderBy,
  limit as qLimit,
  increment,
} from "firebase/firestore";

// ---------- Collections ----------
const dispatchersCol = collection(db, "dispatchers");
const reviewsCol = collection(db, "reviews");
const claimsCol = collection(db, "claims");
const reportsCol = collection(db, "reports");
const marketplaceListingsCol = collection(db, "marketplaceListings");
const marketplaceLeadsCol = collection(db, "marketplaceLeads");
const marketplaceReviewsCol = collection(db, "marketplaceReviews");
const marketplaceReviewReportsCol = collection(db, "marketplaceReviewReports");
const favoritesCol = collection(db, "favorites");
const notificationsCol = collection(db, "notifications");

// ---------- Types ----------
export type Dispatcher = {
  id: string;
  name: string;
  company: string;
  verified: boolean;
  createdBy: string;
  createdAt?: any;
  ratingSum: number;
  reviewCount: number;
  reportCount?: number;
};

export type Review = {
  id: string;
  dispatcherId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  createdBy: string;
  createdAt?: any;
  hidden?: boolean;
};

export type ClaimStatus = "pending" | "approved" | "rejected";

export type ClaimRequest = {
  id: string;
  dispatcherId: string;
  dispatcherName?: string;
  company?: string;
  createdBy: string;
  status: ClaimStatus;
  createdAt?: any;
  email?: string;
  phone?: string;
  role?: string;
  notes?: string;
};

export type ReportStatus = "open" | "closed";

export type Report = {
  id: string;
  reviewId: string;
  dispatcherId: string;
  reason: string;
  createdBy: string;
  status: ReportStatus;
  createdAt?: any;
};

export type MarketplaceServiceType =
  | "Dry Van"
  | "Flatbed"
  | "Reefer"
  | "Power Only"
  | "Box Truck"
  | "Hotshot";

export type MarketplacePricingType = "Weekly" | "Percentage" | "Custom";

export type MarketplaceListing = {
  id: string;
  name: string;
  company: string;
  title: string;
  serviceTypes: MarketplaceServiceType[];
  pricingType: MarketplacePricingType;
  priceLabel: string;
  verified: boolean;
  rating: number;
  reviewCount: number;
  location: string;
  bio: string;
  tags: string[];
  createdBy: string;
  active: boolean;
  createdAt?: any;
  updatedAt?: any;
};

export type MarketplaceLeadStatus = "new" | "contacted" | "closed";

export type MarketplaceLead = {
  id: string;
  listingId: string;
  listingName: string;
  listingCompany: string;
  listingOwnerId: string;
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  senderCompany?: string;
  equipmentType?: string;
  message: string;
  createdBy: string;
  status: MarketplaceLeadStatus;
  createdAt?: any;
};

export type MarketplaceReview = {
  id: string;
  listingId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  createdBy: string;
  createdAt?: any;
  hidden?: boolean;
};

export type MarketplaceReviewReport = {
  id: string;
  listingId: string;
  reviewId: string;
  reason: string;
  createdBy: string;
  status: "open" | "closed";
  createdAt?: any;
};

export type Favorite = {
  id: string;
  userId: string;
  listingId: string;
  createdAt?: any;
  deletedAt?: any;
};

export type AppNotificationType =
  | "lead_new"
  | "claim_approved"
  | "claim_rejected"
  | "system";

export type AppNotification = {
  id: string;
  userId: string;
  type: AppNotificationType;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt?: any;
};

// ---------- Helpers ----------
function requireUser() {
  const u = auth.currentUser;
  if (!u) throw new Error("Not logged in");
  return u;
}

function mapDoc<T>(id: string, data: any): T {
  return { id, ...(data ?? {}) } as T;
}

function cleanTags(tags: string[]) {
  return tags.map((x) => x.trim()).filter(Boolean).slice(0, 12);
}

function cleanServiceTypes(types: MarketplaceServiceType[]) {
  return Array.from(new Set(types)).slice(0, 8);
}

async function createNotification(input: {
  userId: string;
  type: AppNotificationType;
  title: string;
  body: string;
  href?: string;
}) {
  await addDoc(notificationsCol, {
    userId: input.userId,
    type: input.type,
    title: input.title.trim(),
    body: input.body.trim(),
    href: input.href?.trim() || undefined,
    read: false,
    createdAt: serverTimestamp(),
  });
}

// ---------- Dispatchers ----------
export async function createDispatcher(input: { name: string; company: string }) {
  const u = requireUser();

  const ref = await addDoc(dispatchersCol, {
    name: input.name.trim(),
    company: input.company.trim(),
    verified: false,
    createdBy: u.uid,
    createdAt: serverTimestamp(),
    ratingSum: 0,
    reviewCount: 0,
    confirmedReportCount: 0,
    communityAlert: false,
  });

  return ref.id;
}

export async function listDispatchers(opts?: { limit?: number }) {
  const lim = opts?.limit ?? 200;
  const q = query(dispatchersCol, orderBy("createdAt", "desc"), qLimit(lim));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapDoc<Dispatcher>(d.id, d.data()));
}

export async function getDispatcher(id: string) {
  const snap = await getDoc(doc(db, "dispatchers", id));
  if (!snap.exists()) return null;
  return mapDoc<Dispatcher>(snap.id, snap.data());
}

export async function countDispatchers() {
  const q = query(dispatchersCol, qLimit(1000));
  const snap = await getDocs(q);
  return snap.size;
}

export async function countVerifiedDispatchers() {
  const q = query(dispatchersCol, where("verified", "==", true), qLimit(1000));
  const snap = await getDocs(q);
  return snap.size;
}

export async function verifyDispatcher(dispatcherId: string) {
  await updateDoc(doc(db, "dispatchers", dispatcherId), {
    verified: true,
  });
}

// ---------- Reviews ----------
export async function createReview(input: {
  dispatcherId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
}) {
  const u = requireUser();

  const ref = await addDoc(reviewsCol, {
    dispatcherId: input.dispatcherId,
    rating: input.rating,
    comment: input.comment.trim(),
    createdBy: u.uid,
    createdAt: serverTimestamp(),
    hidden: false,
  });

  await updateDoc(doc(db, "dispatchers", input.dispatcherId), {
    ratingSum: increment(input.rating),
    reviewCount: increment(1),
  });

  return ref.id;
}

export async function listReviewsForDispatcher(
  dispatcherId: string,
  opts?: { limit?: number }
) {
  const lim = opts?.limit ?? 200;

  const q = query(
    reviewsCol,
    where("dispatcherId", "==", dispatcherId),
    where("hidden", "==", false),
    orderBy("createdAt", "desc"),
    qLimit(lim)
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => mapDoc<Review>(d.id, d.data()));
}

export async function listReviewsByUser(
  userId: string,
  opts?: { limit?: number; includeHidden?: boolean }
) {
  const lim = opts?.limit ?? 100;

  const constraints: any[] = [
    where("createdBy", "==", userId),
    orderBy("createdAt", "desc"),
    qLimit(lim),
  ];

  if (!opts?.includeHidden) {
    constraints.splice(1, 0, where("hidden", "==", false));
  }

  const q = query(reviewsCol, ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapDoc<Review>(d.id, d.data()));
}

export async function hideReview(reviewId: string) {
  await updateDoc(doc(db, "reviews", reviewId), { hidden: true });
}

// ---------- Claims ----------
export async function createClaimRequest(input: {
  dispatcherId: string;
  dispatcherName?: string;
  company?: string;
  email?: string;
  phone?: string;
  role?: string;
  notes?: string;
}) {
  const u = requireUser();

  const ref = await addDoc(claimsCol, {
    dispatcherId: input.dispatcherId,
    dispatcherName: input.dispatcherName ?? undefined,
    company: input.company ?? undefined,
    createdBy: u.uid,
    status: "pending",
    email: (input.email ?? "").trim() || undefined,
    phone: (input.phone ?? "").trim() || undefined,
    role: (input.role ?? "").trim() || undefined,
    notes: (input.notes ?? "").trim() || undefined,
    createdAt: serverTimestamp(),
  });

  return ref.id;
}

export async function listClaimRequests(opts?: { limit?: number }) {
  const lim = opts?.limit ?? 50;
  const q = query(claimsCol, orderBy("createdAt", "desc"), qLimit(lim));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapDoc<ClaimRequest>(d.id, d.data()));
}

export async function listClaimRequestsByUser(
  userId: string,
  opts?: { limit?: number }
) {
  const lim = opts?.limit ?? 100;
  const q = query(
    claimsCol,
    where("createdBy", "==", userId),
    orderBy("createdAt", "desc"),
    qLimit(lim)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapDoc<ClaimRequest>(d.id, d.data()));
}

export async function approveClaim(claimId: string, dispatcherId: string) {
  const snap = await getDoc(doc(db, "claims", claimId));
  if (!snap.exists()) throw new Error("Claim not found");

  const claim = snap.data();

  await updateDoc(doc(db, "claims", claimId), { status: "approved" });
  await verifyDispatcher(dispatcherId);

  if (claim.createdBy) {
    await createNotification({
      userId: claim.createdBy,
      type: "claim_approved",
      title: "Claim approved",
      body: `Your claim request for ${claim.dispatcherName || "dispatcher"} was approved.`,
      href: `/dispatchers/${dispatcherId}`,
    });
  }
}

export async function rejectClaim(claimId: string) {
  const snap = await getDoc(doc(db, "claims", claimId));
  if (!snap.exists()) throw new Error("Claim not found");

  const claim = snap.data();

  await updateDoc(doc(db, "claims", claimId), { status: "rejected" });

  if (claim.createdBy) {
    await createNotification({
      userId: claim.createdBy,
      type: "claim_rejected",
      title: "Claim rejected",
      body: `Your claim request for ${claim.dispatcherName || "dispatcher"} was rejected.`,
      href: claim.dispatcherId ? `/dispatchers/${claim.dispatcherId}` : undefined,
    });
  }
}

// ---------- Reports ----------
export async function createReport(input: {
  reviewId: string;
  dispatcherId: string;
  reason: string;
}) {
  const u = requireUser();

  const ref = await addDoc(reportsCol, {
    reviewId: input.reviewId,
    dispatcherId: input.dispatcherId,
    reason: input.reason.trim(),
    createdBy: u.uid,
    status: "open",
    createdAt: serverTimestamp(),
  });

  return ref.id;
}

export async function listOpenReports(opts?: { limit?: number }) {
  const lim = opts?.limit ?? 100;
  const q = query(
    reportsCol,
    where("status", "==", "open"),
    orderBy("createdAt", "desc"),
    qLimit(lim)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapDoc<Report>(d.id, d.data()));
}

export async function dismissReport(reportId: string) {
  await updateDoc(doc(db, "reports", reportId), { status: "closed" });
}

export async function hideReviewFromReport(reportId: string, reviewId: string) {
  await hideReview(reviewId);
  await dismissReport(reportId);
}

export async function confirmReport(reportId: string, dispatcherId: string) {
  const dispatcherRef = doc(db, "dispatchers", dispatcherId);
  const dispatcherSnap = await getDoc(dispatcherRef);

  if (!dispatcherSnap.exists()) {
    throw new Error("Dispatcher not found");
  }

  const data = dispatcherSnap.data();
  const current = Number(data.confirmedReportCount ?? 0) + 1;

  await updateDoc(dispatcherRef, {
    confirmedReportCount: current,
    communityAlert: current >= 3,
  });

  await updateDoc(doc(db, "reports", reportId), {
    status: "closed",
  });
}

// ---------- Marketplace ----------
export async function createMarketplaceListing(input: {
  name: string;
  company: string;
  title: string;
  serviceTypes: MarketplaceServiceType[];
  pricingType: MarketplacePricingType;
  priceLabel: string;
  location: string;
  bio: string;
  tags: string[];
}) {
  const u = requireUser();

  const ref = await addDoc(marketplaceListingsCol, {
    name: input.name.trim(),
    company: input.company.trim(),
    title: input.title.trim(),
    serviceTypes: cleanServiceTypes(input.serviceTypes),
    pricingType: input.pricingType,
    priceLabel: input.priceLabel.trim(),
    verified: false,
    rating: 0,
    reviewCount: 0,
    location: input.location.trim(),
    bio: input.bio.trim(),
    tags: cleanTags(input.tags),
    createdBy: u.uid,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}

export async function listMarketplaceListings(opts?: { limit?: number }) {
  const lim = opts?.limit ?? 200;
  const q = query(marketplaceListingsCol, orderBy("createdAt", "desc"), qLimit(lim));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapDoc<MarketplaceListing>(d.id, d.data()));
}

export async function getMarketplaceListing(id: string) {
  const snap = await getDoc(doc(db, "marketplaceListings", id));
  if (!snap.exists()) return null;
  return mapDoc<MarketplaceListing>(snap.id, snap.data());
}

export async function listMarketplaceListingsByUser(
  userId: string,
  opts?: { limit?: number }
) {
  const lim = opts?.limit ?? 100;
  const q = query(
    marketplaceListingsCol,
    where("createdBy", "==", userId),
    orderBy("createdAt", "desc"),
    qLimit(lim)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapDoc<MarketplaceListing>(d.id, d.data()));
}

export async function updateMarketplaceListing(
  listingId: string,
  input: {
    name: string;
    company: string;
    title: string;
    serviceTypes: MarketplaceServiceType[];
    pricingType: MarketplacePricingType;
    priceLabel: string;
    location: string;
    bio: string;
    tags: string[];
    active?: boolean;
  }
) {
  const u = requireUser();

  const existing = await getMarketplaceListing(listingId);
  if (!existing) throw new Error("Listing not found");
  if (existing.createdBy !== u.uid) throw new Error("Not allowed");

  await updateDoc(doc(db, "marketplaceListings", listingId), {
    name: input.name.trim(),
    company: input.company.trim(),
    title: input.title.trim(),
    serviceTypes: cleanServiceTypes(input.serviceTypes),
    pricingType: input.pricingType,
    priceLabel: input.priceLabel.trim(),
    location: input.location.trim(),
    bio: input.bio.trim(),
    tags: cleanTags(input.tags),
    active: input.active ?? true,
    updatedAt: serverTimestamp(),
  });
}

export async function deactivateMarketplaceListing(listingId: string) {
  const u = requireUser();

  const existing = await getMarketplaceListing(listingId);
  if (!existing) throw new Error("Listing not found");
  if (existing.createdBy !== u.uid) throw new Error("Not allowed");

  await updateDoc(doc(db, "marketplaceListings", listingId), {
    active: false,
    updatedAt: serverTimestamp(),
  });
}

// ---------- Marketplace Leads ----------
export async function createMarketplaceLead(input: {
  listingId: string;
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  senderCompany?: string;
  equipmentType?: string;
  message: string;
}) {
  const u = requireUser();

  const listing = await getMarketplaceListing(input.listingId);
  if (!listing) throw new Error("Listing not found");
  if (listing.active === false) throw new Error("Listing is not active");

  const ref = await addDoc(marketplaceLeadsCol, {
    listingId: listing.id,
    listingName: listing.name,
    listingCompany: listing.company,
    listingOwnerId: listing.createdBy,
    senderName: input.senderName.trim(),
    senderEmail: input.senderEmail.trim(),
    senderPhone: (input.senderPhone ?? "").trim() || undefined,
    senderCompany: (input.senderCompany ?? "").trim() || undefined,
    equipmentType: (input.equipmentType ?? "").trim() || undefined,
    message: input.message.trim(),
    createdBy: u.uid,
    status: "new",
    createdAt: serverTimestamp(),
  });

  await createNotification({
    userId: listing.createdBy,
    type: "lead_new",
    title: "New marketplace lead",
    body: `${input.senderName.trim()} sent you a new lead for ${listing.name}.`,
    href: "/my-leads",
  });

  return ref.id;
}

export async function listMarketplaceLeadsForOwner(
  ownerId: string,
  opts?: { limit?: number }
) {
  const lim = opts?.limit ?? 200;
  const q = query(
    marketplaceLeadsCol,
    where("listingOwnerId", "==", ownerId),
    orderBy("createdAt", "desc"),
    qLimit(lim)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapDoc<MarketplaceLead>(d.id, d.data()));
}

export async function listMarketplaceLeadsBySender(
  userId: string,
  opts?: { limit?: number }
) {
  const lim = opts?.limit ?? 200;
  const q = query(
    marketplaceLeadsCol,
    where("createdBy", "==", userId),
    orderBy("createdAt", "desc"),
    qLimit(lim)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapDoc<MarketplaceLead>(d.id, d.data()));
}

export async function updateMarketplaceLeadStatus(
  leadId: string,
  status: MarketplaceLeadStatus
) {
  const u = requireUser();

  const snap = await getDoc(doc(db, "marketplaceLeads", leadId));
  if (!snap.exists()) throw new Error("Lead not found");

  const data = snap.data();
  if (data.listingOwnerId !== u.uid) throw new Error("Not allowed");

  await updateDoc(doc(db, "marketplaceLeads", leadId), {
    status,
  });
}

// ---------- Marketplace Reviews ----------
export async function createMarketplaceReview(input: {
  listingId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
}) {
  const u = requireUser();

  const listing = await getMarketplaceListing(input.listingId);
  if (!listing) throw new Error("Listing not found");
  if (listing.active === false) throw new Error("Listing is not active");

  const ref = await addDoc(marketplaceReviewsCol, {
    listingId: input.listingId,
    rating: input.rating,
    comment: input.comment.trim(),
    createdBy: u.uid,
    createdAt: serverTimestamp(),
    hidden: false,
  });

  const currentCount = Number(listing.reviewCount ?? 0);
  const currentRating = Number(listing.rating ?? 0);
  const nextCount = currentCount + 1;
  const nextRating = ((currentRating * currentCount) + input.rating) / nextCount;

  await updateDoc(doc(db, "marketplaceListings", input.listingId), {
    rating: nextRating,
    reviewCount: nextCount,
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}

export async function listMarketplaceReviewsForListing(
  listingId: string,
  opts?: { limit?: number }
) {
  const lim = opts?.limit ?? 200;

  const q = query(
    marketplaceReviewsCol,
    where("listingId", "==", listingId),
    where("hidden", "==", false),
    orderBy("createdAt", "desc"),
    qLimit(lim)
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => mapDoc<MarketplaceReview>(d.id, d.data()));
}

export async function createMarketplaceReviewReport(input: {
  listingId: string;
  reviewId: string;
  reason: string;
}) {
  const u = requireUser();

  const ref = await addDoc(marketplaceReviewReportsCol, {
    listingId: input.listingId,
    reviewId: input.reviewId,
    reason: input.reason.trim(),
    createdBy: u.uid,
    status: "open",
    createdAt: serverTimestamp(),
  });

  return ref.id;
}

export async function listOpenMarketplaceReviewReports(opts?: { limit?: number }) {
  const lim = opts?.limit ?? 100;
  const q = query(
    marketplaceReviewReportsCol,
    where("status", "==", "open"),
    qLimit(lim)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapDoc<MarketplaceReviewReport>(d.id, d.data()));
}

export async function dismissMarketplaceReviewReport(reportId: string) {
  await updateDoc(doc(db, "marketplaceReviewReports", reportId), {
    status: "closed",
  });
}

export async function hideMarketplaceReview(reviewId: string) {
  await updateDoc(doc(db, "marketplaceReviews", reviewId), {
    hidden: true,
  });
}

export async function hideMarketplaceReviewFromReport(reportId: string, reviewId: string) {
  await hideMarketplaceReview(reviewId);
  await dismissMarketplaceReviewReport(reportId);
}

// ---------- Favorites ----------
export async function listFavoritesByUser(
  userId: string,
  opts?: { limit?: number }
) {
  const lim = opts?.limit ?? 200;
  const q = query(
    favoritesCol,
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    qLimit(lim)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapDoc<Favorite>(d.id, d.data()));
}

export async function isListingFavorited(userId: string, listingId: string) {
  const q = query(
    favoritesCol,
    where("userId", "==", userId),
    where("listingId", "==", listingId),
    qLimit(1)
  );
  const snap = await getDocs(q);
  return snap.docs.some((d) => !d.data().deletedAt);
}

export async function addFavorite(listingId: string) {
  const u = requireUser();

  const exists = await isListingFavorited(u.uid, listingId);
  if (exists) return;

  await addDoc(favoritesCol, {
    userId: u.uid,
    listingId,
    createdAt: serverTimestamp(),
  });
}

export async function removeFavorite(listingId: string) {
  const u = requireUser();

  const q = query(
    favoritesCol,
    where("userId", "==", u.uid),
    where("listingId", "==", listingId),
    qLimit(20)
  );
  const snap = await getDocs(q);

  for (const row of snap.docs) {
    await updateDoc(doc(db, "favorites", row.id), {
      deletedAt: serverTimestamp(),
    });
  }
}

export async function listActiveFavoritesByUser(
  userId: string,
  opts?: { limit?: number }
) {
  const lim = opts?.limit ?? 200;
  const q = query(
    favoritesCol,
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    qLimit(lim)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => mapDoc<Favorite>(d.id, d.data()))
    .filter((x) => !x.deletedAt);
}

// ---------- Notifications ----------
export async function listNotificationsByUser(
  userId: string,
  opts?: { limit?: number }
) {
  const lim = opts?.limit ?? 200;
  const q = query(
    notificationsCol,
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    qLimit(lim)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapDoc<AppNotification>(d.id, d.data()));
}

export async function listUnreadNotificationsByUser(
  userId: string,
  opts?: { limit?: number }
) {
  const lim = opts?.limit ?? 100;
  const q = query(
    notificationsCol,
    where("userId", "==", userId),
    where("read", "==", false),
    orderBy("createdAt", "desc"),
    qLimit(lim)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapDoc<AppNotification>(d.id, d.data()));
}

export async function markNotificationRead(notificationId: string) {
  const u = requireUser();

  const snap = await getDoc(doc(db, "notifications", notificationId));
  if (!snap.exists()) throw new Error("Notification not found");

  const data = snap.data();
  if (data.userId !== u.uid) throw new Error("Not allowed");

  await updateDoc(doc(db, "notifications", notificationId), {
    read: true,
  });
}

export async function markAllNotificationsRead() {
  const u = requireUser();

  const unread = await listUnreadNotificationsByUser(u.uid, { limit: 500 });

  for (const n of unread) {
    await updateDoc(doc(db, "notifications", n.id), {
      read: true,
    });
  }
}

export async function countUnreadNotifications(userId: string) {
  const rows = await listUnreadNotificationsByUser(userId, { limit: 500 });
  return rows.length;
}