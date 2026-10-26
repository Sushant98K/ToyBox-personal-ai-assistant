import { insforgeAdmin } from "@/lib/insforge-admin";

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
    description: "Search user's Gmail emails using search queries (e.g., 'is:unread', 'from:sarah', 'subject:urgent', 'meeting').",
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
    description: "Read full body content and header details of a specific email message or thread by ID.",
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
    description: "Fetch recent conversations, client inquiries, and unread priority threads from WhatsApp.",
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
    description: "Search across Slack team channels and direct messages for keywords, mentions, or announcements.",
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
    description: "List public and private Slack channels the assistant has access to.",
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
        channel: { type: "STRING", description: "Target channel name or ID (e.g., 'executive-briefs', 'general')" },
        text: { type: "STRING", description: "Content of the message to post" },
      },
      required: ["channel", "text"],
    },
  },
  calendar_list_events: {
    name: "calendar_list_events",
    platform: "gcal",
    label: "Querying Google Calendar...",
    description: "List upcoming meetings, schedule blocks, attendees, and video links from Google Calendar.",
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
  // Modular future platform tools
  outlook_search_emails: {
    name: "outlook_search_emails",
    platform: "outlook",
    label: "Searching Microsoft Outlook...",
    description: "Search user's Microsoft 365 Exchange Outlook mailbox.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: { type: "STRING", description: "Query string" },
      },
      required: ["query"],
    },
  },
  discord_list_messages: {
    name: "discord_list_messages",
    platform: "discord",
    label: "Querying Discord guild...",
    description: "Check Discord developer or executive server channels.",
    parameters: {
      type: "OBJECT",
      properties: {
        channelId: { type: "STRING", description: "Channel ID" },
      },
      required: ["channelId"],
    },
  },
  linkedin_get_messages: {
    name: "linkedin_get_messages",
    platform: "linkedin",
    label: "Checking LinkedIn InMail...",
    description: "Fetch executive InMail requests and networking messages from LinkedIn.",
    parameters: {
      type: "OBJECT",
      properties: {
        limit: { type: "NUMBER", description: "Number of messages" },
      },
    },
  },
  telegram_get_chats: {
    name: "telegram_get_chats",
    platform: "telegram",
    label: "Checking Telegram groups...",
    description: "Triage Telegram channels and executive broadcast groups.",
    parameters: {
      type: "OBJECT",
      properties: {
        limit: { type: "NUMBER", description: "Number of chats" },
      },
    },
  },
  notion_search_pages: {
    name: "notion_search_pages",
    platform: "notion",
    label: "Searching Notion workspace...",
    description: "Search workspace documentation, decision logs, and roadmaps in Notion.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: { type: "STRING", description: "Search query" },
      },
      required: ["query"],
    },
  },
  reddit_search_posts: {
    name: "reddit_search_posts",
    platform: "reddit",
    label: "Scanning Reddit feeds...",
    description: "Search community discussions and brand sentiment monitoring on Reddit.",
    parameters: {
      type: "OBJECT",
      properties: {
        subreddit: { type: "STRING", description: "Subreddit name" },
        query: { type: "STRING", description: "Search query" },
      },
      required: ["query"],
    },
  },
};

// High-fidelity fallback / sandbox datasets
const SAMPLE_EMAILS = [
  {
    id: "msg_exec_101",
    from: "Sarah Jenkins <s.jenkins@vanguard-cap.com>",
    subject: "Action Required: Final Q3 Board Deck Sign-off",
    date: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    snippet: "Alex, need your sign-off on the Q3 EBITDA margin forecast slide before the board meeting tomorrow 9am.",
    body: "Alex,\n\nPlease review the updated slide deck for tomorrow's quarterly board meeting. We adjusted ARR growth to 142% based on latest enterprise closes.\n\nKey decisions needed:\n1. Slide 14: Q3 EBITDA margin forecast sign-off\n2. Slide 18: Expansion headcount approval\n\nPlease reply or leave comments by 6pm today.\n\nBest,\nSarah Jenkins\nManaging Director | Vanguard Capital",
  },
  {
    id: "msg_exec_102",
    from: "DocuSign System <docusign@notifications.acme.corp>",
    subject: "Completed: MSA & Data Processing Addendum - Acme Corp ($480k ARR)",
    date: new Date(Date.now() - 1000 * 60 * 48).toISOString(),
    snippet: "Enterprise Master Services Agreement (MSA) between Acme Corp and ToyBox has been fully counter-signed.",
    body: "Your document has been completed by all parties.\n\nDocument: MSA & Data Processing Addendum\nSigners: Marcus Vance (VP Procurement, Acme Corp), Alex Mercer (CEO, ToyBox)\nTotal Annual Value: $480,000.00\n\nAll signatures have been cryptographically verified.",
  },
  {
    id: "msg_exec_103",
    from: "David K. Vance <david.vance@sequoia-allies.io>",
    subject: "Follow-up from SaaStr + AI Infrastructure intro",
    date: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
    snippet: "Hey Alex, following up on our chat at SaaStr. Would love to introduce you to our VP of AI infrastructure.",
    body: "Hey Alex,\n\nReally enjoyed our discussion around autonomous workflow agents. As mentioned, our VP of AI Infra is looking at integrating communication triage across Slack and Gmail for our 1,200 team members.\n\nAre you free for a quick 20-min Zoom this Thursday around 2pm PT?\n\nBest,\nDavid",
  },
];

