import { PricingPlan } from "@/types";

export const pricingPlans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    audienceBadge: "Up to 2 accounts",
    description:
      "Ideal for solo founders and freelancers looking to tame their primary email and Slack inbox.",
    monthlyPrice: 24,
    annualPrice: 19,
    features: [
      "Connect any 2 accounts (Gmail & Slack or WhatsApp)",
      "Twice-daily automated executive summaries (Morning & EOD)",
      "Basic natural-language reminder extraction",
      "Standard audio voice note transcription (up to 20/mo)",
      "Zero-retention ephemeral processing guarantee",
      "Email & community support",
    ],
    ctaLabel: "Start 14-day free trial",
    ctaVariant: "outline",
    isPopular: false,
  },
  {
    id: "pro",
    name: "Executive Pro",
    audienceBadge: "All 5 inboxes",
    badge: "Most Popular",
    description:
      "Full unified intelligence across Gmail, Slack, WhatsApp, Telegram, and Outlook with autonomous agents.",
    monthlyPrice: 59,
    annualPrice: 49,
    features: [
      "All 5 platforms: Gmail, Slack, WhatsApp, Telegram & Outlook",
      "Cross-platform thread fusion & deduplication",
      "Unlimited voice memo & WhatsApp audio transcriptions",
      "Context-aware draft responses tailored to your voice",
      "Autonomous calendar clash detection & rescheduling",
      "VIP sender firewall with custom escalation rules",
      "Priority concierge onboarding & 24/7 dedicated support",
    ],
    ctaLabel: "Get started with Executive Pro",
    ctaVariant: "primary",
    isPopular: true,
  },
];
