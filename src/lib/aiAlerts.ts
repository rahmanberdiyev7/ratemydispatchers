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
  href?: string;
  createdAt?: Date | string | number | null;
};

export type AIAlertRecord = {
  id: string;
  action?: string;
  entityId?: string;
  entityType?: string;
  level?: AIAlertLevel;
  message?: string;
  metadata?: Record<string, unknown> | null;
  reason?: string;
  title?: string;
  createdAt?: Date | string | number | null;
  updatedAt?: Date | string | number | null;
};

function normalizeDate(value: unknown): Date | string | number | null {
  if (!value) return null;

  if (value instanceof Date) return value;

  if (typeof value === "string" || typeof value === "number") {
    return value;
  }

  if (value instanceof Timestamp) {
    return value.toDate();
  }

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

export async function listAIAlerts(maxItems = 50): Promise<AIAlertRecord[]> {
  const q = query(
    collection(db, "aiAuditLogs"),
    orderBy("createdAt", "desc"),
    limit(maxItems)
  );

  const snap = await getDocs(q);

  return snap.docs.map((docSnap) => {
    const data = docSnap.data();

    return {
      id: docSnap.id,
      action: typeof data.action === "string" ? data.action : undefined,
      entityId: typeof data.entityId === "string" ? data.entityId : undefined,
      entityType: typeof data.entityType === "string" ? data.entityType : undefined,
      level: normalizeLevel(data.level),
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