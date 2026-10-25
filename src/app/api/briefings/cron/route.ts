import { NextRequest, NextResponse } from "next/server";
import { getDueSchedules, advanceScheduleNextRun } from "@/lib/briefings/briefing-repository";
import { executeGenerateBriefingCore } from "@/trigger/briefings";

// GET /api/briefings/cron: 15-Minute Lightweight Checker Runner
export async function GET(request: NextRequest) {
  try {
    const dueSchedules = await getDueSchedules();
    const results = [];

    for (const schedule of dueSchedules) {
      try {
        const briefing = await executeGenerateBriefingCore({
          scheduleId: schedule.id,
          userId: schedule.user_id,
          isManual: false,
          customFilters: {
            platforms: schedule.platforms,
            priorityThreshold: schedule.priority_threshold,
            promptGoal: schedule.prompt_goal,
          },
        });

        await advanceScheduleNextRun(schedule.id, schedule.scheduled_time);

        results.push({
          scheduleId: schedule.id,
          name: schedule.name,
          briefingId: briefing.id,
          status: "success",
        });
      } catch (err: any) {
        console.error(`Error generating scheduled briefing ${schedule.id}:`, err);
        results.push({
          scheduleId: schedule.id,
          name: schedule.name,
          status: "error",
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      dueCount: dueSchedules.length,
      executed: results,
    });
  } catch (error: any) {
    console.error("GET /api/briefings/cron error:", error);
    return NextResponse.json(
      { error: error.message || "Cron checker failed" },
      { status: 500 }
    );
  }
}
