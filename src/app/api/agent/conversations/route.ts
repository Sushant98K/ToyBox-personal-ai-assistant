import { NextRequest, NextResponse } from "next/server";
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

// GET /api/agent/conversations - Query only WHERE expires_at > NOW()
export async function GET(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    const nowIso = new Date().toISOString();

    const { data: conversations, error } = await insforgeAdmin
      .database
      .from("agent_conversations")
      .select("id, user_id, title, created_at, expires_at")
      .eq("user_id", userId)
      .gt("expires_at", nowIso)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Error fetching agent_conversations:", error);
      return NextResponse.json({ conversations: [] });
    }

    return NextResponse.json({ conversations: conversations || [] });
  } catch (err: any) {
    console.error("GET /api/agent/conversations error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/agent/conversations - Create fresh conversation & enforce 1-day retention cleanup
export async function POST(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    const body = await request.json().catch(() => ({}));
    const title = body.title || "New Conversation";
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    const nowIso = now.toISOString();

    // 1-Day Expiration Enforcement: Lightweight cleanup of stale conversations
    try {
      await insforgeAdmin
        .database
        .from("agent_conversations")
        .delete()
        .lte("expires_at", nowIso);
    } catch (cleanupErr) {
      console.warn("Notice: lightweight expiration cleanup failed non-critically:", cleanupErr);
    }

    // Insert new conversation
    const { data: created, error } = await insforgeAdmin
      .database
      .from("agent_conversations")
      .insert([
        {
          user_id: userId,
          title,
          created_at: nowIso,
          expires_at: expiresAt,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating agent_conversation:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ conversation: created });
  } catch (err: any) {
    console.error("POST /api/agent/conversations error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
