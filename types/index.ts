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