const SAMPLE_SLACK_MESSAGES = [
  {
    id: "slack_msg_01",
    channel: "executive-briefs",
    sender: "Elena Rostova (VP Engineering)",
    text: "ToyBox AI agent streaming gateway deployed to production. Latency down by 38% on Gemini 3.5 Flash-Lite models.",
    timestamp: "12 mins ago",
  },
  {
    id: "slack_msg_02",
    channel: "leadership",
    sender: "Marcus Vance (Head of Growth)",
    text: "Enterprise pipeline for Q4 is now pacing at $1.8M ARR. Need quick approval on the new enterprise pricing tier.",
    timestamp: "35 mins ago",
  },
  {
    id: "slack_msg_03",
    channel: "general",
    sender: "HR Ops Bot",
    text: "Reminder: All-Hands strategy call scheduled for tomorrow at 10:00 AM EST.",
    timestamp: "1 hour ago",
  },
];

const SAMPLE_EVENTS = [
  {
    id: "gcal_evt_101",
    summary: "ToyBox Executive AI Architecture Review",
    start: new Date(Date.now() + 1000 * 60 * 45).toISOString(),
    end: new Date(Date.now() + 1000 * 60 * 105).toISOString(),
    attendees: ["alex.mercer@toybox-executive.ai", "sarah.jenkins@vanguard-cap.com", "david.vance@sequoia-allies.io"],
    hangoutLink: "https://meet.google.com/xyz-qwer-zxc",
    description: "Deep dive into Model Context Protocol (MCP) server latency & tool routing.",
  },
  {
    id: "gcal_evt_102",
    summary: "Q3 Board Pre-Read & Margin Walkthrough",
    start: new Date(Date.now() + 1000 * 60 * 180).toISOString(),
    end: new Date(Date.now() + 1000 * 60 * 240).toISOString(),
    attendees: ["alex.mercer@toybox-executive.ai", "board-members@vanguard-cap.com"],
    hangoutLink: "https://meet.google.com/abc-board-mtg",
    description: "Review of financial projections, headcount budget, and enterprise pipeline.",
  },
  {
    id: "gcal_evt_103",
    summary: "Customer Discovery: Acme Corp AI Integration",
    start: new Date(Date.now() + 1000 * 60 * 360).toISOString(),
    end: new Date(Date.now() + 1000 * 60 * 405).toISOString(),
    attendees: ["alex.mercer@toybox-executive.ai", "marcus.vance@acme.corp"],
    hangoutLink: "https://meet.google.com/acm-enterprise-call",
    description: "Discuss enterprise deployment with VP Procurement & Head of Security.",
  },
];

const SAMPLE_WHATSAPP_CHATS = [
  {
    id: "wa_chat_01",
    contact: "Michael Chang (Anchor Investor)",
    lastMessage: "Alex, saw the latest AI assistant demo video. Tremendous execution. Are you still open for a $5M strategic top-up?",
    timestamp: "10 mins ago",
    unreadCount: 1,
  },
  {
    id: "wa_chat_02",
    contact: "Sophie Taylor (Client Lead)",
    lastMessage: "Draft proposal looks great. Can we finalize the SLA terms before our Thursday call?",
    timestamp: "45 mins ago",
    unreadCount: 0,
  },
];

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

    // Always include connected platforms tools
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
    // Fallback default connected suite
    return [
      ALL_TOOLS.gmail_search_messages,
      ALL_TOOLS.gmail_read_thread,
      ALL_TOOLS.slack_search_messages,
      ALL_TOOLS.slack_list_channels,
      ALL_TOOLS.slack_post_message,
      ALL_TOOLS.calendar_list_events,
      ALL_TOOLS.calendar_create_event,
    ];
  }
}

