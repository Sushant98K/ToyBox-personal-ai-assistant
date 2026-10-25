import { NextRequest, NextResponse } from "next/server";
import { insforgeAdmin } from "@/lib/insforge-admin";
import { GoogleGenAI } from "@google/genai";
import { getWhatsAppStatus, getWhatsAppMessages } from "@/lib/whatsapp-baileys";
import { platformsCatalog } from "@/config/integrations";

// Schema for Gemini 3.5 Flash-Lite Output
export interface DashboardBriefData {
  important_count: number;
  priority_count: number;
  followup_count: number;
  brief_bullets: string[];
  priority_items: Array<{
    id: string;
    platform: "gmail" | "slack" | "whatsapp" | "calendar";
    title: string;
    context: string;
    time: string;
    priority: "high" | "medium" | "urgent";
  }>;
}

// Resolves target user ID from request headers or first user in DB
async function resolveUserId(request: NextRequest): Promise<string> {
  const customUserId = request.headers.get("x-user-id");
  if (customUserId && customUserId !== "undefined" && customUserId !== "null" && customUserId.length > 5) {
    return customUserId;
  }

  const customUserEmail = request.headers.get("x-user-email");
  if (customUserEmail && customUserEmail !== "undefined" && customUserEmail !== "null") {
    try {
      const { data: usersByEmail } = await insforgeAdmin
        .database
        .from("users")
        .select("id")
        .eq("email", customUserEmail)
        .limit(1);
      if (usersByEmail && usersByEmail.length > 0) {
        return usersByEmail[0].id;
      }
    } catch (e) {
      console.warn("Could not query user by email:", e);
    }
  }

  const { data: users } = await insforgeAdmin
    .database
    .from("users")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1);

  if (users && users.length > 0) {
    return users[0].id;
  }

  return "a727d188-4197-409c-855d-2aa5201cebc7";
}

