export type BriefingCategory =
  | "emails"
  | "messages"
  | "mentions"
  | "meetings"
  | "tasks"
  | "followups";

export type BriefingItemType =
  | "email"
  | "message"
  | "mention"
  | "meeting"
  | "task"
  | "followup";

export type UrgencyLevel = "urgent" | "high" | "medium" | "low";

export interface NormalizedBriefingItem {
  id: string;
  platform: "gmail" | "whatsapp" | "slack" | "calendar" | "gcal" | "outlook" | "discord" | "linkedin" | "telegram" | "notion" | "reddit" | string;
  type: BriefingItemType;
  title: string;
  sender: string;
  channelOrThread?: string;
  timestamp: string;
  bodySnippet: string;
  priorityScore: number; // 1-100 or priority rank
  urgency: UrgencyLevel;
  deepLinkOrId?: string;
  metadata?: Record<string, any>;
}

export interface BriefingCategoryCounts {
  emails: number;
  messages: number;
  mentions: number;
  tasks: number;
  followups: number;
}

export interface BriefingHighlight {
  text: string;
  platform: string;
  urgency: UrgencyLevel;
  category?: BriefingCategory;
}

export interface GeneratedBriefing {
  id: string;
  user_id: string;
  schedule_id?: string | null;
  title: string;
  date: string;
  executive_summary: string;
  highlights: BriefingHighlight[];
  category_counts: BriefingCategoryCounts;
  categorized_items: NormalizedBriefingItem[];
  platforms_used: string[];
  created_at?: string;
}

export interface BriefingSchedule {
  id: string;
  user_id: string;
  name: string;
  prompt_goal: string;
  platforms: string[];
  categories: BriefingCategory[];
  scheduled_time: string; // e.g. "08:30" or cron format
  priority_threshold: "all" | "high_only";
  is_active: boolean;
  last_run_at?: string | null;
  next_run_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ActionComposerDraft {
  subject?: string;
  body: string;
  suggestedAction: string;
  tone: "Professional" | "Casual" | "Direct";
}

export interface SendActionResult {
  success: boolean;
  platform: string;
  action: string;
  messageId?: string;
  details?: Record<string, any>;
  error?: string;
}
