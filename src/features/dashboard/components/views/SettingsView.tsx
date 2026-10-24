"use client";

import React, { useState } from "react";
import {
  Settings,
  Bot,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function SettingsView() {
  const [tone, setTone] = useState<"concise" | "diplomatic" | "detailed">("concise");
  const [morningTime, setMorningTime] = useState("07:30");
  const [eveningTime, setEveningTime] = useState("17:30");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 2000);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in-50 duration-200 max-w-4xl">
      {/* ─── Header ─── */}
      <div className="rounded-[24px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--canvas)] border border-[var(--hairline)] text-xs font-[600] text-[var(--ink)]">
            <Settings className="w-3.5 h-3.5 text-[#0066FF]" />
            <span>Assistant Preferences</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-[652] text-[var(--ink)] tracking-tight">
            Settings & Executive Guardrails
          </h2>
          <p className="text-sm text-[var(--text-muted)] font-[300]">
            Customize briefing delivery timings, AI tone of voice, and autonomous approval boundaries.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="px-5 py-2.5 rounded-full bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 font-[600] text-xs sm:text-sm shrink-0 transition-all flex items-center gap-1.5 shadow-xs focus:outline-none"
        >
          {savedSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Saved!</span>
            </>
          ) : (
            <span>Save Preferences</span>
          )}
        </button>
      </div>

      {/* ─── Section 1: Executive Tone & Persona ─── */}
      <div className="rounded-[24px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-5 sm:p-7 space-y-5">
        <div className="flex items-center gap-3 pb-3.5 border-b border-[var(--hairline)]">
          <div
            className="w-9 h-9 flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline)] text-[var(--ink)] shrink-0 shadow-2xs"
            style={{ borderRadius: "30%" }}
          >
            <Bot className="w-4 h-4 stroke-[1.8]" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-[652] text-[var(--ink)]">
              Assistant Personality & Communication Tone
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Governs how ToyBox drafts your emails, WhatsApp responses, and audio briefs.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div
            onClick={() => setTone("concise")}
            className={cn(
              "p-4 rounded-xl border cursor-pointer transition-all space-y-1.5",
              tone === "concise"
                ? "bg-[var(--canvas)] border-[var(--ink)] ring-1 ring-[var(--ink)]"
                : "bg-[var(--canvas)]/60 border-[var(--hairline)] hover:border-[var(--ink-soft)]"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-[652] text-xs sm:text-sm text-[var(--ink)]">Ultra-Concise</span>
              {tone === "concise" && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              Bullet points only. Eliminates fluff and conversational preamble. Highest information density.
            </p>
          </div>

          <div
            onClick={() => setTone("diplomatic")}
            className={cn(
              "p-4 rounded-xl border cursor-pointer transition-all space-y-1.5",
              tone === "diplomatic"
                ? "bg-[var(--canvas)] border-[var(--ink)] ring-1 ring-[var(--ink)]"
                : "bg-[var(--canvas)]/60 border-[var(--hairline)] hover:border-[var(--ink-soft)]"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-[652] text-xs sm:text-sm text-[var(--ink)]">Diplomatic & Warm</span>
              {tone === "diplomatic" && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              Polite, relationship-preserving tone suitable for investor relations and enterprise clients.
            </p>
          </div>

          <div
            onClick={() => setTone("detailed")}
            className={cn(
              "p-4 rounded-xl border cursor-pointer transition-all space-y-1.5",
              tone === "detailed"
                ? "bg-[var(--canvas)] border-[var(--ink)] ring-1 ring-[var(--ink)]"
                : "bg-[var(--canvas)]/60 border-[var(--hairline)] hover:border-[var(--ink-soft)]"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-[652] text-xs sm:text-sm text-[var(--ink)]">Comprehensive</span>
              {tone === "detailed" && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              Includes full background context, thread transcripts, and alternative decision paths.
            </p>
          </div>
        </div>
      </div>

      {/* ─── Section 2: Delivery Schedules ─── */}
      <div className="rounded-[24px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-5 sm:p-7 space-y-5">
        <div className="flex items-center gap-3 pb-3.5 border-b border-[var(--hairline)]">
          <div
            className="w-9 h-9 flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline)] text-[var(--ink)] shrink-0 shadow-2xs"
            style={{ borderRadius: "30%" }}
          >
            <Clock className="w-4 h-4 stroke-[1.8]" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-[652] text-[var(--ink)]">
              Daily Intelligence Delivery Times
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Times when ToyBox compiles and transmits your morning audio brief and evening wrap.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-[var(--canvas)] border border-[var(--hairline)] space-y-1.5">
            <label className="text-xs font-[600] text-[var(--ink)] block">
              Morning Kickoff Briefing (Audio + Email)
            </label>
            <input
              type="time"
              value={morningTime}
              onChange={(e) => setMorningTime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--field)] text-xs text-[var(--ink)] font-mono border-none focus:outline-none focus:ring-1 focus:ring-[var(--ink)]"
            />
            <p className="text-[10px] text-[var(--text-muted)]">
              Prepares calendar dossier and urgent tasks before your first meeting.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[var(--canvas)] border border-[var(--hairline)] space-y-1.5">
            <label className="text-xs font-[600] text-[var(--ink)] block">
              Evening Wrap & Decisions Queue
            </label>
            <input
              type="time"
              value={eveningTime}
              onChange={(e) => setEveningTime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--field)] text-xs text-[var(--ink)] font-mono border-none focus:outline-none focus:ring-1 focus:ring-[var(--ink)]"
            />
            <p className="text-[10px] text-[var(--text-muted)]">
              Synthesizes everything that happened today and queues signatures for approval.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
