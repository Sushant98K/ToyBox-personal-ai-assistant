import { NextRequest, NextResponse } from "next/server";
import { getBriefingById, deleteBriefing } from "@/lib/briefings/briefing-repository";
import { resolveUserId } from "@/lib/briefings/resolve-user";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/briefings/[id]: Fetch specific briefing by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userId = await resolveUserId(request);

    const briefing = await getBriefingById(id, userId);

    if (!briefing) {
      return NextResponse.json(
        { error: "Briefing not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      briefing,
    });
  } catch (error: any) {
    console.error("GET /api/briefings/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch briefing" },
      { status: 500 }
    );
  }
}

// DELETE /api/briefings/[id]: Delete specific briefing by ID
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userId = await resolveUserId(request);

    const success = await deleteBriefing(id, userId);

    if (!success) {
      return NextResponse.json(
        { error: "Could not delete briefing" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Briefing deleted successfully",
    });
  } catch (error: any) {
    console.error("DELETE /api/briefings/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete briefing" },
      { status: 500 }
    );
  }
}
