import { GoogleGenAI } from "@google/genai";
import {
  NormalizedBriefingItem,
  BriefingCategoryCounts,
  BriefingHighlight,
  UrgencyLevel,
  ActionComposerDraft,
} from "@/types/briefing";

export interface SynthesizedBriefingPayload {
  title: string;
  executive_summary: string;
  highlights: BriefingHighlight[];
  category_counts: BriefingCategoryCounts;
  categorized_items: NormalizedBriefingItem[];
  platforms_used: string[];
}

export interface SynthesisOptions {
  promptGoal?: string;
  priorityThreshold?: "all" | "high_only";
  userName?: string;
}

/**
 * Initializes Google Gen AI client with GEMINI_API_KEY
 */
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY not found in environment.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Synthesizes multi-channel normalized items into an executive daily briefing using gemini-3.5-flash-lite
 */
export async function synthesizeBriefingPayload(
  normalizedData: NormalizedBriefingItem[],
  options?: SynthesisOptions
): Promise<SynthesizedBriefingPayload> {
  const ai = getGeminiClient();
  const promptGoal = options?.promptGoal || "Executive Intelligence Briefing";
  const priorityThreshold = options?.priorityThreshold || "all";
  const userName = options?.userName || "Executive";

  // Derive initial category counts from raw normalized data
  const initialCounts: BriefingCategoryCounts = {
    emails: normalizedData.filter((i) => i.type === "email").length,
    messages: normalizedData.filter((i) => i.type === "message").length,
    mentions: normalizedData.filter((i) => i.type === "mention").length,
    tasks: normalizedData.filter((i) => i.type === "task").length,
    followups: normalizedData.filter((i) => i.type === "followup" || i.type === "meeting").length,
  };

  const platformsUsed = Array.from(new Set(normalizedData.map((i) => i.platform)));

  // If no Gemini client or empty data, return high-fidelity fallback
  if (!ai || normalizedData.length === 0) {
    return buildFallbackBriefing(normalizedData, promptGoal, initialCounts, platformsUsed);
  }

  try {
    const prompt = `You are ToyBox.ai's executive intelligence engine for ${userName}.
Goal/Focus: ${promptGoal}
Priority Threshold: ${priorityThreshold}

Analyze these real normalized items fetched from connected MCP platforms (Gmail, WhatsApp, Slack, Google Calendar):
${JSON.stringify(normalizedData.slice(0, 30), null, 2)}

TASK:
1. Generate a concise, impactful briefing title (e.g., "Executive Daily Intelligence: Operations & Schedule Alignment").
2. Write an executive summary (3-4 sentences) summarizing overall urgency, critical blockers, incoming priorities, and key commitments.
3. Extract 4-6 high-impact highlights. Each highlight must include:
   - "text": concise executive takeaway
   - "platform": "gmail" | "whatsapp" | "slack" | "calendar"
   - "urgency": "urgent" | "high" | "medium" | "low"
   - "category": "emails" | "messages" | "mentions" | "meetings" | "tasks" | "followups"
4. Re-rank and score each item in categorized_items with accurate urgency ('urgent', 'high', 'medium', 'low') and priorityScore (1-100, where 100 is most urgent/critical).
5. Output exact category counts.

Respond ONLY with valid JSON matching this schema:
{
  "title": "string",
  "executive_summary": "string",
  "highlights": [
    {
      "text": "string",
      "platform": "string",
      "urgency": "urgent" | "high" | "medium" | "low",
      "category": "emails" | "messages" | "mentions" | "meetings" | "tasks" | "followups"
    }
  ],
  "category_counts": {
    "emails": number,
    "messages": number,
    "mentions": number,
    "tasks": number,
    "followups": number
  },
  "categorized_items": [
    {
      "id": "string (matching input item id)",
      "urgency": "urgent" | "high" | "medium" | "low",
      "priorityScore": number,
      "title": "string",
      "bodySnippet": "string"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const rawText = response.text || "{}";
    const cleaned = rawText.replace(/^```json\s*/, "").replace(/\s*```$/, "").trim();
    const parsed = JSON.parse(cleaned);

    // Merge AI enrichments back into normalized items
    const aiItemsMap = new Map<string, any>();
    if (Array.isArray(parsed.categorized_items)) {
      parsed.categorized_items.forEach((item: any) => {
        if (item.id) aiItemsMap.set(item.id, item);
      });
    }

    const mergedItems: NormalizedBriefingItem[] = normalizedData.map((original) => {
      const enrichment = aiItemsMap.get(original.id);
      if (enrichment) {
        return {
          ...original,
          title: enrichment.title || original.title,
          bodySnippet: enrichment.bodySnippet || original.bodySnippet,
          urgency: (enrichment.urgency as UrgencyLevel) || original.urgency,
          priorityScore: typeof enrichment.priorityScore === "number" ? enrichment.priorityScore : original.priorityScore,
        };
      }
      return original;
    });

    // Sort by priorityScore descending
    mergedItems.sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));

    // Filter if high_only requested
    const filteredItems = priorityThreshold === "high_only"
      ? mergedItems.filter((i) => i.urgency === "urgent" || i.urgency === "high")
      : mergedItems;

    return {
      title: parsed.title || `${promptGoal} – ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      executive_summary: parsed.executive_summary || "Synthesized actionable insights across connected communication and productivity platforms.",
      highlights: Array.isArray(parsed.highlights) && parsed.highlights.length > 0
        ? parsed.highlights.slice(0, 6)
        : buildFallbackHighlights(mergedItems),
      category_counts: {
        emails: parsed.category_counts?.emails ?? initialCounts.emails,
        messages: parsed.category_counts?.messages ?? initialCounts.messages,
        mentions: parsed.category_counts?.mentions ?? initialCounts.mentions,
        tasks: parsed.category_counts?.tasks ?? initialCounts.tasks,
        followups: parsed.category_counts?.followups ?? initialCounts.followups,
      },
      categorized_items: filteredItems,
      platforms_used: platformsUsed,
    };
  } catch (error) {
    console.warn("Gemini 3.5 Flash-Lite briefing synthesis failed, using fallback:", error);
    return buildFallbackBriefing(normalizedData, promptGoal, initialCounts, platformsUsed);
  }
}