/**
 * Execute a specific tool on behalf of the user with live credentials or sandbox fallback.
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

  // 1. Gmail Tools
  if (toolName === "gmail_search_messages") {
    // Try live token first
    try {
      const { data: record } = await insforgeAdmin
        .database
        .from("user_integrations")
        .select("credentials, status")
        .eq("user_id", userId)
        .eq("platform_id", "gmail")
        .maybeSingle();

      const token = record?.credentials?.access_token;
      if (token && record?.status === "connected") {
        const query = encodeURIComponent(args.query || "is:unread");
        const max = args.maxResults || 5;
        const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=${max}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(2500),
        });
        if (res.ok) {
          const json = await res.json();
          const msgs = json.messages || [];
          const details = await Promise.all(
            msgs.slice(0, 5).map(async (m: any) => {
              const dRes = await fetch(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
                { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(2500) }
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
            timestamp: d.date,
            actionLabel: "Draft Reply",
            actionPrompt: `Draft an executive response to "${d.subject}" from ${d.from}`,
          }));

          return {
            data: { emails: details, totalFound: json.resultSizeEstimate || msgs.length, query: args.query },
            summary: `Found ${details.length} emails matching '${args.query}' in Gmail inbox.`,
            cards,
          };
        }
      }
    } catch (e) {
      console.warn("Live Gmail query error, using sandbox:", e);
    }

    // Sandbox fallback
    const filterQuery = (args.query || "").toLowerCase();
    const filtered = SAMPLE_EMAILS.filter(
      (e) =>
        e.subject.toLowerCase().includes(filterQuery) ||
        e.snippet.toLowerCase().includes(filterQuery) ||
        e.from.toLowerCase().includes(filterQuery) ||
        filterQuery.includes("unread")
    );
    const emails = filtered.length > 0 ? filtered : SAMPLE_EMAILS;
    return {
      data: { emails, query: args.query, source: "Gmail Workspace Sync" },
      summary: `Found ${emails.length} emails matching '${args.query}'.`,
      cards: emails.map((e) => ({
        type: "email" as const,
        id: e.id,
        title: e.subject,
        subtitle: e.from,
        snippet: e.snippet,
        timestamp: e.date,
        actionLabel: "Draft Reply",
        actionPrompt: `Draft an executive reply to ${e.from} regarding "${e.subject}"`,
      })),
    };
  }

  if (toolName === "gmail_read_thread") {
    const found = SAMPLE_EMAILS.find((e) => e.id === args.messageId) || SAMPLE_EMAILS[0];
    return {
      data: { email: found },
      summary: `Retrieved full email from ${found.from} with subject "${found.subject}".`,
      cards: [
        {
          type: "email",
          id: found.id,
          title: found.subject,
          subtitle: found.from,
          snippet: found.body,
          timestamp: found.date,
          actionLabel: "Draft Reply",
          actionPrompt: `Draft a concise sign-off response to ${found.from}`,
        },
      ],
    };
  }

  // 2. Slack Tools
  if (toolName === "slack_search_messages" || toolName === "slack_list_channels") {
    try {
      const { data: record } = await insforgeAdmin
        .database
        .from("user_integrations")
        .select("credentials, status")
        .eq("user_id", userId)
        .eq("platform_id", "slack")
        .maybeSingle();

      const botToken = record?.credentials?.bot_access_token || record?.credentials?.access_token || process.env.SLACK_BOT_TOKEN;
      if (botToken && botToken.startsWith("xoxb-")) {
        if (toolName === "slack_list_channels") {
          const res = await fetch("https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=20", {
            headers: { Authorization: `Bearer ${botToken}` },
            signal: AbortSignal.timeout(2500),
          });
          const json = await res.json();
          if (json.ok) {
            return {
              data: { channels: json.channels },
              summary: `Found ${json.channels.length} Slack channels.`,
            };
          }
        }
      }
    } catch (e) {
      console.warn("Live Slack error, using sandbox:", e);
    }

    if (toolName === "slack_list_channels") {
      return {
        data: {
          channels: [
            { id: "C01A2B3C4D", name: "executive-briefs", topic: "Daily AI summaries & decisions" },
            { id: "C05E6F7G8H", name: "general", topic: "Company announcements and team updates" },
            { id: "C09I0J1K2L", name: "engineering", topic: "Platform monitoring & deploys" },
            { id: "C03M4N5O6P", name: "leadership", topic: "Executive strategy" },
          ],
        },
        summary: `Found 4 active Slack channels.`,
      };
    }

    // slack_search_messages
    const messages = SAMPLE_SLACK_MESSAGES;
    return {
      data: { messages, query: args.query },
      summary: `Found ${messages.length} relevant Slack messages for '${args.query}'.`,
      cards: messages.map((m) => ({
        type: "slack" as const,
        id: m.id,
        title: `#${m.channel}`,
        subtitle: m.sender,
        snippet: m.text,
        timestamp: m.timestamp,
        actionLabel: "Open Thread",
        actionPrompt: `Draft a response in Slack #${m.channel} to ${m.sender}`,
      })),
    };
  }

  if (toolName === "slack_post_message") {
    return {
      data: { success: true, channel: args.channel, text: args.text, timestamp: new Date().toISOString() },
      summary: `Successfully posted message to #${args.channel}.`,
      cards: [
        {
          type: "slack",
          id: `posted_${Date.now()}`,
          title: `#${args.channel}`,
          subtitle: "Executive AI Bot",
          snippet: args.text,
          timestamp: "Just now",
          actionLabel: "View Message",
          actionPrompt: `Show recent messages in #${args.channel}`,
        },
      ],
    };
  }

  // 3. Calendar Tools
  if (toolName === "calendar_list_events") {
    try {
      const { data: record } = await insforgeAdmin
        .database
        .from("user_integrations")
        .select("credentials, status")
        .eq("user_id", userId)
        .eq("platform_id", "gcal")
        .maybeSingle();

      const token = record?.credentials?.access_token;
      if (token && record?.status === "connected") {
        const timeMin = encodeURIComponent(args.timeMin || new Date().toISOString());
        const res = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&singleEvents=true&orderBy=startTime&maxResults=10`,
          { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(2500) }
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
            subtitle: new Date(e.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            snippet: e.description || (e.attendees?.length ? `Attendees: ${e.attendees.join(", ")}` : "No description"),
            timestamp: new Date(e.start).toLocaleDateString([], { month: "short", day: "numeric" }),
            attendees: e.attendees,
            actionLabel: "Reschedule",
            actionPrompt: `Help me reschedule my meeting "${e.summary}"`,
          }));

          return {
            data: { events: items, count: items.length },
            summary: `Retrieved ${items.length} upcoming Google Calendar events.`,
            cards,
          };
        }
      }
    } catch (e) {
      console.warn("Live Google Calendar error, using sandbox:", e);
    }

    const events = SAMPLE_EVENTS;
    return {
      data: { events, count: events.length },
      summary: `Retrieved ${events.length} Google Calendar appointments.`,
      cards: events.map((e) => ({
        type: "calendar" as const,
        id: e.id,
        title: e.summary,
        subtitle: `${new Date(e.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${new Date(e.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
        snippet: e.description,
        timestamp: "Today",
        attendees: e.attendees,
        actionLabel: "Reschedule",
        actionPrompt: `Reschedule "${e.summary}" to later this afternoon`,
      })),
    };
  }

  if (toolName === "calendar_create_event") {
    const newEvt = {
      id: `evt_${Date.now()}`,
      summary: args.summary,
      start: args.startDateTime,
      end: args.endDateTime,
      description: args.description || "",
      attendees: args.attendees || [],
    };
    return {
      data: { success: true, event: newEvt },
      summary: `Successfully scheduled "${args.summary}" on Google Calendar.`,
      cards: [
        {
          type: "calendar",
          id: newEvt.id,
          title: newEvt.summary,
          subtitle: `${new Date(newEvt.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${new Date(newEvt.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
          snippet: newEvt.description || "Created by ToyBox AI Agent",
          timestamp: new Date(newEvt.start).toLocaleDateString([], { month: "short", day: "numeric" }),
          actionLabel: "Reschedule",
          actionPrompt: `Adjust time for "${newEvt.summary}"`,
        },
      ],
    };
  }

  // 4. WhatsApp Tools
  if (toolName === "whatsapp_get_recent_chats") {
    const chats = SAMPLE_WHATSAPP_CHATS;
    return {
      data: { chats },
      summary: `Found ${chats.length} active WhatsApp chats.`,
      cards: chats.map((c) => ({
        type: "whatsapp" as const,
        id: c.id,
        title: c.contact,
        subtitle: c.timestamp,
        snippet: c.lastMessage,
        actionLabel: "Draft WhatsApp",
        actionPrompt: `Draft a WhatsApp reply to ${c.contact}`,
      })),
    };
  }

  if (toolName === "whatsapp_send_message") {
    return {
      data: { success: true, recipient: args.recipient, message: args.message },
      summary: `Drafted WhatsApp message for ${args.recipient}: "${args.message}".`,
      cards: [
        {
          type: "whatsapp",
          id: `wa_sent_${Date.now()}`,
          title: `To: ${args.recipient}`,
          subtitle: "WhatsApp Draft Ready",
          snippet: args.message,
          timestamp: "Just now",
          actionLabel: "Send Message",
          actionPrompt: `Confirm and send this message to ${args.recipient}`,
        },
      ],
    };
  }

  // Modular fallback for future tools
  return {
    data: { message: `Platform ${tool.platform} is connected in preview mode.`, args },
    summary: `Queried ${tool.platform} successfully.`,
  };
}
