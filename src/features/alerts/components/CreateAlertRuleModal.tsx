"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Sparkles,
  SlidersHorizontal,
  CheckCircle2,
  Lock,
  Layers,
  Bell,
  RefreshCw,
} from "lucide-react";
import { SocialIcon } from "@/components/icons/AppIcons";
import {
  AlertPlatform,
  AlertPriority,
  AlertConditionType,
  CreateAlertRuleInput,
  SuggestedAlert,
} from "@/types/alerts";
import { cn } from "@/lib/utils";

interface CreateAlertRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  initialTemplate?: SuggestedAlert | null;
}

const CONNECTED_PLATFORMS: Array<{ id: AlertPlatform; name: string }> = [
  { id: "gmail", name: "Gmail" },
  { id: "whatsapp", name: "WhatsApp" },
  { id: "slack", name: "Slack" },
  { id: "calendar", name: "Google Calendar" },
];

const FUTURE_PLATFORMS = [
  { id: "outlook", name: "Outlook" },
  { id: "discord", name: "Discord" },
  { id: "linkedin", name: "LinkedIn" },
  { id: "telegram", name: "Telegram" },
  { id: "notion", name: "Notion" },
  { id: "reddit", name: "Reddit" },
];

export function CreateAlertRuleModal({
  isOpen,
  onClose,
  onCreated,
  initialTemplate,
}: CreateAlertRuleModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [app, setApp] = useState<AlertPlatform>("gmail");
  const [conditionType, setConditionType] = useState<AlertConditionType>("keyword");
  const [keywordsInput, setKeywordsInput] = useState("urgent, blocker, down, escalation");
  const [sendersInput, setSendersInput] = useState("@board.com, @partner.vc");
  const [thresholdMinutes, setThresholdMinutes] = useState(15);
  const [channel, setChannel] = useState("#incident-response");
  const [priority, setPriority] = useState<AlertPriority>("urgent");
  const [frequency, setFrequency] = useState<"realtime" | "15min">("15min");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill when opening from a suggested alert template
  useEffect(() => {
    if (initialTemplate) {
      setName(initialTemplate.name);
      setDescription(initialTemplate.description);
      setApp(initialTemplate.app);
      setConditionType(initialTemplate.condition_type);
      setPriority(initialTemplate.priority);
      if (initialTemplate.condition_payload.keywords) {
        setKeywordsInput(initialTemplate.condition_payload.keywords.join(", "));
      }
      if (initialTemplate.condition_payload.senders) {
        setSendersInput(initialTemplate.condition_payload.senders.join(", "));
      }
      if (initialTemplate.condition_payload.thresholdMinutes) {
        setThresholdMinutes(initialTemplate.condition_payload.thresholdMinutes);
      }
    } else {
      setName("");
      setDescription("");
      setApp("gmail");
      setConditionType("keyword");
      setPriority("urgent");
    }
    setError(null);
  }, [initialTemplate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please specify an alert name.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload: CreateAlertRuleInput = {
      name: name.trim(),
      app,
      condition_type: conditionType,
      condition_payload: {
        description,
        keywords:
          conditionType === "keyword"
            ? keywordsInput.split(",").map((k) => k.trim()).filter(Boolean)
            : undefined,
        senders:
          conditionType === "sender"
            ? sendersInput.split(",").map((s) => s.trim()).filter(Boolean)
            : undefined,
        thresholdMinutes:
          conditionType === "schedule" || conditionType === "urgency"
            ? Number(thresholdMinutes)
            : undefined,
        channel: app === "slack" ? channel : undefined,
      },
      priority,
      is_active: true,
    };

    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_rule",
          rule: payload,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onCreated();
        onClose();
      } else {
        setError(data.error || "Failed to save alert rule.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create alert rule");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/75 backdrop-blur-sm animate-in fade-in-50 duration-150">
      <div className="relative w-full max-w-xl bg-[var(--canvas-soft)] border border-[var(--hairline)] rounded-[24px] shadow-2xl p-6 sm:p-7 space-y-6 text-[var(--ink)] my-8">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-[var(--hairline)] pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[var(--canvas)] border border-[var(--hairline)] text-xs font-[600]">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#0066FF]" />
              <span>Condition Automation</span>
            </div>
            <h2 className="text-xl font-[652] tracking-tight text-[var(--ink)]">
              {initialTemplate ? "Create Alert from Template" : "Create New Alert Rule"}
            </h2>
            <p className="text-xs text-[var(--text-muted)] font-[300]">
              ToyBox continuously evaluates incoming signals across connected channels and triggers instant in-app alerts.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--ink)] hover:bg-[var(--canvas)] border border-transparent hover:border-[var(--hairline)] transition-all"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-[500]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Rule Name & Goal */}
          <div className="space-y-3">
            <div>
              <label className="block font-[600] text-[var(--ink)] mb-1">Alert Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. VIP Client Email Watch, Production Blocker Radar"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--field)] border border-[var(--hairline)] text-[var(--ink)] focus:outline-none focus:border-[#0066FF]"
              />
            </div>

            <div>
              <label className="block font-[600] text-[var(--ink)] mb-1">Description / Goal</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly state when or why this alert should fire"
                className="w-full px-3.5 py-2 rounded-xl bg-[var(--field)] border border-[var(--hairline)] text-[var(--ink)] focus:outline-none focus:border-[#0066FF]"
              />
            </div>
          </div>

          {/* Select Target App */}
          <div className="space-y-2">
            <label className="block font-[600] text-[var(--ink)]">Select Target Platform</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CONNECTED_PLATFORMS.map((platform) => (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => setApp(platform.id)}
                  className={cn(
                    "flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all",
                    app === platform.id
                      ? "bg-[var(--canvas)] border-[#0066FF] ring-1 ring-[#0066FF] shadow-2xs"
                      : "bg-[var(--field)] border-transparent hover:border-[var(--hairline)]"
                  )}
                >
                  <SocialIcon name={platform.id} size={18} className="w-4 h-4 object-contain shrink-0" />
                  <span className="font-[600] text-xs text-[var(--ink)] truncate">{platform.name}</span>
                </button>
              ))}
            </div>

            {/* Disabled Future Integrations with badges */}
            <div className="pt-1.5 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-[var(--text-faint)] font-[500] mr-1">Future additions:</span>
              {FUTURE_PLATFORMS.map((fp) => (
                <span
                  key={fp.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--raised)] border border-[var(--hairline-soft)] text-[10px] text-[var(--text-muted)] opacity-60 cursor-not-allowed"
                >
                  <Lock className="w-2.5 h-2.5" />
                  <span>{fp.name}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Trigger Condition Type */}
          <div className="space-y-2">
            <label className="block font-[600] text-[var(--ink)]">Alert Trigger Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "keyword", label: "Keywords / Mentions" },
                { id: "sender", label: "VIP Sender / Contact" },
                { id: "schedule", label: "Schedule Overlap" },
                { id: "urgency", label: "Urgency / SLA" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setConditionType(t.id as AlertConditionType)}
                  className={cn(
                    "p-2.5 rounded-xl border text-center transition-all",
                    conditionType === t.id
                      ? "bg-[var(--canvas)] border-[#0066FF] ring-1 ring-[#0066FF] font-[600] text-[var(--ink)]"
                      : "bg-[var(--field)] border-transparent hover:border-[var(--hairline)] text-[var(--text-muted)]"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Criteria Inputs based on Condition Type */}
          <div className="p-3.5 rounded-xl bg-[var(--canvas)] border border-[var(--hairline)] space-y-3">
            {conditionType === "keyword" && (
              <div>
                <label className="block font-[600] text-[var(--ink)] mb-1">
                  Keywords or Hashtags (Comma-separated)
                </label>
                <input
                  type="text"
                  value={keywordsInput}
                  onChange={(e) => setKeywordsInput(e.target.value)}
                  placeholder="e.g. urgent, blocker, production, outage, signed"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--field)] border border-[var(--hairline)] text-[var(--ink)] focus:outline-none focus:border-[#0066FF]"
                />
                {app === "slack" && (
                  <div className="mt-2">
                    <label className="block font-[600] text-[var(--text-muted)] mb-1">Target Slack Channel</label>
                    <input
                      type="text"
                      value={channel}
                      onChange={(e) => setChannel(e.target.value)}
                      placeholder="#incident-response or #all-channels"
                      className="w-full px-3 py-2 rounded-lg bg-[var(--field)] border border-[var(--hairline)] text-[var(--ink)] focus:outline-none focus:border-[#0066FF]"
                    />
                  </div>
                )}
              </div>
            )}

            {conditionType === "sender" && (
              <div>
                <label className="block font-[600] text-[var(--ink)] mb-1">
                  VIP Senders or Email Domains (Comma-separated)
                </label>
                <input
                  type="text"
                  value={sendersInput}
                  onChange={(e) => setSendersInput(e.target.value)}
                  placeholder="e.g. @board.com, partner@vc.com, +14158902134"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--field)] border border-[var(--hairline)] text-[var(--ink)] focus:outline-none focus:border-[#0066FF]"
                />
              </div>
            )}

            {(conditionType === "schedule" || conditionType === "urgency") && (
              <div>
                <label className="block font-[600] text-[var(--ink)] mb-1">
                  Time Threshold: {thresholdMinutes} minutes
                </label>
                <input
                  type="range"
                  min="5"
                  max="120"
                  step="5"
                  value={thresholdMinutes}
                  onChange={(e) => setThresholdMinutes(Number(e.target.value))}
                  className="w-full accent-[#0066FF]"
                />
                <span className="text-[10px] text-[var(--text-muted)] block mt-1">
                  {conditionType === "schedule"
                    ? "Alert when appointments have less than this buffer or overlap."
                    : "Alert when high-priority inquiry waits longer than this without reply."}
                </span>
              </div>
            )}
          </div>

          {/* Priority & Frequency Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-[600] text-[var(--ink)] mb-1.5">Priority Level</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(["urgent", "high", "medium", "low"] as AlertPriority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={cn(
                      "py-1.5 rounded-lg border text-center capitalize text-xs font-[600] transition-all",
                      priority === p
                        ? p === "urgent"
                          ? "bg-rose-500/15 border-rose-500 text-rose-500"
                          : p === "high"
                          ? "bg-amber-500/15 border-amber-500 text-amber-500"
                          : "bg-[#0066FF]/15 border-[#0066FF] text-[#0066FF]"
                        : "bg-[var(--field)] border-transparent text-[var(--text-muted)]"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-[600] text-[var(--ink)] mb-1.5">Check Frequency</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFrequency("15min")}
                  className={cn(
                    "py-1.5 px-2 rounded-lg border text-center text-xs font-[600] transition-all",
                    frequency === "15min"
                      ? "bg-[var(--canvas)] border-[#0066FF] text-[var(--ink)] ring-1 ring-[#0066FF]"
                      : "bg-[var(--field)] border-transparent text-[var(--text-muted)]"
                  )}
                >
                  Every 15 mins (Trigger.dev)
                </button>
                <button
                  type="button"
                  onClick={() => setFrequency("realtime")}
                  className={cn(
                    "py-1.5 px-2 rounded-lg border text-center text-xs font-[600] transition-all",
                    frequency === "realtime"
                      ? "bg-[var(--canvas)] border-[#0066FF] text-[var(--ink)] ring-1 ring-[#0066FF]"
                      : "bg-[var(--field)] border-transparent text-[var(--text-muted)]"
                  )}
                >
                  Real-Time Webhook
                </button>
              </div>
            </div>
          </div>

          {/* Delivery Note */}
          <div className="p-3 rounded-xl bg-[var(--canvas)] border border-[var(--hairline)] flex items-center gap-2.5 text-[11px] text-[var(--text-muted)]">
            <Bell className="w-4 h-4 text-[#0066FF] shrink-0" />
            <span>
              Notification Channel: Strictly in-app notifications and live feed popovers (no SMS or external bot spam).
            </span>
          </div>

          {/* Dialog Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--hairline)]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-full text-xs font-[600] text-[var(--text-muted)] hover:text-[var(--ink)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-full text-xs font-[652] bg-[#0066FF] text-white hover:bg-[#0066FF]/90 transition-all shadow-xs flex items-center gap-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Rule...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save Alert Rule</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
