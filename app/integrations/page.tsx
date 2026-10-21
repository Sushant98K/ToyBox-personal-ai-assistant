import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { IntegrationsView } from "@/components/dashboard/views/IntegrationsView";
import { siteConfig } from "@/config";
import { ArrowLeft, LayoutDashboard, Sparkles, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: `Platform Integrations & MCP Hub – ${siteConfig.name}`,
  description: `Connect and manage multi-platform communication channels including Gmail, WhatsApp, Slack, Outlook, Discord, LinkedIn, and Telegram via Model Context Protocol (MCP).`,
};

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--canvas)] text-[var(--ink)] transition-colors duration-200">
      {/* Top Floating Stadium Nav */}
      <Header />

      {/* Main Page Container */}
      <main className="flex-1 w-full px-4 sm:px-6 md:px-8 2xl:px-12 py-8 sm:py-12 space-y-6">
        {/* Navigation Breadcrumb / Top Bar */}
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] border-b border-[var(--hairline)] pb-4">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hover:text-[var(--ink)] transition-colors"
            >
              Home
            </Link>
            <span>/</span>
            <span className="text-[var(--ink)] font-[600]">Integrations</span>
          </div>

          <Link
            href="/dashboard?tab=integrations"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--canvas-soft)] border border-[var(--hairline)] hover:bg-[var(--field)] text-[var(--ink)] font-[600] transition-all cursor-pointer shadow-xs"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-[#0066FF]" />
            <span>Open in Dashboard</span>
          </Link>
        </div>

        {/* Embedded Full Integrations View with MCP modals & InsForge storage */}
        <IntegrationsView />
      </main>

      {/* Inverse Footer Band */}
      <Footer />
    </div>
  );
}
