"use client";

import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type AIAuditAction =
  | "ai_flagged"
  | "ai_unflagged"
  | "ai_override_enabled"
  | "ai_override_disabled"
  | "ai_override_reason_updated"
  | "verification_requested"
  | "verification_updated"
  | "tier_updated"
  | "platform_role_updated"
  | "account_type_updated";

export type AIAuditEntityType =
  | "user_profile"
  | "dispatcher"
  | "broker"
  | "review"
  | "report"
  | "system";

export type AIAlertRecord = {
  id: string;
  entityType: AIAuditEntityType;
  entityId: string;
  action: AIAuditAction;
  title: string;
  message: string;
  severity: "info" | "warning" | "high";
  actorUid?: string;
  actorEmail?: string;
  targetUid?: string;
  targetEmail?: string;
  metadata?: Record<string, unknown>;
  createdAt?: any;
};

export async function createAIAlert(input: {
  entityType: AIAuditEntityType;
  entityId: string;
  action: AIAuditAction;
  title: string;
  message: string;
  severity?: "info" | "warning" | "high";
  actorUid?: string;
  actorEmail?: string;
  targetUid?: string;
  targetEmail?: string;
  metadata?: Record<string, unknown>;
}) {
  await addDoc(collection(db, "aiAlerts"), {
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    title: input.title,
    message: input.message,
    severity: input.severity ?? "info",
    actorUid: input.actorUid ?? "",
    actorEmail: input.actorEmail ?? "",
    targetUid: input.targetUid ?? "",
    targetEmail: input.targetEmail ?? "",
    metadata: input.metadata ?? {},
    createdAt: serverTimestamp(),
  });
}

export async function listAIAlerts(params?: {
  entityType?: AIAuditEntityType;
  entityId?: string;
  targetUid?: string;
  limitCount?: number;
}): Promise<AIAlertRecord[]> {
  const limitCount = params?.limitCount ?? 100;

  if (params?.entityType && params?.entityId) {
    const q = query(
      collection(db, "aiAlerts"),
      where("entityType", "==", params.entityType),
      where("entityId", "==", params.entityId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  }

  if (params?.targetUid) {
    const q = query(
      collection(db, "aiAlerts"),
      where("targetUid", "==", params.targetUid),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  }

  const q = query(
    collection(db, "aiAlerts"),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}