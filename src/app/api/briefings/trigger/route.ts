import { NextRequest, NextResponse } from "next/server";
import { resolveUserId } from "@/lib/briefings/resolve-user";
import { executeGenerateBriefingCore, generateBriefingTask } from "@/trigger/briefings";

// POST /api/briefings/trigger: Triggers on-demand briefing generation using active MCP apps
export async function POST(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Body may be empty for manual on-demand triggers
    }

    const { scheduleId, platforms, priorityThreshold, promptGoal, calendarHorizonDays } = body;

    // Trigger Trigger.dev worker task in the background if possible
    try {
      if (process.env.TRIGGER_SECRET_KEY) {
        await generateBriefingTask.trigger({
          scheduleId,
          userId,
          isManual: true,
          customFilters: {
            platforms,
            priorityThreshold,
            promptGoal,
            calendarHorizonDays,
          },
        });
      }
    } catch (trigErr) {
      console.warn("Trigger.dev async trigger skipped (executing in-process):", trigErr);
    }

    // Direct in-process execution to guarantee immediate response to user UI
    const briefing = await executeGenerateBriefingCore({
      scheduleId,
      userId,
      isManual: true,
      customFilters: {
        platforms,
        priorityThreshold,
        promptGoal,
        calendarHorizonDays,
      },
    });

    return NextResponse.json({
      success: true,
      briefing,
    });
  } catch (error: any) {
    console.error("POST /api/briefings/trigger error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate briefing" },
      { status: 500 }
    );
  }
}
