import { task, schedules } from "@trigger.dev/sdk";
import { runAlertMonitorForUser, AlertCheckResult } from "@/lib/alerts/alert-monitor";
import { insforgeAdmin } from "@/lib/insforge-admin";

export interface AlertTaskPayload {
  userId: string;
  isManual?: boolean;
}

/**
 * Trigger.dev Worker Task: Runs alert condition evaluation for a given user
 */
export const alertMonitoringTask = task({
  id: "alert-monitoring-task",
  run: async (payload: AlertTaskPayload): Promise<AlertCheckResult> => {
    console.log(`[AlertTask] Executing alert monitor for user: ${payload.userId}`);
    return await runAlertMonitorForUser(payload.userId);
  },
});

/**
 * Trigger.dev 15-Minute Scheduled Monitor
 * Periodically queries connected apps (Gmail, WhatsApp, Slack, Calendar)
 * against active rules and emits in-app notifications
 */
export const alertScheduleChecker = schedules.task({
  id: "alert-schedule-checker",
  cron: "*/15 * * * *",
  run: async () => {
    console.log("[AlertScheduleChecker] Running 15-minute alert monitoring check...");

    try {
      // 1. Fetch users with active alert rules
      const { data: rules } = await insforgeAdmin
        .database
        .from("alert_rules")
        .select("user_id")
        .eq("is_active", true);

      const userIds = Array.from(new Set((rules || []).map((r) => r.user_id).filter(Boolean)));
      console.log(`[AlertScheduleChecker] Found ${userIds.length} users with active alert rules.`);

      const results: AlertCheckResult[] = [];
      for (const userId of userIds) {
        try {
          const res = await runAlertMonitorForUser(userId);
          results.push(res);
        } catch (uErr) {
          console.warn(`[AlertScheduleChecker] Error running monitor for user ${userId}:`, uErr);
        }
      }

      return {
        checkedAt: new Date().toISOString(),
        usersChecked: userIds.length,
        results,
      };
    } catch (err: any) {
      console.error("[AlertScheduleChecker] Unexpected error in schedule checker:", err);
      return {
        error: err.message,
        checkedAt: new Date().toISOString(),
      };
    }
  },
});