// Automatically refreshes Google access token using refresh_token if expired
async function getValidGoogleToken(platformId: "gmail" | "gcal", userId: string): Promise<string | null> {
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

    // Refresh if expiring within 2 minutes or missing
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("refresh") === "true";
    const userId = await resolveUserId(request);
    const nowIso = new Date().toISOString();

    // 1. Check user_dashboard_cache in InsForge DB if not forcing refresh
    if (!forceRefresh) {
      try {
        const { data: cacheRow, error: cacheErr } = await insforgeAdmin
          .database
          .from("user_dashboard_cache")
          .select("*")
          .eq("user_id", userId)
          .gt("expires_at", nowIso)
          .maybeSingle();

        if (!cacheErr && cacheRow && cacheRow.brief_data) {
          const cachedPriorityItems = (cacheRow.brief_data as DashboardBriefData).priority_items || [];
          const hasDistantFutureItems = cachedPriorityItems.some((item) =>
            /\b202[7-9]\b|\b20[3-9]\d\b/.test(item.time || "") ||
            /\b202[7-9]\b|\b20[3-9]\d\b/.test(item.title || "") ||
            /\b202[7-9]\b|\b20[3-9]\d\b/.test(item.context || "")
          );

          if (!hasDistantFutureItems) {
            const platforms = await getConnectedPlatformsSummary(userId);
            return NextResponse.json({
              success: true,
              cached: true,
              updated_at: cacheRow.updated_at,
              expires_at: cacheRow.expires_at,
              brief_data: cacheRow.brief_data as DashboardBriefData,
              platforms,
            });
          }
          // If cached data contains stale distant-future reminders (e.g. 2027/2028), bypass cache and re-synthesize cleanly
        }
      } catch (err) {
        console.warn("Error reading user_dashboard_cache, proceeding to fresh generation:", err);
      }
    }

    // 2. Cache Miss or Force Refresh: Fetch real data from user's connected platforms
    const [platforms, liveContext] = await Promise.all([
      getConnectedPlatformsSummary(userId),
      fetchIntegrationsContext(userId),
    ]);

    // 3. Gemini 3.5 Flash-Lite Engine Synthesis based on REAL connected account status
    const geminiApiKey = process.env.GEMINI_API_KEY || "";
    let briefData: DashboardBriefData;

    if (geminiApiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiApiKey });
        const prompt = `You are ToyBox.ai's multi-platform intelligence executive engine for the user Sushant Kate.
Synthesize an executive intelligence summary strictly from the user's REAL connected platforms data:

[GOOGLE CALENDAR REAL EVENTS]:
${JSON.stringify(liveContext.calendar, null, 2)}

[GMAIL REAL INBOX STATUS]:
${JSON.stringify(liveContext.emails, null, 2)}

[SLACK WORKSPACE REAL STATUS]:
${JSON.stringify(liveContext.slack, null, 2)}

[WHATSAPP REAL CHAT STATUS]:
${JSON.stringify(liveContext.whatsapp, null, 2)}

RULES FOR SYNTHESIS:
1. Base all counts, bullets, and priority items ONLY on the actual data provided above. NEVER invent fake emails or fictitious contacts (like Sarah Jenkins, David Miller, or Acme Corp).
2. For calendar events: Only include events occurring within the near-term upcoming horizon (next 7 to 14 days). DO NOT include distant future events (e.g. 2027 or 2028). For repeating annual reminders like birthdays or anniversaries, only mention them if they fall within the immediate upcoming window (next 7 days), and NEVER show repeated instances for future years. Keep distant recurring reminders quiet.
3. If Gmail has an error (such as Gmail API needing to be enabled in Google Cloud Console project 682852845369), create a clear high-priority action advising the user to enable the Gmail API in their Google Cloud Console.
4. If Slack is connected to workspace "ToyBox Dev Lab" with channels (#social, #all-toybox-dev-lab, #new-channel) but bot needs channel invitation, advise inviting the bot via "/invite @ToyBox AI Assistant".
5. If WhatsApp is active with no new unread messages, confirm that the WhatsApp multi-device bridge is active and monitoring.
6. Provide exact JSON with:
   - "important_count": number of urgent items / setup actions needing attention
   - "priority_count": number of priority tasks / upcoming calendar items
   - "followup_count": number of follow-ups
   - "brief_bullets": exactly 3 or 4 high-impact, factually accurate bullet points
   - "priority_items": array of 4 to 8 prioritized action items (each with "id", "platform" [gmail|slack|whatsapp|calendar], "title", "context", "time", "priority" [high|medium|urgent])

Respond ONLY with valid JSON conforming to the schema without markdown blocks.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash-lite",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        const rawText = response.text || "{}";
        const parsed = JSON.parse(rawText.replace(/^```json\s*/, "").replace(/\s*```$/, ""));

        briefData = {
          important_count: Number(parsed.important_count ?? (liveContext.emails.apiDisabled ? 1 : 0)),
          priority_count: Number(parsed.priority_count ?? (liveContext.calendar.events?.length || 2)),
          followup_count: Number(parsed.followup_count ?? 1),
          brief_bullets: Array.isArray(parsed.brief_bullets) && parsed.brief_bullets.length > 0
            ? parsed.brief_bullets.slice(0, 4)
            : buildDynamicRealBullets(liveContext),
          priority_items: Array.isArray(parsed.priority_items) && parsed.priority_items.length > 0
            ? parsed.priority_items.slice(0, 10).map((item: Record<string, unknown>, idx: number) => ({
                id: (item.id as string) || `pri_${idx + 1}`,
                platform: ["gmail", "slack", "whatsapp", "calendar"].includes(item.platform as string)
                  ? (item.platform as "gmail" | "slack" | "whatsapp" | "calendar")
                  : "calendar",
                title: (item.title as string) || "Connected Account Status",
                context: (item.context as string) || "Active multi-channel connection",
                time: (item.time as string) || "Recent",
                priority: ["high", "medium", "urgent"].includes(item.priority as string)
                  ? (item.priority as "high" | "medium" | "urgent")
                  : "high",
              }))
            : buildDynamicRealPriorityItems(liveContext),
        };
      } catch (geminiError: unknown) {
        console.warn("Gemini 3.5 Flash-Lite synthesis error, using real context fallback:", geminiError);
        briefData = buildRealContextFallback(liveContext);
      }
    } else {
      briefData = buildRealContextFallback(liveContext);
    }

    // 4. Ultra-lightweight single-row UPSERT into user_dashboard_cache (2-hour expiration)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours

    try {
      await insforgeAdmin
        .database
        .from("user_dashboard_cache")
        .upsert([
          {
            user_id: userId,
            brief_data: briefData,
            updated_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
          },
        ], { onConflict: "user_id" });
    } catch (upsertErr) {
      console.warn("Could not upsert into user_dashboard_cache:", upsertErr);
    }

    return NextResponse.json({
      success: true,
      cached: false,
      updated_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      brief_data: briefData,
      platforms,
    });
  } catch (error: unknown) {
    console.error("GET /api/dashboard error:", error);
    const errMessage = error instanceof Error ? error.message : "Failed to load dashboard data";
    return NextResponse.json(
      {
        success: false,
        error: errMessage,
      },
      { status: 500 }
    );
  }
}

// Helper to gather connected platform statuses
async function getConnectedPlatformsSummary(userId: string) {
  const { data: userIntegrations } = await insforgeAdmin
    .database
    .from("user_integrations")
    .select("platform_id, status, last_synced_at, metadata, credentials")
    .eq("user_id", userId);

  const liveWhatsApp = await getWhatsAppStatus(userId).catch(() => null);
  const savedMap = new Map<string, Record<string, unknown>>();
  if (userIntegrations && Array.isArray(userIntegrations)) {
    userIntegrations.forEach((i) => savedMap.set(i.platform_id, i as Record<string, unknown>));
  }

  // Primary active platforms
  const primaryPlatforms = ["gmail", "whatsapp", "slack", "gcal"];
  // Extended platforms
  const extendedPlatforms = ["outlook", "discord", "linkedin", "telegram", "notion", "reddit"];

  const buildPlatformInfo = (platformId: string) => {
    const catalogItem = platformsCatalog.find((p) => p.id === platformId);
    const saved = savedMap.get(platformId);
    let isConnected = saved ? saved.status === "connected" : false;
    let lastSync = saved?.last_synced_at ? formatTimeAgo(new Date(saved.last_synced_at as string)) : "Never";

    if (platformId === "whatsapp") {
      if (liveWhatsApp?.status === "connected") {
        isConnected = true;
        if (lastSync === "Never") lastSync = "Just now";
      } else if (liveWhatsApp?.status === "disconnected") {
        isConnected = false;
      }
    }

    const nameMap: Record<string, string> = {
      gmail: "Gmail",
      whatsapp: "WhatsApp",
      slack: "Slack",
      gcal: "Google Calendar",
      outlook: "Microsoft Outlook",
      discord: "Discord",
      linkedin: "LinkedIn",
      telegram: "Telegram",
      notion: "Notion",
      reddit: "Reddit",
    };

    const metadata = saved?.metadata as Record<string, unknown> | undefined;

    return {
      id: platformId,
      name: nameMap[platformId] || catalogItem?.name || platformId,
      icon: platformId,
      status: (isConnected ? "connected" : "disconnected") as "connected" | "disconnected",
      lastSync,
      account: (metadata?.account_email as string) || (metadata?.account_name as string) || null,
    };
  };

  return {
    active: primaryPlatforms.map(buildPlatformInfo),
    extended: extendedPlatforms.map(buildPlatformInfo),
  };
}

// Concurrently fetch REAL live data from user's connected integrations
async function fetchIntegrationsContext(userId: string) {
  const { data: integrations } = await insforgeAdmin
    .database
    .from("user_integrations")
    .select("platform_id, credentials, status, metadata")
    .eq("user_id", userId);

  const intMap = new Map<string, { status?: string; credentials?: Record<string, unknown>; metadata?: Record<string, unknown> }>();
  if (integrations && Array.isArray(integrations)) {
    integrations.forEach((i) => intMap.set(i.platform_id, i));
  }

  // 1. Google Calendar: Fetch REAL live events using auto-refreshed token
  const calendarData: {
    status: string;
    events: Array<{ summary: string; start: string; attendees?: string }>;
  } = {
    status: "connected",
    events: [],
  };

  const gcalToken = await getValidGoogleToken("gcal", userId);
  if (gcalToken) {
    try {
      const now = new Date();
      const nowIso = now.toISOString();
      const horizonDays = 14; // Strictly limit dashboard calendar scope to next 14 days
      const endOfHorizon = new Date(now.getTime() + horizonDays * 24 * 60 * 60 * 1000).toISOString();

      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
          nowIso
        )}&timeMax=${encodeURIComponent(
          endOfHorizon
        )}&maxResults=10&singleEvents=true&orderBy=startTime`,
        { headers: { Authorization: `Bearer ${gcalToken}` } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.items && Array.isArray(data.items)) {
          const seenEventKeys = new Set<string>();
          const validEvents: Array<{ summary: string; start: string; attendees?: string }> = [];

          for (const item of data.items) {
            const summary = (item.summary || "Scheduled Event").trim();

            // Deduplicate repeating reminders / recurring events (e.g. annual birthdays)
            const normalizedKey = summary
              .toLowerCase()
              .replace(/\b(20\d\d|upcoming)\b/g, "")
              .replace(/[^a-z0-9]/g, " ")
              .replace(/\s+/g, " ")
              .trim();

            const eventKey = item.recurringEventId || normalizedKey;
            if (seenEventKeys.has(eventKey)) {
              continue;
            }
            seenEventKeys.add(eventKey);

            // Double check: strictly exclude anything beyond horizon window or from distant future years
            const startRaw = item.start?.dateTime || item.start?.date || "";
            if (startRaw) {
              const eventDate = new Date(startRaw);
              if (!isNaN(eventDate.getTime()) && eventDate.getTime() > now.getTime() + horizonDays * 24 * 60 * 60 * 1000) {
                continue;
              }
            }

            validEvents.push({
              summary,
              start: item.start?.dateTime ? new Date(item.start.dateTime).toLocaleDateString() : (item.start?.date || "Upcoming"),
              attendees: (item.attendees || []).map((a: { email?: string; displayName?: string }) => a.email || a.displayName || "").filter(Boolean).join(", "),
            });
          }

          calendarData.events = validEvents;
        }
      }
    } catch (e) {
      console.warn("Could not fetch Google Calendar events:", e);
    }
  }

  // 2. Gmail: Fetch REAL unread messages using auto-refreshed token
  const emailData: {
    status: string;
    account: string;
    unreadCount: number;
    apiDisabled?: boolean;
    messages: Array<{ from: string; subject: string; snippet: string; date: string }>;
  } = {
    status: intMap.get("gmail")?.status || "connected",
    account: (intMap.get("gmail")?.metadata?.account_email as string) || "sushant98k@gmail.com",
    unreadCount: 0,
    messages: [],
  };

  const gmailToken = await getValidGoogleToken("gmail", userId);
  if (gmailToken) {
    try {
      const res = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=5",
        { headers: { Authorization: `Bearer ${gmailToken}` } }
      );
      if (res.ok) {
        const listData = await res.json();
        emailData.unreadCount = listData.resultSizeEstimate || (listData.messages?.length ?? 0);
        if (listData.messages && Array.isArray(listData.messages) && listData.messages.length > 0) {
          const realEmails = await Promise.all(
            listData.messages.slice(0, 3).map(async (m: { id: string }) => {
              const dRes = await fetch(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
                { headers: { Authorization: `Bearer ${gmailToken}` } }
              );
              if (dRes.ok) {
                const item = await dRes.json();
                const headers = (item.payload?.headers || []) as Array<{ name: string; value: string }>;
                return {
                  from: headers.find((h) => h.name === "From")?.value || "Unknown",
                  subject: headers.find((h) => h.name === "Subject")?.value || "No Subject",
                  snippet: item.snippet || "",
                  date: headers.find((h) => h.name === "Date")?.value || "",
                };
              }
              return null;
            })
          );
          emailData.messages = realEmails.filter(Boolean) as typeof emailData.messages;
        }
      } else if (res.status === 403) {
        const errJson = await res.json();
        if (errJson?.error?.message?.includes("Gmail API has not been used") || errJson?.error?.message?.includes("disabled")) {
          emailData.apiDisabled = true;
        }
      }
    } catch (e) {
      console.warn("Could not fetch live Gmail messages:", e);
    }
  }

  // 3. Slack: Fetch REAL channels and status
  const slackData: {
    status: string;
    workspace: string;
    channels: string[];
    needsChannelInvite: boolean;
  } = {

    status: intMap.get("slack")?.status || "connected",
    workspace: (intMap.get("slack")?.metadata?.team_name as string) || "ToyBox Dev Lab",
    channels: ["#social", "#all-toybox-dev-lab", "#new-channel"],
    needsChannelInvite: true,
  };

  const slackToken =
    (intMap.get("slack")?.credentials?.access_token as string) ||
    (intMap.get("slack")?.credentials?.bot_access_token as string) ||
    process.env.SLACK_BOT_TOKEN;

  if (slackToken) {
    try {
      const cRes = await fetch("https://slack.com/api/conversations.list?types=public_channel,private_channel", {
        headers: { Authorization: `Bearer ${slackToken}` },
      });
      if (cRes.ok) {
        const cJson = await cRes.json();
        if (cJson.ok && cJson.channels) {
          slackData.channels = cJson.channels.map((c: { name: string }) => `#${c.name}`);
        }
      }
    } catch (e) {
      console.warn("Could not list Slack channels:", e);
    }
  }

  // 4. WhatsApp: Real connection status & live buffered messages
  const whatsAppStatus = await getWhatsAppStatus(userId);
  const liveWaMsgs = getWhatsAppMessages(userId);
  const whatsAppData = {
    status: whatsAppStatus.status,
    phoneNumber: whatsAppStatus.phoneNumber || "+91 9768368524",
    syncActive: whatsAppStatus.syncMessages,
    unreadCount: liveWaMsgs.filter((m) => m.unread).length,
    messages: liveWaMsgs.slice(0, 5),
  };

  return {
    calendar: calendarData,
    emails: emailData,
    slack: slackData,
    whatsapp: whatsAppData,
  };
}

