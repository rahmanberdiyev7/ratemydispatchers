import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type AIAlertLevel = "low" | "medium" | "high" | "critical";

export type AIAlert = {
  id: string;
  title: string;
  message: string;
  level: AIAlertLevel;
  severity?: AIAlertLevel;
  href?: string;
  createdAt?: Date | string | number | null;
};

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
    value === "critical"
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
  if (level === "medium") return "Medium";
  return "Low";
}

export function getAIAlertTone(level: AIAlertLevel) {
  if (level === "critical") return "danger";
  if (level === "high") return "warning";
  if (level === "medium") return "info";
  return "neutral";
}

export function buildAIAlerts(): AIAlert[] {
  return [];
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