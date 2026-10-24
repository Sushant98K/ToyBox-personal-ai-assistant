import { NextRequest, NextResponse } from "next/server";
import { insforgeAdmin } from "@/lib/insforge-admin";

async function resolveUserId(request: NextRequest): Promise<string> {
  const customUserId = request.headers.get("x-user-id");
  if (customUserId && customUserId !== "undefined" && customUserId.length > 5) {
    return customUserId;
  }
  const { data: users } = await insforgeAdmin
    .database
    .from("users")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1);
  return users?.[0]?.id || "a727d188-4197-409c-855d-2aa5201cebc7";
}

// GET /api/integrations/slack/channels
// Fetches live channels via conversations.list using stored bot_access_token
export async function GET(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);

    // Retrieve stored Slack credentials from InsForge database
    const { data: record, error } = await insforgeAdmin
      .database
      .from("user_integrations")
      .select("*")
      .eq("user_id", userId)
      .eq("platform_id", "slack")
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.warn("DB query warning for Slack integration:", error);
    }

    const token =
      record?.credentials?.bot_access_token ||
      record?.credentials?.access_token ||
      process.env.SLACK_BOT_TOKEN;

    const workspaceName =
      record?.metadata?.workspace_name ||
      record?.metadata?.team_name ||
      record?.credentials?.team_name ||
      "Enterprise Workspace";

    const botId =
      record?.metadata?.bot_user_id ||
      record?.credentials?.bot_user_id ||
      record?.credentials?.authed_user_id ||
      "B09K82L41";

    const selectedChannel =
      record?.settings?.selected_channel || record?.metadata?.selected_channel || "C01A2B3C4D";

    // If we have an active bot token, fetch channels from Slack API conversations.list
    if (token && token.startsWith("xoxb-")) {
      try {
        const slackRes = await fetch(
          "https://slack.com/api/conversations.list?types=public_channel,private_channel&exclude_archived=true&limit=100",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (slackRes.ok) {
          const slackData = await slackRes.json();
          if (slackData.ok && Array.isArray(slackData.channels) && slackData.channels.length > 0) {
            const channels = slackData.channels.map((ch: any) => ({
              id: ch.id,
              name: ch.name,
              is_private: !!ch.is_private,
              is_general: !!ch.is_general,
              num_members: ch.num_members || 0,
              topic: ch.topic?.value || "",
              purpose: ch.purpose?.value || "",
            }));

            return NextResponse.json({
              success: true,
              live: true,
              workspaceName,
              botId,
              selectedChannel,
              channels,
            });
          }
        }
      } catch (slackApiErr) {
        console.warn("Error calling Slack conversations.list API:", slackApiErr);
      }
    }

    // Fallback channels if token is not yet provisioned or rate-limited
    const fallbackChannels = [
      {
        id: "C01A2B3C4D",
        name: "executive-briefs",
        is_private: false,
        is_general: false,
        num_members: 14,
        topic: "Daily AI summaries & high-priority briefings",
        purpose: "Channel for automated agent reports",
      },
      {
        id: "C05E6F7G8H",
        name: "general",
        is_private: false,
        is_general: true,
        num_members: 48,
        topic: "Company announcements and team updates",
        purpose: "General team discussion",
      },
      {
        id: "C09I0J1K2L",
        name: "engineering",
        is_private: true,
        is_general: false,
        num_members: 22,
        topic: "Sprint reviews, architecture & deployments",
        purpose: "Engineering team updates",
      },
      {
        id: "C03M4N5O6P",
        name: "leadership",
        is_private: true,
        is_general: false,
        num_members: 8,
        topic: "Executive roadmap & strategy alignment",
        purpose: "Leadership discussions",
      },
      {
        id: "C07Q8R9S0T",
        name: "customer-success",
        is_private: false,
        is_general: false,
        num_members: 19,
        topic: "VIP account notifications & escalations",
        purpose: "Client alerts",
      },
    ];

    return NextResponse.json({
      success: true,
      live: false,
      workspaceName,
      botId,
      selectedChannel,
      channels: fallbackChannels,
    });
  } catch (err: any) {
    console.error("GET /api/integrations/slack/channels error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch Slack channels" },
      { status: 500 }
    );
  }
}

// POST /api/integrations/slack/channels
// Saves the user's preferred Slack channel in integration settings
export async function POST(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    const body = await request.json();
    const { channelId, channelName } = body;

    if (!channelId) {
      return NextResponse.json({ error: "channelId is required" }, { status: 400 });
    }

    const { data: existing } = await insforgeAdmin
      .database
      .from("user_integrations")
      .select("*")
      .eq("user_id", userId)
      .eq("platform_id", "slack")
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "Slack integration record not found" }, { status: 404 });
    }

    const updatedSettings = {
      ...(existing.settings || {}),
      selected_channel: channelId,
      selected_channel_name: channelName,
    };

    const updatedMetadata = {
      ...(existing.metadata || {}),
      selected_channel: channelId,
      selected_channel_name: channelName,
    };

    const { data, error } = await insforgeAdmin
      .database
      .from("user_integrations")
      .update({
        settings: updatedSettings,
        metadata: updatedMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("platform_id", "slack")
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to save selected channel", details: error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      selectedChannel: channelId,
      integration: data,
    });
  } catch (err: any) {
    console.error("POST /api/integrations/slack/channels error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
