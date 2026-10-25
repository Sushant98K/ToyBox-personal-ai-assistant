"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Play,
  Pause,
  Clock,
  ShieldAlert,
  Volume2,
  Check,
  Circle,
  ArrowUpRight,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { DashboardTab } from "../../types";
import { cn } from "@/lib/utils";
import { SocialIcon } from "@/components/icons/AppIcons";

interface PriorityItem {
  id: string;
  platform: "gmail" | "slack" | "whatsapp" | "calendar";
  title: string;
  context: string;
  time: string;
  priority: "high" | "medium" | "urgent";
}

interface DashboardBriefData {
  important_count: number;
  priority_count: number;
  followup_count: number;
  brief_bullets: string[];
  priority_items: PriorityItem[];
}

interface BriefingViewProps {
  currentUser?: {
    id?: string;
    name?: string;
    email?: string;
  } | null;
  onNavigateTab?: (tab: DashboardTab) => void;
}

export function BriefingView({ currentUser, onNavigateTab }: BriefingViewProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardBriefData | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<
    "all" | "urgent" | "high" | "medium"
  >("all");
  const [isPlaying, setIsPlaying] = useState(false);
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

  const currentUserId = currentUser?.id;
  const currentUserEmail = currentUser?.email;

  // Load synthesized briefing data from API
  useEffect(() => {
    let isCancelled = false;
    async function loadBriefing() {
      try {
        const headers: Record<string, string> = {};
        if (currentUserId) headers["x-user-id"] = currentUserId;
        if (currentUserEmail) headers["x-user-email"] = currentUserEmail;

        const res = await fetch("/api/dashboard", { headers, cache: "no-store" });
        if (res.ok && !isCancelled) {
          const json = await res.json();
          if (json.brief_data) setData(json.brief_data);
        }
      } catch (err) {
        console.warn("Error fetching briefing view data:", err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }
    loadBriefing();
    return () => {
      isCancelled = true;
    };
  }, [currentUserId, currentUserEmail]);

  // Toggle resolved state
  const toggleResolve = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setResolvedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Priority Rank: Urgent (1) -> High (2) -> Medium (3)
  const PRIORITY_ORDER: Record<string, number> = {
    urgent: 1,
    high: 2,
    medium: 3,
  };

  const rawItems = data?.priority_items || [];

  // Defensive filter: quiet distant future items (e.g. 2027, 2028) & deduplicate repeating birthdays
  const seenBirthdayKeys = new Set<string>();
  const sanitizedItems = rawItems.filter((item) => {
    const timeStr = item.time || "";
    const titleStr = item.title || "";
    const contextStr = item.context || "";

    // Silence distant future reminders (e.g. 2027, 2028)
    if (
      /\b202[7-9]\b|\b20[3-9]\d\b/.test(timeStr) ||
      /\b202[7-9]\b|\b20[3-9]\d\b/.test(titleStr) ||
      /\b202[7-9]\b|\b20[3-9]\d\b/.test(contextStr)
    ) {
      return false;
    }

    // Deduplicate repeating birthday / anniversary reminders
    const isBirthday =
      /\b(bday|birthday|anniversary)\b/i.test(titleStr) ||
      /\b(bday|birthday|anniversary)\b/i.test(contextStr);

    if (isBirthday) {
      const baseKey = titleStr
        .toLowerCase()
        .replace(/\b(20\d\d|upcoming)\b/g, "")
        .replace(/[^a-z0-9]/g, "")
        .trim();
      if (seenBirthdayKeys.has(baseKey)) {
        return false;
      }
      seenBirthdayKeys.add(baseKey);
    }

    return true;
  });

  // Sort with highest priority first
  const sortedItems = [...sanitizedItems].sort((a, b) => {
    const rankA = PRIORITY_ORDER[a.priority] ?? 99;
    const rankB = PRIORITY_ORDER[b.priority] ?? 99;
    return rankA - rankB;
  });

  // Filter according to priority filter
  const filteredItems = sortedItems.filter((item) => {
    if (selectedPriority === "all") return true;
    return item.priority === selectedPriority;
  });

  const counts = {
    all: sortedItems.length,
    urgent: sortedItems.filter((i) => i.priority === "urgent").length,
    high: sortedItems.filter((i) => i.priority === "high").length,
    medium: sortedItems.filter((i) => i.priority === "medium").length,
  };

  // Context action based on platform
  const getPlatformAction = (platform: PriorityItem["platform"]) => {
    switch (platform) {
      case "gmail":
        return {
          label: "Open Gmail",
          onClick: () => window.open("https://mail.google.com", "_blank"),
        };
      case "slack":
        return {
          label: "Open Slack",
          onClick: () => window.open("https://app.slack.com", "_blank"),
        };
      case "calendar":
        return {
          label: "Open Calendar",
          onClick: () => window.open("https://calendar.google.com", "_blank"),
        };
      case "whatsapp":
        return {
          label: "Manage WhatsApp",
          onClick: () => onNavigateTab?.("integrations"),
        };
      default:
        return {
          label: "Inspect Platform",
          onClick: () => onNavigateTab?.("integrations"),
        };
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in-50 duration-200">
      {/* ─── A. Briefing Audio & Summary Hero ─── */}
      <div className="rounded-[24px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--canvas)] border border-[var(--hairline)] text-xs font-[600] text-[var(--ink)]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Executive Daily Intelligence Briefing</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-[652] text-[var(--ink)] tracking-tight">
              Detailed Intelligence & Action Review.
            </h1>
            <p className="text-sm text-[var(--text-muted)] max-w-2xl font-[300] leading-relaxed">
              Synthesized across your connected feeds on Gmail, Slack, WhatsApp, and Google Calendar.
              Inspect prioritized decisions, listen to the voice summary, or clear active action checkpoints.
            </p>
          </div>

          {/* Audio Player Widget */}
          <div className="p-3.5 rounded-2xl bg-[var(--canvas)] border border-[var(--hairline)] flex items-center gap-3.5 shrink-0 shadow-none">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              aria-label={isPlaying ? "Pause briefing audio" : "Play briefing audio"}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 transition-all shrink-0 focus:outline-none cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-6 text-xs font-[600]">
                <span className="text-[var(--ink)] flex items-center gap-1.5 text-[11px]">
                  <Volume2 className="w-3.5 h-3.5 text-[#0066FF]" />
                  <span>Voice Briefing (AI Host)</span>
                </span>
                <span className="text-[var(--text-muted)] font-mono text-[10px]">
                  {isPlaying ? "01:14" : "00:00"} / 02:45
                </span>
              </div>
              <div className="w-40 sm:w-44 h-1.5 bg-[var(--hairline)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--primary)] rounded-full transition-all duration-300"
                  style={{ width: isPlaying ? "58%" : "25%" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Priority Filter Segmented Control Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-[var(--hairline)] overflow-x-auto scrollbar-none">
          {[
            { id: "all", label: "All Priority Items", count: counts.all },
            { id: "urgent", label: "Urgent Decisions", count: counts.urgent, dot: "bg-rose-500" },
            { id: "high", label: "High Priority", count: counts.high, dot: "bg-amber-500" },
            { id: "medium", label: "Medium Priority", count: counts.medium, dot: "bg-[var(--text-muted)]" },
          ].map((tab) => {
            const active = selectedPriority === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedPriority(tab.id as "all" | "urgent" | "high" | "medium")}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-[600] transition-all focus:outline-none whitespace-nowrap cursor-pointer flex items-center gap-1.5",
                  active
                    ? "bg-[var(--canvas)] text-[var(--ink)] border border-[var(--hairline)] shadow-none"
                    : "text-[var(--text-muted)] hover:text-[var(--ink)]"
                )}
              >
                {tab.dot && <span className={cn("w-1.5 h-1.5 rounded-full", tab.dot)} />}
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full",
                    active
                      ? "bg-[var(--canvas-soft)] text-[var(--ink)]"
                      : "text-[var(--text-faint)]"
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── B. Today's Key Highlights (Gemini Synthesis) ─── */}
      {data?.brief_bullets && data.brief_bullets.length > 0 && (
        <div className="rounded-[24px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline-soft)]">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline)] text-[#0066FF] shrink-0"
                style={{ borderRadius: "30%" }}
              >
                <Sparkles className="w-4 h-4 fill-current" />
              </div>
              <div>
                <h3 className="font-[652] text-sm sm:text-base text-[var(--ink)]">
                  Executive Briefing Synthesis.
                </h3>
                <p className="text-xs font-[300] text-[var(--text-muted)]">
                  High-level insights parsed from real integrated feeds
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#0066FF] text-white text-[11px] font-[600]">
              <Sparkles className="w-3 h-3 fill-current" />
              Gemini 3.5 Flash-Lite
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.brief_bullets.map((bullet, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3.5 rounded-[16px] bg-[var(--canvas)] border border-[var(--hairline-soft)] hover:border-[var(--hairline)] transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-[#0066FF] mt-1.5 shrink-0" />
                <p className="text-xs sm:text-sm text-[var(--ink)] leading-relaxed font-[456]">
                  {bullet}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── C. Detailed Priority Items Feed ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 flex items-center justify-center bg-[var(--canvas-soft)] border border-[var(--hairline)] text-[var(--ink)] shrink-0"
              style={{ borderRadius: "30%" }}
            >
              <ShieldAlert className="w-4 h-4 stroke-[1.8]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-[652] text-[var(--ink)] tracking-tight">
                Detailed Action Items ({filteredItems.length})
              </h2>
              <p className="text-xs text-[var(--text-muted)] font-[300]">
                Ranked by urgency: Highest priority first • Instant resolution & direct jump
              </p>
            </div>
          </div>

          <span className="text-xs text-[var(--text-muted)] font-[456] hidden sm:inline-block">
            {rawItems.filter((i) => !resolvedIds.has(i.id)).length} Unresolved total
          </span>
        </div>

        {loading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 bg-[var(--canvas-soft)] rounded-[20px] animate-pulse"
              />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 sm:p-12 text-center space-y-3 rounded-[24px] bg-[var(--canvas-soft)] border border-[var(--hairline-soft)]">
            <div
              className="w-12 h-12 mx-auto flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline)] text-[var(--text-muted)]"
              style={{ borderRadius: "30%" }}
            >
              <Check className="w-5 h-5 text-emerald-500" />
            </div>
            <h3 className="text-sm sm:text-base font-[652] text-[var(--ink)]">
              No {selectedPriority !== "all" ? `${selectedPriority} priority` : "pending"} items
            </h3>
            <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
              All intelligence items in this category have been addressed or resolved. Switch filter or return to all priorities.
            </p>
            {selectedPriority !== "all" && (
              <button
                type="button"
                onClick={() => setSelectedPriority("all")}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-[600] bg-[var(--canvas)] hover:bg-[var(--field)] text-[var(--ink)] border border-[var(--hairline)] transition-all cursor-pointer"
              >
                <span>View All Priority Items</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredItems.map((item) => {
              const isResolved = resolvedIds.has(item.id);
              const action = getPlatformAction(item.platform);

              const priorityBadge = {
                urgent: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
                high: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                medium: "bg-[var(--canvas)] text-[var(--text-muted)] border-[var(--hairline)]",
              }[item.priority] || "bg-[var(--canvas)] text-[var(--text-muted)] border-[var(--hairline)]";

              const platformName = {
                gmail: "Gmail Inbox",
                slack: "Slack Channel",
                calendar: "Google Calendar",
                whatsapp: "WhatsApp Telemetry",
              }[item.platform] || item.platform;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-[20px] bg-[var(--canvas-soft)] border p-5 sm:p-6 transition-all space-y-4 group",
                    isResolved
                      ? "border-[var(--hairline-soft)] opacity-60"
                      : "border-[var(--hairline)] hover:border-[var(--ink-soft)]/40"
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className="w-10 h-10 flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline)] shrink-0 p-2 mt-0.5"
                        style={{ borderRadius: "30%" }}
                      >
                        <SocialIcon
                          name={item.platform}
                          size={18}
                          className="w-4 h-4 object-contain"
                        />
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={cn(
                              "px-2.5 py-0.5 rounded-full text-[10px] font-[600] uppercase tracking-wider border",
                              priorityBadge
                            )}
                          >
                            {item.priority}
                          </span>

                          <span className="text-[11px] text-[var(--text-muted)] font-[500] flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--canvas)] border border-[var(--hairline)]">
                            <span>{platformName}</span>
                          </span>

                          <span className="text-[11px] text-[var(--text-faint)] font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.time}
                          </span>
                        </div>

                        <h3
                          className={cn(
                            "text-sm sm:text-base font-[652] transition-colors leading-snug",
                            isResolved ? "line-through text-[var(--text-faint)]" : "text-[var(--ink)]"
                          )}
                        >
                          {item.title}
                        </h3>

                        <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed font-[300] pt-1">
                          {item.context}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 pt-2 sm:pt-0">
                      <button
                        type="button"
                        onClick={(e) => toggleResolve(item.id, e)}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-[600] transition-all cursor-pointer",
                          isResolved
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                            : "bg-[var(--canvas)] hover:bg-[var(--field)] text-[var(--ink)] border border-[var(--hairline)]"
                        )}
                      >
                        {isResolved ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Resolved</span>
                          </>
                        ) : (
                          <>
                            <Circle className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                            <span>Mark Resolved</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={action.onClick}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-[600] bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        <span>{action.label}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
