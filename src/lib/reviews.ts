// src/lib/reviews.ts
import {
  addDoc,
  collection,
  getDocs,
  limit as qLimit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

export type Rating = 1 | 2 | 3 | 4 | 5;

export type Review = {
  id: string;
  dispatcherId: string;
  comment: string;
  rating: Rating;
  createdBy: string;
  createdAt?: Timestamp;
  dispatcherName?: string;
};

const reviewsCol = collection(db, "reviews");

function mapReview(id: string, data: any): Review {
  return {
    id,
    dispatcherId: String(data?.dispatcherId ?? ""),
    comment: String(data?.comment ?? ""),
    rating: (data?.rating ?? 5) as Rating,
    createdBy: String(data?.createdBy ?? ""),
    createdAt: data?.createdAt,
    dispatcherName: data?.dispatcherName ? String(data.dispatcherName) : undefined,
  };
}

export async function listRecentReviews(arg: number | { limit?: number } = 5): Promise<Review[]> {
  const lim = typeof arg === "number" ? arg : arg.limit ?? 5;
  const q = query(reviewsCol, orderBy("createdAt", "desc"), qLimit(lim));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapReview(d.id, d.data()));
}

export async function listReviewsForDispatcher(dispatcherId: string, lim = 200): Promise<Review[]> {
  const q = query(
    reviewsCol,
    where("dispatcherId", "==", dispatcherId),
    orderBy("createdAt", "desc"),
    qLimit(lim)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapReview(d.id, d.data()));
}

export async function createReview(input: {
  dispatcherId: string;
  comment: string;
  rating: Rating;
  createdBy: string;
  dispatcherName?: string;
}): Promise<string> {
  const ref = await addDoc(reviewsCol, {
    dispatcherId: input.dispatcherId,
    comment: input.comment.trim(),
    rating: input.rating,
    createdBy: input.createdBy,
    dispatcherName: input.dispatcherName ?? "",
    createdAt: serverTimestamp(),
  });
  return ref.id;
}