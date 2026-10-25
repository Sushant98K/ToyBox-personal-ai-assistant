import { task, schedules } from "@trigger.dev/sdk";
import { fetchConnectedData } from "@/lib/briefings/fetch-connected-data";
import { synthesizeBriefingPayload } from "@/lib/ai/briefing-generator";
import { deduplicateBriefingItems, detectCalendarHorizon } from "@/lib/briefings/deduplicate";
import {
  createBriefing,
  getDueSchedules,
  advanceScheduleNextRun,
} from "@/lib/briefings/briefing-repository";
import { insforgeAdmin } from "@/lib/insforge-admin";
import { GeneratedBriefing } from "@/types/briefing";

export interface GenerateBriefingPayload {
  scheduleId?: string;
  userId: string;
  isManual?: boolean;
  customFilters?: {
    platforms?: string[];
    priorityThreshold?: "all" | "high_only";
    promptGoal?: string;
    calendarHorizonDays?: number;
  };
}

/**
 * Core engine logic to resolve MCP data, synthesize with Gemini 3.5 Flash-Lite,
 * and persist briefing records + sync dashboard cache.
 */
export async function executeGenerateBriefingCore(
  payload: GenerateBriefingPayload
): Promise<GeneratedBriefing> {
  const { scheduleId, userId, isManual = true, customFilters } = payload;

  console.log(`[BriefingEngine] Starting briefing generation for user: ${userId} (Manual: ${isManual})`);

  // 1. Fetch Schedule metadata if triggered by schedule
  let promptGoal = customFilters?.promptGoal;
  let requestedPlatforms = customFilters?.platforms;
  let priorityThreshold = customFilters?.priorityThreshold || "all";
  let customHorizon = customFilters?.calendarHorizonDays;

  if (scheduleId) {
    try {
      const { data: schedule } = await insforgeAdmin
        .database
        .from("briefing_schedules")
        .select("*")
        .eq("id", scheduleId)
        .maybeSingle();

      if (schedule) {
        promptGoal = promptGoal || schedule.prompt_goal || schedule.name;
        if (!requestedPlatforms && Array.isArray(schedule.platforms) && schedule.platforms.length > 0) {
          requestedPlatforms = schedule.platforms;
        }
        if (!customFilters?.priorityThreshold && schedule.priority_threshold) {
          priorityThreshold = schedule.priority_threshold;
        }
      }
    } catch (schedErr) {
      console.warn("[BriefingEngine] Warning fetching schedule details:", schedErr);
    }
  }

  // Detect calendar horizon: default 7 days for general briefings, or dynamic up to 365 days if explicitly asked
  const horizonDays = customHorizon ?? detectCalendarHorizon(promptGoal, 7);

  // 2. Fetch live connected MCP data from active platforms
  const { items: rawItems, activePlatforms } = await fetchConnectedData(userId, {
    requestedPlatforms,
    calendarHorizonDays: horizonDays,
    promptGoal,
  });

  const normalizedItems = deduplicateBriefingItems(rawItems, {
    calendarHorizonDays: horizonDays,
    contextText: promptGoal,
  });

  console.log(
    `[BriefingEngine] Fetched ${rawItems.length} items (${normalizedItems.length} deduplicated, horizon: ${horizonDays}d) from platforms: ${activePlatforms.join(", ")}`
  );

  // 3. Synthesize via Gemini 3.5 Flash-Lite
  const synthesized = await synthesizeBriefingPayload(normalizedItems, {
    promptGoal: promptGoal || "Executive Daily Intelligence Briefing",
    priorityThreshold,
  });

  // 4. Insert record into generated_briefings in InsForge Postgres
  const createdBriefing = await createBriefing({
    user_id: userId,
    schedule_id: scheduleId || null,
    title: synthesized.title,
    date: new Date().toISOString().split("T")[0],
    executive_summary: synthesized.executive_summary,
    highlights: synthesized.highlights,
    category_counts: synthesized.category_counts,
    categorized_items: synthesized.categorized_items,
    platforms_used: activePlatforms.length > 0 ? activePlatforms : synthesized.platforms_used,
  });

  if (!createdBriefing) {
    throw new Error("Failed to persist generated briefing record in database.");
  }

  // Update last_run_at on schedule if triggered from a schedule
  if (scheduleId) {
    try {
      await insforgeAdmin
        .database
        .from("briefing_schedules")
        .update({
          last_run_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", scheduleId);
    } catch (schedUpdErr) {
      console.warn("[BriefingEngine] Warning updating schedule last_run_at:", schedUpdErr);
    }
  }

  // 5. Synchronize user_dashboard_cache
  try {
    const dashboardPriorityItems = synthesized.categorized_items.map((item, idx) => ({
      id: item.id || `pri_${idx + 1}`,
      platform: ["gmail", "slack", "whatsapp", "calendar"].includes(item.platform)
        ? (item.platform as "gmail" | "slack" | "whatsapp" | "calendar")
        : "calendar",
      title: item.title,
      context: item.bodySnippet,
      time: item.timestamp,
      priority: item.urgency === "urgent" ? "urgent" : item.urgency === "high" ? "high" : "medium",
    }));

    await insforgeAdmin
      .database
      .from("user_dashboard_cache")
      .upsert(
        [
          {
            user_id: userId,
            brief_data: {
              important_count: synthesized.category_counts.emails + (synthesized.highlights.filter((h) => h.urgency === "urgent").length),
              priority_count: dashboardPriorityItems.length,
              followup_count: synthesized.category_counts.followups,
              brief_bullets: synthesized.highlights.map((h) => h.text),
              priority_items: dashboardPriorityItems,
            },
            updated_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          },
        ],
        { onConflict: "user_id" }
      );
  } catch (cacheErr) {
    console.warn("[BriefingEngine] Warning updating user_dashboard_cache:", cacheErr);
  }

  console.log(`[BriefingEngine] Successfully completed briefing: ${createdBriefing.id}`);
  return createdBriefing;
}

/**
 * Trigger.dev Execution Worker Task
 */
export const generateBriefingTask = task({
  id: "generate-briefing-task",
  run: async (payload: GenerateBriefingPayload) => {
    return await executeGenerateBriefingCore(payload);
  },
});

/**
 * Trigger.dev 15-Minute Lightweight Scheduler Task
 * Evaluates active schedules, triggers worker tasks, and advances next_run_at
 */
export const briefingScheduleChecker = schedules.task({
  id: "briefing-schedule-checker",
  cron: "*/15 * * * *",
  run: async () => {
    console.log("[ScheduleChecker] Running 15-minute schedule check...");
    const dueSchedules = await getDueSchedules();

    console.log(`[ScheduleChecker] Found ${dueSchedules.length} due briefing schedules.`);

    const results = [];
    for (const schedule of dueSchedules) {
      try {
        console.log(`[ScheduleChecker] Triggering briefing for schedule ${schedule.id} (User: ${schedule.user_id})`);

        // Trigger worker task
        await generateBriefingTask.trigger({
          scheduleId: schedule.id,
          userId: schedule.user_id,
          isManual: false,
        });

        // Advance next_run_at to avoid duplicate triggers
        await advanceScheduleNextRun(schedule.id, schedule.scheduled_time);

        results.push({ scheduleId: schedule.id, status: "triggered" });
      } catch (err: any) {
        console.error(`[ScheduleChecker] Error processing schedule ${schedule.id}:`, err);
        results.push({ scheduleId: schedule.id, status: "error", error: err.message });
      }
    }

    return {
      checkedAt: new Date().toISOString(),
      schedulesChecked: dueSchedules.length,
      results,
    };
  },
});
