import { NextRequest, NextResponse } from "next/server";
import { getSchedules, createSchedule, advanceScheduleNextRun } from "@/lib/briefings/briefing-repository";
import { resolveUserId } from "@/lib/briefings/resolve-user";
import { executeGenerateBriefingCore } from "@/trigger/briefings";

// GET /api/briefings/schedules: Fetch schedules for current user
export async function GET(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    const schedules = await getSchedules(userId);

    // Self-healing catchup: Evaluate any active schedules that became due
    const now = new Date();
    for (const s of schedules) {
      if (s.is_active && s.next_run_at && new Date(s.next_run_at) <= now) {
        // Trigger background execution without delaying HTTP response
        (async () => {
          try {
            await executeGenerateBriefingCore({
              scheduleId: s.id,
              userId: s.user_id,
              isManual: false,
            });
            await advanceScheduleNextRun(s.id, s.scheduled_time);
          } catch (err) {
            console.error(`[ScheduleCatchup] Error running overdue schedule ${s.id}:`, err);
          }
        })();
      }
    }

    return NextResponse.json({
      success: true,
      schedules,
    });
  } catch (error: any) {
    console.error("GET /api/briefings/schedules error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch schedules" },
      { status: 500 }
    );
  }
}

// POST /api/briefings/schedules: Create a new custom briefing schedule
export async function POST(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    const body = await request.json();

    const {
      name,
      prompt_goal,
      platforms,
      categories,
      scheduled_time,
      priority_threshold,
      is_active,
    } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Briefing name is required" },
        { status: 400 }
      );
    }

    const schedule = await createSchedule({
      user_id: userId,
      name: name.trim(),
      prompt_goal: prompt_goal || "Executive Briefing",
      platforms: Array.isArray(platforms) ? platforms : ["gmail", "slack", "calendar", "whatsapp"],
      categories: Array.isArray(categories) ? categories : ["emails", "messages", "mentions", "meetings", "followups"],
      scheduled_time: scheduled_time || "08:30",
      priority_threshold: priority_threshold === "high_only" ? "high_only" : "all",
      is_active: is_active !== undefined ? Boolean(is_active) : true,
    });

    if (!schedule) {
      return NextResponse.json(
        { error: "Failed to create schedule" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      schedule,
    });
  } catch (error: any) {
    console.error("POST /api/briefings/schedules error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create schedule" },
      { status: 500 }
    );
  }
}
