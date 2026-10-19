"use client";

import React, { useState } from "react";
import {
  Puzzle,
  Mail,
  MessageSquare,
  Calendar,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface IntegrationItem {
  id: string;
  name: string;
  category: string;
  description: string;
  status: "connected" | "disconnected";
  lastSync: string;
  syncFrequency: string;
  messagesProcessed: string;
  icon: any;
}

export function IntegrationsView() {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([
    {
      id: "gmail",
      name: "Google Workspace / Gmail",
      category: "Email & Threads",
      description: "Autonomous classification, VIP priority flagging, and 1-click draft preparation",
      status: "connected",
      lastSync: "1 min ago",
      syncFrequency: "Real-time Webhook",
      messagesProcessed: "184 emails today",
      icon: Mail,
    },
    {
      id: "slack",
      name: "Slack Enterprise",
      category: "Team Messaging",
      description: "Executive channel digests, @mention triage, and thread sentiment analysis",
      status: "connected",
      lastSync: "Just now",
      syncFrequency: "Real-time Event API",
      messagesProcessed: "92 messages today",
      icon: MessageSquare,
    },
    {
      id: "whatsapp",
      name: "WhatsApp Business API",
      category: "Direct Messaging",
      description: "Client concierge, urgent lead detection, and executive auto-acknowledgement",
      status: "connected",
      lastSync: "4 mins ago",
      syncFrequency: "Webhook Stream",
      messagesProcessed: "41 chats today",
      icon: MessageSquare,
    },
    {
      id: "outlook",
      name: "Microsoft 365 / Outlook",
      category: "Corporate Email",
      description: "Secondary corporate inbox routing, calendar invites, and attachment extraction",
      status: "connected",
      lastSync: "8 mins ago",
      syncFrequency: "Graph API Polling",
      messagesProcessed: "31 emails today",
      icon: Mail,
    },
    {
      id: "google-calendar",
      name: "Google Calendar & Meet",
      category: "Scheduling",
      description: "Meeting preparation briefs, attendee dossiers, and automatic buffer holds",
      status: "connected",
      lastSync: "12 mins ago",
      syncFrequency: "Bi-directional Sync",
      messagesProcessed: "6 events today",
      icon: Calendar,
    },
    {
      id: "telegram",
      name: "Telegram Messenger",
      category: "Crypto & Community",
      description: "Monitors key announcement channels and VIP direct chats for operational updates",
      status: "disconnected",
      lastSync: "Never",
      syncFrequency: "Disabled",
      messagesProcessed: "0 chats",
      icon: MessageSquare,
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

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in-50 duration-200">
      {/* ─── Header ─── */}
      <div className="rounded-[24px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--canvas)] border border-[var(--hairline)] text-xs font-[600] text-[var(--ink)]">
            <Puzzle className="w-3.5 h-3.5 text-[#0066FF]" />
            <span>Connected Communication Feeds</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-[652] text-[var(--ink)] tracking-tight">
            Multi-Platform Integration Hub
          </h2>
          <p className="text-sm text-[var(--text-muted)] max-w-2xl font-[300]">
            Connect and synchronize all your executive communication channels. ToyBox securely ingests
            and synthesizes incoming streams with zero data training retention.
          </p>
        </div>

        <button
          type="button"
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 transition-all font-[600] text-xs sm:text-sm shrink-0 shadow-xs focus:outline-none"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Channel</span>
        </button>
      </div>

      {/* ─── Integrations Grid with Minimal Squircles ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {integrations.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.id}
              className="rounded-[20px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-5 flex flex-col justify-between space-y-4 hover:border-[var(--ink-soft)]/30 transition-colors"
            >
              <div className="space-y-3.5">
                <div className="flex items-start justify-between gap-3">
                  {/* Minimal Squircle Icon */}
                  <div
                    className="w-10 h-10 flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline)] text-[var(--ink)] shadow-2xs shrink-0"
                    style={{ borderRadius: "30%" }}
                  >
                    <Icon className="w-4 h-4 stroke-[1.8]" />
                  </div>

                  {/* Connection Status Badge */}
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-[600] border flex items-center gap-1.5",
                      item.status === "connected"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-[var(--canvas)] text-[var(--text-muted)] border-[var(--hairline)]"
                    )}
                  >
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        item.status === "connected" ? "bg-emerald-500" : "bg-gray-400"
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
                      "w-full py-1.5 rounded-full text-xs font-[600] transition-all border focus:outline-none",
                      item.status === "connected"
                        ? "bg-[var(--canvas)] text-[var(--text-muted)] hover:text-rose-500 hover:border-rose-500/30 border-[var(--hairline)]"
                        : "bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 border-transparent"
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
