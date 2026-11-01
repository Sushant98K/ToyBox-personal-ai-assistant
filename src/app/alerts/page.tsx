import { Metadata } from "next";
import { siteConfig } from "@/config";
import { AlertsManager } from "@/features/alerts/components/AlertsManager";

export const metadata: Metadata = {
  title: `Alerts & Live Monitoring – ${siteConfig.name}`,
  description:
    "Real-time alerts, AI-detected triggers, and automated condition monitoring across Gmail, WhatsApp, Slack, and Google Calendar.",
};

export default function AlertsPage() {
  return <AlertsManager />;
}
