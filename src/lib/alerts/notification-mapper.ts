import { TriggeredAlert } from "@/types/alerts";
import { LiveNotification } from "@/components/ui/live-notification-feed";

/**
 * Format timestamp into relative age string e.g. "4m", "1h", "now", "2d"
 */
export function formatNotificationTime(timestamp: string): string {
  try {
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h`;
    const diffDays = Math.floor(diffHr / 24);
    return `${diffDays}d`;
  } catch {
    return "now";
  }
}

/**
 * Maps database triggered_alerts record into LiveNotification for the LiveNotificationFeed component
 */
export function mapAlertToLiveNotification(alert: TriggeredAlert): LiveNotification {
  const normApp = (alert.app || "").toLowerCase();
  const time = formatNotificationTime(alert.triggered_at);

  const actions = [
    { label: "Review" },
    { label: "Dismiss", done: "Dismissed" },
    { label: "Resolve", done: "Resolved" },
  ];

  if (normApp.includes("gmail") || normApp.includes("email")) {
    return {
      id: alert.id,
      kind: "message",
      app: "Gmail",
      title: alert.title,
      body: alert.message,
      time,
      accent: "#EA4335",
      read: alert.read,
      from: alert.metadata?.from || alert.metadata?.sender || "Priority Contact",
      text: alert.message || alert.title,
      actions,
    };
  }

  if (normApp.includes("whatsapp")) {
    return {
      id: alert.id,
      kind: "message",
      app: "WhatsApp",
      title: alert.title,
      body: alert.message,
      time,
      accent: "#25D366",
      read: alert.read,
      from: alert.metadata?.sender || alert.metadata?.channel || "Direct VIP Line",
      text: alert.message || alert.title,
      actions,
    };
  }

  if (normApp.includes("slack")) {
    return {
      id: alert.id,
      kind: "message",
      app: "Slack",
      title: alert.title,
      body: alert.message,
      time,
      accent: "#E01E5A",
      read: alert.read,
      from: alert.metadata?.channel || alert.metadata?.sender || "#general",
      text: alert.message || alert.title,
      actions,
    };
  }

  if (normApp.includes("calendar") || normApp.includes("gcal")) {
    const rawDate =
      alert.metadata?.start_time ||
      alert.metadata?.date ||
      new Date(alert.triggered_at).toISOString().split("T")[0];

    return {
      id: alert.id,
      kind: "calendar",
      app: "Calendar",
      title: alert.title,
      body: alert.message,
      time,
      accent: "#4285F4",
      read: alert.read,
      date: rawDate,
      attendees: Array.isArray(alert.metadata?.attendees)
        ? alert.metadata.attendees
        : ["Executive Team", "Host"],
      actions,
    };
  }

  // Default / System Alert
  return {
    id: alert.id,
    kind: "code",
    app: alert.app ? alert.app.toUpperCase() : "System Alert",
    title: alert.title,
    body: alert.message,
    time,
    accent: "#0066FF",
    read: alert.read,
    code: alert.metadata?.code || alert.priority.toUpperCase(),
    actions,
  };
}

/**
 * Maps an array of TriggeredAlert records to LiveNotification[]
 */
export function mapAlertsToLiveNotifications(alerts: TriggeredAlert[]): LiveNotification[] {
  return alerts.map(mapAlertToLiveNotification);
}
