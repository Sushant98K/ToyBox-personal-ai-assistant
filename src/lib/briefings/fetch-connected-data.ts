import { insforgeAdmin } from "@/lib/insforge-admin";
import { getWhatsAppStatus, getWhatsAppMessages } from "@/lib/whatsapp-baileys";
import { NormalizedBriefingItem, UrgencyLevel } from "@/types/briefing";
import { formatHumanDateTime } from "./date-formatter";
import { detectCalendarHorizon } from "./deduplicate";

export interface FetchConnectedDataOptions {
  requestedPlatforms?: string[];
  calendarHorizonDays?: number;
  promptGoal?: string;
}

/**
 * Automatically refreshes Google OAuth tokens if expired or near expiry
 */
async function getValidGoogleToken(
  platformId: "gmail" | "gcal",
  userId: string
): Promise<string | null> {
  try {
    const { data: rec } = await insforgeAdmin
      .database
      .from("user_integrations")
      .select("credentials, status")
      .eq("user_id", userId)
      .eq("platform_id", platformId)
      .maybeSingle();

    if (!rec || rec.status !== "connected") {
      return null;
    }

    const creds = rec.credentials || {};
    let token = creds.access_token;
    const refreshToken = creds.refresh_token;
    const expiresAt = Number(creds.expires_at) || 0;

    const isExpired = Date.now() > expiresAt - 120000;

    if ((!token || isExpired) && refreshToken) {
      const clientId = process.env.GOOGLE_CLIENT_ID || process.env.GMAIL_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.GMAIL_CLIENT_SECRET;

      if (clientId && clientSecret) {
        const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
          }),
        });

        if (refreshRes.ok) {
          const d = await refreshRes.json();
          token = d.access_token;
          const newExpiresAt = Date.now() + (d.expires_in || 3600) * 1000;

          await insforgeAdmin
            .database
            .from("user_integrations")
            .update({
              credentials: {
                ...creds,
                access_token: token,
                expires_at: newExpiresAt,
              },
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId)
            .eq("platform_id", platformId);
        }
      }
    }

    return token || null;
  } catch (err) {
    console.warn(`Error getting valid Google token for ${platformId}:`, err);
    return null;
  }
}

/**
 * Fetch connected data across all active MCP platforms for a user
 */
