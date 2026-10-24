"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  RefreshCw,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Mail,
  CheckSquare,
  MessageSquare,
  Clock,
  ArrowUpRight,
  Circle,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Layers,
  Zap,
  Check,
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

interface PlatformSummary {
  id: string;
  name: string;
  icon: string;
  status: "connected" | "disconnected";
  lastSync: string;
  account?: string | null;
}

interface DashboardBriefData {
  important_count: number;
  priority_count: number;
  followup_count: number;
  brief_bullets: string[];
  priority_items: PriorityItem[];
}

interface DashboardOverviewViewProps {
  onNavigateTab: (tab: DashboardTab) => void;
  currentUser?: {
    id?: string;
    name?: string;
    email?: string;
  } | null;
  onSyncCountChange?: (count: number) => void;
}

export function DashboardOverviewView({
  onNavigateTab,
  currentUser,
  onSyncCountChange,
}: DashboardOverviewViewProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<DashboardBriefData | null>(null);
  const [platforms, setPlatforms] = useState<{
    active: PlatformSummary[];
    extended: PlatformSummary[];
  } | null>(null);
  const [isCached, setIsCached] = useState<boolean>(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [showExtended, setShowExtended] = useState<boolean>(false);
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  const [priorityFilter, setPriorityFilter] = useState<"all" | "urgent" | "high" | "medium">("all");

  const currentUserId = currentUser?.id;
  const currentUserEmail = currentUser?.email;

  // Propagate active synced integrations count to shell sidebar
  useEffect(() => {
    if (platforms?.active) {
      const activeCount = platforms.active.filter((p) => p.status === "connected").length;
      onSyncCountChange?.(activeCount);
    }
  }, [platforms, onSyncCountChange]);

  // Mount effect to fetch initial dashboard data
  useEffect(() => {
    let isCancelled = false;
    async function loadInitial() {
      try {
        const headers: Record<string, string> = {};
        if (currentUserId) headers["x-user-id"] = currentUserId;
        if (currentUserEmail) headers["x-user-email"] = currentUserEmail;

        const res = await fetch("/api/dashboard", { headers, cache: "no-store" });
        if (res.ok && !isCancelled) {
          const json = await res.json();
          if (json.brief_data) setData(json.brief_data);
          if (json.platforms) {
            setPlatforms(json.platforms);
            if (json.platforms.active) {
              const count = json.platforms.active.filter((p: any) => p.status === "connected").length;
              onSyncCountChange?.(count);
            }
          }
          setIsCached(Boolean(json.cached));
          setUpdatedAt(json.updated_at || new Date().toISOString());
        }
      } catch (err) {
        console.warn("Error fetching executive dashboard:", err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }
    loadInitial();
    return () => {
      isCancelled = true;
    };
  }, [currentUserId, currentUserEmail, onSyncCountChange]);

  // Explicit user-triggered manual refresh (bypasses 2-hour cache)
  const handleManualRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const headers: Record<string, string> = {};
      if (currentUserId) headers["x-user-id"] = currentUserId;
      if (currentUserEmail) headers["x-user-email"] = currentUserEmail;

      const res = await fetch("/api/dashboard?refresh=true", { headers, cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.brief_data) setData(json.brief_data);
        if (json.platforms) setPlatforms(json.platforms);
        setIsCached(Boolean(json.cached));
        setUpdatedAt(json.updated_at || new Date().toISOString());
      }
    } catch (err) {
      console.warn("Manual refresh failed:", err);
    } finally {
      setRefreshing(false);
    }
  }, [currentUserId, currentUserEmail]);

  // Greeting based on time of day
  const currentHour = new Date().getHours();
  let greeting = "Good evening";
  let GreetingIcon = Sunset;

  if (currentHour >= 5 && currentHour < 12) {
    greeting = "Good morning";
    GreetingIcon = Sunrise;
  } else if (currentHour >= 12 && currentHour < 17) {
    greeting = "Good afternoon";
    GreetingIcon = Sun;
  } else if (currentHour >= 17 && currentHour < 22) {
    greeting = "Good evening";
    GreetingIcon = Sunset;
  } else {
    greeting = "Good night";
    GreetingIcon = Moon;
  }

  const executiveName =
    currentUser?.name || currentUser?.email?.split("@")[0] || "Executive";

  // Toggle resolution for priority items
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

  // Helper to format relative updated time
  const formatLastSync = (dateStr: string | null) => {
    if (!dateStr) return "Just now";
    const date = new Date(dateStr);
    const diffSec = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    return `${diffHr}h ago`;
  };

  return (
    <div className="flex-1 w-full min-w-0 max-w-none px-4 sm:px-6 md:px-8 py-6 space-y-6 sm:space-y-8 bg-[var(--canvas)] text-[var(--ink)] transition-colors duration-200">
      {/* ─── A. Welcome & Action Header ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[var(--hairline-soft)]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 flex items-center justify-center bg-[var(--canvas-soft)] border border-[var(--hairline)] text-[var(--ink)] shrink-0"
              style={{ borderRadius: "30%" }}
            >
              <GreetingIcon className="w-4 h-4 text-[var(--ink)] stroke-[1.8]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-[652] tracking-tight text-[var(--ink)] leading-[1.13]">
              {greeting}, {executiveName}.
            </h1>
          </div>
          <p className="text-sm font-[300] text-[var(--text-muted)] pl-0.5 leading-relaxed">
            Multi-platform executive intelligence synthesized across your connected communication channels.
          </p>
        </div>

        {/* Action Bar (Right-aligned) */}
        <div className="flex items-center gap-2.5 self-start lg:self-auto shrink-0">
          {/* Cache indicator pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--canvas-soft)] border border-[var(--hairline)] text-xs font-[456] text-[var(--text-muted)]">
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                isCached ? "bg-emerald-500" : "bg-[#0066FF] animate-pulse"
              )}
            />
            <span>
              {isCached ? "2h Cache Active" : "Fresh Synthesis"}
              {updatedAt && ` • ${formatLastSync(updatedAt)}`}
            </span>
          </div>

          {/* Refresh / Regenerate Button (Mobbin button-outline) */}
          <button
            type="button"
            id="refresh-dashboard-btn"
            onClick={handleManualRefresh}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--canvas)] hover:bg-[var(--field)] active:scale-95 border border-[var(--hairline)] text-[var(--ink)] text-xs sm:text-sm font-[600] transition-all disabled:opacity-50 cursor-pointer shadow-none"
          >
            <RefreshCw
              className={cn("w-3.5 h-3.5 text-[#0066FF]", refreshing && "animate-spin")}
            />
            <span>{refreshing ? "Synthesizing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* ─── B. Stats Cards Row (3 Cards Grid) ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* Card 1: Important Updates */}
        <div className="relative overflow-hidden rounded-[24px] bg-[var(--canvas-soft)] border border-[var(--hairline-soft)] p-6 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div
              className="w-10 h-10 flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline)] text-[var(--ink)] group-hover:scale-105 transition-transform"
              style={{ borderRadius: "30%" }}
            >
              <Mail className="w-5 h-5 stroke-[1.8] text-[var(--ink)]" />
            </div>
            <span className="text-xs font-[600] text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
              Action Required
            </span>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-[652] text-[var(--ink)] tracking-tight leading-none">
              {loading ? (
                <div className="w-14 h-9 bg-[var(--field)] rounded-full animate-pulse" />
              ) : (
                data?.important_count ?? 0
              )}
            </div>
            <div className="text-sm font-[652] text-[var(--ink)] mt-2">
              Important Updates
            </div>
            <div className="text-xs font-[456] text-[var(--text-muted)] mt-1 leading-relaxed">
              Urgent messages and inbox items requiring executive attention
            </div>
          </div>
        </div>

        {/* Card 2: Priority Tasks */}
        <div className="relative overflow-hidden rounded-[24px] bg-[var(--canvas-soft)] border border-[var(--hairline-soft)] p-6 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div
              className="w-10 h-10 flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline)] text-[var(--ink)] group-hover:scale-105 transition-transform"
              style={{ borderRadius: "30%" }}
            >
              <CheckSquare className="w-5 h-5 stroke-[1.8] text-[var(--ink)]" />
            </div>
            <span className="text-xs font-[600] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              Pending Review
            </span>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-[652] text-[var(--ink)] tracking-tight leading-none">
              {loading ? (
                <div className="w-14 h-9 bg-[var(--field)] rounded-full animate-pulse" />
              ) : (
                data?.priority_count ?? 0
              )}
            </div>
            <div className="text-sm font-[652] text-[var(--ink)] mt-2">
              Priority Tasks
            </div>
            <div className="text-xs font-[456] text-[var(--text-muted)] mt-1 leading-relaxed">
              Flagged items, calendar milestones, and operational decisions
            </div>
          </div>
        </div>

        {/* Card 3: Follow-ups */}
        <div className="relative overflow-hidden rounded-[24px] bg-[var(--canvas-soft)] border border-[var(--hairline-soft)] p-6 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div
              className="w-10 h-10 flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline)] text-[var(--ink)] group-hover:scale-105 transition-transform"
              style={{ borderRadius: "30%" }}
            >
              <MessageSquare className="w-5 h-5 stroke-[1.8] text-[var(--ink)]" />
            </div>
            <span className="text-xs font-[600] text-[var(--text-muted)] bg-[var(--canvas)] px-2.5 py-0.5 rounded-full border border-[var(--hairline)]">
              Awaiting Reply
            </span>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-[652] text-[var(--ink)] tracking-tight leading-none">
              {loading ? (
                <div className="w-14 h-9 bg-[var(--field)] rounded-full animate-pulse" />
              ) : (
                data?.followup_count ?? 0
              )}
            </div>
            <div className="text-sm font-[652] text-[var(--ink)] mt-2">
              Follow-ups
            </div>
            <div className="text-xs font-[456] text-[var(--text-muted)] mt-1 leading-relaxed">
              Unresolved discussions and scheduled reminder checkpoints
            </div>
          </div>
        </div>
      </div>

      {/* ─── C. Today's Brief (Single Consolidated Card) ─── */}
      <div className="rounded-[24px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-6 sm:p-8 space-y-6 transition-colors">
        {/* Header with AI Badge & Contributing Platform Icons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--hairline-soft)]">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline)] text-[#0066FF] shrink-0"
              style={{ borderRadius: "30%" }}
            >
              <Sparkles className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-[652] text-[var(--ink)] tracking-tight">
                  Today&apos;s Brief.
                </h2>
                {/* Mobbin badge-popular using the single accent electric blue */}
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#0066FF] text-white text-[11px] font-[600]">
                  <Sparkles className="w-3 h-3 fill-current" />
                  Gemini 3.5 Flash-Lite
                </span>
              </div>
              <p className="text-xs font-[300] text-[var(--text-muted)] mt-0.5">
                Consolidated cross-channel synthesis generated {formatLastSync(updatedAt)}
              </p>
            </div>
          </div>

          {/* Multi-platform Source Contributing Icons Row (Actively reflects live connected feeds) */}
          <div className="flex items-center gap-2 self-start sm:self-auto bg-[var(--canvas)] px-3 py-1.5 rounded-full border border-[var(--hairline)]">
            <span className="text-xs text-[var(--text-muted)] font-[456] mr-1">Sources:</span>
            <div className="flex items-center gap-1.5">
              {(platforms?.active
                ? platforms.active.filter((p) => p.status === "connected")
                : [
                    { id: "gmail", name: "Gmail", icon: "gmail", status: "connected" as const, lastSync: "2h ago" },
                    { id: "slack", name: "Slack", icon: "slack", status: "connected" as const, lastSync: "20h ago" },
                    { id: "gcal", name: "Google Calendar", icon: "gcal", status: "connected" as const, lastSync: "2h ago" },
                  ]
              ).map((source) => (
                <div
                  key={source.id}
                  className="w-5 h-5 flex items-center justify-center bg-[var(--canvas-soft)] rounded-full p-0.5"
                  title={`${source.name} Synced`}
                >
                  <SocialIcon
                    name={source.icon as any}
                    size={12}
                    className="w-3 h-3 object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3 to 4 High-Impact Bullet Points Inside the Consolidated Card */}
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3 py-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[var(--hairline)] mt-2 shrink-0 animate-pulse" />
                  <div className="h-4 bg-[var(--canvas)] rounded w-full animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            (data?.brief_bullets || []).map((bullet, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3.5 rounded-[16px] bg-[var(--canvas)] border border-[var(--hairline-soft)] hover:border-[var(--hairline)] transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-[#0066FF] mt-1.5 shrink-0" />
                <p className="text-xs sm:text-sm text-[var(--ink)] leading-relaxed font-[456]">
                  {bullet}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Fast-Action Shortcuts Bar */}
        <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--hairline-soft)]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigateTab("briefing")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 font-[600] text-xs sm:text-sm transition-all cursor-pointer"
            >
              <span>Review in Briefings</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab("ai-agent")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--canvas)] hover:bg-[var(--field)] border border-[var(--hairline)] text-xs font-[600] text-[var(--ink)] transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-[#0066FF]" />
              <span>Ask Agent Fleet</span>
            </button>
          </div>

          <span className="text-xs text-[var(--text-faint)] font-[456]">
            Model: gemini-3.5-flash-lite • Sub-second latency.
          </span>
        </div>
      </div>

      {/* ─── D. Side-by-Side Row (Connected Apps & Priority Items) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Connected Platforms Card */}
        <div className="rounded-[24px] bg-[var(--canvas-soft)] border border-[var(--hairline-soft)] p-6 sm:p-7 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline-soft)]">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline)] text-[var(--ink)] shrink-0"
                style={{ borderRadius: "30%" }}
              >
                <Layers className="w-4 h-4 stroke-[1.8]" />
              </div>
              <div>
                <h3 className="font-[652] text-sm sm:text-base text-[var(--ink)]">
                  Connected Platforms.
                </h3>
                <p className="text-xs font-[300] text-[var(--text-muted)]">
                  Live connection & sync status across channels
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("integrations")}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--canvas)] hover:bg-[var(--field)] border border-[var(--hairline)] text-xs font-[600] text-[var(--ink)] transition-colors cursor-pointer"
            >
              <span>Manage</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {/* Current Active Platforms List */}
          <div className="space-y-2.5">
            {loading ? (
              <div className="space-y-2 py-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-12 bg-[var(--canvas)] rounded-[16px] animate-pulse"
                  />
                ))}
              </div>
            ) : (
              (platforms?.active || [
                { id: "gmail", name: "Gmail", icon: "gmail", status: "connected", lastSync: "Just now" },
                { id: "whatsapp", name: "WhatsApp", icon: "whatsapp", status: "connected", lastSync: "Just now" },
                { id: "slack", name: "Slack", icon: "slack", status: "connected", lastSync: "18h ago" },
                { id: "gcal", name: "Google Calendar", icon: "gcal", status: "connected", lastSync: "Just now" },
              ]).map((platform) => {
                const isConn = platform.status === "connected";
                return (
                  <div
                    key={platform.id}
                    className="p-3.5 rounded-[16px] bg-[var(--canvas)] border border-[var(--hairline-soft)] hover:border-[var(--hairline)] flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-8 h-8 bg-[var(--canvas-soft)] border border-[var(--hairline)] flex items-center justify-center shrink-0 p-1.5"
                        style={{ borderRadius: "30%" }}
                      >
                        <SocialIcon
                          name={platform.icon}
                          size={16}
                          className="w-4 h-4 object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-[652] text-xs sm:text-sm text-[var(--ink)] truncate">
                            {platform.name}
                          </span>
                        </div>
                        {platform.account && (
                          <p className="text-[11px] font-[456] text-[var(--text-muted)] truncate">
                            {platform.account}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] text-[var(--text-faint)] font-mono hidden sm:inline-block">
                        {platform.lastSync}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-[600] border",
                          isConn
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : "bg-[var(--canvas-soft)] text-[var(--text-faint)] border-[var(--hairline)]"
                        )}
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            isConn ? "bg-emerald-500 animate-pulse" : "bg-[var(--text-faint)]"
                          )}
                        />
                        <span>{isConn ? "Connected" : "Disconnected"}</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Extensible Future Platforms Section (Collapsible Accordion) */}
          <div className="pt-2 border-t border-[var(--hairline-soft)]">
            <button
              type="button"
              onClick={() => setShowExtended(!showExtended)}
              className="w-full flex items-center justify-between text-xs text-[var(--text-muted)] hover:text-[var(--ink)] transition-colors py-1 cursor-pointer font-[600]"
            >
              <span>Upcoming Platform Integrations (6 Channels)</span>
              {showExtended ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {showExtended && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 animate-in fade-in duration-200">
                {(platforms?.extended || [
                  { id: "outlook", name: "Outlook", icon: "outlook", status: "disconnected", lastSync: "Never" },
                  { id: "discord", name: "Discord", icon: "discord", status: "disconnected", lastSync: "Never" },
                  { id: "linkedin", name: "LinkedIn", icon: "linkedin", status: "disconnected", lastSync: "Never" },
                  { id: "telegram", name: "Telegram", icon: "telegram", status: "disconnected", lastSync: "Never" },
                  { id: "notion", name: "Notion", icon: "notion", status: "disconnected", lastSync: "Never" },
                  { id: "reddit", name: "Reddit", icon: "reddit", status: "disconnected", lastSync: "Never" },
                ]).map((ext) => (
                  <div
                    key={ext.id}
                    className="p-2.5 rounded-[16px] bg-[var(--canvas)] border border-[var(--hairline-soft)] flex items-center gap-2"
                  >
                    <div
                      className="w-6 h-6 bg-[var(--canvas-soft)] border border-[var(--hairline)] flex items-center justify-center shrink-0 p-1"
                      style={{ borderRadius: "30%" }}
                    >
                      <SocialIcon name={ext.icon} size={12} className="w-3 h-3 object-contain" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-[652] text-[var(--ink)] truncate">
                        {ext.name}
                      </p>
                      <span className="text-[10px] font-[456] text-[var(--text-faint)]">Ready</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Priority Items Card */}
        {(() => {
          const PRIORITY_ORDER: Record<string, number> = {
            urgent: 1,
            high: 2,
            medium: 3,
          };

          const rawItems = data?.priority_items || [];
          
          // Sort with highest priority first (urgent -> high -> medium)
          const sortedItems = [...rawItems].sort((a, b) => {
            const rankA = PRIORITY_ORDER[a.priority] ?? 99;
            const rankB = PRIORITY_ORDER[b.priority] ?? 99;
            return rankA - rankB;
          });

          // Filter according to priority filter
          const filteredItems = sortedItems.filter((item) => {
            if (priorityFilter === "all") return true;
            return item.priority === priorityFilter;
          });

          // Only show top 4 on dashboard, not more than that
          const displayedItems = filteredItems.slice(0, 4);

          const counts = {
            all: sortedItems.length,
            urgent: sortedItems.filter((i) => i.priority === "urgent").length,
            high: sortedItems.filter((i) => i.priority === "high").length,
            medium: sortedItems.filter((i) => i.priority === "medium").length,
          };

          return (
            <div className="rounded-[24px] bg-[var(--canvas-soft)] border border-[var(--hairline-soft)] p-6 sm:p-7 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--hairline-soft)]">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline)] text-[var(--ink)] shrink-0"
                    style={{ borderRadius: "30%" }}
                  >
                    <ShieldAlert className="w-4 h-4 stroke-[1.8]" />
                  </div>
                  <div>
                    <h3 className="font-[652] text-sm sm:text-base text-[var(--ink)]">
                      Priority Items.
                    </h3>
                    <p className="text-xs font-[300] text-[var(--text-muted)]">
                      Immediate actions extracted across connected apps
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--canvas)] border border-[var(--hairline)] text-xs font-[600] text-[var(--ink)] self-start sm:self-auto">
                  {rawItems.filter((i) => !resolvedIds.has(i.id)).length} Pending
                </span>
              </div>

              {/* Priority Filter Segmented Control Tabs */}
              <div className="flex items-center gap-1.5 p-1 rounded-full bg-[var(--canvas)] border border-[var(--hairline-soft)] overflow-x-auto scrollbar-none">
                {[
                  { id: "all", label: "All", count: counts.all },
                  { id: "urgent", label: "Urgent", count: counts.urgent, dot: "bg-rose-500" },
                  { id: "high", label: "High", count: counts.high, dot: "bg-amber-500" },
                  { id: "medium", label: "Medium", count: counts.medium, dot: "bg-[var(--text-muted)]" },
                ].map((tab) => {
                  const active = priorityFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setPriorityFilter(tab.id as "all" | "urgent" | "high" | "medium")}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-[600] transition-all cursor-pointer whitespace-nowrap",
                        active
                          ? "bg-[var(--canvas-soft)] text-[var(--ink)] border border-[var(--hairline)] shadow-2xs"
                          : "text-[var(--text-muted)] hover:text-[var(--ink)] border border-transparent"
                      )}
                    >
                      {tab.dot && <span className={cn("w-1.5 h-1.5 rounded-full", tab.dot)} />}
                      <span>{tab.label}</span>
                      {tab.count > 0 && (
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.2 rounded-full",
                            active
                              ? "bg-[var(--canvas)] text-[var(--ink)]"
                              : "text-[var(--text-faint)]"
                          )}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* List of Top 4 Priority Items */}
              <div className="space-y-3">
                {loading ? (
                  <div className="space-y-3 py-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-20 bg-[var(--canvas)] rounded-[16px] animate-pulse"
                      />
                    ))}
                  </div>
                ) : displayedItems.length === 0 ? (
                  <div className="py-8 text-center space-y-1.5 rounded-[16px] bg-[var(--canvas)] border border-[var(--hairline-soft)]">
                    <p className="text-xs font-[652] text-[var(--ink)]">
                      No {priorityFilter !== "all" ? `${priorityFilter} priority` : "pending"} items
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      All action items in this filter category have been cleared.
                    </p>
                  </div>
                ) : (
                  displayedItems.map((item) => {
                    const isResolved = resolvedIds.has(item.id);

                    const priorityBadge = {
                      urgent: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
                      high: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                      medium: "bg-[var(--canvas-soft)] text-[var(--text-muted)] border-[var(--hairline)]",
                    }[item.priority] || "bg-[var(--canvas-soft)] text-[var(--text-muted)] border-[var(--hairline)]";

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "p-4 rounded-[16px] bg-[var(--canvas)] border transition-all space-y-2.5 group",
                          isResolved
                            ? "border-[var(--hairline-soft)] opacity-60"
                            : "border-[var(--hairline-soft)] hover:border-[var(--hairline)]"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div
                              className="w-7 h-7 bg-[var(--canvas-soft)] border border-[var(--hairline)] flex items-center justify-center shrink-0 p-1 mt-0.5"
                              style={{ borderRadius: "30%" }}
                            >
                              <SocialIcon
                                name={item.platform}
                                size={14}
                                className="w-3.5 h-3.5 object-contain"
                              />
                            </div>
                            <div className="min-w-0">
                              <h4
                                className={cn(
                                  "text-xs sm:text-sm font-[652] truncate",
                                  isResolved ? "line-through text-[var(--text-faint)]" : "text-[var(--ink)]"
                                )}
                              >
                                {item.title}
                              </h4>
                              <p className="text-xs font-[456] text-[var(--text-muted)] line-clamp-2 mt-0.5 leading-relaxed">
                                {item.context}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-[600] uppercase tracking-wider border",
                                priorityBadge
                              )}
                            >
                              {item.priority}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 text-xs border-t border-[var(--hairline-soft)]">
                          <span className="text-[var(--text-faint)] font-mono flex items-center gap-1 text-[11px]">
                            <Clock className="w-3 h-3" />
                            {item.time}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => toggleResolve(item.id, e)}
                            className={cn(
                              "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-[600] transition-all cursor-pointer",
                              isResolved
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                : "bg-[var(--canvas-soft)] hover:bg-[var(--field)] text-[var(--ink)] border border-[var(--hairline)]"
                            )}
                          >
                            {isResolved ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-500" />
                                <span>Resolved</span>
                              </>
                            ) : (
                              <>
                                <Circle className="w-3 h-3 text-[var(--text-muted)]" />
                                <span>Mark Resolved</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* View More Redirect to Briefing */}
              <div className="pt-2 border-t border-[var(--hairline-soft)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs text-[var(--text-muted)] font-[456]">
                  Showing top {displayedItems.length} of {filteredItems.length} {priorityFilter !== "all" ? `${priorityFilter} priority` : "priority"} {filteredItems.length === 1 ? "item" : "items"}
                </span>

                <button
                  type="button"
                  id="view-more-briefing-btn"
                  onClick={() => onNavigateTab("briefing")}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-[600] bg-[var(--canvas)] hover:bg-[var(--field)] text-[var(--ink)] border border-[var(--hairline)] transition-all cursor-pointer group active:scale-95 shadow-none shrink-0"
                >
                  <span>View More in Briefing</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--ink)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
