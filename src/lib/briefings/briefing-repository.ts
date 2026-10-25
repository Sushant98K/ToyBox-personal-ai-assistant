import { insforgeAdmin } from "@/lib/insforge-admin";
import { GeneratedBriefing, BriefingSchedule } from "@/types/briefing";
import { deduplicateBriefingItems, detectCalendarHorizon } from "@/lib/briefings/deduplicate";
import { nextScheduledRun, ScheduleValue } from "@/components/ui/schedule-picker";

/**
 * Sanitizes briefing by deduplicating items and updating counts
 */
function sanitizeBriefing(briefing: GeneratedBriefing): GeneratedBriefing {
  if (!briefing || !Array.isArray(briefing.categorized_items)) return briefing;
  const horizonDays = detectCalendarHorizon(`${briefing.title} ${briefing.executive_summary}`, 7);
  const deduped = deduplicateBriefingItems(briefing.categorized_items, {
    referenceDate: briefing.created_at || briefing.date,
    calendarHorizonDays: horizonDays,
    contextText: `${briefing.title} ${briefing.executive_summary}`,
  });
  return {
    ...briefing,
    categorized_items: deduped,
    category_counts: {
      emails: deduped.filter((i) => i.type === "email").length,
      messages: deduped.filter((i) => i.type === "message").length,
      mentions: deduped.filter((i) => i.type === "mention").length,
      tasks: deduped.filter((i) => i.type === "task").length,
      followups: deduped.filter((i) => i.type === "followup" || i.type === "task").length,
    },
  };
}

/**
 * Calculates next run date based on scheduled time string (e.g. "08:30" or ScheduleValue JSON)
 */
export function calculateNextRunAt(scheduledTime: string = "08:30"): string | null {
  if (typeof scheduledTime === "string" && scheduledTime.trim().startsWith("{")) {
    try {
      const parsed: ScheduleValue = JSON.parse(scheduledTime);
      const nextDate = nextScheduledRun(parsed);
      if (nextDate) {
        return nextDate.toISOString();
      }
      return null;
    } catch (e) {
      console.warn("Error parsing scheduledTime JSON:", e);
    }
  }

  const [hoursStr, minutesStr] = (scheduledTime || "08:30").split(":");
  const hours = parseInt(hoursStr || "8", 10);
  const minutes = parseInt(minutesStr || "30", 10);

  const now = new Date();
  const next = new Date();
  next.setHours(hours, minutes, 0, 0);

  // If time has already passed today, advance to tomorrow
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  return next.toISOString();
}

/**
 * Get list of generated briefings for user
 */
export async function getBriefings(
  userId: string,
  limit: number = 20
): Promise<GeneratedBriefing[]> {
  const { data, error } = await insforgeAdmin
    .database
    .from("generated_briefings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching generated briefings:", error);
    return [];
  }

  return ((data || []) as GeneratedBriefing[]).map(sanitizeBriefing);
}

/**
 * Get individual generated briefing by ID
 */
export async function getBriefingById(
  id: string,
  userId?: string
): Promise<GeneratedBriefing | null> {
  let query = insforgeAdmin
    .database
    .from("generated_briefings")
    .select("*")
    .eq("id", id);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query.maybeSingle();

  if (error || !data) {
    return null;
  }

  return sanitizeBriefing(data as GeneratedBriefing);
}

/**
 * Create and persist a new generated briefing
 */
export async function createBriefing(
  payload: Omit<GeneratedBriefing, "id" | "created_at">
): Promise<GeneratedBriefing | null> {
  const cleanedItems = deduplicateBriefingItems(payload.categorized_items || [], { calendarHorizonDays: 365 });
  const row = {
    ...payload,
    categorized_items: cleanedItems,
    date: payload.date || new Date().toISOString().split("T")[0],
    created_at: new Date().toISOString(),
  };

  const { data, error } = await insforgeAdmin
    .database
    .from("generated_briefings")
    .insert([row])
    .select()
    .single();

  if (error) {
    console.error("Error creating generated_briefing in DB:", error);
    return null;
  }

  return sanitizeBriefing(data as GeneratedBriefing);
}

/**
 * Delete a briefing by ID
 */
export async function deleteBriefing(id: string, userId: string): Promise<boolean> {
  const { error } = await insforgeAdmin
    .database
    .from("generated_briefings")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting briefing:", error);
    return false;
  }
  return true;
}

/**
 * Fetch all briefing schedules for user
 */
export async function getSchedules(userId: string): Promise<BriefingSchedule[]> {
  const { data, error } = await insforgeAdmin
    .database
    .from("briefing_schedules")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching briefing_schedules:", error);
    return [];
  }

  return (data || []) as BriefingSchedule[];
}

/**
 * Create a new briefing schedule
 */
export async function createSchedule(
  payload: Omit<BriefingSchedule, "id" | "created_at" | "updated_at">
): Promise<BriefingSchedule | null> {
  const nextRun = payload.next_run_at || calculateNextRunAt(payload.scheduled_time);
  const now = new Date().toISOString();

  const row = {
    ...payload,
    next_run_at: nextRun,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await insforgeAdmin
    .database
    .from("briefing_schedules")
    .insert([row])
    .select()
    .single();

  if (error) {
    console.error("Error creating briefing_schedule:", error);
    return null;
  }

  return data as BriefingSchedule;
}

/**
 * Update an existing schedule
 */
export async function updateSchedule(
  id: string,
  userId: string,
  patch: Partial<BriefingSchedule>
): Promise<BriefingSchedule | null> {
  const updatePayload = {
    ...patch,
    updated_at: new Date().toISOString(),
  };

  if (patch.scheduled_time && !patch.next_run_at) {
    updatePayload.next_run_at = calculateNextRunAt(patch.scheduled_time);
  }

  const { data, error } = await insforgeAdmin
    .database
    .from("briefing_schedules")
    .update(updatePayload)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating briefing_schedule:", error);
    return null;
  }

  return data as BriefingSchedule;
}

/**
 * Delete a schedule
 */
export async function deleteSchedule(id: string, userId: string): Promise<boolean> {
  const { error } = await insforgeAdmin
    .database
    .from("briefing_schedules")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting briefing_schedule:", error);
    return false;
  }
  return true;
}

/**
 * Find schedules that are active and due within next 15 minutes
 */
export async function getDueSchedules(): Promise<BriefingSchedule[]> {
  const fifteenMinutesFromNow = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { data, error } = await insforgeAdmin
    .database
    .from("briefing_schedules")
    .select("*")
    .eq("is_active", true)
    .lte("next_run_at", fifteenMinutesFromNow);

  if (error) {
    console.error("Error querying due schedules:", error);
    return [];
  }

  return (data || []) as BriefingSchedule[];
}

/**
 * Advances next_run_at and sets last_run_at after schedule execution
 */
export async function advanceScheduleNextRun(
  scheduleId: string,
  scheduledTime: string = "08:30"
): Promise<void> {
  const now = new Date().toISOString();
  const nextRun = calculateNextRunAt(scheduledTime);

  const updateFields: Record<string, any> = {
    last_run_at: now,
    next_run_at: nextRun,
    updated_at: now,
  };

  if (nextRun === null) {
    updateFields.is_active = false;
  }

  await insforgeAdmin
    .database
    .from("briefing_schedules")
    .update(updateFields)
    .eq("id", scheduleId);
}
