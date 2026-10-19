"use client";

import React, { useState } from "react";
import {
  Puzzle,
  Plus,
  Search,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SocialIcon } from "@/components/icons/AppIcons";

interface IntegrationItem {
  id: string;
  name: string;
  category: "Email & Messaging" | "Productivity & Docs" | "Community & Chat";
  description: string;
  status: "connected" | "disconnected";
  lastSync: string;
  syncFrequency: string;
  messagesProcessed: string;
  socialIcon: string;
}

export function IntegrationsView() {
  const [filter, setFilter] = useState<"all" | "connected" | "email-messaging" | "productivity">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  const [integrations, setIntegrations] = useState<IntegrationItem[]>([
    {
      id: "gmail",
      name: "Google Workspace / Gmail",
      category: "Email & Messaging",
      description: "Autonomous classification, VIP priority flagging, and 1-click draft preparation",
      status: "connected",
      lastSync: "1 min ago",
      syncFrequency: "Real-time Webhook",
      messagesProcessed: "184 emails today",
      socialIcon: "gmail",
    },
    {
      id: "slack",
      name: "Slack Enterprise",
      category: "Email & Messaging",
      description: "Executive channel digests, @mention triage, and thread sentiment analysis",
      status: "connected",
      lastSync: "Just now",
      syncFrequency: "Real-time Event API",
      messagesProcessed: "92 messages today",
      socialIcon: "slack",
    },
    {
      id: "whatsapp",
      name: "WhatsApp Business API",
      category: "Email & Messaging",
      description: "Client concierge, urgent lead detection, and executive auto-acknowledgement",
      status: "connected",
      lastSync: "4 mins ago",
      syncFrequency: "Webhook Stream",
      messagesProcessed: "41 chats today",
      socialIcon: "whatsapp",
    },
    {
      id: "outlook",
      name: "Microsoft 365 / Outlook",
      category: "Email & Messaging",
      description: "Secondary corporate inbox routing, calendar invites, and attachment extraction",
      status: "connected",
      lastSync: "8 mins ago",
      syncFrequency: "Graph API Polling",
      messagesProcessed: "31 emails today",
      socialIcon: "outlook",
    },
    {
      id: "google-calendar",
      name: "Google Calendar & Meet",
      category: "Productivity & Docs",
      description: "Meeting preparation briefs, attendee dossiers, and automatic buffer holds",
      status: "connected",
      lastSync: "12 mins ago",
      syncFrequency: "Bi-directional Sync",
      messagesProcessed: "6 events today",
      socialIcon: "gcal",
    },
    {
      id: "telegram",
      name: "Telegram Messenger",
      category: "Email & Messaging",
      description: "Monitors key announcement channels and VIP direct chats for operational updates",
      status: "disconnected",
      lastSync: "Never",
      syncFrequency: "Disabled",
      messagesProcessed: "0 chats",
      socialIcon: "telegram",
    },
    {
      id: "notion",
      name: "Notion Knowledge Base",
      category: "Productivity & Docs",
      description: "Automatic meeting action item extraction, project status boards, and executive dossiers",
      status: "connected",
      lastSync: "15 mins ago",
      syncFrequency: "Bi-directional Sync",
      messagesProcessed: "14 pages today",
      socialIcon: "notion",
    },
    {
      id: "discord",
      name: "Discord Community",
      category: "Community & Chat",
      description: "Monitors announcement channels, VIP tester feedback, and critical incident room alerts",
      status: "disconnected",
      lastSync: "Never",
      syncFrequency: "Disabled",
      messagesProcessed: "0 alerts",
      socialIcon: "discord",
    },
  ]);

  const toggleConnect = (id: string) => {
    setIntegrations((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === "connected" ? "disconnected" : "connected",
              lastSync: item.status === "connected" ? "Disconnected" : "Just now",
            }
          : item
      )
    );
  };

  const handleSyncAll = () => {
    setIsSyncingAll(true);
    setTimeout(() => {
      setIsSyncingAll(false);
      setIntegrations((prev) =>
        prev.map((item) =>
          item.status === "connected" ? { ...item, lastSync: "Just now" } : item
        )
      );
    }, 1200);
  };

  const filteredIntegrations = integrations.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === "connected") return item.status === "connected";
    if (filter === "email-messaging") return item.category === "Email & Messaging";
    if (filter === "productivity") return item.category === "Productivity & Docs" || item.category === "Community & Chat";

    return true;
  });

  const connectedCount = integrations.filter((i) => i.status === "connected").length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in-50 duration-200">
      {/* ─── Header Banner ─── */}
      <div className="rounded-[24px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--canvas)] border border-[var(--hairline)] text-xs font-[600] text-[var(--ink)]">
            <Puzzle className="w-3.5 h-3.5 text-[#0066FF]" />
            <span>Connected Communication Feeds</span>
            <span className="w-1 h-1 rounded-full bg-[var(--text-faint)]" />
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{connectedCount} Active</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-[652] text-[var(--ink)] tracking-tight">
            Multi-Platform Integration Hub
          </h2>
          <p className="text-sm text-[var(--text-muted)] max-w-2xl font-[300]">
            Connect and synchronize all your executive communication channels. ToyBox securely ingests
            and synthesizes incoming streams with zero data training retention.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleSyncAll}
            disabled={isSyncingAll}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[var(--canvas)] border border-[var(--hairline)] hover:bg-[var(--field)] text-[var(--ink)] transition-all font-[600] text-xs sm:text-sm focus:outline-none disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isSyncingAll && "animate-spin text-[#0066FF]")} />
            <span>{isSyncingAll ? "Syncing..." : "Sync All"}</span>
          </button>

          <button
            type="button"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 transition-all font-[600] text-xs sm:text-sm shadow-xs focus:outline-none"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Channel</span>
          </button>
        </div>
      </div>

      {/* ─── Search & Category Filter Pills ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-[600] transition-all whitespace-nowrap",
              filter === "all"
                ? "bg-[var(--primary)] text-[var(--on-primary)]"
                : "bg-[var(--canvas-soft)] text-[var(--text-muted)] border border-[var(--hairline)] hover:text-[var(--ink)]"
            )}
          >
            All Channels ({integrations.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("connected")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-[600] transition-all whitespace-nowrap flex items-center gap-1.5",
              filter === "connected"
                ? "bg-[var(--primary)] text-[var(--on-primary)]"
                : "bg-[var(--canvas-soft)] text-[var(--text-muted)] border border-[var(--hairline)] hover:text-[var(--ink)]"
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Connected ({connectedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("email-messaging")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-[600] transition-all whitespace-nowrap",
              filter === "email-messaging"
                ? "bg-[var(--primary)] text-[var(--on-primary)]"
                : "bg-[var(--canvas-soft)] text-[var(--text-muted)] border border-[var(--hairline)] hover:text-[var(--ink)]"
            )}
          >
            Email & Messaging
          </button>
          <button
            type="button"
            onClick={() => setFilter("productivity")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-[600] transition-all whitespace-nowrap",
              filter === "productivity"
                ? "bg-[var(--primary)] text-[var(--on-primary)]"
                : "bg-[var(--canvas-soft)] text-[var(--text-muted)] border border-[var(--hairline)] hover:text-[var(--ink)]"
            )}
          >
            Productivity & Community
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[var(--text-faint)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search integrations..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-full bg-[var(--field)] border border-transparent focus:border-[var(--hairline)] text-[var(--ink)] placeholder:text-[var(--text-faint)] outline-none transition-all"
          />
        </div>
      </div>

      {/* ─── Integrations Grid with Real Brand Squircles ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredIntegrations.map((item) => {
          return (
            <div
              key={item.id}
              className="rounded-[20px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-5 flex flex-col justify-between space-y-4 hover:border-[var(--ink-soft)]/30 transition-all group"
            >
              <div className="space-y-3.5">
                <div className="flex items-start justify-between gap-3">
                  {/* Real Downloaded Social Brand Icon in 30% Squircle */}
                  <div
                    className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline)] p-2 shrink-0 transition-transform group-hover:scale-105"
                    style={{ borderRadius: "30%" }}
                  >
                    <SocialIcon
                      name={item.socialIcon}
                      size={28}
                      className="w-7 h-7 object-contain"
                      alt={item.name}
                    />
                  </div>

                  {/* Connection Status Badge */}
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-[600] border flex items-center gap-1.5",
                      item.status === "connected"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-[var(--canvas)] text-[var(--text-muted)] border-[var(--hairline)]"
                    )}
                  >
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        item.status === "connected" ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
                      )}
                    />
                    <span>{item.status === "connected" ? "Connected" : "Disconnected"}</span>
                  </span>
                </div>

                <div>
                  <h3 className="font-[652] text-sm sm:text-base text-[var(--ink)] tracking-tight">
                    {item.name}
                  </h3>
                  <span className="text-[11px] text-[var(--text-muted)] font-[500] block mt-0.5">
                    {item.category}
                  </span>
                  <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed font-[300]">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--hairline)] space-y-2 text-xs">
                <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                  <span>Last Synced:</span>
                  <span className="font-[600] text-[var(--ink)]">{item.lastSync}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                  <span>Throughput:</span>
                  <span className="font-[600] text-[var(--ink)]">{item.messagesProcessed}</span>
                </div>

                <div className="pt-1.5">
                  <button
                    type="button"
                    onClick={() => toggleConnect(item.id)}
                    className={cn(
                      "w-full py-2 rounded-full text-xs font-[600] transition-all border focus:outline-none cursor-pointer",
                      item.status === "connected"
                        ? "bg-[var(--canvas)] text-[var(--text-muted)] hover:text-rose-500 hover:border-rose-500/30 border-[var(--hairline)]"
                        : "bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 border-transparent shadow-xs"
                    )}
                  >
                    {item.status === "connected" ? "Disconnect Channel" : "Connect Channel"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
