import { NextRequest, NextResponse } from "next/server";
import { insforgeAdmin } from "@/lib/insforge-admin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/agent/conversations/[id] - Fetch messages for conversation
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const nowIso = new Date().toISOString();

    // Verify conversation exists and has not expired
    const { data: conversation, error: convError } = await insforgeAdmin
      .database
      .from("agent_conversations")
      .select("id, title, created_at, expires_at")
      .eq("id", id)
      .gt("expires_at", nowIso)
      .maybeSingle();

    if (convError || !conversation) {
      return NextResponse.json({ error: "Conversation not found or expired" }, { status: 404 });
    }

    // Fetch messages in chronological order
    const { data: messages, error: msgError } = await insforgeAdmin
      .database
      .from("agent_messages")
      .select("id, conversation_id, role, content, metadata, created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });

    if (msgError) {
      return NextResponse.json({ error: msgError.message }, { status: 500 });
    }

    return NextResponse.json({
      conversation,
      messages: messages || [],
    });
  } catch (err: any) {
    console.error("GET /api/agent/conversations/[id] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/agent/conversations/[id] - Delete specific conversation
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const { error } = await insforgeAdmin
      .database
      .from("agent_conversations")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/agent/conversations/[id] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
