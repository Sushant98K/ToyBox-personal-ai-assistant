import { GoogleGenAI } from "@google/genai";
import { TriggeredAlert, AlertAnalysisResult, SuggestedAlert } from "@/types/alerts";

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

/**
 * Analyzes a triggered alert with gemini-3.5-flash-lite to generate:
 * - Executive explanation of why the alert fired
 * - Immediate recommended next step
 * - Prefilled one-click contextual action / reply draft
 */
export async function analyzeAlertWithAI(
  alert: TriggeredAlert,
  executiveName: string = "Executive"
): Promise<AlertAnalysisResult> {
  const ai = getGeminiClient();

  const appType = (alert.app || "").toLowerCase();
  let defaultActionType: AlertAnalysisResult["recommendedActionType"] = "general_review";
  if (appType.includes("gmail") || appType.includes("email")) defaultActionType = "gmail_reply";
  else if (appType.includes("whatsapp")) defaultActionType = "whatsapp_reply";
  else if (appType.includes("slack")) defaultActionType = "slack_reply";
  else if (appType.includes("calendar") || appType.includes("gcal")) defaultActionType = "calendar_reschedule";

  if (!ai) {
    return generateHeuristicAnalysis(alert, executiveName, defaultActionType);
  }

  try {
    const prompt = `You are ToyBox.ai's Executive Chief of Staff AI. Analyze this critical in-app notification alert for ${executiveName} and produce an executive analysis and recommended immediate action.

ALERT DETAILS:
- Platform / App: ${alert.app}
- Title: ${alert.title}
- Message / Content: ${alert.message}
- Priority: ${alert.priority}
- Metadata: ${JSON.stringify(alert.metadata || {})}
- Triggered Time: ${alert.triggered_at}

Provide a JSON object adhering to this schema:
{
  "summary": "1-2 sentence executive briefing explaining the core situation",
  "whyTriggered": "Specific reason this triggered an alert based on priority keywords, sender VIP status, or scheduling rules",
  "immediateNextStep": "Clear, direct recommended action the executive should execute immediately",
  "recommendedActionType": "${defaultActionType}",
  "prefilledDraft": {
    "recipient": "Email address, phone number, or channel handle",
    "subject": "Email subject or message header if applicable",
    "body": "Concise, professional draft response or note ready to send without further editing",
    "channel": "Slack channel name if applicable",
    "proposedTime": "Suggested time slot if calendar conflict"
  }
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const rawText = response.text || "{}";
    const cleaned = rawText.replace(/^```json\s*/, "").replace(/\s*```$/, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      summary: parsed.summary || alert.message || alert.title,
      whyTriggered: parsed.whyTriggered || `Alert triggered due to ${alert.priority} signal threshold on ${alert.app}.`,
      immediateNextStep: parsed.immediateNextStep || "Review and confirm appropriate response.",
      recommendedActionType: parsed.recommendedActionType || defaultActionType,
      prefilledDraft: parsed.prefilledDraft || {
        recipient: alert.metadata?.sender || alert.metadata?.from || "",
        subject: `Re: ${alert.title}`,
        body: `Thank you for the update. I have reviewed this and will follow up shortly.`,
      },
    };
  } catch (err) {
    console.warn("[AlertAI] Error querying gemini-3.5-flash-lite, using structured fallback:", err);
    return generateHeuristicAnalysis(alert, executiveName, defaultActionType);
  }
}

function generateHeuristicAnalysis(
  alert: TriggeredAlert,
  executiveName: string,
  actionType: AlertAnalysisResult["recommendedActionType"]
): AlertAnalysisResult {
  const normApp = (alert.app || "").toLowerCase();

  if (normApp.includes("gmail")) {
    return {
      summary: `Urgent email received: "${alert.title}". Requires decision or reply.`,
      whyTriggered: "Sender matches priority contact threshold or contains urgent keywords.",
      immediateNextStep: "Send approved reply draft to acknowledge and provide direction.",
      recommendedActionType: "gmail_reply",
      prefilledDraft: {
        recipient: alert.metadata?.from || alert.metadata?.sender || "sender@example.com",
        subject: `Re: ${alert.title}`,
        body: `Hi, thank you for bringing this to my attention. I am reviewing the details now and will have our team coordinate on this today. Best, ${executiveName}`,
      },
    };
  }

  if (normApp.includes("whatsapp")) {
    return {
      summary: `WhatsApp direct message flagged: "${alert.title}".`,
      whyTriggered: "Direct VIP contact message awaiting response.",
      immediateNextStep: "Transmit instant confirmation message via WhatsApp concierge.",
      recommendedActionType: "whatsapp_reply",
      prefilledDraft: {
        recipient: alert.metadata?.sender || "+1 (555) 019-2834",
        body: `Understood, thanks for the heads-up. Reviewing this now and getting back to you within the hour.`,
      },
    };
  }

  if (normApp.includes("slack")) {
    return {
      summary: `Slack message in ${alert.metadata?.channel || "#general"} marked high-priority.`,
      whyTriggered: "Channel thread detected blocker or time-sensitive operational request.",
      immediateNextStep: "Post acknowledgment in thread to align team.",
      recommendedActionType: "slack_reply",
      prefilledDraft: {
        channel: alert.metadata?.channel || "#general",
        body: `Acknowledged team. Let's proceed with the proposed plan. I will join if any escalation is needed.`,
      },
    };
  }

  if (normApp.includes("calendar")) {
    return {
      summary: `Calendar scheduling conflict detected: "${alert.title}".`,
      whyTriggered: "Meeting time shift or overlapping calendar commitment.",
      immediateNextStep: "Confirm adjusted time slot and update attendee calendar invitations.",
      recommendedActionType: "calendar_reschedule",
      prefilledDraft: {
        proposedTime: "4:30 PM - 5:15 PM EST",
        body: `Updated meeting time to 4:30 PM EST to resolve schedule overlap. Buffer block created.`,
      },
    };
  }

  return {
    summary: `System alert: "${alert.title}". Status: ${alert.status}.`,
    whyTriggered: "Automated alert monitoring rule criteria satisfied.",
    immediateNextStep: "Verify audit logs and mark resolved when completed.",
    recommendedActionType: "general_review",
    prefilledDraft: {
      body: `Reviewed and resolved on ${new Date().toLocaleDateString()}.`,
    },
  };
}

