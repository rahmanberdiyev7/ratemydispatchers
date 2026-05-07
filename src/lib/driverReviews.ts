import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type DriverType = "owner_operator" | "company_driver";

export type DriverReview = {
  id: string;
  driverId: string;
  reviewerUid: string;
  reviewerEmail?: string | null;
  reviewerAccountType?: string | null;
  rating: number;
  title: string;
  comment: string;
  wouldWorkAgain: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type CreateDriverReviewInput = {
  driverId: string;
  reviewerUid: string;
  reviewerEmail?: string | null;
  reviewerAccountType?: string | null;
  rating: number;
  title: string;
  comment: string;
  wouldWorkAgain: boolean;
};

export async function createDriverReview(input: CreateDriverReviewInput) {
  if (!input.driverId) throw new Error("Driver ID is required.");
  if (!input.reviewerUid) throw new Error("Reviewer UID is required.");
  if (input.rating < 1 || input.rating > 5) {
    throw new Error("Rating must be between 1 and 5.");
  }

  const reviewRef = await addDoc(collection(db, "driverReviews"), {
    driverId: input.driverId,
    reviewerUid: input.reviewerUid,
    reviewerEmail: input.reviewerEmail ?? null,
    reviewerAccountType: input.reviewerAccountType ?? null,
    rating: input.rating,
    title: input.title.trim(),
    comment: input.comment.trim(),
    wouldWorkAgain: input.wouldWorkAgain,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const driverRef = doc(db, "drivers", input.driverId);
  const driverSnap = await getDoc(driverRef);

  if (driverSnap.exists()) {
    await updateDoc(driverRef, {
      reviewCount: increment(1),
      ratingSum: increment(input.rating),
      updatedAt: serverTimestamp(),
    });
  }

  return reviewRef.id;
}

export async function listDriverReviews(driverId: string): Promise<DriverReview[]> {
  const q = query(
    collection(db, "driverReviews"),
    where("driverId", "==", driverId),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);

  return snap.docs.map((row) => {
    const data = row.data();

    return {
      id: row.id,
      driverId: String(data.driverId ?? ""),
      reviewerUid: String(data.reviewerUid ?? ""),
      reviewerEmail:
        typeof data.reviewerEmail === "string" ? data.reviewerEmail : null,
      reviewerAccountType:
        typeof data.reviewerAccountType === "string"
          ? data.reviewerAccountType
          : null,
      rating: Number(data.rating ?? 0),
      title: String(data.title ?? ""),
      comment: String(data.comment ?? ""),
      wouldWorkAgain: Boolean(data.wouldWorkAgain),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  });
}

export function getDriverAverageRating(reviewCount?: number, ratingSum?: number) {
  const count = Number(reviewCount ?? 0);
  const sum = Number(ratingSum ?? 0);

  if (!count) return 0;

  return Number((sum / count).toFixed(1));
}