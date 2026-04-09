"use client";

import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit as fsLimit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type BrokerReview = {
  id: string;
  brokerId: string;
  createdBy: string;
  rating: number;
  comment: string;
  hidden?: boolean;
  createdAt?: any;
  updatedAt?: any;
};

function mapBrokerReview(docSnap: QueryDocumentSnapshot<DocumentData>): BrokerReview {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    brokerId: data.brokerId ?? "",
    createdBy: data.createdBy ?? "",
    rating: Number(data.rating ?? 0),
    comment: data.comment ?? "",
    hidden: data.hidden === true,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function listBrokerReviewsForBroker(
  brokerId: string,
  input?: { limit?: number }
): Promise<BrokerReview[]> {
  const n = Math.max(1, Math.min(Number(input?.limit ?? 100), 500));

  const qy = query(
    collection(db, "brokerReviews"),
    where("brokerId", "==", brokerId),
    orderBy("createdAt", "desc"),
    fsLimit(n)
  );

  const snap = await getDocs(qy);
  return snap.docs.map(mapBrokerReview);
}

export async function createBrokerReview(input: {
  brokerId: string;
  rating: number;
  comment: string;
  createdBy: string;
}) {
  const cleanComment = input.comment.trim();
  const cleanRating = Math.max(1, Math.min(5, Math.round(Number(input.rating))));

  return addDoc(collection(db, "brokerReviews"), {
    brokerId: input.brokerId,
    createdBy: input.createdBy,
    rating: cleanRating,
    comment: cleanComment,
    hidden: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function hideBrokerReview(reviewId: string) {
  const ref = doc(db, "brokerReviews", reviewId);

  await updateDoc(ref, {
    hidden: true,
    updatedAt: serverTimestamp(),
  });
}