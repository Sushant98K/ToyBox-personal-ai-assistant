import { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Bot,
  Newspaper,
  Puzzle,
  Bell,
  Settings,
  CreditCard,
} from "lucide-react";

export type DashboardTab =
  | "dashboard"
  | "ai-agent"
  | "briefing"
  | "integrations"
  | "alerts"
  | "settings"
  | "pricing-settings";

export interface NavOption {
  id: DashboardTab;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  badge?: string;
  badgeType?: "accent" | "danger" | "neutral" | "success";
  description?: string;
}

export const MAIN_NAV_OPTIONS: NavOption[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Executive synthesis & metrics",
  },
  {
    id: "ai-agent",
    label: "AI Agent",
    icon: Bot,
    description: "Autonomous task fleet",
  },
  {
    id: "briefing",
    label: "Briefing",
    icon: Newspaper,
    description: "Daily intelligence report",
  },
  {
    id: "integrations",
    label: "Integrations",
    icon: Puzzle,
    description: "Gmail, Slack, WhatsApp, Outlook",
  },
  {
    id: "alerts",
    label: "Alerts",
    icon: Bell,
    description: "Urgent items requiring decision",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    description: "Preferences, schedules & persona",
  },
];

export const PRICING_NAV_OPTION: NavOption = {
  id: "pricing-settings",
  label: "Pricing Settings",
  icon: CreditCard,
  badge: "PRO",
  badgeType: "accent",
  description: "Subscription tier & usage quotas",
};
