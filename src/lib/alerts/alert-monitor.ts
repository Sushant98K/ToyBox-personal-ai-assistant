import { insforgeAdmin } from "@/lib/insforge-admin";
import { getValidGoogleToken } from "@/lib/agent/tools";
import { getWhatsAppMessages, getWhatsAppStatus } from "@/lib/whatsapp-baileys";
import { AlertRule, TriggeredAlert } from "@/types/alerts";

export interface AlertCheckResult {
  userId: string;
  rulesEvaluated: number;
  newAlertsCreated: number;
  createdAlerts: TriggeredAlert[];
}

/**
 * Evaluates active alert rules for a specific user against live connected platform data.
 * If conditions match, persists new records in `public.triggered_alerts`.
 */
export async function runAlertMonitorForUser(userId: string): Promise<AlertCheckResult> {
  // 1. Fetch user's active alert rules
  const { data: rules, error: rulesErr } = await insforgeAdmin
    .database
    .from("alert_rules")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (rulesErr) {
    console.warn("[AlertMonitor] Error querying alert_rules:", rulesErr);
  }

  const activeRules: AlertRule[] = rules || [];
  if (activeRules.length === 0) {
    return {
      userId,
      rulesEvaluated: 0,
      newAlertsCreated: 0,
      createdAlerts: [],
    };
  }

  // 2. Fetch user's connected integrations
  const { data: integrations } = await insforgeAdmin
    .database
    .from("user_integrations")
    .select("platform_id, status, credentials, metadata")
    .eq("user_id", userId);

  const connMap = new Map<string, any>();
  (integrations || []).forEach((i) => {
    if (i.status === "connected") {
      connMap.set(i.platform_id, i);
    }
  });

  // Check live WhatsApp connection
  const waStatus = await getWhatsAppStatus(userId).catch(() => null);
  const isWhatsAppConnected = waStatus?.status === "connected" || connMap.get("whatsapp") !== undefined;

  const createdAlerts: TriggeredAlert[] = [];

  // 3. Evaluate each active rule
  for (const rule of activeRules) {
    const app = (rule.app || "").toLowerCase();

    // Check if platform is connected
    if (app === "gmail" && !connMap.has("gmail")) continue;
    if (app === "whatsapp" && !isWhatsAppConnected) continue;
    if (app === "slack" && !connMap.has("slack")) continue;
    if ((app === "calendar" || app === "gcal") && !connMap.has("gcal") && !connMap.has("calendar")) continue;

    try {
      const matched = await evaluateRule(rule, userId, connMap);
      if (matched && matched.length > 0) {
        for (const item of matched) {
          // Check for duplicate alert to prevent spamming the feed
          const { data: existing } = await insforgeAdmin
            .database
            .from("triggered_alerts")
            .select("id")
            .eq("user_id", userId)
            .eq("title", item.title)
            .eq("status", "active")
            .limit(1);

          if (!existing || existing.length === 0) {
            const newRecord = {
              user_id: userId,
              rule_id: rule.id,
              app: rule.app,
              title: item.title,
              message: item.message,
              priority: rule.priority || item.priority || "high",
              status: "active",
              metadata: item.metadata || {},
              read: false,
              triggered_at: new Date().toISOString(),
            };

            const { data: savedAlert, error: insertErr } = await insforgeAdmin
              .database
              .from("triggered_alerts")
              .insert([newRecord])
              .select()
              .single();

            if (!insertErr && savedAlert) {
              createdAlerts.push(savedAlert as TriggeredAlert);
            }
          }
        }
      }
    } catch (ruleErr) {
      console.warn(`[AlertMonitor] Error evaluating rule ${rule.name}:`, ruleErr);
    }
  }

  return {
    userId,
    rulesEvaluated: activeRules.length,
    newAlertsCreated: createdAlerts.length,
    createdAlerts,
  };
}

interface MatchCandidate {
  title: string;
  message: string;
  priority?: "urgent" | "high" | "medium" | "low";
  metadata?: Record<string, any>;
}

