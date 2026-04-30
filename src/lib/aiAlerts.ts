export type AIAlertLevel = "low" | "medium" | "high" | "critical";

export type AIAlert = {
  id: string;
  title: string;
  message: string;
  level: AIAlertLevel;
  href?: string;
  createdAt?: Date | string | number | null;
};

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