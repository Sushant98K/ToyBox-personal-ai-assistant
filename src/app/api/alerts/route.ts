import { NextRequest, NextResponse } from "next/server";
import { insforgeAdmin } from "@/lib/insforge-admin";
import { runAlertMonitorForUser } from "@/lib/alerts/alert-monitor";
import { analyzeAlertWithAI, DEFAULT_SUGGESTED_ALERTS } from "@/lib/alerts/alert-ai-service";
import { executeAgentTool } from "@/lib/agent/tools";
import { TriggeredAlert, AlertRule, AlertStats } from "@/types/alerts";

async function resolveUserId(request: NextRequest): Promise<string> {
  const customUserId = request.headers.get("x-user-id");
  if (customUserId && customUserId !== "undefined" && customUserId !== "null" && customUserId.length > 5) {
    return customUserId;
  }
  const customUserEmail = request.headers.get("x-user-email");
  if (customUserEmail && customUserEmail !== "undefined" && customUserEmail !== "null") {
    try {
      const { data: usersByEmail } = await insforgeAdmin
        .database
        .from("users")
        .select("id")
        .eq("email", customUserEmail)
        .limit(1);
      if (usersByEmail && usersByEmail.length > 0) return usersByEmail[0].id;
    } catch {}
  }

  const { data: users } = await insforgeAdmin
    .database
    .from("users")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1);

  return users?.[0]?.id || "a727d188-4197-409c-855d-2aa5201cebc7";
}

// Initial default seed rules when user has none
const INITIAL_RULES: Array<Omit<AlertRule, "id" | "user_id" | "created_at">> = [
  {
    name: "VIP Client & Board Email Watch",
    app: "gmail",
    condition_type: "sender",
    condition_payload: {
      senders: ["@board.com", "@partner.vc", "@client.corp"],
      description: "Auto-flags urgent communications from board partners and key customers",
    },
    priority: "urgent",
    is_active: true,
  },
  {
    name: "Production Blocker Radar",
    app: "slack",
    condition_type: "keyword",
    condition_payload: {
      keywords: ["blocker", "outage", "down", "critical incident"],
      channel: "#incident-response",
      description: "Monitors engineering & exec channels for high-severity blockers",
    },
    priority: "urgent",
    is_active: true,
  },
  {
    name: "Calendar Conflict Watchdog",
    app: "calendar",
    condition_type: "schedule",
    condition_payload: {
      thresholdMinutes: 15,
      description: "Detects back-to-back overlaps and alerts before executive meetings",
    },
    priority: "high",
    is_active: true,
  },
  {
    name: "WhatsApp VIP Line SLA",
    app: "whatsapp",
    condition_type: "urgency",
    condition_payload: {
      thresholdMinutes: 30,
      description: "Alerts when incoming WhatsApp VIP thread waits >30m for reply",
    },
    priority: "high",
    is_active: true,
  },
];

// Initial default seed alerts when user has none
const INITIAL_ALERTS: Array<Omit<TriggeredAlert, "id" | "user_id" | "triggered_at">> = [
  {
    app: "slack",
    title: "Board of Directors Q4 Session Time Shift Required",
    message: "Lead Partner requested 30-min shift to 4:30 PM due to aircraft departure delays. No overlapping calendar conflicts detected.",
    priority: "urgent",
    status: "active",
    metadata: {
      source: "Slack #board-directors",
      channel: "#board-directors",
      sender: "Partner David M.",
      deepLink: "https://slack.com",
    },
    read: false,
  },
  {
    app: "whatsapp",
    title: "Revised Enterprise Vendor NDA Approval Needed",
    message: "Datadog VP of Procurement sent modified redline terms for 2026 enterprise commitment. Legal AI verified terms align with standard guidelines.",
    priority: "urgent",
    status: "active",
    metadata: {
      source: "WhatsApp VIP Direct Line",
      sender: "VP Procurement (Datadog)",
      phone: "+1 (415) 890-2134",
    },
    read: false,
  },
  {
    app: "gmail",
    title: "Q4 Key Account Renewal Contract Counter-Proposal",
    message: "Enterprise customer submitted requested redline revision for $120k ARR annual renewal. Awaiting executive sign-off.",
    priority: "high",
    status: "active",
    metadata: {
      source: "Gmail Primary Inbox",
      from: "procurement@acme-enterprise.com",
      subject: "Fwd: 2026 Service Agreement Counter-Proposal",
    },
    read: false,
  },
  {
    app: "calendar",
    title: "Executive Schedule Overlap: Q4 Strategy & Product Sync",
    message: "Overlapping appointment detected at 3:00 PM EST between Product Roadmap Review and Investor Prep.",
    priority: "medium",
    status: "resolved",
    metadata: {
      source: "Google Calendar",
      start_time: new Date().toISOString(),
      attendees: ["Sarah Jenkins", "Alex Rivera"],
    },
    read: true,
  },
];

