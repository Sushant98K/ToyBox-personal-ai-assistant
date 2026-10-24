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
    const now = new Date().toISOString();

    // Clear stored Slack tokens and reset status to disconnected in InsForge DB
    const { data, error } = await insforgeAdmin
      .database
      .from("user_integrations")
      .upsert(
        [
          {
            user_id: userId,
            platform_id: "slack",
            platform_name: "Slack Enterprise",
            status: "disconnected",
            auth_type: "oauth2",
            credentials: {},
            metadata: {},
            settings: {},
            last_synced_at: null,
            sync_frequency: "Real-time Event API",
            messages_processed: "0 items",
            updated_at: now,
          },
        ],
        { onConflict: "user_id,platform_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("InsForge DB error disconnecting Slack:", error);
      return NextResponse.json(
        { error: "Failed to disconnect Slack from database", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Slack tokens cleared and integration disconnected.",
      integration: data,
    });
  } catch (err: any) {
    console.error("POST /api/integrations/slack/disconnect error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to disconnect Slack" },
      { status: 500 }
    );
  }
}
