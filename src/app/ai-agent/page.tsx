import { Metadata } from "next";
import { siteConfig } from "@/config";
import { ChatInterface } from "@/components/agent/ChatInterface";

export const metadata: Metadata = {
  title: `AI Agent – Autonomous Chief of Staff – ${siteConfig.name}`,
  description:
    "Live executive AI assistant connected to Gmail, WhatsApp, Slack, and Google Calendar via Gemini 3.5 Flash-Lite and MCP.",
};

export default function AiAgentPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] w-full min-w-0 max-w-none px-6 py-4 md:px-8 bg-[#0B0F17] text-white overflow-hidden">
      <ChatInterface />
    </div>
  );
}