async function evaluateRule(
  rule: AlertRule,
  userId: string,
  connMap: Map<string, any>
): Promise<MatchCandidate[]> {
  const app = (rule.app || "").toLowerCase();
  const condType = rule.condition_type;
  const payload = rule.condition_payload || {};
  const keywords = (payload.keywords || []).map((k: string) => k.toLowerCase().trim()).filter(Boolean);
  const senders = (payload.senders || []).map((s: string) => s.toLowerCase().trim()).filter(Boolean);

  // A. Gmail Evaluation
  if (app === "gmail") {
    const token = await getValidGoogleToken("gmail", userId);
    if (!token) return [];

    let queryParts = ["is:unread"];
    if (condType === "keyword" && keywords.length > 0) {
      queryParts.push(`{${keywords.join(" ")}}`);
    }
    if (condType === "sender" && senders.length > 0) {
      queryParts.push(`{${senders.map((s) => `from:${s}`).join(" ")}}`);
    }

    const query = encodeURIComponent(queryParts.join(" "));
    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=3`,
      { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(6000) }
    );

    if (res.ok) {
      const data = await res.json();
      const msgs = data.messages || [];
      if (msgs.length === 0) return [];

      const candidates: MatchCandidate[] = [];
      for (const m of msgs.slice(0, 2)) {
        const dRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(5000) }
        );
        if (dRes.ok) {
          const item = await dRes.json();
          const headers = item.payload?.headers || [];
          const subject = headers.find((h: any) => h.name === "Subject")?.value || "Incoming Urgent Email";
          const from = headers.find((h: any) => h.name === "From")?.value || "Unknown Contact";
          const snippet = item.snippet || "";

          candidates.push({
            title: `Email Watch: ${subject}`,
            message: `Priority email from ${from}: "${snippet.slice(0, 120)}..."`,
            priority: rule.priority,
            metadata: {
              from,
              sender: from,
              subject,
              messageId: m.id,
              snippet,
              ruleMatched: rule.name,
            },
          });
        }
      }
      return candidates;
    }
  }

  // B. WhatsApp Evaluation
  if (app === "whatsapp") {
    const messages = getWhatsAppMessages(userId);
    const unread = messages.filter((m) => m.unread);
    if (unread.length === 0) return [];

    const candidates: MatchCandidate[] = [];
    for (const msg of unread.slice(0, 2)) {
      const text = (msg.text || "").toLowerCase();
      const sender = msg.senderName || msg.from || "";

      let isMatch = false;
      if (condType === "keyword") {
        isMatch = keywords.some((k: string) => text.includes(k));
      } else if (condType === "sender") {
        isMatch = senders.some((s: string) => sender.toLowerCase().includes(s));
      } else {
        isMatch = true;
      }

      if (isMatch) {
        candidates.push({
          title: `WhatsApp Urgent: ${sender}`,
          message: msg.text || "New message from priority client.",
          priority: rule.priority,
          metadata: {
            sender,
            channel: "WhatsApp VIP Direct",
            messageId: msg.id,
            timestamp: msg.timestamp,
            ruleMatched: rule.name,
          },
        });
      }
    }
    return candidates;
  }

  // C. Google Calendar Evaluation
  if (app === "calendar" || app === "gcal") {
    const token = await getValidGoogleToken("gcal", userId);
    if (!token) return [];

    const now = new Date();
    const horizon = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
        now.toISOString()
      )}&timeMax=${encodeURIComponent(
        horizon.toISOString()
      )}&singleEvents=true&orderBy=startTime&maxResults=10`,
      { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(6000) }
    );

    if (res.ok) {
      const data = await res.json();
      const events = data.items || [];
      if (events.length === 0) return [];

      // Check for overlap between consecutive events
      const candidates: MatchCandidate[] = [];
      for (let i = 0; i < events.length - 1; i++) {
        const e1 = events[i];
        const e2 = events[i + 1];
        const end1 = new Date(e1.end?.dateTime || e1.end?.date).getTime();
        const start2 = new Date(e2.start?.dateTime || e2.start?.date).getTime();

        // If overlap or zero-buffer < 5 mins
        if (start2 < end1 + 5 * 60 * 1000) {
          candidates.push({
            title: `Schedule Overlap: ${e1.summary || "Meeting"} & ${e2.summary || "Event"}`,
            message: `Consecutive appointments have zero buffer or overlap at ${new Date(start2).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
            priority: rule.priority,
            metadata: {
              event1: e1.summary,
              event2: e2.summary,
              start_time: e2.start?.dateTime || e2.start?.date,
              attendees: (e1.attendees || []).map((a: any) => a.displayName || a.email).filter(Boolean),
              ruleMatched: rule.name,
            },
          });
          break; // Avoid flood
        }
      }
      return candidates;
    }
  }

  // D. Slack Evaluation
  if (app === "slack") {
    const slackRow = connMap.get("slack");
    const token =
      slackRow?.credentials?.bot_access_token ||
      slackRow?.credentials?.access_token ||
      process.env.SLACK_BOT_TOKEN;

    if (!token) return [];

    const channel = payload.channel || "general";
    // Check recent channel messages or query
    const res = await fetch(
      `https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=5`,
      { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(5000) }
    );

    if (res.ok) {
      const listData = await res.json();
      const targetChan = listData.channels?.find(
        (c: any) => c.name === channel || channel === "#all-channels"
      ) || listData.channels?.[0];

      if (targetChan) {
        const histRes = await fetch(
          `https://slack.com/api/conversations.history?channel=${targetChan.id}&limit=5`,
          { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(5000) }
        );

        if (histRes.ok) {
          const histData = await histRes.json();
          const msgs = histData.messages || [];
          const candidates: MatchCandidate[] = [];

          for (const msg of msgs) {
            const text = (msg.text || "").toLowerCase();
            const hasKeyword = keywords.length > 0
              ? keywords.some((k: string) => text.includes(k))
              : /urgent|blocker|outage|help|incident|down/i.test(text);

            if (hasKeyword) {
              candidates.push({
                title: `Slack Blocker Alert (#${targetChan.name})`,
                message: msg.text.slice(0, 140),
                priority: rule.priority,
                metadata: {
                  channel: `#${targetChan.name}`,
                  channelId: targetChan.id,
                  ts: msg.ts,
                  user: msg.user,
                  ruleMatched: rule.name,
                },
              });
              break;
            }
          }
          return candidates;
        }
      }
    }
  }

  return [];
}