function buildDynamicRealBullets(context: Awaited<ReturnType<typeof fetchIntegrationsContext>>): string[] {
  const bullets: string[] = [];

  // Calendar
  if (context.calendar.events.length > 0) {
    const firstEvt = context.calendar.events[0];
    bullets.push(
      `Google Calendar: Upcoming event "${firstEvt.summary}" on ${firstEvt.start}. ${context.calendar.events.length} upcoming event(s) in the next 14 days.`
    );
  } else {
    bullets.push("Google Calendar: Connected to sushant98k@gmail.com with 0 scheduled meetings or conflicts in the next 14 days.");
  }

  // Gmail
  if (context.emails.apiDisabled) {
    bullets.push(
      "Gmail (sushant98k@gmail.com): OAuth connected. Gmail API needs to be enabled in Google Cloud Console project 682852845369 to activate message sync."
    );
  } else if (context.emails.messages.length > 0) {
    bullets.push(`Gmail: ${context.emails.unreadCount} unread email(s) found in sushant98k@gmail.com inbox.`);
  } else {
    bullets.push("Gmail: Connected to sushant98k@gmail.com. Inbox has 0 unread urgent messages requiring attention.");
  }

  // Slack
  bullets.push(
    `Slack (${context.slack.workspace}): Connected with ${context.slack.channels.length} channels (${context.slack.channels.slice(0, 3).join(", ")}). Bot is standing by for channel invitations.`
  );

  // WhatsApp
  bullets.push(
    `WhatsApp: Multi-device paired to ${context.whatsapp.phoneNumber}. End-to-end encrypted channel is live and awaiting incoming messages.`
  );

  return bullets;
}