export async function GET(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    const { searchParams } = new URL(request.url);
    const filterPlatform = searchParams.get("app");
    const filterPriority = searchParams.get("priority");
    const filterStatus = searchParams.get("status");

    // 1. Fetch Rules (seed if empty)
    let { data: rules } = await insforgeAdmin
      .database
      .from("alert_rules")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!rules || rules.length === 0) {
      const seedPayload = INITIAL_RULES.map((r) => ({
        ...r,
        user_id: userId,
        created_at: new Date().toISOString(),
      }));
      const { data: createdRules } = await insforgeAdmin
        .database
        .from("alert_rules")
        .insert(seedPayload)
        .select();
      rules = createdRules || [];
    }

    // 2. Fetch Triggered Alerts (seed if empty)
    let { data: alerts } = await insforgeAdmin
      .database
      .from("triggered_alerts")
      .select("*")
      .eq("user_id", userId)
      .order("triggered_at", { ascending: false });

    if (!alerts || alerts.length === 0) {
      const seedAlertsPayload = INITIAL_ALERTS.map((a, idx) => ({
        ...a,
        user_id: userId,
        triggered_at: new Date(Date.now() - (idx + 1) * 15 * 60 * 1000).toISOString(),
      }));
      const { data: createdAlerts } = await insforgeAdmin
        .database
        .from("triggered_alerts")
        .insert(seedAlertsPayload)
        .select();
      alerts = createdAlerts || [];
    }

    const allAlerts: TriggeredAlert[] = alerts || [];
    const allRules: AlertRule[] = rules || [];

    // 3. Compute Stats
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

    const stats: AlertStats = {
      activeRulesCount: allRules.filter((r) => r.is_active).length,
      triggeredTodayCount: allAlerts.filter(
        (a) => new Date(a.triggered_at).getTime() > twentyFourHoursAgo
      ).length,
      highPriorityCount: allAlerts.filter(
        (a) =>
          a.status === "active" && (a.priority === "urgent" || a.priority === "high")
      ).length,
      pausedResolvedCount: allAlerts.filter(
        (a) => a.status === "resolved" || a.status === "snoozed"
      ).length,
    };

    // 4. Apply filters for query
    let filtered = allAlerts;
    if (filterPlatform && filterPlatform !== "all") {
      filtered = filtered.filter(
        (a) => (a.app || "").toLowerCase() === filterPlatform.toLowerCase()
      );
    }
    if (filterPriority && filterPriority !== "all") {
      filtered = filtered.filter(
        (a) => (a.priority || "").toLowerCase() === filterPriority.toLowerCase()
      );
    }
    if (filterStatus && filterStatus !== "all") {
      filtered = filtered.filter((a) => a.status === filterStatus);
    }

    return NextResponse.json({
      success: true,
      alerts: filtered,
      allAlerts,
      rules: allRules,
      stats,
      suggestedAlerts: DEFAULT_SUGGESTED_ALERTS,
    });
  } catch (error: any) {
    console.error("GET /api/alerts error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    const body = await request.json();
    const { action } = body;

    // ─── 1. Create Rule ───
    if (action === "create_rule") {
      const { rule } = body;
      if (!rule?.name || !rule?.app) {
        return NextResponse.json({ error: "Missing rule name or app" }, { status: 400 });
      }

      const newRecord = {
        user_id: userId,
        name: rule.name,
        app: rule.app,
        condition_type: rule.condition_type || "keyword",
        condition_payload: rule.condition_payload || {},
        priority: rule.priority || "high",
        is_active: rule.is_active !== undefined ? rule.is_active : true,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await insforgeAdmin
        .database
        .from("alert_rules")
        .insert([newRecord])
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, rule: data });
    }

    // ─── 2. Toggle Rule ───
    if (action === "toggle_rule") {
      const { ruleId, is_active } = body;
      const { data, error } = await insforgeAdmin
        .database
        .from("alert_rules")
        .update({ is_active })
        .eq("id", ruleId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, rule: data });
    }

    // ─── 3. Delete Rule ───
    if (action === "delete_rule") {
      const { ruleId } = body;
      const { error } = await insforgeAdmin
        .database
        .from("alert_rules")
        .delete()
        .eq("id", ruleId)
        .eq("user_id", userId);

      if (error) throw error;
      return NextResponse.json({ success: true, deleted: ruleId });
    }

    // ─── 4. Resolve Alert ───
    if (action === "resolve_alert") {
      const alertId = body.alertId || body.alert_id;
      const { data, error } = await insforgeAdmin
        .database
        .from("triggered_alerts")
        .update({ status: "resolved", read: true })
        .eq("id", alertId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, alert: data });
    }

    // ─── 5. Snooze Alert ───
    if (action === "snooze_alert") {
      const alertId = body.alertId || body.alert_id;
      const { hours = 4 } = body;
      const snoozeUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

      const { data, error } = await insforgeAdmin
        .database
        .from("triggered_alerts")
        .update({ status: "snoozed", read: true, metadata: { snoozedUntil: snoozeUntil } })
        .eq("id", alertId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, alert: data });
    }

    // ─── 6. Dismiss Alert ───
    if (action === "dismiss_alert") {
      const alertId = body.alertId || body.alert_id;
      const { data, error } = await insforgeAdmin
        .database
        .from("triggered_alerts")
        .update({ status: "resolved", read: true })
        .eq("id", alertId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, alert: data });
    }

    // ─── 7. Mark All Read ───
    if (action === "mark_all_read") {
      const { error } = await insforgeAdmin
        .database
        .from("triggered_alerts")
        .update({ read: true })
        .eq("user_id", userId);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // ─── 8. AI Analyze Alert (Gemini 3.5 Flash-Lite) ───
    if (action === "analyze_alert") {
      let alert = body.alert;
      const alertId = body.alertId || body.alert_id;

      if (!alert && alertId) {
        const { data: dbAlert } = await insforgeAdmin
          .database
          .from("triggered_alerts")
          .select("*")
          .eq("id", alertId)
          .single();
        alert = dbAlert;
      }

      if (!alert) {
        return NextResponse.json({ error: "Missing alert data" }, { status: 400 });
      }

      // Query user display name
      const { data: userRec } = await insforgeAdmin
        .database
        .from("users")
        .select("name, email")
        .eq("id", userId)
        .maybeSingle();

      const executiveName = userRec?.name || userRec?.email?.split("@")[0] || "Executive";
      const analysis = await analyzeAlertWithAI(alert, executiveName);

      return NextResponse.json({ success: true, analysis });
    }

    // ─── 9. Execute Contextual Action via MCP Tools ───
    if (action === "execute_action") {
      const { toolName, toolArgs } = body;
      if (!toolName) {
        return NextResponse.json({ error: "toolName is required" }, { status: 400 });
      }

      const result = await executeAgentTool(toolName, toolArgs || {}, userId);

      // If associated with an alert, mark the alert as resolved
      if (body.alertId) {
        await insforgeAdmin
          .database
          .from("triggered_alerts")
          .update({ status: "resolved", read: true })
          .eq("id", body.alertId)
          .eq("user_id", userId);
      }

      return NextResponse.json({ success: true, result });
    }

    // ─── 10. Run Alert Monitor Scan On-Demand ───
    if (action === "run_check") {
      const checkResult = await runAlertMonitorForUser(userId);
      return NextResponse.json({ success: true, checkResult });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/alerts error:", error);
    return NextResponse.json(
      { error: error.message || "Alert operation failed" },
      { status: 500 }
    );
  }
}
