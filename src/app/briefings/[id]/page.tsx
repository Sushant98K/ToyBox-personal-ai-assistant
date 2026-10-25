"use client";

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Clock,
  ExternalLink,
  ShieldAlert,
  Send,
  CheckCircle2,
  Circle,
  Search,
  Filter,
  Mail,
  MessageSquare,
  AtSign,
  CalendarCheck,
  Check,
  Share2,
} from "lucide-react";
import { SocialIcon } from "@/components/icons/AppIcons";
import { ContextualActionComposerModal } from "@/components/briefings/ContextualActionComposerModal";
import { GeneratedBriefing, NormalizedBriefingItem, BriefingCategory } from "@/types/briefing";
import { formatHumanDateTime, formatCompactTime, formatSnippetText } from "@/lib/briefings/date-formatter";
import { deduplicateBriefingItems, detectCalendarHorizon } from "@/lib/briefings/deduplicate";
import { insforge } from "@/lib/insforge";

export default function BriefingDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const briefingId = params?.id as string;
  const initialCategory = (searchParams.get("category") as BriefingCategory | null) || "all";

  const [briefing, setBriefing] = useState<GeneratedBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

  // Action Composer Modal State
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerTargetItem, setComposerTargetItem] = useState<NormalizedBriefingItem | null>(null);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  // Load briefing from API
  useEffect(() => {
    let isMounted = true;
    async function loadBriefing() {
      try {
        const { data: authData } = await insforge.auth.getCurrentUser();
        const currentUserId = authData?.user?.id;
        if (isMounted && currentUserId) setUserId(currentUserId);

        const headers: Record<string, string> = {};
        if (currentUserId) headers["x-user-id"] = currentUserId;

        const res = await fetch(`/api/briefings/${briefingId}`, { headers });
        if (res.ok && isMounted) {
          const json = await res.json();
          if (json.briefing) {
            setBriefing(json.briefing);
            // Default select the first item
            if (json.briefing.categorized_items?.length > 0) {
              setSelectedItemId(json.briefing.categorized_items[0].id);
            }
          }
        }
      } catch (err) {
        console.warn("Error loading briefing details:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (briefingId) {
      loadBriefing();
    }
    return () => {
      isMounted = false;
    };
  }, [briefingId]);

  // Update selected category when query parameter changes
  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) {
      setSelectedCategory(cat);
    }
  }, [searchParams]);

  const toggleResolve = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setResolvedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const rawItems = React.useMemo(() => {
    const horizonDays = detectCalendarHorizon(
      `${briefing?.title || ""} ${briefing?.executive_summary || ""}`,
      7
    );
    return deduplicateBriefingItems(briefing?.categorized_items || [], {
      referenceDate: briefing?.created_at || briefing?.date,
      calendarHorizonDays: horizonDays,
      contextText: `${briefing?.title || ""} ${briefing?.executive_summary || ""}`,
    });
  }, [
    briefing?.categorized_items,
    briefing?.created_at,
    briefing?.date,
    briefing?.title,
    briefing?.executive_summary,
  ]);

  const categoryCounts = React.useMemo(() => {
    return {
      all: rawItems.length,
      emails: rawItems.filter((i) => i.type === "email").length,
      messages: rawItems.filter((i) => i.type === "message").length,
      mentions: rawItems.filter((i) => i.type === "mention").length,
      meetings: rawItems.filter((i) => i.type === "meeting").length,
      followups: rawItems.filter((i) => i.type === "task" || i.type === "followup").length,
    };
  }, [rawItems]);

  // Filter items by category & search query
  const filteredItems = rawItems.filter((item) => {
    if (selectedCategory !== "all") {
      if (selectedCategory === "emails" && item.type !== "email") return false;
      if (selectedCategory === "messages" && item.type !== "message") return false;
      if (selectedCategory === "mentions" && item.type !== "mention") return false;
      if (selectedCategory === "meetings" && item.type !== "meeting") return false;
      if (selectedCategory === "followups" && item.type !== "task" && item.type !== "followup")
        return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchSender = item.sender?.toLowerCase().includes(q);
      const matchSnippet = item.bodySnippet?.toLowerCase().includes(q);
      return matchTitle || matchSender || matchSnippet;
    }

    return true;
  });

  const selectedItem =
    rawItems.find((i) => i.id === selectedItemId) || filteredItems[0] || null;

  const handleOpenComposer = (item: NormalizedBriefingItem) => {
    setComposerTargetItem(item);
    setIsComposerOpen(true);
  };

  const getPlatformActionLabel = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "gmail":
        return "Reply via Email";
      case "whatsapp":
        return "Send WhatsApp Reply";
      case "slack":
        return "Reply in Thread";
      case "calendar":
      case "gcal":
        return "Confirm / Reschedule";
      default:
        return "Execute Action";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[var(--canvas-soft)] rounded-full animate-pulse" />
        <div className="h-40 rounded-[24px] bg-[var(--canvas-soft)] animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[550px]">
          <div className="lg:col-span-5 rounded-[24px] bg-[var(--canvas-soft)] animate-pulse" />
          <div className="lg:col-span-7 rounded-[24px] bg-[var(--canvas-soft)] animate-pulse" />
        </div>
      </div>
    );
  }

  if (!briefing) {
    return (
      <div className="p-12 text-center rounded-[24px] bg-[var(--canvas-soft)] border border-[var(--hairline)] space-y-4">
        <ShieldAlert className="w-10 h-10 mx-auto text-amber-500" />
        <h2 className="text-xl font-[652]">Briefing Not Found</h2>
        <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
          The requested intelligence report could not be found or may have been deleted.
        </p>
        <Link
          href="/briefings"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--primary)] text-[var(--on-primary)] text-xs font-[600]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Briefings</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* ─── Breadcrumb & Top Bar ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--hairline-soft)]">
        <div className="flex items-center gap-3">
          <Link
            href="/briefings"
            className="p-2 rounded-full bg-[var(--canvas-soft)] hover:bg-[var(--field)] text-[var(--text-muted)] hover:text-[var(--ink)] border border-[var(--hairline)] transition-all cursor-pointer"
            title="Return to Briefings Hub"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)] font-[500]">Intelligence Report</span>
              <span className="text-[10px] text-[var(--text-faint)] font-mono">•</span>
              <span className="text-xs text-[var(--text-muted)] font-mono">
                {new Date(briefing.created_at || briefing.date).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-[652] text-[var(--ink)] tracking-tight">
              {briefing.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--canvas-soft)] border border-[var(--hairline)]">
            {briefing.platforms_used.map((plat) => (
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

          <button
            type="button"
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
              }
            }}
            className="p-2 rounded-full bg-[var(--canvas-soft)] hover:bg-[var(--field)] text-[var(--text-muted)] hover:text-[var(--ink)] border border-[var(--hairline)] transition-all cursor-pointer"
            title="Copy briefing link"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─── Executive Summary Banner ─── */}
      <div className="rounded-[24px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-5 sm:p-6 space-y-3">
        <div className="flex items-center gap-2 text-xs font-[600] text-[#0066FF]">
          <Sparkles className="w-3.5 h-3.5 fill-current" />
          <span>Executive Summary (Gemini 3.5 Flash-Lite)</span>
        </div>
        <p className="text-xs sm:text-sm text-[var(--ink)] leading-relaxed font-[300]">
          {briefing.executive_summary}
        </p>
      </div>

      {/* ─── Full-Width Split / Drawer Layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ─── LEFT PANEL: Categorized Item List & Filter Tabs ─── */}
        <div className="lg:col-span-5 rounded-[24px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-4 sm:p-5 space-y-4">
          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: "all", label: "All", count: categoryCounts.all },
              { id: "emails", label: "Emails", count: categoryCounts.emails },
              { id: "messages", label: "Messages", count: categoryCounts.messages },
              { id: "mentions", label: "Mentions", count: categoryCounts.mentions },
              {
                id: "meetings",
                label: "Meetings",
                count: categoryCounts.meetings,
              },
              {
                id: "followups",
                label: "Follow-ups",
                count: categoryCounts.followups,
              },
            ].map((tab) => {
              const active = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-3 py-1 rounded-full text-xs font-[600] whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? "bg-[var(--canvas)] text-[var(--ink)] border border-[var(--hairline)] shadow-2xs"
                      : "text-[var(--text-muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      active
                        ? "bg-[var(--canvas-soft)] text-[var(--ink)]"
                        : "text-[var(--text-faint)]"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Field */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items, senders, keywords..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[var(--field)] border border-[var(--hairline)] text-xs text-[var(--ink)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-[#0066FF]"
            />
          </div>

          {/* List of Normalized Items */}
          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {filteredItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)] space-y-1">
                <p>No items found in this category.</p>
              </div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                const isResolved = resolvedIds.has(item.id);

                const urgencyBadge = {
                  urgent: "bg-rose-500/10 text-rose-500 border-rose-500/20",
                  high: "bg-amber-500/10 text-amber-500 border-amber-500/20",
                  medium: "bg-[var(--canvas)] text-[var(--text-muted)] border-[var(--hairline)]",
                  low: "bg-[var(--canvas)] text-[var(--text-faint)] border-[var(--hairline-soft)]",
                }[item.urgency] || "bg-[var(--canvas)] text-[var(--text-muted)]";

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItemId(item.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 group ${
                      isSelected
                        ? "bg-[var(--canvas)] border-[#0066FF] shadow-xs"
                        : "bg-[var(--canvas)] border-[var(--hairline-soft)] hover:border-[var(--hairline)]"
                    } ${isResolved ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-6 h-6 flex items-center justify-center bg-[var(--canvas-soft)] border border-[var(--hairline)] p-1 shrink-0"
                          style={{ borderRadius: "30%" }}
                        >
                          <SocialIcon name={item.platform} size={14} className="w-3.5 h-3.5 object-contain" />
                        </div>
                        <span className="text-[11px] font-[500] text-[var(--text-muted)] truncate">
                          {item.sender}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`text-[9px] px-2 py-0.2 rounded-full font-[600] uppercase tracking-wider border ${urgencyBadge}`}
                        >
                          {item.urgency}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => toggleResolve(item.id, e)}
                          title={isResolved ? "Mark unaddressed" : "Mark addressed"}
                          className="text-[var(--text-muted)] hover:text-emerald-500 transition-colors p-0.5 cursor-pointer"
                        >
                          {isResolved ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Circle className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <h4
                      className={`text-xs sm:text-sm font-[652] leading-snug line-clamp-1 ${
                        isResolved ? "line-through text-[var(--text-faint)]" : "text-[var(--ink)]"
                      }`}
                    >
                      {item.title}
                    </h4>

                    <p className="text-[11px] text-[var(--text-muted)] font-[300] line-clamp-2 leading-relaxed">
                      {formatSnippetText(item.bodySnippet)}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-[var(--text-faint)] font-mono pt-1">
                      <span>{item.channelOrThread || item.platform}</span>
                      <span>
                        {formatCompactTime(item.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ─── RIGHT PANEL: Full Context Preview & In-Place Action Composer Triggers ─── */}
        <div className="lg:col-span-7 rounded-[24px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-6 sm:p-7 space-y-6">
          {selectedItem ? (
            <div className="space-y-6">
              {/* Top Context Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-[var(--hairline)]">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className="w-11 h-11 flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline)] p-2 shrink-0 mt-0.5"
                    style={{ borderRadius: "30%" }}
                  >
                    <SocialIcon name={selectedItem.platform} size={22} className="w-5 h-5 object-contain" />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-[600] uppercase tracking-wider border ${
                          selectedItem.urgency === "urgent"
                            ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                            : selectedItem.urgency === "high"
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            : "bg-[var(--canvas)] text-[var(--text-muted)] border-[var(--hairline)]"
                        }`}
                      >
                        {selectedItem.urgency}
                      </span>

                      <span className="text-xs text-[var(--text-muted)] px-2.5 py-0.5 rounded-full bg-[var(--canvas)] border border-[var(--hairline)]">
                        {selectedItem.platform.toUpperCase()} • {selectedItem.channelOrThread || "Direct Feed"}
                      </span>

                      <span className="text-xs text-[var(--text-faint)] font-mono flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatHumanDateTime(selectedItem.timestamp)}
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-[652] text-[var(--ink)] leading-snug">
                      {selectedItem.title}
                    </h2>

                    <div className="text-xs text-[var(--text-muted)] pt-0.5">
                      From: <span className="font-[500] text-[var(--ink-soft)]">{selectedItem.sender}</span>
                    </div>
                  </div>
                </div>

                {/* Direct Platform Jump Link */}
                {selectedItem.deepLinkOrId && (
                  <button
                    type="button"
                    onClick={() => window.open(selectedItem.deepLinkOrId, "_blank")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--canvas)] hover:bg-[var(--field)] text-[var(--ink)] text-xs font-[600] border border-[var(--hairline)] transition-all cursor-pointer shrink-0"
                  >
                    <span>Open in App</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Full Content Body Preview */}
              <div className="space-y-2">
                <h3 className="text-xs font-[600] uppercase tracking-wider text-[var(--text-muted)]">
                  Message Content & Telemetry Snippet
                </h3>
                <div className="p-4 rounded-xl bg-[var(--canvas)] border border-[var(--hairline)] text-xs sm:text-sm text-[var(--ink)] leading-relaxed font-[300] whitespace-pre-wrap">
                  {formatSnippetText(selectedItem.bodySnippet)}
                </div>
              </div>

              {/* Metadata details if available */}
              {selectedItem.metadata && Object.keys(selectedItem.metadata).length > 0 && (
                <div className="p-3.5 rounded-xl bg-[var(--canvas)] border border-[var(--hairline-soft)] space-y-1.5 text-xs">
                  <div className="text-[10px] font-[600] uppercase tracking-wider text-[var(--text-muted)]">
                    MCP Integration Metadata
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-[var(--text-faint)]">
                    {Object.entries(selectedItem.metadata).map(([k, v]) => (
                      <div key={k} className="truncate">
                        <span className="text-[var(--text-muted)]">{k}:</span> {String(v)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* In-Place Action Composer Trigger Card */}
              <div className="rounded-2xl bg-[var(--canvas)] border border-[#0066FF]/40 p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-[600] text-[#0066FF]">
                    <Sparkles className="w-4 h-4 fill-current" />
                    <span>Contextual Action Engine</span>
                  </div>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Powered by Gemini 3.5 Flash-Lite & Connected MCP
                  </span>
                </div>

                <p className="text-xs text-[var(--text-muted)] font-[300] leading-relaxed">
                  Draft a personalized reply or execute actions via {selectedItem.platform.toUpperCase()} Model Context Protocol (MCP) tool.
                </p>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleOpenComposer(selectedItem)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 transition-opacity text-xs font-[600] shadow-sm cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{getPlatformActionLabel(selectedItem.platform)}</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => toggleResolve(selectedItem.id, e)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[var(--canvas-soft)] hover:bg-[var(--field)] text-[var(--ink)] text-xs font-[600] border border-[var(--hairline)] transition-all cursor-pointer"
                  >
                    {resolvedIds.has(selectedItem.id) ? (
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
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-[var(--text-muted)]">
              Select an item on the left to preview context and compose actions.
            </div>
          )}
        </div>
      </div>

      {/* Contextual Action Composer Modal */}
      <ContextualActionComposerModal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        item={composerTargetItem}
        userId={userId}
        onActionComplete={(itemId) => {
          setResolvedIds((prev) => new Set([...prev, itemId]));
        }}
      />
    </div>
  );
}
