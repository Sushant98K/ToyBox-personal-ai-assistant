"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertItem {
  id: number;
  title: string;
  source: string;
  channel: string;
  time: string;
  severity: "critical" | "warning" | "info";
  summary: string;
  recommendedAction: string;
  status: "pending" | "resolved" | "dismissed";
}

export function AlertsView() {
  const [filter, setFilter] = useState<"all" | "critical" | "warning">("all");
  const [alerts, setAlerts] = useState<AlertItem[]>([
    {
      id: 1,
      title: "Board of Directors Q4 Session Time Shift Required",
      source: "Slack #board-directors",
      channel: "Slack",
      time: "14 mins ago",
      severity: "critical",
      summary: "Lead Partner requested 30-min shift to 4:30 PM due to aircraft departure delays. No overlapping calendar conflicts detected.",
      recommendedAction: "Confirm 4:30 PM EST start and push calendar updates to board members",
      status: "pending",
    },
    {
      id: 2,
      title: "Revised Enterprise Vendor NDA Approval Needed",
      source: "WhatsApp VIP Direct Line",
      channel: "WhatsApp",
      time: "38 mins ago",
      severity: "critical",
      summary: "Datadog VP of Procurement sent modified redline terms for 2026 enterprise commitment. Legal AI verified terms align with standard guidelines.",
      recommendedAction: "Sign electronic addendum & transmit verification via WhatsApp concierge",
      status: "pending",
    },
    {
      id: 3,
      title: "Spike in Unsolicited Outbound Pitch Requests",
      source: "Gmail Primary Inbox",
      channel: "Gmail",
      time: "1 hour ago",
      severity: "warning",
      summary: "18 sales reps sent meeting requests with zero mutual connections. Inbox Gatekeeper blocked calendar access and routed them to intake form.",
      recommendedAction: "Archive blocked requests & maintain strict gatekeeping filters",
      status: "pending",
    },
    {
      id: 4,
      title: "Domain Certificate Renewal Scheduled",
      source: "Cloudflare Automated Webhook",
      channel: "System Alert",
      time: "3 hours ago",
      severity: "info",
      summary: "SSL certificate for toybox.ai auto-renewed successfully for another 12 months. Zero downtime expected.",
      recommendedAction: "No action required • Logged to security audit records",
      status: "pending",
    },
  ]);

  const handleResolve = (id: number) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "resolved" } : a))
    );
  };

  const handleDismiss = (id: number) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "dismissed" } : a))
    );
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filter === "critical") return a.severity === "critical";
    if (filter === "warning") return a.severity === "warning";
    return true;
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in-50 duration-200">
      {/* ─── Header ─── */}
      <div className="rounded-[24px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--canvas)] border border-[var(--hairline)] text-xs font-[600] text-[var(--ink)]">
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
            <span>Priority Signal Stream</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-[652] text-[var(--ink)] tracking-tight">
            Executive Alerts & Action Queue
          </h2>
          <p className="text-sm text-[var(--text-muted)] max-w-2xl font-[300]">
            ToyBox continuously audits every incoming message, chat, and event, escalating only those
            that meet your executive priority threshold.
          </p>
        </div>

        {/* Severity Filter Pills */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-[600] transition-all border focus:outline-none",
              filter === "all"
                ? "bg-[var(--canvas)] text-[var(--ink)] border-[var(--hairline)] shadow-2xs"
                : "text-[var(--text-muted)] hover:text-[var(--ink)] border-transparent"
            )}
          >
            All Alerts ({alerts.filter((a) => a.status === "pending").length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("critical")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-[600] transition-all border focus:outline-none flex items-center gap-1.5",
              filter === "critical"
                ? "bg-[var(--canvas)] text-[var(--ink)] border-[var(--hairline)] shadow-2xs"
                : "text-[var(--text-muted)] hover:text-[var(--ink)] border-transparent"
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Critical (2)</span>
          </button>
        </div>
      </div>

      {/* ─── Alerts Stream List ─── */}
      <div className="space-y-3.5">
        {filteredAlerts.map((item) => (
          <div
            key={item.id}
            className={cn(
              "rounded-[20px] bg-[var(--canvas-soft)] border p-5 transition-all space-y-3.5",
              item.status === "resolved"
                ? "opacity-60 border-[var(--hairline-soft)]"
                : "border-[var(--hairline)] hover:border-[var(--ink-soft)]/30"
            )}
          >
            <div className="flex items-start gap-3.5">
              {/* Minimal Squircle Icon */}
              <div
                className={cn(
                  "w-9 h-9 flex items-center justify-center shrink-0 shadow-2xs border",
                  item.severity === "critical"
                    ? "bg-[var(--canvas)] border-[var(--hairline)] text-rose-500"
                    : item.severity === "warning"
                    ? "bg-[var(--canvas)] border-[var(--hairline)] text-amber-500"
                    : "bg-[var(--canvas)] border-[var(--hairline)] text-[var(--text-muted)]"
                )}
                style={{ borderRadius: "30%" }}
              >
                <AlertCircle className="w-4 h-4 stroke-[1.8]" />
              </div>

              <div className="flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight uppercase",
                        item.severity === "critical"
                          ? "bg-rose-500/15 text-rose-500 border border-rose-500/20"
                          : item.severity === "warning"
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          : "bg-[var(--field)] text-[var(--text-muted)]"
                      )}
                    >
                      {item.severity}
                    </span>
                    <span className="text-xs font-[600] text-[var(--text-muted)]">
                      {item.source}
                    </span>
                  </div>

                  <span className="text-[11px] text-[var(--text-faint)] flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{item.time}</span>
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-[652] text-[var(--ink)] tracking-tight">
                  {item.title}
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed font-[300]">
                  {item.summary}
                </p>

                {/* Recommended Agent Action Bar */}
                <div className="p-3 rounded-xl bg-[var(--canvas)] border border-[var(--hairline-soft)] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#0066FF] shrink-0" />
                    <span className="text-[var(--ink)] font-[500] text-[11px]">
                      <strong className="font-[600]">Action:</strong> {item.recommendedAction}
                    </span>
                  </div>

                  {item.status === "pending" ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleResolve(item.id)}
                        className="px-3.5 py-1.5 rounded-full bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 font-[600] transition-opacity flex items-center gap-1.5 text-xs focus:outline-none"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Execute Now</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDismiss(item.id)}
                        className="px-3 py-1.5 rounded-full bg-[var(--canvas-soft)] hover:bg-[var(--hairline)] text-[var(--text-muted)] hover:text-[var(--ink)] font-[600] transition-colors text-xs focus:outline-none"
                      >
                        Dismiss
                      </button>
                    </div>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-[600] text-xs flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Resolved</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
