import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type AIAlertLevel = "low" | "medium" | "high" | "critical" | "warning" | "info";

export interface AIAlert {
  id: string;
  title: string;
  message: string;
  level: AIAlertLevel;
  severity?: AIAlertLevel;
  href?: string;
  createdAt?: Date | string | number | null;
}

export type AIAlertRecord = {
  id: string;
  action?: string;
  actorEmail?: string;
  actorUid?: string;
  entityId?: string;
  entityType?: string;
  targetEmail?: string;
  targetUid?: string;
  level?: AIAlertLevel;
  severity?: AIAlertLevel;
  message?: string;
  metadata?: Record<string, unknown> | null;
  reason?: string;
  title?: string;
  createdAt?: Date | string | number | null;
  updatedAt?: Date | string | number | null;
};

type ListAIAlertsInput =
  | number
  | {
      limitCount?: number;
      maxItems?: number;
    };

type CreateAIAlertInput = {
  title?: string;
  message?: string;
  level?: AIAlertLevel;
  severity?: AIAlertLevel;
  action?: string;
  actorEmail?: string;
  actorUid?: string;
  entityId?: string;
  entityType?: string;
  targetEmail?: string;
  targetUid?: string;
  reason?: string;
  metadata?: Record<string, unknown> | null;
};

function normalizeDate(value: unknown): Date | string | number | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") return value;
  if (value instanceof Timestamp) return value.toDate();
  return null;
}

function normalizeLevel(value: unknown): AIAlertLevel {
  if (
    value === "low" ||
    value === "medium" ||
    value === "high" ||
    value === "critical" ||
    value === "warning" ||
    value === "info"
  ) {
    return value;
  }

  return "medium";
}

function normalizeLimit(input?: ListAIAlertsInput): number {
  if (typeof input === "number") return input;

  if (input && typeof input === "object") {
    return input.limitCount ?? input.maxItems ?? 50;
  }

  return 50;
}

export function getAIAlertLevelLabel(level: AIAlertLevel) {
  if (level === "critical") return "Critical";
  if (level === "high") return "High";
  if (level === "warning") return "Warning";
  if (level === "info") return "Info";
  if (level === "medium") return "Medium";
  return "Low";
}

export function getAIAlertTone(level: AIAlertLevel) {
  if (level === "critical") return "danger";
  if (level === "high" || level === "warning") return "warning";
  if (level === "medium" || level === "info") return "info";
  return "neutral";
}

export function buildAIAlerts(): AIAlert[] {
  return [];
}

export async function createAIAlert(input: CreateAIAlertInput) {
  const level = normalizeLevel(input.level ?? input.severity);

  const ref = await addDoc(collection(db, "aiAuditLogs"), {
    title: input.title ?? "AI Alert",
    message: input.message ?? input.reason ?? "AI alert created.",
    level,
    severity: level,
    action: input.action ?? "ai_alert",
    actorEmail: input.actorEmail ?? "",
    actorUid: input.actorUid ?? "",
    entityId: input.entityId ?? "",
    entityType: input.entityType ?? "",
    targetEmail: input.targetEmail ?? "",
    targetUid: input.targetUid ?? "",
    reason: input.reason ?? "",
    metadata: input.metadata ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}

export async function listAIAlerts(
  input: ListAIAlertsInput = 50
): Promise<AIAlertRecord[]> {
  const maxItems = normalizeLimit(input);

  const q = query(
    collection(db, "aiAuditLogs"),
    orderBy("createdAt", "desc"),
    limit(maxItems)
  );

  const snap = await getDocs(q);

  return snap.docs.map((docSnap) => {
    const data = docSnap.data();
    const level = normalizeLevel(data.level ?? data.severity);

    return {
      id: docSnap.id,
      action: typeof data.action === "string" ? data.action : undefined,
      actorEmail: typeof data.actorEmail === "string" ? data.actorEmail : undefined,
      actorUid: typeof data.actorUid === "string" ? data.actorUid : undefined,
      entityId: typeof data.entityId === "string" ? data.entityId : undefined,
      entityType: typeof data.entityType === "string" ? data.entityType : undefined,
      targetEmail: typeof data.targetEmail === "string" ? data.targetEmail : undefined,
      targetUid: typeof data.targetUid === "string" ? data.targetUid : undefined,
      level,
      severity: level,
      message: typeof data.message === "string" ? data.message : undefined,
      metadata:
        data.metadata && typeof data.metadata === "object"
          ? (data.metadata as Record<string, unknown>)
          : null,
      reason: typeof data.reason === "string" ? data.reason : undefined,
      title: typeof data.title === "string" ? data.title : undefined,
      createdAt: normalizeDate(data.createdAt),
      updatedAt: normalizeDate(data.updatedAt),
    };
  });
}