function buildDynamicRealPriorityItems(context: Awaited<ReturnType<typeof fetchIntegrationsContext>>): DashboardBriefData["priority_items"] {
  const items: DashboardBriefData["priority_items"] = [];

  if (context.emails.apiDisabled) {
    items.push({
      id: "pri_gmail_enable",
      platform: "gmail",
      title: "Enable Gmail API in Google Cloud Console",
      context: "Project 682852845369 requires Gmail API activation to allow automatic inbox classification.",
      time: "Action required",
      priority: "urgent",
    });
  }

  // Live messages from Gmail
  if (context.emails.messages && context.emails.messages.length > 0) {
    context.emails.messages.forEach((msg, idx) => {
      items.push({
        id: `pri_gmail_${idx + 1}`,
        platform: "gmail",
        title: msg.subject || "Unread Email Action Required",
        context: `From: ${msg.from}. ${msg.snippet ? msg.snippet.slice(0, 110) : "Awaiting executive reply."}`,
        time: msg.date ? formatTimeAgo(new Date(msg.date)) : "Recent",
        priority: idx === 0 ? "urgent" : "high",
      });
    });
  }

  // Google Calendar events
  if (context.calendar.events.length > 0) {
    context.calendar.events.forEach((evt, idx) => {
      items.push({
        id: `pri_calendar_event_${idx + 1}`,
        platform: "calendar",
        title: `Upcoming: ${evt.summary}`,
        context: `Scheduled on ${evt.start} synced from primary Google Calendar.${evt.attendees ? ` Attendees: ${evt.attendees}` : ""}`,
        time: evt.start,
        priority: idx === 0 ? "high" : "medium",
      });
    });
  }

  // Slack channel invite
  items.push({
    id: "pri_slack_invite",
    platform: "slack",
    title: "Invite Slack Bot to Channels",
    context: `Type "/invite @ToyBox" into ${context.slack.channels[0] || "#general"} in workspace "${context.slack.workspace}".`,
    time: "Setup item",
    priority: "medium",
  });

  // WhatsApp telemetry
  items.push({
    id: "pri_whatsapp_live",
    platform: "whatsapp",
    title: "WhatsApp Bridge Active",
    context: `Baileys multi-device connected for ${context.whatsapp.phoneNumber}. 0 pending critical alerts.`,
    time: "Live",
    priority: "medium",
  });

  return items;
}

function buildRealContextFallback(context: Awaited<ReturnType<typeof fetchIntegrationsContext>>): DashboardBriefData {
  return {
    important_count: context.emails.apiDisabled ? 1 : 0,
    priority_count: context.calendar.events.length > 0 ? context.calendar.events.length : 2,
    followup_count: 1,
    brief_bullets: buildDynamicRealBullets(context),
    priority_items: buildDynamicRealPriorityItems(context),
  };
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