export async function fetchConnectedData(
  userId: string,
  platformsOrOptions?: string[] | FetchConnectedDataOptions
): Promise<{
  items: NormalizedBriefingItem[];
  activePlatforms: string[];
}> {
  let requestedPlatformList: string[] | undefined;
  let customHorizonDays: number | undefined;
  let promptGoal: string | undefined;

  if (Array.isArray(platformsOrOptions)) {
    requestedPlatformList = platformsOrOptions;
  } else if (platformsOrOptions && typeof platformsOrOptions === "object") {
    requestedPlatformList = platformsOrOptions.requestedPlatforms;
    customHorizonDays = platformsOrOptions.calendarHorizonDays;
    promptGoal = platformsOrOptions.promptGoal;
  }

  const horizonDays = customHorizonDays ?? detectCalendarHorizon(promptGoal, 7);
  const normalizedItems: NormalizedBriefingItem[] = [];

  // 1. Query user_integrations to find which platforms are actually connected
  const { data: dbIntegrations } = await insforgeAdmin
    .database
    .from("user_integrations")
    .select("*")
    .eq("user_id", userId);

  const integrationMap = new Map<string, any>();
  if (dbIntegrations && Array.isArray(dbIntegrations)) {
    dbIntegrations.forEach((row) => {
      integrationMap.set(row.platform_id, row);
    });
  }

  // Check live WhatsApp Baileys status in real time
  const liveWhatsApp = await getWhatsAppStatus(userId).catch(() => null);
  const isWhatsAppConnected =
    liveWhatsApp?.status === "connected" ||
    integrationMap.get("whatsapp")?.status === "connected";

  const isGmailConnected = integrationMap.get("gmail")?.status === "connected";
  const isCalendarConnected =
    integrationMap.get("gcal")?.status === "connected" ||
    integrationMap.get("calendar")?.status === "connected";
  const isSlackConnected = integrationMap.get("slack")?.status === "connected";

  const isPlatformRequested = (platform: string) => {
    if (!requestedPlatformList || requestedPlatformList.length === 0) return true;
    return requestedPlatformList.includes(platform) ||
      (platform === "calendar" && requestedPlatformList.includes("gcal")) ||
      (platform === "gcal" && requestedPlatformList.includes("calendar"));
  };

  const activePlatforms: string[] = [];

  // ============================================================
  // GMAIL CONNECTOR
  // ============================================================
  if (isGmailConnected && isPlatformRequested("gmail")) {
    activePlatforms.push("gmail");
    try {
      const token = await getValidGoogleToken("gmail", userId);
      if (token) {
        const listRes = await fetch(
          "https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=10",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (listRes.ok) {
          const listJson = await listRes.json();
          const messages = listJson.messages || [];

          // Fetch details for top unread messages
          for (const m of messages.slice(0, 6)) {
            try {
              const dRes = await fetch(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              if (dRes.ok) {
                const item = await dRes.json();
                const headers = item.payload?.headers || [];
                const subject = headers.find((h: any) => h.name === "Subject")?.value || "(No Subject)";
                const from = headers.find((h: any) => h.name === "From")?.value || "Unknown Sender";
                const date = headers.find((h: any) => h.name === "Date")?.value || new Date().toISOString();
                const snippet = item.snippet || "";

                // Determine initial urgency based on keywords
                const isUrgent =
                  /urgent|action required|important|deadline|overdue|immediately|asap/i.test(subject) ||
                  /urgent|payment|sign-off/i.test(snippet);

                normalizedItems.push({
                  id: `gmail_${item.id}`,
                  platform: "gmail",
                  type: "email",
                  title: subject,
                  sender: from,
                  timestamp: date,
                  bodySnippet: snippet || "Unread email requiring executive triage.",
                  priorityScore: isUrgent ? 90 : 65,
                  urgency: isUrgent ? "urgent" : "high",
                  deepLinkOrId: `https://mail.google.com/mail/u/0/#inbox/${item.threadId || item.id}`,
                  metadata: {
                    messageId: item.id,
                    threadId: item.threadId,
                    labelIds: item.labelIds,
                  },
                });
              }
            } catch (msgErr) {
              console.warn("Could not fetch individual Gmail message:", msgErr);
            }
          }
        } else {
          const errText = await listRes.text();
          if (errText.includes("has not been used in project") || listRes.status === 403) {
            const connectedEmail = integrationMap.get("gmail")?.metadata?.account_email || "your email";
            normalizedItems.push({
              id: "gmail_enable_api",
              platform: "gmail",
              type: "task",
              title: "Enable Gmail API in Google Cloud Console",
              sender: "Google Cloud Platform",
              timestamp: new Date().toISOString(),
              bodySnippet:
                `OAuth connected for ${connectedEmail}. Gmail API needs activation in Google Cloud Console project to sync real emails.`,
              priorityScore: 95,
              urgency: "urgent",
              deepLinkOrId: "https://console.cloud.google.com/apis/library/gmail.googleapis.com",
            });
          }
        }
      }
    } catch (e) {
      console.warn("Error fetching Gmail MCP data:", e);
    }
  }

  // ============================================================
  // GOOGLE CALENDAR CONNECTOR
  // ============================================================
  if (isCalendarConnected && (isPlatformRequested("calendar") || isPlatformRequested("gcal"))) {
    activePlatforms.push("calendar");
    try {
      const token = await getValidGoogleToken("gcal", userId);
      if (token) {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const endOfHorizon = new Date(now.getTime() + horizonDays * 24 * 60 * 60 * 1000).toISOString();
        const maxCalResults = horizonDays > 30 ? 50 : 25;

        const calRes = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
            startOfToday
          )}&timeMax=${encodeURIComponent(
            endOfHorizon
          )}&maxResults=${maxCalResults}&singleEvents=true&orderBy=startTime`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (calRes.ok) {
          const calJson = await calRes.json();
          const events = calJson.items || [];

          const seenEventKeys = new Set<string>();

          events.forEach((evt: any) => {
            const startRaw = evt.start?.dateTime || evt.start?.date || "";
            const summary = (evt.summary || "Scheduled Calendar Event").trim();

            // Deduplicate recurring events: only keep the earliest upcoming instance
            const eventKey = (evt.recurringEventId || summary.toLowerCase()).trim();
            if (seenEventKeys.has(eventKey)) {
              return;
            }
            seenEventKeys.add(eventKey);

            const attendees = (evt.attendees || []).map((a: any) => a.email || a.displayName).join(", ");
            const humanSchedule = formatHumanDateTime(startRaw);

            normalizedItems.push({
              id: `gcal_${evt.id}`,
              platform: "calendar",
              type: "meeting",
              title: summary,
              sender: evt.organizer?.email || "Google Calendar",
              timestamp: startRaw || new Date().toISOString(),
              bodySnippet: `Scheduled on ${humanSchedule}.${attendees ? ` Attendees: ${attendees}.` : ""}${
                evt.description ? ` Note: ${evt.description.slice(0, 100)}` : ""
              }`,
              priorityScore: 75,
              urgency: "high",
              deepLinkOrId: evt.htmlLink || "https://calendar.google.com",
              metadata: {
                eventId: evt.id,
                recurringEventId: evt.recurringEventId,
                hangoutLink: evt.hangoutLink,
                location: evt.location,
                horizonDays: horizonDays,
              },
            });
          });
        }
      }
    } catch (e) {
      console.warn("Error fetching Google Calendar MCP data:", e);
    }
  }

  // ============================================================
  // SLACK CONNECTOR
  // ============================================================
  if (isSlackConnected && isPlatformRequested("slack")) {
    activePlatforms.push("slack");
    try {
      const slackRow = integrationMap.get("slack");
      const botToken =
        slackRow?.credentials?.bot_access_token ||
        slackRow?.credentials?.access_token ||
        process.env.SLACK_BOT_TOKEN;

      const workspace =
        (slackRow?.metadata?.team_name as string) ||
        (slackRow?.metadata?.workspace_name as string) ||
        "Connected Workspace";

      if (botToken) {
        const chanRes = await fetch(
          "https://slack.com/api/conversations.list?types=public_channel,private_channel&exclude_archived=true&limit=10",
          {
            headers: { Authorization: `Bearer ${botToken}` },
          }
        );

        if (chanRes.ok) {
          const chanJson = await chanRes.json();
          if (chanJson.ok && Array.isArray(chanJson.channels)) {
            const channels = chanJson.channels.slice(0, 3);
            const channelsNeedingInvite: string[] = [];

            for (const ch of channels) {
              // Try fetching recent messages in the channel
              const histRes = await fetch(
                `https://slack.com/api/conversations.history?channel=${ch.id}&limit=5`,
                { headers: { Authorization: `Bearer ${botToken}` } }
              );

              if (histRes.ok) {
                const histJson = await histRes.json();
                if (histJson.ok && Array.isArray(histJson.messages)) {
                  histJson.messages.forEach((msg: any) => {
                    if (msg.subtype === "channel_join") return;

                    const isMention = msg.text?.includes("<@") || false;
                    normalizedItems.push({
                      id: `slack_${ch.id}_${msg.ts}`,
                      platform: "slack",
                      type: isMention ? "mention" : "message",
                      title: isMention ? `Mention in #${ch.name}` : `Message in #${ch.name}`,
                      sender: msg.user || "Slack Member",
                      channelOrThread: `#${ch.name}`,
                      timestamp: new Date(Number(msg.ts) * 1000).toISOString(),
                      bodySnippet: msg.text || "Message posted in synced channel.",
                      priorityScore: isMention ? 85 : 55,
                      urgency: isMention ? "high" : "medium",
                      deepLinkOrId: `https://slack.com/app_redirect?channel=${ch.id}&message_ts=${msg.ts}`,
                      metadata: {
                        channelId: ch.id,
                        channelName: ch.name,
                        ts: msg.ts,
                      },
                    });
                  });
                } else if (histJson.error === "not_in_channel") {
                  channelsNeedingInvite.push(ch.name);
                }
              }
            }

            // Consolidate bot channel invite into a single unified task
            if (channelsNeedingInvite.length > 0) {
              const channelListStr = channelsNeedingInvite.map((c) => `#${c}`).join(", ");
              normalizedItems.push({
                id: "slack_invite_consolidated",
                platform: "slack",
                type: "task",
                title: "Invite ToyBox Bot to Slack Channels",
                sender: workspace,
                channelOrThread: channelListStr,
                timestamp: new Date().toISOString(),
                bodySnippet: `Type "/invite @ToyBox" into ${channelListStr} to stream active unread mentions and discussions.`,
                priorityScore: 60,
                urgency: "medium",
                deepLinkOrId: "https://app.slack.com",
                metadata: {
                  channels: channelsNeedingInvite,
                },
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn("Error fetching Slack MCP data:", e);
    }
  }

  // ============================================================
  // WHATSAPP CONNECTOR (Baileys)
  // ============================================================
  if (isWhatsAppConnected && isPlatformRequested("whatsapp")) {
    activePlatforms.push("whatsapp");
    try {
      const waMessages = getWhatsAppMessages(userId);
      const phoneNumber =
        liveWhatsApp?.phoneNumber ||
        (integrationMap.get("whatsapp")?.metadata?.phone_number as string) ||
        "Connected Device";

      if (waMessages && waMessages.length > 0) {
        waMessages.forEach((msg, idx) => {
          const senderDisplay = msg.senderName || msg.from || phoneNumber;
          normalizedItems.push({
            id: `wa_${msg.id || idx}`,
            platform: "whatsapp",
            type: "message",
            title: `WhatsApp Chat: ${senderDisplay}`,
            sender: senderDisplay,
            timestamp: msg.timestamp || new Date().toISOString(),
            bodySnippet: msg.text || "Encrypted WhatsApp message received.",
            priorityScore: msg.unread ? 80 : 50,
            urgency: msg.unread ? "high" : "medium",
            deepLinkOrId: `https://web.whatsapp.com`,
            metadata: {
              rawSender: msg.from,
              senderName: msg.senderName,
              chatJid: msg.chatJid,
              unread: msg.unread,
            },
          });
        });
      } else {
        // WhatsApp is connected and monitoring
        normalizedItems.push({
          id: "wa_active_monitor",
          platform: "whatsapp",
          type: "message",
          title: `WhatsApp Telemetry: ${phoneNumber}`,
          sender: phoneNumber,
          timestamp: new Date().toISOString(),
          bodySnippet: "Baileys multi-device socket live. All incoming chats monitored for priority alerts.",
          priorityScore: 40,
          urgency: "low",
          deepLinkOrId: "https://web.whatsapp.com",
        });
      }
    } catch (e) {
      console.warn("Error fetching WhatsApp MCP data:", e);
    }
  }

  // ============================================================
  // FUTURE MODULAR CONNECTORS (Outlook, Discord, LinkedIn, Telegram, Notion, Reddit)
  // Modular connectors: Cleanly skip if not connected without error
  // ============================================================
  const futurePlatforms = ["outlook", "discord", "linkedin", "telegram", "notion", "reddit"];
  for (const plat of futurePlatforms) {
    if (integrationMap.get(plat)?.status === "connected" && isPlatformRequested(plat)) {
      activePlatforms.push(plat);
      // Ready for future platform MCP handlers
    }
  }

  return {
    items: normalizedItems,
    activePlatforms,
  };
}
