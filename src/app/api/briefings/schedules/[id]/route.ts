import { NextRequest, NextResponse } from "next/server";
import { updateSchedule, deleteSchedule } from "@/lib/briefings/briefing-repository";
import { resolveUserId } from "@/lib/briefings/resolve-user";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/briefings/schedules/[id]: Update or toggle schedule active state
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userId = await resolveUserId(request);
    const body = await request.json();

    const updated = await updateSchedule(id, userId, body);

    if (!updated) {
      return NextResponse.json(
        { error: "Could not update schedule" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      schedule: updated,
    });
  } catch (error: any) {
    console.error("PATCH /api/briefings/schedules/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update schedule" },
      { status: 500 }
    );
  }
}

// DELETE /api/briefings/schedules/[id]: Delete schedule
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userId = await resolveUserId(request);

    const success = await deleteSchedule(id, userId);

    if (!success) {
      return NextResponse.json(
        { error: "Could not delete schedule" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Schedule deleted successfully",
    });
  } catch (error: any) {
    console.error("DELETE /api/briefings/schedules/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete schedule" },
      { status: 500 }
    );
  }
}
