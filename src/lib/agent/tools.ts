import { insforgeAdmin } from "@/lib/insforge-admin";
import { getWhatsAppMessages, getWhatsAppStatus, getOrRestoreWASocket } from "@/lib/whatsapp-baileys";

export interface ToolDefinition {
  name: string;
  platform: string;
  label: string;
  description: string;
  parameters: {
    type: "OBJECT";
    properties: Record<string, { type: "STRING" | "NUMBER" | "BOOLEAN" | "ARRAY"; description: string }>;
    required?: string[];
  };
}

export interface ToolExecutionResult {
  data: any;
  summary: string;
  cards?: Array<{
    type: "email" | "slack" | "calendar" | "whatsapp";
    id: string;
    title: string;
    subtitle?: string;
    snippet?: string;
    timestamp?: string;
    attendees?: string[];
    actionLabel?: string;
    actionPrompt?: string;
  }>;
}

// All available tool declarations
export const ALL_TOOLS: Record<string, ToolDefinition> = {
  gmail_search_messages: {
    name: "gmail_search_messages",
    platform: "gmail",
    label: "Reading Gmail inbox...",
    description: "Search user's live Gmail emails using search queries (e.g., 'is:unread', 'from:colleague', 'subject:urgent', 'meeting').",
    parameters: {
      type: "OBJECT",
      properties: {
        query: { type: "STRING", description: "Search query string (e.g., 'is:unread', 'label:IMPORTANT')" },
        maxResults: { type: "NUMBER", description: "Maximum messages to return (default: 5)" },
      },
      required: ["query"],
    },
  },
  gmail_read_thread: {
    name: "gmail_read_thread",
    platform: "gmail",
    label: "Fetching email thread...",
    description: "Read full body content and header details of a specific live email message or thread by ID.",
    parameters: {
      type: "OBJECT",
      properties: {
        messageId: { type: "STRING", description: "The ID of the email message or thread to read" },
      },
      required: ["messageId"],
    },
  },
  whatsapp_get_recent_chats: {
    name: "whatsapp_get_recent_chats",
    platform: "whatsapp",
    label: "Scanning WhatsApp chats...",
    description: "Fetch live incoming and outgoing WhatsApp messages, client inquiries, and unread priority threads.",
    parameters: {
      type: "OBJECT",
      properties: {
        limit: { type: "NUMBER", description: "Number of chats to retrieve (default: 5)" },
      },
    },
  },
  whatsapp_send_message: {
    name: "whatsapp_send_message",
    platform: "whatsapp",
    label: "Drafting WhatsApp message...",
    description: "Send or draft a follow-up WhatsApp message to a specific contact or phone number.",
    parameters: {
      type: "OBJECT",
      properties: {
        recipient: { type: "STRING", description: "Name or phone number of the contact" },
        message: { type: "STRING", description: "Message body text to send" },
      },
      required: ["recipient", "message"],
    },
  },
  slack_search_messages: {
    name: "slack_search_messages",
    platform: "slack",
    label: "Searching Slack channels...",
    description: "Search across user's connected Slack team channels and direct messages for keywords or announcements.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: { type: "STRING", description: "Keywords or mention query string" },
        channel: { type: "STRING", description: "Optional channel name or ID to restrict search" },
      },
      required: ["query"],
    },
  },
  slack_list_channels: {
    name: "slack_list_channels",
    platform: "slack",
    label: "Listing Slack channels...",
    description: "List public and private Slack channels the user and bot have access to.",
    parameters: {
      type: "OBJECT",
      properties: {
        limit: { type: "NUMBER", description: "Maximum channels to return (default: 10)" },
      },
    },
  },
  slack_post_message: {
    name: "slack_post_message",
    platform: "slack",
    label: "Posting to Slack channel...",
    description: "Post a message or executive notification into a specific Slack channel.",
    parameters: {
      type: "OBJECT",
      properties: {
        channel: { type: "STRING", description: "Target channel name or ID (e.g., 'general', 'executive-briefs')" },
        text: { type: "STRING", description: "Content of the message to post" },
      },
      required: ["channel", "text"],
    },
  },
  calendar_list_events: {
    name: "calendar_list_events",
    platform: "gcal",
    label: "Querying Google Calendar...",
    description: "List live upcoming meetings, schedule blocks, attendees, and video links from Google Calendar.",
    parameters: {
      type: "OBJECT",
      properties: {
        timeMin: { type: "STRING", description: "ISO timestamp for start of window (defaults to now)" },
        timeMax: { type: "STRING", description: "ISO timestamp for end of window" },
        maxResults: { type: "NUMBER", description: "Maximum events to return (default: 10)" },
      },
    },
  },
  calendar_create_event: {
    name: "calendar_create_event",
    platform: "gcal",
    label: "Scheduling Calendar event...",
    description: "Create or schedule a new event or focus time block on Google Calendar.",
    parameters: {
      type: "OBJECT",
      properties: {
        summary: { type: "STRING", description: "Title of the meeting or event" },
        startDateTime: { type: "STRING", description: "ISO timestamp for meeting start" },
        endDateTime: { type: "STRING", description: "ISO timestamp for meeting end" },
        description: { type: "STRING", description: "Optional description or meeting agenda" },
        attendees: { type: "ARRAY", description: "List of attendee email addresses" },
      },
      required: ["summary", "startDateTime", "endDateTime"],
    },
  },
};

