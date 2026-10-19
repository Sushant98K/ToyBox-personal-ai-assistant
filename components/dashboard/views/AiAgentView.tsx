"use client";

import React, { useState } from "react";
import {
  Bot,
  Sparkles,
  Mail,
  MessageSquare,
  Calendar,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SocialIcon } from "@/components/icons/AppIcons";

interface AgentItem {
  id: string;
  name: string;
  role: string;
  channels: string[];
  autonomyLevel: "Full Autopilot" | "Semi-Autonomous" | "Manual Approval";
  status: "active" | "paused";
  tasksCompleted: number;
  lastExecution: string;
  icon: any;
}

export function AiAgentView() {
  const [agents, setAgents] = useState<AgentItem[]>([
    {
      id: "inbox-triager",
      name: "Inbox Triager & Gatekeeper",
      role: "Filters spam, auto-labels VIP clients, and generates draft replies for executive approval",
      channels: ["Gmail", "Outlook"],
      autonomyLevel: "Semi-Autonomous",
      status: "active",
      tasksCompleted: 142,
      lastExecution: "3 mins ago",
      icon: Mail,
    },
    {
      id: "whatsapp-concierge",
      name: "Instant Messaging Concierge",
      role: "Triages WhatsApp and Telegram threads, flags urgent requests, and summarizes group noise",
      channels: ["WhatsApp", "Telegram"],
      autonomyLevel: "Full Autopilot",
      status: "active",
      tasksCompleted: 88,
      lastExecution: "12 mins ago",
      icon: MessageSquare,
    },
    {
      id: "calendar-negotiator",
      name: "Executive Calendar Negotiator",
      role: "Defends deep work blocks, resolves scheduling conflicts, and preps briefing notes before calls",
      channels: ["Google Calendar", "Meet"],
      autonomyLevel: "Semi-Autonomous",
      status: "active",
      tasksCompleted: 54,
      lastExecution: "28 mins ago",
      icon: Calendar,
    },
    {
      id: "briefing-synthesizer",
      name: "Daily Synthesis Engine",
      role: "Gathers cross-platform data at 7:00 AM & 5:00 PM to build the executive morning & evening briefs",
      channels: ["All Connected Sources"],
      autonomyLevel: "Full Autopilot",
      status: "active",
      tasksCompleted: 310,
      lastExecution: "5:00 PM EST",
      icon: Sparkles,
    },
  ]);

  const toggleAgentStatus = (id: string) => {
    setAgents((prev) =>
      prev.map((agent) =>
        agent.id === id
          ? { ...agent, status: agent.status === "active" ? "paused" : "active" }
          : agent
      )
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in-50 duration-200">
      {/* ─── Header Summary ─── */}
      <div className="rounded-[24px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--canvas)] border border-[var(--hairline)] text-xs font-[600] text-[var(--ink)]">
            <Bot className="w-3.5 h-3.5 text-[#0066FF]" />
            <span>Autonomous Agent Fleet</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-[652] text-[var(--ink)] tracking-tight">
            Personal Assistant Micro-Agents
          </h2>
          <p className="text-sm text-[var(--text-muted)] max-w-2xl font-[300]">
            Each agent operates continuously in the background with defined security perimeters,
            executing tasks or drafting actions for executive sign-off.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-full bg-[var(--canvas)] border border-[var(--hairline)] text-xs font-[600] text-[var(--ink)] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>3 Active • 1 Standby</span>
          </div>
        </div>
      </div>

      {/* ─── Agent Cards Grid with Minimal Theme Squircles ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {agents.map((agent) => {
          const Icon = agent.icon;

          return (
            <div
              key={agent.id}
              className="rounded-[20px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-5 space-y-4 hover:border-[var(--ink-soft)]/30 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                {/* Top Row: Minimal Squircle + Status Toggle */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline)] text-[var(--ink)] shadow-2xs shrink-0"
                      style={{ borderRadius: "30%" }}
                    >
                      <Icon className="w-4 h-4 stroke-[1.8]" />
                    </div>
                    <div>
                      <h3 className="font-[652] text-sm sm:text-base text-[var(--ink)] tracking-tight">
                        {agent.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {agent.channels.map((ch) => {
                          const lower = ch.toLowerCase();
                          const iconName = lower.includes("gmail")
                            ? "gmail"
                            : lower.includes("outlook")
                            ? "outlook"
                            : lower.includes("whatsapp")
                            ? "whatsapp"
                            : lower.includes("telegram")
                            ? "telegram"
                            : lower.includes("calendar") || lower.includes("meet")
                            ? "gcal"
                            : lower.includes("slack")
                            ? "slack"
                            : lower.includes("notion")
                            ? "notion"
                            : lower.includes("discord")
                            ? "discord"
                            : null;
                          return (
                            <span
                              key={ch}
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--canvas)] border border-[var(--hairline-soft)] text-[10px] font-[500] text-[var(--text-muted)]"
                            >
                              {iconName && (
                                <SocialIcon
                                  name={iconName}
                                  size={12}
                                  className="w-3 h-3 object-contain"
                                />
                              )}
                              <span>{ch}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Pause/Resume Switch */}
                  <button
                    type="button"
                    onClick={() => toggleAgentStatus(agent.id)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-[11px] font-[600] border transition-all flex items-center gap-1.5 focus:outline-none",
                      agent.status === "active"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-[var(--canvas)] text-[var(--text-muted)] border-[var(--hairline)]"
                    )}
                  >
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        agent.status === "active" ? "bg-emerald-500" : "bg-gray-400"
                      )}
                    />
                    <span>{agent.status === "active" ? "Active" : "Paused"}</span>
                  </button>
                </div>

                {/* Role Description */}
                <p className="text-xs text-[var(--text-muted)] leading-relaxed font-[300]">
                  {agent.role}
                </p>
              </div>

              {/* Metrics Footer */}
              <div className="pt-3 border-t border-[var(--hairline)] flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-[var(--text-faint)] block text-[9px] uppercase font-bold">
                      Mode
                    </span>
                    <span className="font-[600] text-[var(--ink)] text-[11px]">
                      {agent.autonomyLevel}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-faint)] block text-[9px] uppercase font-bold">
                      Processed
                    </span>
                    <span className="font-[600] text-[var(--ink)] text-[11px]">
                      {agent.tasksCompleted} tasks
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-faint)] block text-[9px] uppercase font-bold">
                      Last Run
                    </span>
                    <span className="text-[var(--text-muted)] text-[11px]">
                      {agent.lastExecution}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--ink)] hover:bg-[var(--canvas)] border border-transparent hover:border-[var(--hairline)] transition-colors"
                  title="Configure Agent Prompts"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
