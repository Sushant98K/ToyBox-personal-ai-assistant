import { NormalizedBriefingItem } from "@/types/briefing";

export interface DeduplicateOptions {
  referenceDate?: Date | string | number;
  calendarHorizonDays?: number; // Maximum days ahead to include calendar events (default: 7 days)
  contextText?: string; // Optional prompt goal or title to infer intended horizon
}

/**
 * Detects the intended calendar horizon in days from prompt goals, titles, or instructions.
 * E.g.:
 * - "give me all schedule dates this year" -> 365 days
 * - "next month schedule" -> 35 days
 * - "next 2 weeks" -> 14 days
 * - General daily briefing ("Executive Briefing", "Morning Triage", etc.) -> 7 days (default)
 */
export function detectCalendarHorizon(text?: string, defaultDays: number = 7): number {
  if (!text || typeof text !== "string") return defaultDays;
  const t = text.toLowerCase();

  // 1. Year / Annual horizon (365 days)
  if (
    /\b(this|next|full|entire|all)\s+year\b/.test(t) ||
    /\b(annual|yearly|all\s+year|through\s+202[0-9]|in\s+202[0-9])\b/.test(t) ||
    /\ball\s+(schedule\s+)?(dates|events|meetings)\b/.test(t) ||
    /\ball\s+upcoming\s+(schedule|events|meetings|dates)\b/.test(t) ||
    /\bcalendar\s+this\s+year\b/.test(t) ||
    /\bschedule\s+(dates\s+)?this\s+year\b/.test(t)
  ) {
    return 365;
  }

  // 2. Quarter horizon (90 days)
  if (/\b(quarter|quarterly|next\s+3\s+months|90\s+days|q[1-4])\b/.test(t)) {
    return 90;
  }

  // 3. Month horizon (30-35 days)
  if (
    /\b(next\s+month|upcoming\s+month|30\s+days|month\s+ahead|month\s+schedule)\b/.test(t)
  ) {
    return 35;
  }

  if (/\b(this\s+month|monthly)\b/.test(t)) {
    return 31;
  }

  // 4. Two weeks horizon (14 days)
  if (/\b(next\s+2\s+weeks|two\s+weeks|14\s+days|fortnight)\b/.test(t)) {
    return 14;
  }

  // 5. Short horizon (1-2 days)
  if (/\btomorrow\b/.test(t)) {
    return 2;
  }
  if (/\btoday\b/.test(t)) {
    return 1;
  }

  return defaultDays;
}

/**
 * Deduplicates and scopes briefing items:
 * - Scopes Google Calendar events to the relevant upcoming window (default: next 7 days for general briefings,
 *   or custom horizon up to 365 days if the user explicitly asks for "this year" or "next month").
 * - Deduplicates recurring events: Keeps only the single earliest occurrence within the window.
 * - Consolidates multi-channel Slack bot invites into 1 unified task.
 * - Deduplicates tasks, emails, and messages with identical IDs, thread IDs, or normalized titles.
 */
export function deduplicateBriefingItems(
  items: NormalizedBriefingItem[] = [],
  options?: DeduplicateOptions
): NormalizedBriefingItem[] {
  if (!Array.isArray(items) || items.length === 0) return [];

  const seenIds = new Set<string>();
  const seenKeys = new Set<string>();
  const calEventMap = new Map<string, number>(); // calKey -> index in deduplicated
  const deduplicated: NormalizedBriefingItem[] = [];

  const refTime = options?.referenceDate ? new Date(options.referenceDate).getTime() : Date.now();
  const fallbackHorizon =
    options?.calendarHorizonDays ??
    (options?.contextText ? detectCalendarHorizon(options.contextText, 7) : 7);

  for (const item of items) {
    if (!item) continue;

    // 0. Exact ID deduplication
    if (item.id && seenIds.has(item.id)) {
      continue;
    }

    const normTitle = (item.title || "").toLowerCase().trim();
    const cleanTitle = normTitle.replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
    const normPlatform = (item.platform || "").toLowerCase().trim();

    // 1. Calendar events: scope to upcoming window (7 days for general, up to 365 for custom annual) and deduplicate recurring events
    if (item.type === "meeting" || normPlatform === "calendar" || normPlatform === "gcal") {
      const itemHorizonDays = item.metadata?.horizonDays ?? fallbackHorizon;
      const horizonMs = itemHorizonDays * 24 * 60 * 60 * 1000;

      if (item.timestamp) {
        const eventTime = new Date(item.timestamp).getTime();
        if (!isNaN(eventTime) && !isNaN(refTime)) {
          // Exclude events scheduled beyond the horizon (e.g. 6-7 months in the future for general briefings)
          if (eventTime > refTime + horizonMs) {
            continue;
          }
          // Exclude events from before the briefing day (> 24 hours prior)
          if (eventTime < refTime - 24 * 60 * 60 * 1000) {
            continue;
          }
        }
      }

      const recurringId = item.metadata?.recurringEventId;
      const calKey = recurringId ? `rec_${recurringId}` : `cal_${cleanTitle}`;

      if (calEventMap.has(calKey)) {
        const existingIdx = calEventMap.get(calKey)!;
        const existingItem = deduplicated[existingIdx];
        const existingTime = new Date(existingItem.timestamp).getTime();
        const currentTime = new Date(item.timestamp).getTime();

        // Keep the earlier occurrence
        if (!isNaN(currentTime) && !isNaN(existingTime) && currentTime < existingTime) {
          deduplicated[existingIdx] = item;
        }
        continue;
      }

      calEventMap.set(calKey, deduplicated.length);
      if (item.id) seenIds.add(item.id);
      deduplicated.push(item);
      continue;
    }

    // 2. Slack channel invitation tasks: consolidate duplicate channel invites into 1 unified task
    if (
      (normPlatform === "slack" || item.type === "task") &&
      (normTitle.includes("invite toybox bot") || (normTitle.includes("invite") && normTitle.includes("bot")))
    ) {
      const slackInviteKey = "slack_bot_channel_invite";
      if (seenKeys.has(slackInviteKey)) {
        continue;
      }
      seenKeys.add(slackInviteKey);
      if (item.id) seenIds.add(item.id);
      deduplicated.push({
        ...item,
        id: "slack_invite_consolidated",
        title: "Invite ToyBox Bot to Slack Channels",
        bodySnippet:
          'Type "/invite @ToyBox" into your synced development channels (#social, #all-toybox-dev-lab, #new-channel) to stream active discussions and mentions.',
      });
      continue;
    }

    // 3. General tasks and messages: deduplicate by platform + type + cleanTitle + sender
    const generalKey = `${normPlatform}_${item.type}_${cleanTitle}_${(item.sender || "").toLowerCase().trim()}`;
    if (seenKeys.has(generalKey)) {
      continue;
    }
    seenKeys.add(generalKey);
    if (item.id) seenIds.add(item.id);
    deduplicated.push(item);
  }

  return deduplicated;
}