/**
 * Standard AI suggested alert templates based on connected app patterns
 */
export const DEFAULT_SUGGESTED_ALERTS: SuggestedAlert[] = [
  {
    id: "sug-vip-email",
    name: "VIP Email Tracker",
    app: "gmail",
    condition_type: "sender",
    condition_payload: {
      senders: ["@board.com", "@investors.vc", "@keyclient.com"],
      description: "Triggers when emails arrive from high-priority enterprise domains or board members",
    },
    priority: "urgent",
    description: "Instantly flags emails from key investors, board members, or strategic enterprise clients.",
    badgeText: "High Impact",
  },
  {
    id: "sug-slack-urgency",
    name: "Slack Urgency Watcher",
    app: "slack",
    condition_type: "keyword",
    condition_payload: {
      keywords: ["blocker", "down", "critical", "incident", "outage", "escalation"],
      channel: "#all-channels",
      description: "Detects operational emergencies and critical blockers across team channels",
    },
    priority: "urgent",
    description: "Monitors Slack channels for crisis signals, downtime warnings, and critical blockers.",
    badgeText: "Incident Radar",
  },
  {
    id: "sug-meeting-overlap",
    name: "Meeting Overlap Watchdog",
    app: "calendar",
    condition_type: "schedule",
    condition_payload: {
      thresholdMinutes: 15,
      description: "Detects overlapping appointments or zero-buffer executive schedules",
    },
    priority: "high",
    description: "Guards against double-booking and proposes automatic buffer blocks before major presentations.",
    badgeText: "Calendar Guard",
  },
  {
    id: "sug-whatsapp-leads",
    name: "Customer Inquiry Reminder",
    app: "whatsapp",
    condition_type: "urgency",
    condition_payload: {
      thresholdMinutes: 30,
      description: "Triggers when inbound VIP client threads wait >30m without reply",
    },
    priority: "high",
    description: "Alerts when priority inbound client threads remain unanswered for more than 30 minutes.",
    badgeText: "Response SLA",
  },
];
