"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Send,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  MessageSquare,
  Mail,
  Shield,
  Layers,
} from "lucide-react";
import { SocialIcon } from "@/components/icons/AppIcons";
import { TriggeredAlert, AlertAnalysisResult } from "@/types/alerts";
import { cn } from "@/lib/utils";

interface AlertDetailModalProps {
  alert: TriggeredAlert | null;
  isOpen: boolean;
  onClose: () => void;
  onResolve: (alertId: string) => Promise<void>;
  onSnooze: (alertId: string, hours: number) => Promise<void>;
  onRefresh: () => void;
}

export function AlertDetailModal({
  alert,
  isOpen,
  onClose,
  onResolve,
  onSnooze,
  onRefresh,
}: AlertDetailModalProps) {
  const [analysis, setAnalysis] = useState<AlertAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [draftBody, setDraftBody] = useState("");
  const [draftRecipient, setDraftRecipient] = useState("");
  const [draftSubject, setDraftSubject] = useState("");
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Automatically request AI analysis when alert opens
  useEffect(() => {
    if (!alert || !isOpen) {
      setAnalysis(null);
      setActionSuccessMessage(null);
      setActionError(null);
      return;
    }

    let isMounted = true;
    async function loadAnalysis() {
      setIsAnalyzing(true);
      try {
        const res = await fetch("/api/alerts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "analyze_alert",
            alert,
          }),
        });

        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.analysis) {
            setAnalysis(data.analysis);
            setDraftBody(data.analysis.prefilledDraft?.body || "");
            setDraftRecipient(data.analysis.prefilledDraft?.recipient || alert?.metadata?.sender || "");
            setDraftSubject(data.analysis.prefilledDraft?.subject || `Re: ${alert?.title}`);
          }
        }
      } catch (err) {
        console.warn("Could not load AI alert analysis:", err);
      } finally {
        if (isMounted) setIsAnalyzing(false);
      }
    }

    loadAnalysis();
    return () => {
      isMounted = false;
    };
  }, [alert, isOpen]);

  if (!isOpen || !alert) return null;

  const normApp = (alert.app || "").toLowerCase();

  const handleExecuteAction = async () => {
    setIsExecutingAction(true);
    setActionSuccessMessage(null);
    setActionError(null);

    try {
      let toolName = "";
      let toolArgs: Record<string, any> = {};

      if (normApp.includes("gmail")) {
        toolName = "gmail_search_messages"; // Or email action
        toolArgs = {
          to: draftRecipient,
          subject: draftSubject,
          body: draftBody,
        };
      } else if (normApp.includes("whatsapp")) {
        toolName = "whatsapp_send_message";
        toolArgs = {
          recipient: draftRecipient,
          message: draftBody,
        };
      } else if (normApp.includes("slack")) {
        toolName = "slack_post_message";
        toolArgs = {
          channel: alert.metadata?.channel || "general",
          text: draftBody,
          thread_ts: alert.metadata?.ts,
        };
      } else if (normApp.includes("calendar")) {
        toolName = "calendar_create_event";
        const nowIso = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        const endIso = new Date(Date.now() + 105 * 60 * 1000).toISOString();
        toolArgs = {
          summary: `Buffer: Rescheduled ${alert.title}`,
          startTime: nowIso,
          endTime: endIso,
          description: draftBody,
        };
      }

      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute_action",
          alertId: alert.id,
          toolName: toolName || "whatsapp_send_message",
          toolArgs,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccessMessage("Action executed successfully and alert marked as resolved!");
        onRefresh();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setActionError(data.error || "Failed to execute action. Please verify connected permissions.");
      }
    } catch (err: any) {
      setActionError(err.message || "Failed to execute contextual action");
    } finally {
      setIsExecutingAction(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/75 backdrop-blur-sm animate-in fade-in-50 duration-150">
      <div className="relative w-full max-w-2xl bg-[var(--canvas-soft)] border border-[var(--hairline)] rounded-[24px] shadow-2xl p-6 sm:p-7 space-y-6 text-[var(--ink)] my-8">
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-4 border-b border-[var(--hairline)] pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline)] shadow-2xs shrink-0"
              style={{ borderRadius: "30%" }}
            >
              <SocialIcon name={alert.app} size={20} className="w-5 h-5 object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  {alert.app.toUpperCase()}
                </span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight",
                    alert.priority === "urgent"
                      ? "bg-rose-500/15 text-rose-500 border border-rose-500/20"
                      : alert.priority === "high"
                      ? "bg-amber-500/15 text-amber-500 border border-amber-500/20"
                      : "bg-blue-500/15 text-blue-500 border border-blue-500/20"
                  )}
                >
                  {alert.priority}
                </span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize",
                    alert.status === "active"
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                      : "bg-[var(--raised)] text-[var(--text-muted)] border border-[var(--hairline)]"
                  )}
                >
                  {alert.status}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-[652] text-[var(--ink)] tracking-tight mt-0.5">
                {alert.title}
              </h2>
            </div>
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

        {/* Alert Raw Context */}
        <div className="space-y-2">
          <div className="text-[11px] font-[600] uppercase tracking-wider text-[var(--text-faint)]">
            Alert Context & Payload
          </div>
          <div className="p-3.5 rounded-xl bg-[var(--canvas)] border border-[var(--hairline)] text-xs text-[var(--ink-soft)] leading-relaxed space-y-1.5">
            <p>{alert.message}</p>
            {alert.metadata?.source && (
              <div className="text-[10px] text-[var(--text-muted)] pt-1 flex items-center gap-2">
                <span>Source: {alert.metadata.source}</span>
                <span>•</span>
                <span>Triggered: {new Date(alert.triggered_at).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* AI Analysis Suite (gemini-3.5-flash-lite) */}
        <div className="rounded-[20px] bg-[var(--canvas)] border border-[#0066FF]/20 p-4 sm:p-5 space-y-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#0066FF]/15 flex items-center justify-center text-[#0066FF]">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-[652] text-[var(--ink)] tracking-tight">
                AI Summary & Recommendation
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--raised)] border border-[var(--hairline)] text-[var(--text-muted)]">
              gemini-3.5-flash-lite
            </span>
          </div>

          {isAnalyzing ? (
            <div className="flex items-center gap-2 py-4 text-xs text-[var(--text-muted)] animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin text-[#0066FF]" />
              <span>Analyzing alert context and drafting resolution with Gemini 3.5 Flash-Lite...</span>
            </div>
          ) : analysis ? (
            <div className="space-y-3 text-xs leading-relaxed">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0066FF]">
                  Root Cause / Trigger Reason
                </span>
                <p className="text-[var(--ink-soft)]">{analysis.whyTriggered}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Immediate Recommended Step
                </span>
                <p className="text-[var(--ink-soft)]">{analysis.immediateNextStep}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">No AI analysis available.</p>
          )}
        </div>

        {/* Contextual Action Suite / Quick Reply Draft */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-[600] uppercase tracking-wider text-[var(--text-faint)]">
              Contextual Action / Quick Response
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">
              One-click dispatch via {alert.app} MCP
            </span>
          </div>

          <div className="space-y-2">
            {normApp.includes("gmail") && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={draftRecipient}
                  onChange={(e) => setDraftRecipient(e.target.value)}
                  placeholder="Recipient"
                  className="px-3 py-1.5 rounded-xl bg-[var(--field)] border border-[var(--hairline)] text-xs text-[var(--ink)] focus:outline-none focus:border-[#0066FF]"
                />
                <input
                  type="text"
                  value={draftSubject}
                  onChange={(e) => setDraftSubject(e.target.value)}
                  placeholder="Subject"
                  className="px-3 py-1.5 rounded-xl bg-[var(--field)] border border-[var(--hairline)] text-xs text-[var(--ink)] focus:outline-none focus:border-[#0066FF]"
                />
              </div>
            )}

            <textarea
              rows={3}
              value={draftBody}
              onChange={(e) => setDraftBody(e.target.value)}
              placeholder="Edit response draft or message notes..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--field)] border border-[var(--hairline)] text-xs text-[var(--ink)] focus:outline-none focus:border-[#0066FF] resize-none leading-relaxed"
            />
          </div>

          {actionSuccessMessage && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-[500] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{actionSuccessMessage}</span>
            </div>
          )}

          {actionError && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-[500] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}
        </div>

        {/* Bottom Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--hairline)]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isExecutingAction || alert.status === "resolved"}
              onClick={() => onResolve(alert.id)}
              className="px-3.5 py-1.5 rounded-full text-xs font-[600] bg-[var(--canvas)] border border-[var(--hairline)] text-[var(--ink)] hover:border-emerald-500 hover:text-emerald-400 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark as Resolved</span>
            </button>

            <button
              type="button"
              disabled={isExecutingAction || alert.status === "snoozed"}
              onClick={() => onSnooze(alert.id, 4)}
              className="px-3.5 py-1.5 rounded-full text-xs font-[600] bg-[var(--canvas)] border border-[var(--hairline)] text-[var(--text-muted)] hover:text-[var(--ink)] transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Snooze (4h)</span>
            </button>
          </div>

          <button
            type="button"
            disabled={isExecutingAction || !draftBody}
            onClick={handleExecuteAction}
            className="px-4 py-2 rounded-full text-xs font-[652] bg-[#0066FF] text-white hover:bg-[#0066FF]/90 transition-all shadow-xs flex items-center gap-2 disabled:opacity-60"
          >
            {isExecutingAction ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Executing...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch Action via {alert.app}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
