import { NextRequest, NextResponse } from "next/server";
import { getBriefings } from "@/lib/briefings/briefing-repository";
import { resolveUserId } from "@/lib/briefings/resolve-user";

// GET /api/briefings: Returns list of historical and recent briefings
export async function GET(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const briefings = await getBriefings(userId, limit);

    return NextResponse.json({
      success: true,
      userId,
      briefings,
    });
  } catch (error: any) {
    console.error("GET /api/briefings error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch briefings" },
      { status: 500 }
    );
  }
}
