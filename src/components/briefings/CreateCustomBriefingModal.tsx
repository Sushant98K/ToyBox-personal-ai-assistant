"use client";

import React, { useState } from "react";
import { X, Sparkles, Clock, Check, ShieldAlert } from "lucide-react";
import { SocialIcon } from "@/components/icons/AppIcons";
import { BriefingCategory, BriefingSchedule } from "@/types/briefing";

interface CreateCustomBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScheduleCreated: (schedule: BriefingSchedule) => void;
  userId?: string;
}

const AVAILABLE_PLATFORMS = [
  { id: "gmail", name: "Gmail Inbox", connected: true },
  { id: "gcal", name: "Google Calendar", connected: true },
  { id: "slack", name: "Slack Workspace", connected: true },
  { id: "whatsapp", name: "WhatsApp Telemetry", connected: true },
  { id: "outlook", name: "Microsoft Outlook", connected: false },
  { id: "discord", name: "Discord Server", connected: false },
  { id: "linkedin", name: "LinkedIn InMail", connected: false },
  { id: "telegram", name: "Telegram Messenger", connected: false },
  { id: "notion", name: "Notion Workspace", connected: false },
  { id: "reddit", name: "Reddit Mentions", connected: false },
];

const CATEGORIES: { id: BriefingCategory; label: string }[] = [
  { id: "emails", label: "Emails" },
  { id: "messages", label: "Messages" },
  { id: "mentions", label: "Mentions (@me)" },
  { id: "meetings", label: "Calendar Events" },
  { id: "followups", label: "Follow-ups & Tasks" },
];