/**
 * Automatically refreshes Google OAuth tokens if expired or near expiry
 */
export async function getValidGoogleToken(
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
 * Filter available tools based strictly on active user integrations in database.
 */
export async function getActiveToolsForUser(userId: string): Promise<ToolDefinition[]> {
  try {
    const { data: integrations } = await insforgeAdmin
      .database
      .from("user_integrations")
      .select("platform_id, status")
      .eq("user_id", userId);

    const connectedPlatforms = new Set<string>();
    if (integrations && Array.isArray(integrations)) {
      integrations.forEach((item) => {
        if (item.status === "connected") {
          connectedPlatforms.add(item.platform_id);
          if (item.platform_id === "gcal") connectedPlatforms.add("calendar");
          if (item.platform_id === "calendar") connectedPlatforms.add("gcal");
        }
      });
    }

    // Check WhatsApp live socket status as well
    try {
      const waStatus = await getWhatsAppStatus(userId);
      if (waStatus?.status === "connected") {
        connectedPlatforms.add("whatsapp");
      }
    } catch {}

    const tools: ToolDefinition[] = [];
    for (const key of Object.keys(ALL_TOOLS)) {
      const tool = ALL_TOOLS[key];
      if (connectedPlatforms.has(tool.platform)) {
        tools.push(tool);
      }
    }

    return tools;
  } catch (err) {
    console.warn("Could not check connected platforms:", err);
    return [];
  }
}

/**
 * Execute a specific tool on behalf of the user with live credentials from connected apps.
 */
export async function executeAgentTool(
  toolName: string,
  args: any,
  userId: string
): Promise<ToolExecutionResult> {
  const tool = ALL_TOOLS[toolName];
  if (!tool) {
    return {
      data: { error: `Tool ${toolName} not found` },
      summary: `Tool ${toolName} is not recognized.`,
    };
  }

  // ============================================================
  // 1. Gmail Tools
  // ============================================================
  if (toolName === "gmail_search_messages") {
    const token = await getValidGoogleToken("gmail", userId);
    if (!token) {
      return {
        data: { connected: false, message: "Gmail is not connected. Connect your Google account in the Integrations dashboard." },
        summary: "Gmail is not connected for this account. Prompt the user to connect Gmail in the Integrations tab.",
      };
    }

    try {
      const query = encodeURIComponent(args.query || "is:unread");
      const max = args.maxResults || 5;
      const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=${max}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        const json = await res.json();
        const msgs = json.messages || [];

        if (msgs.length === 0) {
          return {
            data: { emails: [], totalFound: 0, query: args.query },
            summary: `No emails found matching '${args.query}' in Gmail inbox.`,
          };
        }

        const details = await Promise.all(
          msgs.slice(0, 5).map(async (m: any) => {
            const dRes = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
              { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(6000) }
            );
            if (dRes.ok) {
              const item = await dRes.json();
              const headers = item.payload?.headers || [];
              return {
                id: item.id,
                subject: headers.find((h: any) => h.name === "Subject")?.value || "(No Subject)",
                from: headers.find((h: any) => h.name === "From")?.value || "Unknown",
                date: headers.find((h: any) => h.name === "Date")?.value || new Date().toISOString(),
                snippet: item.snippet,
              };
            }
            return { id: m.id };
          })
        );

        const cards = details.map((d: any) => ({
          type: "email" as const,
          id: d.id,
          title: d.subject,
          subtitle: d.from,
          snippet: d.snippet,
          timestamp: d.date ? new Date(d.date).toLocaleDateString([], { month: "short", day: "numeric" }) : "Recent",
          actionLabel: "Draft Reply",
          actionPrompt: `Draft an executive response to "${d.subject}" from ${d.from}`,
        }));

        return {
          data: { emails: details, totalFound: json.resultSizeEstimate || msgs.length, query: args.query },
          summary: `Retrieved ${details.length} real emails matching '${args.query}' from Gmail.`,
          cards,
        };
      }
    } catch (e: any) {
      console.warn("Gmail API live search error:", e);
      return {
        data: { error: e.message || "Failed to query Gmail API" },
        summary: "Encountered a timeout or error reading from the live Gmail API.",
      };
    }
  }

  if (toolName === "gmail_read_thread") {
    const token = await getValidGoogleToken("gmail", userId);
    if (!token) {
      return {
        data: { connected: false, message: "Gmail is not connected." },
        summary: "Gmail is not connected.",
      };
    }

    try {
      const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${args.messageId}?format=full`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        const msg = await res.json();
        const headers = msg.payload?.headers || [];
        const subject = headers.find((h: any) => h.name === "Subject")?.value || "(No Subject)";
        const from = headers.find((h: any) => h.name === "From")?.value || "Unknown";
        const date = headers.find((h: any) => h.name === "Date")?.value || "";

        let bodyText = msg.snippet || "";
        if (msg.payload?.body?.data) {
          bodyText = Buffer.from(msg.payload.body.data, "base64url").toString("utf-8");
        } else if (msg.payload?.parts) {
          const textPart = msg.payload.parts.find((p: any) => p.mimeType === "text/plain");
          if (textPart?.body?.data) {
            bodyText = Buffer.from(textPart.body.data, "base64url").toString("utf-8");
          }
        }

        return {
          data: { id: msg.id, subject, from, date, snippet: msg.snippet, bodyText },
          summary: `Retrieved full email from ${from} with subject "${subject}".`,
          cards: [
            {
              type: "email",
              id: msg.id,
              title: subject,
              subtitle: from,
              snippet: bodyText.slice(0, 300),
              timestamp: date ? new Date(date).toLocaleDateString([], { month: "short", day: "numeric" }) : "Recent",
              actionLabel: "Draft Reply",
              actionPrompt: `Draft a sign-off response to ${from} regarding "${subject}"`,
            },
          ],
        };
      }
    } catch (e: any) {
      console.warn("Gmail API read thread error:", e);
      return {
        data: { error: e.message },
        summary: "Failed to read full email content from Gmail.",
      };
    }
  }

  // ============================================================
  // 2. Google Calendar Tools
  // ============================================================
  if (toolName === "calendar_list_events") {
    const token = await getValidGoogleToken("gcal", userId);
    if (!token) {
      return {
        data: { connected: false, message: "Google Calendar is not connected. Connect your Google account in the Integrations dashboard." },
        summary: "Google Calendar is not connected for this user account.",
      };
    }

    try {
      const timeMin = encodeURIComponent(args.timeMin || new Date().toISOString());
      const maxResults = args.maxResults || 10;
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&singleEvents=true&orderBy=startTime&maxResults=${maxResults}`,
        { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(8000) }
      );

      if (res.ok) {
        const json = await res.json();
        const items = (json.items || []).map((e: any) => ({
          id: e.id,
          summary: e.summary || "(No Title)",
          start: e.start?.dateTime || e.start?.date,
          end: e.end?.dateTime || e.end?.date,
          attendees: (e.attendees || []).map((a: any) => a.email),
          hangoutLink: e.hangoutLink,
          description: e.description,
        }));

        const cards = items.map((e: any) => ({
          type: "calendar" as const,
          id: e.id,
          title: e.summary,
          subtitle: e.start ? new Date(e.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Scheduled",
          snippet: e.description || (e.attendees?.length ? `Attendees: ${e.attendees.join(", ")}` : "No description"),
          timestamp: e.start ? new Date(e.start).toLocaleDateString([], { month: "short", day: "numeric" }) : "Upcoming",
          attendees: e.attendees,
          actionLabel: "Reschedule",
          actionPrompt: `Help me reschedule my meeting "${e.summary}"`,
        }));

        return {
          data: { events: items, count: items.length },
          summary: `Retrieved ${items.length} live upcoming Google Calendar appointments.`,
          cards,
        };
      }
    } catch (e: any) {
      console.warn("Calendar API list error:", e);
      return {
        data: { error: e.message },
        summary: "Failed to query Google Calendar API.",
      };
    }
  }

  if (toolName === "calendar_create_event") {
    const token = await getValidGoogleToken("gcal", userId);
    if (!token) {
      return {
        data: { connected: false, message: "Google Calendar is not connected." },
        summary: "Google Calendar is not connected. Event was not scheduled.",
      };
    }

    try {
      const eventBody = {
        summary: args.summary,
        description: args.description || "Scheduled by ToyBox AI Agent",
        start: { dateTime: args.startDateTime },
        end: { dateTime: args.endDateTime },
        attendees: (args.attendees || []).map((email: string) => ({ email })),
      };

      const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventBody),
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        const created = await res.json();
        return {
          data: { success: true, event: created },
          summary: `Successfully scheduled "${args.summary}" on Google Calendar.`,
          cards: [
            {
              type: "calendar",
              id: created.id,
              title: created.summary,
              subtitle: created.start?.dateTime
                ? new Date(created.start.dateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "Scheduled",
              snippet: created.description || "Created by ToyBox AI Agent",
              timestamp: created.start?.dateTime
                ? new Date(created.start.dateTime).toLocaleDateString([], { month: "short", day: "numeric" })
                : "Upcoming",
              actionLabel: "Reschedule",
              actionPrompt: `Adjust time for "${created.summary}"`,
            },
          ],
        };
      }
    } catch (e: any) {
      console.warn("Calendar API create error:", e);
      return {
        data: { error: e.message },
        summary: "Could not create event on Google Calendar.",
      };
    }
  }

  // ============================================================
  // 3. Slack Tools
  // ============================================================
  if (toolName === "slack_list_channels" || toolName === "slack_search_messages" || toolName === "slack_post_message") {
    const { data: record } = await insforgeAdmin
      .database
      .from("user_integrations")
      .select("credentials, status")
      .eq("user_id", userId)
      .eq("platform_id", "slack")
      .maybeSingle();

    const botToken = record?.credentials?.bot_access_token || record?.credentials?.access_token || process.env.SLACK_BOT_TOKEN;

    if (!botToken || record?.status !== "connected") {
      return {
        data: { connected: false, message: "Slack is not connected. Connect your Slack workspace in the Integrations dashboard." },
        summary: "Slack workspace is not connected for this user account.",
      };
    }

    if (toolName === "slack_list_channels") {
      try {
        const res = await fetch("https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=20", {
          headers: { Authorization: `Bearer ${botToken}` },
          signal: AbortSignal.timeout(6000),
        });
        const json = await res.json();
        if (json.ok && Array.isArray(json.channels)) {
          const channels = json.channels.map((c: any) => ({
            id: c.id,
            name: c.name,
            topic: c.topic?.value || "",
            is_private: c.is_private,
          }));
          return {
            data: { channels },
            summary: `Found ${channels.length} real Slack channels in connected workspace.`,
          };
        }
      } catch (e: any) {
        console.warn("Slack conversations.list error:", e);
      }
    }

    if (toolName === "slack_search_messages") {
      try {
        // Query recent messages from channel or workspace
        const channel = args.channel || "general";
        // Find channel id
        const chanListRes = await fetch("https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=20", {
          headers: { Authorization: `Bearer ${botToken}` },
        });
        const chanJson = await chanListRes.json();
        const matched = chanJson.channels?.find((c: any) => c.name === channel.replace("#", "") || c.id === channel);

        if (matched) {
          const histRes = await fetch(`https://slack.com/api/conversations.history?channel=${matched.id}&limit=10`, {
            headers: { Authorization: `Bearer ${botToken}` },
          });
          const histJson = await histRes.json();
          if (histJson.ok && Array.isArray(histJson.messages)) {
            const msgs = histJson.messages
              .filter((m: any) => m.subtype !== "channel_join")
              .map((m: any) => ({
                id: m.ts,
                channel: matched.name,
                sender: m.user || "Member",
                text: m.text,
                timestamp: new Date(Number(m.ts) * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              }));

            return {
              data: { messages: msgs, channel: matched.name },
              summary: `Found ${msgs.length} recent messages in Slack #${matched.name}.`,
              cards: msgs.slice(0, 4).map((m: any) => ({
                type: "slack" as const,
                id: m.id,
                title: `#${m.channel}`,
                subtitle: m.sender,
                snippet: m.text,
                timestamp: m.timestamp,
                actionLabel: "Reply in Thread",
                actionPrompt: `Draft a response in Slack #${m.channel} to: "${m.text.slice(0, 60)}"`,
              })),
            };
          }
        }
      } catch (e: any) {
        console.warn("Slack search messages error:", e);
      }

      return {
        data: { messages: [], query: args.query },
        summary: `Searched Slack channels for '${args.query}'. No matching recent messages found.`,
      };
    }

    if (toolName === "slack_post_message") {
      try {
        const res = await fetch("https://slack.com/api/chat.postMessage", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${botToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            channel: args.channel,
            text: args.text,
          }),
        });
        const json = await res.json();
        if (json.ok) {
          return {
            data: { success: true, channel: args.channel, messageTs: json.ts },
            summary: `Successfully posted message to Slack #${args.channel}.`,
            cards: [
              {
                type: "slack",
                id: json.ts,
                title: `#${args.channel}`,
                subtitle: "Live Message Dispatched",
                snippet: args.text,
                timestamp: "Just now",
                actionLabel: "View Channel",
                actionPrompt: `Show recent messages in #${args.channel}`,
              },
            ],
          };
        }
      } catch (e: any) {
        console.warn("Slack post message error:", e);
      }

      return {
        data: { success: false, error: "Failed to post message to Slack channel" },
        summary: `Could not post to Slack channel #${args.channel}. Check bot channel permissions.`,
      };
    }
  }

  // ============================================================
  // 4. WhatsApp Tools
  // ============================================================
  if (toolName === "whatsapp_get_recent_chats") {
    const waStatus = await getWhatsAppStatus(userId);
    const isConnected = waStatus?.status === "connected";
    const liveMessages = getWhatsAppMessages(userId);

    if (!isConnected) {
      return {
        data: { connected: false, message: "WhatsApp is not connected. Pair your device in the Integrations dashboard." },
        summary: "WhatsApp is not connected for this account. Prompt user to connect WhatsApp in Integrations.",
      };
    }

    if (liveMessages.length === 0) {
      return {
        data: {
          connected: true,
          phoneNumber: waStatus.phoneNumber,
          messages: [],
          status: "Listening for live WhatsApp messages via Baileys multi-device protocol",
        },
        summary: `WhatsApp is live and connected for ${waStatus.phoneNumber}. No incoming chats have been received yet.`,
      };
    }

    const limit = args.limit || 5;
    const recent = liveMessages.slice(0, limit);

    return {
      data: { connected: true, messages: recent, count: recent.length },
      summary: `Retrieved ${recent.length} live WhatsApp conversations.`,
      cards: recent.map((m) => ({
        type: "whatsapp" as const,
        id: m.id,
        title: m.senderName || m.from,
        subtitle: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recent",
        snippet: m.text,
        actionLabel: "Draft Reply",
        actionPrompt: `Draft a WhatsApp reply to ${m.senderName || m.from}: "${m.text.slice(0, 60)}"`,
      })),
    };
  }

  if (toolName === "whatsapp_send_message") {
    const waStatus = await getWhatsAppStatus(userId);
    const sock = await getOrRestoreWASocket(userId);

    if (sock && waStatus.status === "connected" && args.recipient && args.message) {
      try {
        const clean = args.recipient.replace(/[^0-9]/g, "");
        if (clean.length >= 8) {
          const jid = `${clean}@s.whatsapp.net`;
          const sendRes = await sock.sendMessage(jid, { text: args.message });
          return {
            data: { success: true, messageId: sendRes?.key?.id, recipient: args.recipient },
            summary: `Dispatched live WhatsApp message to ${args.recipient}.`,
            cards: [
              {
                type: "whatsapp",
                id: sendRes?.key?.id || `wa_${Date.now()}`,
                title: `Sent to: ${args.recipient}`,
                subtitle: "WhatsApp Message Sent",
                snippet: args.message,
                timestamp: "Just now",
                actionLabel: "Send Follow-up",
                actionPrompt: `Send a follow-up WhatsApp message to ${args.recipient}`,
              },
            ],
          };
        }
      } catch (e: any) {
        console.warn("Live WhatsApp send failed:", e);
      }
    }

    return {
      data: { success: true, recipient: args.recipient, message: args.message, isDraft: true },
      summary: `Prepared WhatsApp message draft for ${args.recipient}: "${args.message}".`,
      cards: [
        {
          type: "whatsapp",
          id: `wa_draft_${Date.now()}`,
          title: `Draft to: ${args.recipient}`,
          subtitle: "Ready to Dispatch",
          snippet: args.message,
          timestamp: "Draft",
          actionLabel: "Confirm Send",
          actionPrompt: `Confirm and dispatch this message to ${args.recipient}`,
        },
      ],
    };
  }

  return {
    data: { message: `Platform ${tool.platform} action executed.` },
    summary: `Executed ${toolName} successfully.`,
  };
}
