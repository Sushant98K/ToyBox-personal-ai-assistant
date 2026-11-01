export type AlertPlatform = "gmail" | "whatsapp" | "slack" | "calendar";

export type FuturePlatform = "outlook" | "discord" | "linkedin" | "telegram" | "notion" | "reddit";

export type AlertConditionType = "keyword" | "sender" | "schedule" | "urgency";

export type AlertPriority = "urgent" | "high" | "medium" | "low";

export type AlertStatus = "active" | "resolved" | "snoozed";

export interface AlertRule {
  id: string;
  user_id: string;
  name: string;
  app: AlertPlatform;
  condition_type: AlertConditionType;
  condition_payload: {
    keywords?: string[];
    senders?: string[];
    thresholdMinutes?: number;
    channel?: string;
    description?: string;
  };
  priority: AlertPriority;
  is_active: boolean;
  created_at: string;
}

export interface TriggeredAlert {
  id: string;
  user_id: string;
  rule_id?: string | null;
  app: AlertPlatform | string;
  title: string;
  message: string;
  priority: AlertPriority;
  status: AlertStatus;
  metadata: {
    source?: string;
    channel?: string;
    sender?: string;
    from?: string;
    deepLink?: string;
    messageId?: string;
    threadId?: string;
    recipients?: string[];
    date?: string;
    start_time?: string;
    attendees?: string[];
    suggestedAction?: string;
    extractedSnippet?: string;
    [key: string]: any;
  };
  read: boolean;
  triggered_at: string;
}

export interface AlertStats {
  activeRulesCount: number;
  triggeredTodayCount: number;
  highPriorityCount: number;
  pausedResolvedCount: number;
}

export interface SuggestedAlert {
  id: string;
  name: string;
  app: AlertPlatform;
  condition_type: AlertConditionType;
  condition_payload: {
    keywords?: string[];
    senders?: string[];
    channel?: string;
    thresholdMinutes?: number;
    description?: string;
    [key: string]: any;
  };
  priority: AlertPriority;
  description: string;
  badgeText: string;
}

export interface CreateAlertRuleInput {
  name: string;
  app: AlertPlatform;
  condition_type: AlertConditionType;
  condition_payload: {
    keywords?: string[];
    senders?: string[];
    thresholdMinutes?: number;
    channel?: string;
    description?: string;
  };
  priority: AlertPriority;
  is_active?: boolean;
}

export interface AlertAnalysisResult {
  summary: string;
  whyTriggered: string;
  immediateNextStep: string;
  recommendedActionType: "gmail_reply" | "whatsapp_reply" | "slack_reply" | "calendar_reschedule" | "general_review";
  prefilledDraft?: {
    recipient?: string;
    subject?: string;
    body?: string;
    channel?: string;
    threadId?: string;
    proposedTime?: string;
  };
}
