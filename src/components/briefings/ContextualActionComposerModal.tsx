"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Mail,
  MessageSquare,
  Calendar,
} from "lucide-react";
import { SocialIcon } from "@/components/icons/AppIcons";
import { NormalizedBriefingItem } from "@/types/briefing";
import { formatSnippetText } from "@/lib/briefings/date-formatter";

interface ContextualActionComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: NormalizedBriefingItem | null;
  userId?: string;
  onActionComplete?: (itemId: string, details: any) => void;
}

export function ContextualActionComposerModal({
  isOpen,
  onClose,
  item,
  userId,
  onActionComplete,
}: ContextualActionComposerModalProps) {
  const [tone, setTone] = useState<"Professional" | "Casual" | "Direct">("Professional");
  const [userInstruction, setUserInstruction] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [suggestedAction, setSuggestedAction] = useState("");
  const [isDrafting, setIsDrafting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Auto-generate initial draft with Gemini 3.5 Flash-Lite when modal opens for an item
  useEffect(() => {
    if (isOpen && item) {
      generateDraft(item, tone, "");
    } else {
      setStatusMessage(null);
      setUserInstruction("");
    }
  }, [isOpen, item?.id]);

  const generateDraft = async (
    targetItem: NormalizedBriefingItem,
    selectedTone: "Professional" | "Casual" | "Direct",
    instruction: string
  ) => {
    setIsDrafting(true);
    setStatusMessage(null);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (userId) headers["x-user-id"] = userId;

      const res = await fetch("/api/briefings/action", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "draft",
          itemContext: targetItem,
          userInstruction: instruction || undefined,
          tone: selectedTone,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate AI draft");
      }

      const json = await res.json();
      if (json.draft) {
        setBody(json.draft.body || "");
        if (json.draft.subject) {
          setSubject(json.draft.subject);
        } else if (targetItem.platform === "gmail") {
          setSubject(`Re: ${targetItem.title.replace(/^Re:\s*/i, "")}`);
        }
        setSuggestedAction(json.draft.suggestedAction || "Send Action");
      }
    } catch (err: any) {
      console.warn("Could not generate AI draft:", err);
      // Fallback draft
      setBody(
        `Hi ${targetItem.sender.split(" ")[0] || "there"},\n\nThank you for reaching out regarding "${targetItem.title}". I'm reviewing the details and will follow up shortly.\n\nBest regards,`
      );
      if (targetItem.platform === "gmail") {
        setSubject(`Re: ${targetItem.title.replace(/^Re:\s*/i, "")}`);
      }
      setSuggestedAction("Send Action");
    } finally {
      setIsDrafting(false);
    }
  };

  const handleToneChange = (newTone: "Professional" | "Casual" | "Direct") => {
    setTone(newTone);
    if (item) {
      generateDraft(item, newTone, userInstruction);
    }
  };

  const handleSend = async () => {
    if (!item || !body.trim()) return;

    setIsSending(true);
    setStatusMessage(null);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (userId) headers["x-user-id"] = userId;

      const res = await fetch("/api/briefings/action", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "send",
          itemContext: item,
          subject: subject || undefined,
          body: body.trim(),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Action execution failed");
      }

      const json = await res.json();
      setStatusMessage({
        type: "success",
        text: `Successfully executed action via ${item.platform.toUpperCase()} MCP tool.`,
      });

      if (onActionComplete) {
        onActionComplete(item.id, json);
      }

      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to dispatch action.",
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen || !item) return null;

  const platformName = {
    gmail: "Gmail",
    slack: "Slack",
    whatsapp: "WhatsApp",
    calendar: "Google Calendar",
    gcal: "Google Calendar",
  }[item.platform.toLowerCase()] || item.platform;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-[24px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-6 sm:p-7 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 text-[var(--ink)]">
        {/* Header */}
        <div className="flex items-start justify-between pb-3.5 border-b border-[var(--hairline)]">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline)] shrink-0 p-1.5"
              style={{ borderRadius: "30%" }}
            >
              <SocialIcon name={item.platform} size={20} className="w-5 h-5 object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-[652] tracking-tight">
                  Contextual Action Composer
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#0066FF] text-white text-[10px] font-[600] flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 fill-current" />
                  Gemini
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-[300]">
                Dispatches real MCP tool call to {platformName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--ink)] hover:bg-[var(--canvas)] border border-transparent hover:border-[var(--hairline)] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Item Context Reference Strip */}
        <div className="p-3 rounded-xl bg-[var(--canvas)] border border-[var(--hairline)] space-y-1">
          <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] font-[500]">
            <span className="truncate">From: {item.sender}</span>
            <span className="shrink-0">{item.channelOrThread || platformName}</span>
          </div>
          <div className="text-xs font-[600] text-[var(--ink)] truncate">
            {item.title}
          </div>
          <p className="text-[11px] text-[var(--text-faint)] line-clamp-2 leading-relaxed">
            {formatSnippetText(item.bodySnippet)}
          </p>
        </div>

        {/* Tone Selector & AI Prompt Refine */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-[600] text-[var(--ink-soft)] uppercase tracking-wider">
              Draft Tone
            </label>
            <div className="flex items-center gap-1.5 bg-[var(--canvas)] p-1 rounded-full border border-[var(--hairline)]">
              {(["Professional", "Casual", "Direct"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleToneChange(t)}
                  className={`px-3 py-1 rounded-full text-[11px] font-[600] transition-all cursor-pointer ${
                    tone === t
                      ? "bg-[var(--primary)] text-[var(--on-primary)] shadow-xs"
                      : "text-[var(--text-muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Guidance Prompt */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={userInstruction}
              onChange={(e) => setUserInstruction(e.target.value)}
              placeholder="Guide Gemini: e.g., 'Politely decline meeting' or 'Confirm 2pm Zoom'"
              className="flex-1 px-3.5 py-1.5 rounded-xl bg-[var(--field)] border border-[var(--hairline)] text-xs text-[var(--ink)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-[#0066FF]"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  generateDraft(item, tone, userInstruction);
                }
              }}
            />
            <button
              type="button"
              disabled={isDrafting}
              onClick={() => generateDraft(item, tone, userInstruction)}
              className="px-3 py-1.5 rounded-xl bg-[var(--canvas)] border border-[var(--hairline)] hover:border-[var(--text-muted)] text-[var(--ink)] text-xs font-[600] flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isDrafting ? "animate-spin text-[#0066FF]" : ""}`} />
              <span>Regenerate</span>
            </button>
          </div>
        </div>

        {/* Subject (if Gmail or email) */}
        {item.platform === "gmail" && (
          <div className="space-y-1">
            <label className="text-[11px] font-[600] text-[var(--text-muted)] uppercase tracking-wider">
              Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-[var(--field)] border border-[var(--hairline)] text-xs text-[var(--ink)] focus:outline-none focus:border-[#0066FF]"
            />
          </div>
        )}

        {/* Message Body Editor */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-[600] text-[var(--text-muted)] uppercase tracking-wider">
              Proposed Contextual Reply
            </label>
            {isDrafting && (
              <span className="text-[11px] text-[#0066FF] flex items-center gap-1 animate-pulse">
                <Sparkles className="w-3 h-3" />
                Synthesizing draft...
              </span>
            )}
          </div>
          <textarea
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={isDrafting}
            className="w-full px-4 py-3 rounded-xl bg-[var(--field)] border border-[var(--hairline)] text-xs sm:text-sm text-[var(--ink)] focus:outline-none focus:border-[#0066FF] leading-relaxed resize-none disabled:opacity-50"
          />
        </div>

        {/* Status Alerts */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs font-[500] flex items-center gap-2 ${
              statusMessage.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500"
                : "bg-rose-500/10 border border-rose-500/20 text-rose-500"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--hairline)]">
          <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Target: {platformName}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="px-4 py-2 rounded-full text-xs font-[600] text-[var(--text-muted)] hover:text-[var(--ink)] hover:bg-[var(--canvas)] transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSend}
              disabled={isSending || isDrafting || !body.trim()}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 transition-opacity text-xs font-[600] shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  <span>Dispatching MCP...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>{suggestedAction || "Send Action"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
