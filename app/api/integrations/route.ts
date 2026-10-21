import { NextRequest, NextResponse } from "next/server";
import { insforgeAdmin } from "@/lib/insforge-admin";
import { platformsCatalog } from "@/config/integrations";

// Helper to determine the target user ID for integrations persistence
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

  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.replace("Bearer ", "").trim();
      const { data: users } = await insforgeAdmin
        .database
        .from("users")
        .select("id")
        .limit(1);
      if (users && users.length > 0) {
        return users[0].id;
      }
    } catch (e) {
      console.warn("Could not parse token user:", e);
    }
  }

  // Fallback to the first existing user in public.users
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

// GET /api/integrations
// Returns list of all platforms with user's connection status merged from InsForge DB
export async function GET(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);

    // Fetch user's saved integrations from InsForge PostgreSQL
    const { data: userIntegrations, error } = await insforgeAdmin
      .database
      .from("user_integrations")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.warn("Warning querying user_integrations from InsForge:", error);
    }

    const savedMap = new Map<string, any>();
    if (userIntegrations && Array.isArray(userIntegrations)) {
      userIntegrations.forEach((item) => {
        savedMap.set(item.platform_id, item);
      });
    }

    // Merge catalog with database state
    const result = platformsCatalog.map((platform) => {
      const saved = savedMap.get(platform.id);
      return {
        id: platform.id,
        name: platform.name,
        category: platform.category,
        description: platform.description,
        protocol: platform.protocol,
        socialIcon: platform.socialIcon,
        status: saved ? saved.status : "disconnected",
        lastSync: saved?.last_synced_at
          ? formatTimeAgo(new Date(saved.last_synced_at))
          : "Never",
        syncFrequency: saved?.sync_frequency || platform.defaultSyncFrequency,
        messagesProcessed: saved?.messages_processed || (saved?.status === "connected" ? platform.defaultThroughput : "0 items"),
        accountEmail: saved?.metadata?.account_email || null,
        hasCustomCredentials: !!(saved?.credentials && Object.keys(saved.credentials).length > 0),
        mcpToolsCount: platform.mcpTools.length,
      };
    });

    return NextResponse.json({
      success: true,
      userId,
      integrations: result,
    });
  } catch (error: any) {
    console.error("GET /api/integrations error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch integrations" },
      { status: 500 }
    );
  }
}

// POST /api/integrations
// Connects or disconnects a platform and persists in InsForge
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platformId, status, credentials, metadata, syncFrequency, messagesProcessed } = body;

    if (!platformId) {
      return NextResponse.json(
        { error: "platformId is required" },
        { status: 400 }
      );
    }

    const userId = await resolveUserId(request);
    const platform = platformsCatalog.find((p) => p.id === platformId);
    const platformName = platform?.name || platformId;

    const newStatus = status === "connected" ? "connected" : "disconnected";
    const now = new Date().toISOString();

    const payload = {
      user_id: userId,
      platform_id: platformId,
      platform_name: platformName,
      status: newStatus,
      auth_type: platformId === "gmail" ? "mcp_oauth" : "api_key",
      credentials: credentials || {},
      metadata: metadata || (platformId === "gmail" ? { account_email: "sushant98k@gmail.com" } : {}),
      last_synced_at: newStatus === "connected" ? now : null,
      sync_frequency: syncFrequency || platform?.defaultSyncFrequency || "Real-time Webhook",
      messages_processed: messagesProcessed || (newStatus === "connected" ? platform?.defaultThroughput || "Active sync" : "0 items"),
      updated_at: now,
    };

    // Upsert into public.user_integrations in InsForge
    const { data, error } = await insforgeAdmin
      .database
      .from("user_integrations")
      .upsert([payload], { onConflict: "user_id,platform_id" })
      .select()
      .single();

    if (error) {
      console.error("InsForge DB error updating user_integrations:", error);
      return NextResponse.json(
        { error: "Failed to persist integration status in InsForge", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      integration: data,
    });
  } catch (error: any) {
    console.error("POST /api/integrations error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update integration" },
      { status: 500 }
    );
  }
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}
