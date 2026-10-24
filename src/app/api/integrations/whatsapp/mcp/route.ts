import { NextRequest, NextResponse } from "next/server";
import { getPlatformById } from "@/config/integrations";
import { executeWhatsAppMcpTool, disconnectWhatsApp } from "@/lib/whatsapp-baileys";
import { insforgeAdmin } from "@/lib/insforge-admin";

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

  return "00000000-0000-0000-0000-000000000000";
}

// GET /api/integrations/whatsapp/mcp
export async function GET(request: NextRequest) {
  const whatsappPlatform = getPlatformById("whatsapp");
  const tools = whatsappPlatform?.mcpTools || [];

  return NextResponse.json({
    mcpVersion: "1.0.0",
    serverName: "toybox-whatsapp-baileys-mcp-server",
    protocol: "mcp/1.0",
    description:
      "Model Context Protocol (MCP) server for WhatsApp integration using Baileys multi-device protocol. Exposes messages, chat history, groups, and contact intelligence.",
    tools: tools.map((tool) => ({
      name: tool.name,
      title: tool.title,
      description: tool.description,
      category: tool.category,
      inputSchema: {
        type: "object",
        properties: tool.parameters.reduce((acc, param) => {
          acc[param.name] = {
            type: param.type.replace("[]", ""),
            description: param.description,
            ...(param.default !== undefined ? { default: param.default } : {}),
          };
          return acc;
        }, {} as Record<string, any>),
        required: tool.parameters.filter((p) => p.required).map((p) => p.name),
      },
    })),
  });
}

// POST /api/integrations/whatsapp/mcp
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, tool_name, arguments: toolArgs } = body;
    const userId = await resolveUserId(request);

    // 1. List tools
    if (action === "list_tools") {
      const whatsappPlatform = getPlatformById("whatsapp");
      return NextResponse.json({
        success: true,
        tools: whatsappPlatform?.mcpTools || [],
      });
    }

    // 2. Call MCP tool
    if (action === "call_tool") {
      if (!tool_name) {
        return NextResponse.json(
          { error: "tool_name is required for call_tool" },
          { status: 400 }
        );
      }

      const result = await executeWhatsAppMcpTool(tool_name, toolArgs || {}, userId);
      return NextResponse.json({
        success: true,
        tool: tool_name,
        result,
      });
    }

    // 3. Disconnect
    if (action === "disconnect") {
      const result = await disconnectWhatsApp(userId);
      return NextResponse.json({
        success: true,
        message: "WhatsApp disconnected",
        result,
      });
    }

    // 4. Sync messages
    if (action === "sync_messages" || action === "sync") {
      const now = new Date().toISOString();
      await insforgeAdmin
        .database
        .from("user_integrations")
        .update({
          last_synced_at: now,
          messages_processed: "Active",
          updated_at: now,
        })
        .eq("user_id", userId)
        .eq("platform_id", "whatsapp");

      return NextResponse.json({
        success: true,
        syncedAt: now,
        messagesProcessed: "Active",
      });
    }

    return NextResponse.json(
      { error: `Unknown action '${action}'` },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("WhatsApp MCP Route Error:", error);
    return NextResponse.json(
      { error: error.message || "MCP server internal error" },
      { status: 500 }
    );
  }
}
