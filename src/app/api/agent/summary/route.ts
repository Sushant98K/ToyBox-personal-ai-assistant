import { NextRequest, NextResponse } from "next/server";
import { insforgeAdmin } from "@/lib/insforge-admin";
import { getValidGoogleToken } from "@/lib/agent/tools";
import { getWhatsAppStatus, getWhatsAppMessages } from "@/lib/whatsapp-baileys";

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
      if (usersByEmail && usersByEmail.length > 0) return usersByEmail[0].id;
    } catch {}
  }
  const { data: users } = await insforgeAdmin
    .database
    .from("users")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1);
  return users?.[0]?.id || "a727d188-4197-409c-855d-2aa5201cebc7";
}

export async function GET(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);

    // 1. Fetch user's latest personalized briefing
    const { data: briefings } = await insforgeAdmin
      .database
      .from("generated_briefings")
      .select("id, title, executive_summary, highlights, category_counts, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    const latestBriefing = briefings?.[0] || null;

    // 2. Fetch user's real connected integrations
    const { data: integrations } = await insforgeAdmin
      .database
      .from("user_integrations")
      .select("platform_id, status, last_synced_at, messages_processed")
      .eq("user_id", userId);

    const integrationMap = new Map<string, any>();
    (integrations || []).forEach((i) => {
      integrationMap.set(i.platform_id, i);
    });

    // Check live WhatsApp Baileys status
    const liveWhatsApp = await getWhatsAppStatus(userId).catch(() => null);
    const isWhatsAppConnected =
      liveWhatsApp?.status === "connected" ||
      integrationMap.get("whatsapp")?.status === "connected";

    const isGmailConnected = integrationMap.get("gmail")?.status === "connected";
    const isCalendarConnected =
      integrationMap.get("gcal")?.status === "connected" ||
      integrationMap.get("calendar")?.status === "connected";
    const isSlackConnected = integrationMap.get("slack")?.status === "connected";

    const connectedPlatforms = [
      { id: "gmail", name: "Gmail", status: isGmailConnected ? "connected" : "disconnected", isConnected: Boolean(isGmailConnected) },
      { id: "slack", name: "Slack", status: isSlackConnected ? "connected" : "disconnected", isConnected: Boolean(isSlackConnected) },
      { id: "whatsapp", name: "WhatsApp", status: isWhatsAppConnected ? "connected" : "disconnected", isConnected: Boolean(isWhatsAppConnected) },
      { id: "gcal", name: "Google Calendar", status: isCalendarConnected ? "connected" : "disconnected", isConnected: Boolean(isCalendarConnected) },
    ];

    // 3. Dynamic Real Upcoming Calendar Event
    let nextMeetingTitle = "Schedule clear — no meetings today";
    let nextMeetingTime = "All Clear";
    let meetingUrgency = "normal";

    if (isCalendarConnected) {
      try {
        const calToken = await getValidGoogleToken("gcal", userId);
        if (calToken) {
          const nowIso = new Date().toISOString();
          const endOfDay = new Date(new Date().setHours(23, 59, 59, 999)).toISOString();
          const res = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
              nowIso
            )}&timeMax=${encodeURIComponent(
              endOfDay
            )}&singleEvents=true&orderBy=startTime&maxResults=1`,
            { headers: { Authorization: `Bearer ${calToken}` }, signal: AbortSignal.timeout(4000) }
          );

          if (res.ok) {
            const calData = await res.json();
            const firstEvt = calData.items?.[0];
            if (firstEvt) {
              nextMeetingTitle = firstEvt.summary || "Scheduled Event";
              const startTime = firstEvt.start?.dateTime || firstEvt.start?.date;
              nextMeetingTime = startTime
                ? new Date(startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "Today";
              meetingUrgency = "high";
            }
          }
        }
      } catch (calErr) {
        console.warn("Could not query live calendar for summary bar:", calErr);
      }
    }

    // 4. Derive unread / important message count from real data or briefing
    let unreadCount = 0;
    if (latestBriefing?.category_counts?.messages) {
      unreadCount = latestBriefing.category_counts.messages;
    } else {
      // Check live WhatsApp unread count
      const waMsgs = getWhatsAppMessages(userId);
      const waUnread = waMsgs.filter((m) => m.unread).length;
      unreadCount = waUnread;
    }

    const connectedNames = connectedPlatforms.filter((c) => c.isConnected).map((c) => c.name);

    let messagesLabel =
      unreadCount > 0
        ? `${unreadCount} unread items across ${connectedNames.join(" & ") || "inbox"}`
        : connectedNames.length > 0
        ? `All ${connectedNames.join(", ")} items triaged`
        : "Connect apps in Integrations to view priority items";

    // 5. Briefing snippet
    const briefTitle = latestBriefing?.title || "Executive Intelligence Overview";
    const briefSnippet = latestBriefing?.executive_summary
      ? latestBriefing.executive_summary.slice(0, 140) + "..."
      : connectedNames.length > 0
      ? `AI agent synchronized across ${connectedNames.join(", ")}. Ask any question or request a triage brief.`
      : "Connect your workspace integrations to unlock real-time executive summaries.";

    const briefTimestamp = latestBriefing?.created_at
      ? new Date(latestBriefing.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    return NextResponse.json({
      todaysBrief: {
        title: briefTitle,
        snippet: briefSnippet,
        timestamp: briefTimestamp,
        id: latestBriefing?.id,
      },
      importantMessages: {
        unreadCount,
        label: messagesLabel,
      },
      scheduleAlert: {
        title: nextMeetingTitle,
        time: nextMeetingTime,
        urgency: meetingUrgency,
      },
      connectors: connectedPlatforms,
    });
  } catch (err: any) {
    console.error("GET /api/agent/summary error:", err);
    return NextResponse.json(
      {
        todaysBrief: {
          title: "Executive Intelligence Overview",
          snippet: "Ask ToyBox AI to synthesize communications or inspect your upcoming schedule.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
        importantMessages: {
          unreadCount: 0,
          label: "Inboxes up to date",
        },
        scheduleAlert: {
          title: "Schedule clear — no meetings today",
          time: "All Clear",
          urgency: "normal",
        },
        connectors: [
          { id: "gmail", name: "Gmail", status: "disconnected", isConnected: false },
          { id: "slack", name: "Slack", status: "disconnected", isConnected: false },
          { id: "whatsapp", name: "WhatsApp", status: "disconnected", isConnected: false },
          { id: "gcal", name: "Google Calendar", status: "disconnected", isConnected: false },
        ],
      },
      { status: 200 }
    );
  }
}
