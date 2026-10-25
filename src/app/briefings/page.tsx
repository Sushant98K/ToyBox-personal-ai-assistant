"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  RefreshCw,
  Plus,
  Calendar,
  Clock,
  ArrowRight,
  Trash2,
  ExternalLink,
  Mail,
  MessageSquare,
  AtSign,
  CalendarCheck,
  CheckCircle2,
  ShieldAlert,
  ChevronRight,
  Filter,
} from "lucide-react";
import { SocialIcon } from "@/components/icons/AppIcons";
import { CreateCustomBriefingModal } from "@/components/briefings/CreateCustomBriefingModal";
import { GeneratedBriefing, BriefingSchedule, BriefingCategory } from "@/types/briefing";
import { formatHumanDateTime, formatSnippetText } from "@/lib/briefings/date-formatter";
import { deduplicateBriefingItems, detectCalendarHorizon } from "@/lib/briefings/deduplicate";
import { insforge } from "@/lib/insforge";

export default function BriefingsPage() {
  const router = useRouter();

  // State
  const [briefings, setBriefings] = useState<GeneratedBriefing[]>([]);
  const [schedules, setSchedules] = useState<BriefingSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoBriefingActive, setAutoBriefingActive] = useState(true);
  const [dateFilter, setDateFilter] = useState<"6h" | "today" | "week" | "all">("today");
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  // Load user session and briefings data
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const { data: authData } = await insforge.auth.getCurrentUser();
        const currentUserId = authData?.user?.id;
        if (isMounted && currentUserId) {
          setUserId(currentUserId);
        }

        const headers: Record<string, string> = {};
        if (currentUserId) headers["x-user-id"] = currentUserId;

        // Fetch historical briefings
        const [briefingsRes, schedulesRes] = await Promise.all([
          fetch("/api/briefings", { headers, cache: "no-store" }),
          fetch("/api/briefings/schedules", { headers, cache: "no-store" }),
        ]);

        if (briefingsRes.ok && isMounted) {
          const bJson = await briefingsRes.json();
          if (bJson.briefings && Array.isArray(bJson.briefings)) {
            setBriefings(bJson.briefings);
          }
        }

        if (schedulesRes.ok && isMounted) {
          const sJson = await schedulesRes.json();
          if (sJson.schedules && Array.isArray(sJson.schedules)) {
            setSchedules(sJson.schedules);
            const hasActive = sJson.schedules.some((s: BriefingSchedule) => s.is_active);
            setAutoBriefingActive(hasActive || sJson.schedules.length === 0);
          }
        }
      } catch (err) {
        console.warn("Error fetching briefings page data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle On-Demand Briefing Generation
  const handleGenerateNow = async () => {
    setIsGenerating(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (userId) headers["x-user-id"] = userId;

      const res = await fetch("/api/briefings/trigger", {
        method: "POST",
        headers,
        body: JSON.stringify({
          promptGoal: "Executive Intelligence Briefing",
        }),
      });

      if (!res.ok) {
        throw new Error("Briefing generation failed");
      }

      const json = await res.json();
      if (json.briefing) {
        setBriefings((prev) => [json.briefing, ...prev.filter((b) => b.id !== json.briefing.id)]);
      }
    } catch (err) {
      console.error("Error triggering on-demand briefing:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle Auto Briefing Schedule
  const handleToggleAutoBriefing = async () => {
    const nextState = !autoBriefingActive;
    setAutoBriefingActive(nextState);

    // If schedules exist, toggle the first active schedule
    if (schedules.length > 0) {
      try {
        const target = schedules[0];
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (userId) headers["x-user-id"] = userId;

        await fetch(`/api/briefings/schedules/${target.id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ is_active: nextState }),
        });
      } catch (e) {
        console.warn("Could not sync schedule toggle:", e);
      }
    }
  };

  // Delete Briefing
  const handleDeleteBriefing = async (briefingId: string) => {
    try {
      const headers: Record<string, string> = {};
      if (userId) headers["x-user-id"] = userId;

      const res = await fetch(`/api/briefings/${briefingId}`, {
        method: "DELETE",
        headers,
      });

      if (res.ok) {
        setBriefings((prev) => prev.filter((b) => b.id !== briefingId));
        setDeleteConfirmId(null);
      }
    } catch (e) {
      console.error("Failed to delete briefing:", e);
    }
  };

  const latestBriefing = briefings[0] || null;

  const latestItems = React.useMemo(() => {
    const horizonDays = detectCalendarHorizon(
      `${latestBriefing?.title || ""} ${latestBriefing?.executive_summary || ""}`,
      7
    );
    return deduplicateBriefingItems(latestBriefing?.categorized_items || [], {
      referenceDate: latestBriefing?.created_at || latestBriefing?.date,
      calendarHorizonDays: horizonDays,
      contextText: `${latestBriefing?.title || ""} ${latestBriefing?.executive_summary || ""}`,
    });
  }, [
    latestBriefing?.categorized_items,
    latestBriefing?.created_at,
    latestBriefing?.date,
    latestBriefing?.title,
    latestBriefing?.executive_summary,
  ]);

  // Filter briefings by date range
  const filteredBriefings = briefings.filter((b) => {
    if (dateFilter === "all") return true;
    const bDate = new Date(b.created_at || b.date).getTime();
    const now = Date.now();
    if (dateFilter === "6h") return now - bDate <= 6 * 60 * 60 * 1000;
    if (dateFilter === "today") return now - bDate <= 24 * 60 * 60 * 1000;
    if (dateFilter === "week") return now - bDate <= 7 * 24 * 60 * 60 * 1000;
    return true;
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in-50 duration-200">
      {/* ─── A. Page Header & Action Bar ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--hairline-soft)]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--canvas-soft)] border border-[var(--hairline)] text-xs font-[600] text-[#0066FF] mb-2">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>Autonomous Intelligence Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-[652] text-[var(--ink)] tracking-tight">
            Intelligence Briefings.
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] font-[300] mt-1">
            Smart, actionable daily briefings aggregated from your connected platforms.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Auto Briefing Toggle */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--canvas-soft)] border border-[var(--hairline)] text-xs font-[500]">
            <span className="text-[var(--text-muted)]">Auto Briefing</span>
            <button
              type="button"
              onClick={handleToggleAutoBriefing}
              aria-label="Toggle Auto Briefing"
              className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                autoBriefingActive ? "bg-emerald-500" : "bg-[var(--raised)] border border-[var(--hairline)]"
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white transition-transform duration-150 absolute top-0.5 ${
                  autoBriefingActive ? "left-4.5" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center bg-[var(--canvas-soft)] p-1 rounded-full border border-[var(--hairline)] text-xs font-[500]">
            {(
              [
                { id: "6h", label: "6h" },
                { id: "today", label: "Today" },
                { id: "week", label: "This Week" },
                { id: "all", label: "All" },
              ] as const
            ).map((df) => (
              <button
                key={df.id}
                type="button"
                onClick={() => setDateFilter(df.id)}
                className={`px-3 py-1 rounded-full text-[11px] font-[600] transition-all cursor-pointer ${
                  dateFilter === df.id
                    ? "bg-[var(--canvas)] text-[var(--ink)] border border-[var(--hairline)] shadow-2xs"
                    : "text-[var(--text-muted)] hover:text-[var(--ink)]"
                }`}
              >
                {df.label}
              </button>
            ))}
          </div>

          {/* Generate Now Button */}
          <button
            type="button"
            onClick={handleGenerateNow}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 transition-opacity text-xs font-[600] shadow-sm cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
            <span>{isGenerating ? "Synthesizing..." : "Generate Now"}</span>
          </button>

          {/* Create Custom Briefing Button */}
          <button
            type="button"
            onClick={() => setIsCustomModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--canvas-soft)] hover:bg-[var(--field)] text-[var(--ink)] border border-[var(--hairline)] transition-all text-xs font-[600] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Custom Briefing</span>
          </button>
        </div>
      </div>

      {/* ─── B. Top Highlight Card (Today's Executive Briefing) ─── */}
      {latestBriefing ? (
        <div className="rounded-[24px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-5 border-b border-[var(--hairline)]">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-[#0066FF] text-white text-[11px] font-[600] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 fill-current" />
                  Latest Synthesis
                </span>
                <span className="text-xs text-[var(--text-muted)] font-mono flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatHumanDateTime(latestBriefing.created_at || latestBriefing.date)}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-[652] text-[var(--ink)] tracking-tight">
                {latestBriefing.title}
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-3xl leading-relaxed font-[300]">
                {latestBriefing.executive_summary}
              </p>
            </div>

            {/* Platform Badges & Full Breakdown Jump */}
            <div className="flex flex-col sm:items-end gap-3 shrink-0">
              <div className="flex items-center gap-1.5">
                {latestBriefing.platforms_used.map((plat) => (
                  <div
                    key={plat}
                    className="w-8 h-8 flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline)] p-1.5"
                    style={{ borderRadius: "30%" }}
                    title={plat}
                  >
                    <SocialIcon name={plat} size={18} className="w-4 h-4 object-contain" />
                  </div>
                ))}
                <span className="text-xs text-[var(--text-muted)] ml-2 font-[500]">
                  {latestItems.length} items analyzed
                </span>
              </div>

              <Link
                href={`/briefings/${latestBriefing.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 transition-opacity text-xs font-[600] cursor-pointer"
              >
                <span>View Full Breakdown</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Key Bulleted Highlights with App Badges */}
          <div className="space-y-3">
            <h3 className="text-xs font-[600] uppercase tracking-wider text-[var(--text-muted)]">
              Executive Highlights & Urgency Signals
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {latestBriefing.highlights.map((highlight, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-[var(--canvas)] border border-[var(--hairline-soft)] hover:border-[var(--hairline)] transition-colors"
                >
                  <div
                    className="w-6 h-6 flex items-center justify-center bg-[var(--canvas-soft)] border border-[var(--hairline)] shrink-0 p-1 mt-0.5"
                    style={{ borderRadius: "30%" }}
                  >
                    <SocialIcon name={highlight.platform} size={14} className="w-3.5 h-3.5 object-contain" />
                  </div>
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-[var(--ink)] leading-snug font-[456]">
                      {highlight.text}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <span
                        className={`text-[9px] px-2 py-0.2 rounded-full font-[600] uppercase tracking-wider ${
                          highlight.urgency === "urgent"
                            ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                            : highlight.urgency === "high"
                            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            : "bg-[var(--canvas-soft)] text-[var(--text-muted)]"
                        }`}
                      >
                        {highlight.urgency}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : loading ? (
        <div className="h-64 rounded-[24px] bg-[var(--canvas-soft)] animate-pulse border border-[var(--hairline)]" />
      ) : (
        <div className="rounded-[24px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-8 sm:p-12 text-center space-y-4">
          <div
            className="w-14 h-14 mx-auto flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline)] text-[#0066FF]"
            style={{ borderRadius: "30%" }}
          >
            <Sparkles className="w-7 h-7 fill-current" />
          </div>
          <h2 className="text-lg sm:text-xl font-[652]">No Briefing Generated Yet</h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
            Generate your first executive daily intelligence report to scan Gmail, WhatsApp, Slack, and Google Calendar.
          </p>
          <button
            type="button"
            onClick={handleGenerateNow}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 transition-opacity text-xs font-[600] shadow-sm cursor-pointer"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>{isGenerating ? "Synthesizing with Gemini..." : "Generate First Briefing"}</span>
          </button>
        </div>
      )}

      {/* ─── C. Category Overview Grid ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-[652] text-[var(--ink)] tracking-tight">
            Categorized Feeds Overview
          </h2>
          <span className="text-xs text-[var(--text-muted)]">
            Click any category card to drill down into actionable items
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {[
            {
              id: "emails",
              label: "Emails",
              app: "gmail",
              appName: "Gmail",
              icon: Mail,
              count: latestItems.filter((i) => i.type === "email").length,
              synopsis: "Unread threads, VIP board approvals, vendor agreements",
            },
            {
              id: "messages",
              label: "Messages",
              app: "whatsapp",
              appName: "WhatsApp & Slack",
              icon: MessageSquare,
              count: latestItems.filter((i) => i.type === "message").length,
              synopsis: "Customer pings, direct priority messages & triage",
            },
            {
              id: "mentions",
              label: "Mentions",
              app: "slack",
              appName: "Slack @mentions",
              icon: AtSign,
              count: latestItems.filter((i) => i.type === "mention").length,
              synopsis: "Channel discussions where you were explicitly tagged",
            },
            {
              id: "meetings",
              label: "Schedule",
              app: "gcal",
              appName: "Google Calendar",
              icon: CalendarCheck,
              count: latestItems.filter((i) => i.type === "meeting").length,
              synopsis: "Upcoming appointments, agenda blocks & conflicts",
            },
            {
              id: "followups",
              label: "Follow-ups",
              app: "gmail",
              appName: "Deadlines & Tasks",
              icon: CheckCircle2,
              count: latestItems.filter((i) => i.type === "task" || i.type === "followup").length,
              synopsis: "Open loops, pending replies & executive approvals",
            },
          ].map((cat) => {
            const targetBriefingId = latestBriefing?.id;
            const href = targetBriefingId
              ? `/briefings/${targetBriefingId}?category=${cat.id}`
              : "#";

            return (
              <div
                key={cat.id}
                onClick={() => {
                  if (targetBriefingId) {
                    router.push(`/briefings/${targetBriefingId}?category=${cat.id}`);
                  }
                }}
                className={`rounded-[20px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-4 sm:p-5 flex flex-col justify-between space-y-3 transition-all cursor-pointer group hover:border-[#0066FF]/60 hover:shadow-xs`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="w-9 h-9 flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline)] p-1.5 shrink-0"
                    style={{ borderRadius: "30%" }}
                  >
                    <SocialIcon name={cat.app} size={18} className="w-4 h-4 object-contain" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[var(--canvas)] border border-[var(--hairline)] text-xs font-[600] text-[var(--ink)]">
                    {cat.count}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-[652] text-sm text-[var(--ink)] flex items-center justify-between">
                    <span>{cat.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:translate-x-0.5 transition-transform" />
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)] font-[300] line-clamp-2 leading-relaxed">
                    {cat.synopsis}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── D. Past & Custom Briefings Table ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-[652] text-[var(--ink)] tracking-tight">
            Historical & Scheduled Briefings ({filteredBriefings.length})
          </h2>
          <span className="text-xs text-[var(--text-muted)]">
            Persisted in PostgreSQL database with instant recall
          </span>
        </div>

        {filteredBriefings.length === 0 ? (
          <div className="p-8 text-center rounded-[20px] bg-[var(--canvas-soft)] border border-[var(--hairline)] text-xs text-[var(--text-muted)]">
            No briefings found matching the selected date filter.
          </div>
        ) : (
          <div className="rounded-[20px] bg-[var(--canvas-soft)] border border-[var(--hairline)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--canvas)] border-b border-[var(--hairline)] text-[var(--text-muted)] font-[600] uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3">Briefing Name</th>
                    <th className="px-5 py-3">Date & Time</th>
                    <th className="px-5 py-3">Platforms</th>
                    <th className="px-5 py-3">Items</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--hairline-soft)]">
                  {filteredBriefings.map((b) => {
                    const isLatest = latestBriefing?.id === b.id;
                    return (
                      <tr
                        key={b.id}
                        className="hover:bg-[var(--canvas)]/60 transition-colors group"
                      >
                        <td className="px-5 py-4 font-[600] text-[var(--ink)]">
                          <Link
                            href={`/briefings/${b.id}`}
                            className="hover:text-[#0066FF] transition-colors flex items-center gap-2"
                          >
                            <span>{b.title}</span>
                            {isLatest && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#0066FF] text-white">
                                Latest
                              </span>
                            )}
                          </Link>
                        </td>

                        <td className="px-5 py-4 text-[var(--text-muted)] font-mono text-[11px]">
                          {formatHumanDateTime(b.created_at || b.date)}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            {b.platforms_used.map((plat) => (
                              <div
                                key={plat}
                                className="w-6 h-6 flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline)] p-1 shrink-0"
                                style={{ borderRadius: "30%" }}
                                title={plat}
                              >
                                <SocialIcon name={plat} size={14} className="w-3.5 h-3.5 object-contain" />
                              </div>
                            ))}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-[var(--text-muted)]">
                          <span className="font-[600] text-[var(--ink)]">
                            {deduplicateBriefingItems(b.categorized_items || [], {
                              referenceDate: b.created_at || b.date,
                              calendarHorizonDays: detectCalendarHorizon(`${b.title} ${b.executive_summary}`, 7),
                              contextText: `${b.title} ${b.executive_summary}`,
                            }).length}
                          </span>{" "}
                          items
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-[600]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Completed
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/briefings/${b.id}`}
                              className="px-3 py-1 rounded-full bg-[var(--canvas)] hover:bg-[var(--field)] border border-[var(--hairline)] text-[var(--ink)] font-[600] text-[11px] transition-all inline-flex items-center gap-1"
                            >
                              <span>View</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>

                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(b.id)}
                              className="p-1 rounded-full text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete briefing"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setDeleteConfirmId(null)}
          />
          <div className="relative w-full max-w-sm rounded-[24px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-6 space-y-4 shadow-xl text-center">
            <div className="w-10 h-10 mx-auto rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="font-[652] text-base text-[var(--ink)]">Delete Briefing?</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Are you sure you want to delete this briefing record? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-1.5 rounded-full text-xs font-[600] text-[var(--text-muted)] hover:text-[var(--ink)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteBriefing(deleteConfirmId)}
                className="px-4 py-1.5 rounded-full text-xs font-[600] bg-rose-500 text-white hover:bg-rose-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Briefing Creation Modal */}
      <CreateCustomBriefingModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        userId={userId}
        onScheduleCreated={(newSchedule) => {
          setSchedules((prev) => [newSchedule, ...prev]);
        }}
      />
    </div>
  );
}