export function CreateCustomBriefingModal({
  isOpen,
  onClose,
  onScheduleCreated,
  userId,
}: CreateCustomBriefingModalProps) {
  const [name, setName] = useState("");
  const [promptGoal, setPromptGoal] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    "gmail",
    "gcal",
    "slack",
    "whatsapp",
  ]);
  const [selectedCategories, setSelectedCategories] = useState<BriefingCategory[]>([
    "emails",
    "messages",
    "mentions",
    "meetings",
    "followups",
  ]);
  const [scheduledTime, setScheduledTime] = useState("08:30");
  const [priorityThreshold, setPriorityThreshold] = useState<"all" | "high_only">("all");
  const [calendarScope, setCalendarScope] = useState<"7d" | "14d" | "month" | "quarter" | "year">("7d");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const togglePlatform = (platId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platId) ? prev.filter((p) => p !== platId) : [...prev, platId]
    );
  };

  const toggleCategory = (catId: BriefingCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Please enter a briefing name.");
      return;
    }
    if (selectedPlatforms.length === 0) {
      setErrorMsg("Please select at least one connected app.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (userId) headers["x-user-id"] = userId;

      const scopeLabel = {
        "7d": "Upcoming 7 days",
        "14d": "Next 2 weeks",
        month: "Next month",
        quarter: "Next quarter",
        year: "All schedule dates this year",
      }[calendarScope];

      const effectivePrompt =
        calendarScope !== "7d"
          ? `${promptGoal.trim() || name.trim()} [Scope: ${scopeLabel}]`
          : promptGoal.trim() || name.trim();

      const res = await fetch("/api/briefings/schedules", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: name.trim(),
          prompt_goal: effectivePrompt,
          platforms: selectedPlatforms,
          categories: selectedCategories,
          scheduled_time: scheduledTime,
          priority_threshold: priorityThreshold,
          is_active: true,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to create custom schedule");
      }

      const json = await res.json();
      onScheduleCreated(json.schedule);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-[24px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-150 text-[var(--ink)]">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[var(--hairline)]">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[var(--canvas)] border border-[var(--hairline)] text-[11px] font-[600] text-[#0066FF]">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Automated Intelligence Schedule</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-[652] tracking-tight">
              Create Custom Briefing
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] font-[300]">
              Configure automated synthesis prompts, schedules, and active MCP platforms.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--ink)] hover:bg-[var(--canvas)] border border-transparent hover:border-[var(--hairline)] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-[500] flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Briefing Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-[600] text-[var(--ink-soft)] uppercase tracking-wider">
              Briefing Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Engineering Daily Standup, Client Escalations"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--field)] border border-[var(--hairline)] text-sm text-[var(--ink)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-[#0066FF] transition-all"
            />
          </div>

          {/* Goal / Description Prompt */}
          <div className="space-y-1.5">
            <label className="text-xs font-[600] text-[var(--ink-soft)] uppercase tracking-wider">
              Goal / Focus Prompt (Gemini Instructions)
            </label>
            <textarea
              rows={2}
              value={promptGoal}
              onChange={(e) => setPromptGoal(e.target.value)}
              placeholder="e.g., Focus on critical blockers, unread Slack DMs, and high-priority board questions."
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--field)] border border-[var(--hairline)] text-sm text-[var(--ink)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-[#0066FF] transition-all resize-none"
            />
          </div>

          {/* Connected App Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-[600] text-[var(--ink-soft)] uppercase tracking-wider">
                Connected Platforms
              </label>
              <span className="text-[11px] text-[var(--text-muted)]">
                {selectedPlatforms.length} selected
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {AVAILABLE_PLATFORMS.map((plat) => {
                const isSelected = selectedPlatforms.includes(plat.id);
                return (
                  <button
                    key={plat.id}
                    type="button"
                    disabled={!plat.connected}
                    onClick={() => plat.connected && togglePlatform(plat.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                      !plat.connected
                        ? "opacity-45 bg-[var(--canvas)]/40 border-[var(--hairline-soft)] cursor-not-allowed"
                        : isSelected
                        ? "bg-[var(--canvas)] border-[#0066FF] shadow-xs cursor-pointer"
                        : "bg-[var(--canvas)] border-[var(--hairline)] hover:border-[var(--text-muted)] cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-7 h-7 flex items-center justify-center bg-[var(--canvas-soft)] border border-[var(--hairline)] shrink-0 p-1"
                        style={{ borderRadius: "30%" }}
                      >
                        <SocialIcon name={plat.id} size={16} className="w-3.5 h-3.5 object-contain" />
                      </div>
                      <span className="text-xs font-[500] truncate">{plat.name}</span>
                    </div>

                    {!plat.connected ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--raised)] text-[var(--text-faint)] shrink-0 font-[500]">
                        Soon
                      </span>
                    ) : isSelected ? (
                      <div className="w-4 h-4 rounded-full bg-[#0066FF] text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-[var(--hairline)] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Checkboxes */}
          <div className="space-y-2">
            <label className="text-xs font-[600] text-[var(--ink-soft)] uppercase tracking-wider">
              Included Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-[600] transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-[var(--primary)] text-[var(--on-primary)] shadow-xs"
                        : "bg-[var(--canvas)] text-[var(--text-muted)] border border-[var(--hairline)] hover:text-[var(--ink)]"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Frequency & Scheduled Time & Priority Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--hairline)]">
            <div className="space-y-1.5">
              <label className="text-xs font-[600] text-[var(--ink-soft)] flex items-center gap-1.5 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-[#0066FF]" />
                <span>Daily Scheduled Time</span>
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-[var(--field)] border border-[var(--hairline)] text-sm text-[var(--ink)] focus:outline-none focus:border-[#0066FF]"
              />
              <span className="text-[10px] text-[var(--text-muted)]">
                Evaluated by 15-minute background worker
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-[600] text-[var(--ink-soft)] uppercase tracking-wider">
                Priority Threshold
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPriorityThreshold("all")}
                  className={`py-2 px-3 rounded-xl text-xs font-[600] border transition-all cursor-pointer ${
                    priorityThreshold === "all"
                      ? "bg-[var(--canvas)] border-[#0066FF] text-[var(--ink)]"
                      : "bg-[var(--canvas)] border-[var(--hairline)] text-[var(--text-muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  All Items
                </button>
                <button
                  type="button"
                  onClick={() => setPriorityThreshold("high_only")}
                  className={`py-2 px-3 rounded-xl text-xs font-[600] border transition-all cursor-pointer ${
                    priorityThreshold === "high_only"
                      ? "bg-[var(--canvas)] border-[#0066FF] text-[var(--ink)]"
                      : "bg-[var(--canvas)] border-[var(--hairline)] text-[var(--text-muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  High & Urgent Only
                </button>
              </div>
            </div>
          </div>

          {/* Calendar Schedule Horizon (Only if Calendar is selected) */}
          {selectedPlatforms.includes("gcal") && (
            <div className="space-y-1.5 pt-2 border-t border-[var(--hairline)]">
              <label className="text-xs font-[600] text-[var(--ink-soft)] uppercase tracking-wider flex items-center justify-between">
                <span>Calendar Schedule Horizon</span>
                <span className="text-[10px] text-[var(--text-muted)] font-normal">
                  General daily briefs default to 7 days
                </span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {[
                  { id: "7d", label: "7 Days", desc: "Default" },
                  { id: "14d", label: "2 Weeks", desc: "Short-term" },
                  { id: "month", label: "Next Month", desc: "30 Days" },
                  { id: "quarter", label: "Quarter", desc: "90 Days" },
                  { id: "year", label: "Full Year", desc: "All Dates" },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setCalendarScope(s.id as any)}
                    className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                      calendarScope === s.id
                        ? "bg-[var(--canvas)] border-[#0066FF] text-[var(--ink)] shadow-xs"
                        : "bg-[var(--canvas)] border-[var(--hairline)] text-[var(--text-muted)] hover:text-[var(--ink)]"
                    }`}
                  >
                    <div className="text-xs font-[600]">{s.label}</div>
                    <div className="text-[9px] text-[var(--text-faint)]">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--hairline)]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-full text-xs font-[600] text-[var(--text-muted)] hover:text-[var(--ink)] hover:bg-[var(--canvas)] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 transition-opacity text-xs font-[600] shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  <span>Saving Schedule...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Save & Activate Schedule</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
