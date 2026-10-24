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

export async function POST(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    const body = await request.json();
    const { tool_name, arguments: args = {} } = body;

    // Fetch token from DB
    const { data: record } = await insforgeAdmin
      .database
      .from("user_integrations")
      .select("credentials, metadata")
      .eq("user_id", userId)
      .eq("platform_id", "slack")
      .maybeSingle();

    const botToken =
      record?.credentials?.bot_access_token ||
      record?.credentials?.access_token ||
      process.env.SLACK_BOT_TOKEN;

    const hasLiveToken = !!(botToken && botToken.startsWith("xoxb-"));

    switch (tool_name) {
      case "slack_list_channels": {
        if (hasLiveToken) {
          try {
            const types = args.types || "public_channel,private_channel";
            const limit = args.limit || 100;
            const res = await fetch(
              `https://slack.com/api/conversations.list?types=${encodeURIComponent(
                types
              )}&exclude_archived=true&limit=${limit}`,
              {
                headers: { Authorization: `Bearer ${botToken}` },
              }
            );
            const data = await res.json();
            if (data.ok) {
              return NextResponse.json({
                success: true,
                live: true,
                result: {
                  channels: data.channels.map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    is_private: c.is_private,
                    num_members: c.num_members,
                    topic: c.topic?.value,
                  })),
                  total_channels: data.channels.length,
                },
              });
            }
          } catch (e) {
            console.warn("Live slack_list_channels error, falling back to mock:", e);
          }
        }

        return NextResponse.json({
          success: true,
          live: false,
          result: {
            channels: [
              { id: "C01A2B3C4D", name: "executive-briefs", is_private: false, num_members: 14, topic: "Daily AI summaries & decisions" },
              { id: "C05E6F7G8H", name: "general", is_private: false, num_members: 48, topic: "Company announcements and team updates" },
              { id: "C09I0J1K2L", name: "engineering", is_private: true, num_members: 22, topic: "Platform monitoring & deploys" },
              { id: "C03M4N5O6P", name: "leadership", is_private: true, num_members: 8, topic: "Executive strategy" },
            ],
            total_channels: 4,
          },
        });
      }

      case "slack_get_channel_history": {
        const channel = args.channel || "C01A2B3C4D";
        const limit = args.limit || 20;

        if (hasLiveToken) {
          try {
            const res = await fetch(
              `https://slack.com/api/conversations.history?channel=${encodeURIComponent(
                channel
              )}&limit=${limit}`,
              {
                headers: { Authorization: `Bearer ${botToken}` },
              }
            );
            const data = await res.json();
            if (data.ok) {
              return NextResponse.json({
                success: true,
                live: true,
                result: {
                  channel,
                  messages: data.messages,
                  has_more: data.has_more,
                },
              });
            }
          } catch (e) {
            console.warn("Live slack_get_channel_history error:", e);
          }
        }

        return NextResponse.json({
          success: true,
          live: false,
          result: {
            channel,
            messages: [
              {
                ts: "1729752000.001",
                user: "U0123456",
                text: "Q3 executive revenue projections and enterprise contract updates have been compiled.",
                reply_count: 2,
              },
              {
                ts: "1729752300.002",
                user: "U0987654",
                text: "ToyBox AI autonomous agent summary approved. Ready to schedule cross-functional sync.",
              },
            ],
            messages_count: 2,
          },
        });
      }

      case "slack_post_message": {
        const channel = args.channel || "C01A2B3C4D";
        const text = args.text || "ToyBox AI Executive Assistant notification";

        if (hasLiveToken) {
          try {
            const res = await fetch("https://slack.com/api/chat.postMessage", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${botToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ channel, text }),
            });
            const data = await res.json();
            if (data.ok) {
              return NextResponse.json({
                success: true,
                live: true,
                result: data,
              });
            }
          } catch (e) {
            console.warn("Live slack_post_message error:", e);
          }
        }

        return NextResponse.json({
          success: true,
          live: false,
          result: {
            ok: true,
            channel,
            ts: `${Date.now() / 1000}`,
            message: {
              text,
              bot_id: record?.metadata?.bot_user_id || "B09K82L41",
              type: "message",
              subtype: "bot_message",
            },
          },
        });
      }

      case "slack_reply_thread": {
        const channel = args.channel || "C01A2B3C4D";
        const thread_ts = args.thread_ts || "1729752000.001";
        const text = args.text || "Synthesized consensus: all action items assigned.";

        if (hasLiveToken) {
          try {
            const res = await fetch("https://slack.com/api/chat.postMessage", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${botToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ channel, thread_ts, text }),
            });
            const data = await res.json();
            if (data.ok) {
              return NextResponse.json({
                success: true,
                live: true,
                result: data,
              });
            }
          } catch (e) {
            console.warn("Live slack_reply_thread error:", e);
          }
        }

        return NextResponse.json({
          success: true,
          live: false,
          result: {
            ok: true,
            channel,
            thread_ts,
            ts: `${Date.now() / 1000}`,
            reply: {
              text,
              bot_id: record?.metadata?.bot_user_id || "B09K82L41",
            },
          },
        });
      }

      case "slack_list_users": {
        const limit = args.limit || 50;

        if (hasLiveToken) {
          try {
            const res = await fetch(
              `https://slack.com/api/users.list?limit=${limit}`,
              {
                headers: { Authorization: `Bearer ${botToken}` },
              }
            );
            const data = await res.json();
            if (data.ok) {
              return NextResponse.json({
                success: true,
                live: true,
                result: {
                  members: data.members.map((m: any) => ({
                    id: m.id,
                    name: m.name,
                    real_name: m.real_name,
                    is_bot: m.is_bot,
                    is_admin: m.is_admin,
                  })),
                  total_members: data.members.length,
                },
              });
            }
          } catch (e) {
            console.warn("Live slack_list_users error:", e);
          }
        }

        return NextResponse.json({
          success: true,
          live: false,
          result: {
            members: [
              { id: "U0123456", name: "sushantk", real_name: "Sushant Kate", is_admin: true, is_bot: false },
              { id: "B09K82L41", name: "toybox_bot", real_name: "ToyBox AI Agent", is_admin: false, is_bot: true },
              { id: "U0654321", name: "sarahc", real_name: "Sarah Chen", is_admin: false, is_bot: false },
            ],
            total_members: 3,
          },
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown MCP tool '${tool_name}'` },
          { status: 400 }
        );
    }
  } catch (err: any) {
    console.error("Slack MCP handler error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to execute MCP tool" },
      { status: 500 }
    );
  }
}
