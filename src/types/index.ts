export interface NavItem {
  label: string;
  href: string;
}

export interface Integration {
  id: string;
  name: string;
  role: string;
  status: string;
  protocol: string;
  type: "email" | "messaging" | "calendar" | "workspace";
}

export interface McpToolParameter {
  name: string;
  type: string;
  description: string;
  required?: boolean;
  default?: string | number | boolean;
}

export interface McpToolDefinition {
  name: string;
  title: string;
  description: string;
  category: "read" | "write" | "manage" | "search";
  parameters: McpToolParameter[];
  sampleOutput?: Record<string, unknown> | string;
}

export interface IntegrationPlatform {
  id: string;
  name: string;
  role: string;
  category: "Email & Messaging" | "Productivity & Docs" | "Community & Chat";
  type: "email" | "messaging" | "calendar" | "workspace";
  description: string;
  protocol: string;
  socialIcon: string;
  defaultSyncFrequency: string;
  defaultThroughput: string;
  mcpTools: McpToolDefinition[];
}

export interface PricingPlan {
  id: string;
  name: string;
  badge?: string;
  isPopular?: boolean;
  audienceBadge: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  ctaLabel: string;
  ctaVariant: "outline" | "primary";
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Testimonial {
  name: string;
  role: string;
  company: string;
  companyBadge: string;
  avatarBg: string;
  initials: string;
  quote: string;
}

export interface WorkflowStep {
  step: string;
  title: string;
  description: string;
  badge: string;
}

export interface ReminderItem {
  id: string;
  app: string;
  channel: string;
  task: string;
  time: string;
  source: string;
}