/**
 * Drafts contextual replies for Gmail, WhatsApp, and Slack using gemini-3.5-flash-lite
 */
export async function composeContextualReply(
  itemContext: NormalizedBriefingItem,
  userInstruction?: string,
  tone: "Professional" | "Casual" | "Direct" = "Professional"
): Promise<ActionComposerDraft> {
  const ai = getGeminiClient();

  const platform = itemContext.platform?.toLowerCase() || "email";
  const defaultAction =
    platform === "gmail"
      ? "Reply via Email"
      : platform === "whatsapp"
      ? "Send WhatsApp Message"
      : platform === "slack"
      ? "Reply in Slack Thread"
      : "Confirm / Update Schedule";

  if (!ai) {
    return {
      subject: itemContext.title ? `Re: ${itemContext.title.replace(/^Re:\s*/i, "")}` : undefined,
      body: `Hi ${itemContext.sender.split(" ")[0] || "there"},\n\nThank you for reaching out regarding "${itemContext.title}". I've received your message and will review the details shortly.\n\nBest regards,\nExecutive Office`,
      suggestedAction: defaultAction,
      tone,
    };
  }

  try {
    const prompt = `You are ToyBox.ai's contextual action composer drafting a message on behalf of the user.

PLATFORM: ${platform}
ITEM CONTEXT:
- Title: ${itemContext.title}
- Sender: ${itemContext.sender}
- Channel / Thread: ${itemContext.channelOrThread || "Direct"}
- Snippet / Context: ${itemContext.bodySnippet}
- Urgency: ${itemContext.urgency}

USER INSTRUCTION (if any): ${userInstruction || "Draft an appropriate, prompt executive response addressing the context."}
TONE: ${tone} (Follow this tone strictly: Professional = polished, polite; Casual = conversational, warm; Direct = concise, action-focused)

INSTRUCTIONS:
1. Provide a contextually accurate reply body. Keep WhatsApp and Slack messages concise (1-3 sentences). Emails can be structured.
2. If this is an email, provide a relevant 'subject' line starting with 'Re: '.
3. Provide a 'suggestedAction' descriptor (e.g. "Send Email via Gmail", "Post Slack Reply", "Send WhatsApp Telemetry").

Respond ONLY with valid JSON matching:
{
  "subject": "string or null",
  "body": "string",
  "suggestedAction": "string"
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
      subject: parsed.subject || (platform === "gmail" ? `Re: ${itemContext.title.replace(/^Re:\s*/i, "")}` : undefined),
      body: parsed.body || `Hi ${itemContext.sender.split(" ")[0] || "there"},\n\nReceived your update regarding "${itemContext.title}". I will follow up shortly.`,
      suggestedAction: parsed.suggestedAction || defaultAction,
      tone,
    };
  } catch (err) {
    console.warn("Contextual reply generation error:", err);
    return {
      subject: platform === "gmail" ? `Re: ${itemContext.title.replace(/^Re:\s*/i, "")}` : undefined,
      body: `Hi ${itemContext.sender.split(" ")[0] || "there"},\n\nThanks for your note regarding "${itemContext.title}". I'm on it and will get back to you with next steps.\n\nBest regards,`,
      suggestedAction: defaultAction,
      tone,
    };
  }
}

function buildFallbackHighlights(items: NormalizedBriefingItem[]): BriefingHighlight[] {
  if (items.length === 0) {
    return [
      {
        text: "All connected platforms synced with zero critical blockers.",
        platform: "system",
        urgency: "low",
        category: "tasks",
      },
    ];
  }

  return items.slice(0, 4).map((item) => ({
    text: `${item.title}: ${item.bodySnippet.slice(0, 80)}...`,
    platform: item.platform,
    urgency: item.urgency,
    category: (item.type === "email" ? "emails" : item.type === "meeting" ? "meetings" : "messages") as any,
  }));
}

function buildFallbackBriefing(
  items: NormalizedBriefingItem[],
  promptGoal: string,
  counts: BriefingCategoryCounts,
  platformsUsed: string[]
): SynthesizedBriefingPayload {
  return {
    title: `${promptGoal} – ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    executive_summary: `Synthesized intelligence review across ${platformsUsed.length > 0 ? platformsUsed.join(", ") : "connected accounts"}. ${counts.emails} emails, ${counts.messages} messages, and ${counts.followups} meetings/deadlines scanned.`,
    highlights: buildFallbackHighlights(items),
    category_counts: counts,
    categorized_items: items,
    platforms_used: platformsUsed,
  };
}
