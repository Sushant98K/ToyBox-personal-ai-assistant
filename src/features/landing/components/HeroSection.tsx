"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Calendar,
  MessageSquare,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import {
  GmailIcon,
  SlackIcon,
  WhatsAppIcon,
  TelegramIcon,
  OutlookIcon,
} from "@/components/icons";

type ActiveTab = "brief" | "reminders" | "drafts";

export function HeroSection() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("brief");
  const [selectedChannel, setSelectedChannel] = useState<string>("all");
  const [remindersCompleted, setRemindersCompleted] = useState<{ [key: string]: boolean }>({});

  const toggleReminder = (id: string) => {
    setRemindersCompleted((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const channelBadges = [
    { id: "all", label: "Unified Stream", count: 28 },
    { id: "gmail", label: "Gmail", icon: GmailIcon, count: 8 },
    { id: "slack", label: "Slack", icon: SlackIcon, count: 12 },
    { id: "whatsapp", label: "WhatsApp", icon: WhatsAppIcon, count: 4 },
    { id: "telegram", label: "Telegram", icon: TelegramIcon, count: 3 },
    { id: "outlook", label: "Outlook", icon: OutlookIcon, count: 1 },
  ];

  return (
    <section id="overview" className="relative pt-12 pb-20 md:pt-20 md:pb-28 px-4 sm:px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto text-center flex flex-col items-center">
        {/* Soft Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--canvas-soft)] text-[var(--ink)] text-xs font-[600] mb-8 border border-[var(--hairline)]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-[650]">ToyBox.ai</span>
          <span className="text-[var(--text-muted)]">•</span>
          <span>Task Optimization &amp; Yield Bot</span>
          <span className="text-[var(--text-muted)] hidden sm:inline">•</span>
          <span className="text-[var(--text-muted)] hidden sm:inline">Zero-retention encryption</span>
        </div>

        {/* Display Heading - Saans/Inter 652 with tight line-height, ending with terminal period */}
        <h1 className="text-4xl sm:text-6xl md:text-[76px] font-[650] text-[var(--ink)] leading-[1.03] tracking-tight max-w-4xl text-center">
          All your communications, distilled into clarity.
        </h1>

        {/* Lead Subtitle - Saans 300 Light */}
        <p className="mt-6 text-lg sm:text-xl text-[var(--text-muted)] font-[300] leading-[1.4] max-w-2xl text-center">
          Connect Gmail, Slack, WhatsApp, Telegram, and Outlook in minutes. ToyBox.ai triages incoming messages, generates executive daily briefs, and schedules smart reminders before anything slips.
        </p>

        {/* CTA Button Row */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
          <Link
            href="/sign-up"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[var(--primary)] hover:opacity-90 text-[var(--on-primary)] font-[600] text-[16px] px-7 py-3.5 rounded-full transition-all"
          >
            <span>Connect your accounts</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#features"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[var(--canvas)] hover:bg-[var(--canvas-soft)] text-[var(--ink)] border border-[var(--hairline)] font-[600] text-[16px] px-7 py-3.5 rounded-full transition-all"
          >
            <span>Explore features</span>
            <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
          </a>
        </div>

        {/* App Squircle Badges Bar */}
        <div className="mt-10 pt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <span className="text-xs font-[600] text-[var(--text-muted)] uppercase tracking-wider mr-1">
            Seamlessly synced with:
          </span>
          {[
            { name: "Gmail", Icon: GmailIcon },
            { name: "Slack", Icon: SlackIcon },
            { name: "WhatsApp", Icon: WhatsAppIcon },
            { name: "Telegram", Icon: TelegramIcon },
            { name: "Outlook", Icon: OutlookIcon },
          ].map((app) => (
            <div
              key={app.name}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--canvas-soft)] border border-[var(--hairline)] text-xs font-[600] text-[var(--ink)]"
            >
              <div
                className="w-5 h-5 flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline-soft)] shadow-none"
                style={{ borderRadius: "30%" }}
              >
                <app.Icon size={14} />
              </div>
              <span>{app.name}</span>
            </div>
          ))}
        </div>

        {/* Interactive Showcase Mockup Frame */}
        <div className="mt-14 w-full max-w-4xl bg-[var(--canvas)] border border-[var(--hairline)] rounded-[24px] p-4 sm:p-6 text-left shadow-sm">
          {/* Top Bar of the Mockup */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[var(--hairline-soft)] gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[var(--hairline)]" />
                <span className="w-3 h-3 rounded-full bg-[var(--hairline)]" />
                <span className="w-3 h-3 rounded-full bg-[var(--hairline)]" />
              </div>
              <span className="text-xs font-[650] text-[var(--text-muted)] pl-2 border-l border-[var(--hairline)]">
                ToyBox.ai Terminal • Morning Operations Brief
              </span>
            </div>

            {/* Segmented Mode Selector inside Mockup */}
            <div className="bg-[var(--canvas-soft)] p-1 rounded-full inline-flex self-start sm:self-auto border border-[var(--hairline)]">
              <button
                onClick={() => setActiveTab("brief")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-[600] transition-all cursor-pointer ${
                  activeTab === "brief"
                    ? "bg-[var(--raised)] text-[var(--ink)] shadow-sm"
                    : "text-[var(--text-muted)] hover:text-[var(--ink)]"
                }`}
              >
                Executive Brief
              </button>
              <button
                onClick={() => setActiveTab("reminders")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-[600] transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "reminders"
                    ? "bg-[var(--raised)] text-[var(--ink)] shadow-sm"
                    : "text-[var(--text-muted)] hover:text-[var(--ink)]"
                }`}
              >
                <span>Reminders</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </button>
              <button
                onClick={() => setActiveTab("drafts")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-[600] transition-all cursor-pointer ${
                  activeTab === "drafts"
                    ? "bg-[var(--raised)] text-[var(--ink)] shadow-sm"
                    : "text-[var(--text-muted)] hover:text-[var(--ink)]"
                }`}
              >
                Suggested Drafts
              </button>
            </div>
          </div>

          {/* Connected Channels Filter Bar */}
          <div className="pt-4 pb-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {channelBadges.map((badge) => {
              const Icon = badge.icon;
              const isSelected = selectedChannel === badge.id;
              return (
                <button
                  key={badge.id}
                  onClick={() => setSelectedChannel(badge.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-[600] whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[var(--primary)] text-[var(--on-primary)]"
                      : "bg-[var(--canvas-soft)] text-[var(--text-muted)] hover:text-[var(--ink)] border border-[var(--hairline)]"
                  }`}
                >
                  {Icon && (
                    <div
                      className="w-3.5 h-3.5 flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline-soft)]"
                      style={{ borderRadius: "30%" }}
                    >
                      <Icon size={10} />
                    </div>
                  )}
                  <span>{badge.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? "bg-black/20 text-[var(--on-primary)]"
                        : "bg-[var(--hairline)] text-[var(--ink)]"
                    }`}
                  >
                    {badge.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Main Content Area based on Tab */}
          <div className="mt-4 bg-[var(--canvas-soft)] rounded-[16px] p-5 sm:p-6 border border-[var(--hairline-soft)]">
            {activeTab === "brief" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[var(--ink)]" />
                    <h3 className="font-[650] text-sm text-[var(--ink)]">
                      Today&apos;s Synthesis (8:00 AM Digest)
                    </h3>
                  </div>
                  <span className="text-xs font-[450] text-[var(--text-muted)]">
                    28 items analyzed across 5 apps • 4 min reading time saved
                  </span>
                </div>

                {/* Synthesis Bullet 1: Cross-platform deal update */}
                <div className="bg-[var(--canvas)] rounded-[16px] p-4 border border-[var(--hairline)] hover:border-[var(--ink)]/30 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--canvas-soft)] text-[11px] font-[600] text-[var(--ink)] border border-[var(--hairline-soft)]">
                          <div
                            className="w-3.5 h-3.5 flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline-soft)]"
                            style={{ borderRadius: "30%" }}
                          >
                            <GmailIcon size={10} />
                          </div>
                          Gmail
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--canvas-soft)] text-[11px] font-[600] text-[var(--ink)] border border-[var(--hairline-soft)]">
                          <div
                            className="w-3.5 h-3.5 flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline-soft)]"
                            style={{ borderRadius: "30%" }}
                          >
                            <SlackIcon size={10} />
                          </div>
                          Slack #board-updates
                        </span>
                        <span className="text-[11px] font-[600] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          High Priority
                        </span>
                      </div>
                      <p className="font-[650] text-sm text-[var(--ink)]">
                        Series A term sheet revised: Valuation agreed, board seat terms pending review.
                      </p>
                      <p className="text-xs text-[var(--text-muted)] font-[450] leading-relaxed">
                        Partner Alex sent the redlined doc via Gmail (7:12 AM), while Marcus confirmed legal availability on Slack for today at 2:30 PM.
                      </p>
                    </div>
                    <span className="text-xs font-[450] text-[var(--text-faint)] shrink-0">
                      7:14 AM
                    </span>
                  </div>
                </div>

                {/* Synthesis Bullet 2: WhatsApp Voice Note + Telegram alpha */}
                <div className="bg-[var(--canvas)] rounded-[16px] p-4 border border-[var(--hairline)] hover:border-[var(--ink)]/30 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--canvas-soft)] text-[11px] font-[600] text-[var(--ink)] border border-[var(--hairline-soft)]">
                          <div
                            className="w-3.5 h-3.5 flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline-soft)]"
                            style={{ borderRadius: "30%" }}
                          >
                            <WhatsAppIcon size={10} />
                          </div>
                          WhatsApp (Voice Note transcribed)
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--canvas-soft)] text-[11px] font-[600] text-[var(--ink)] border border-[var(--hairline-soft)]">
                          <div
                            className="w-3.5 h-3.5 flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline-soft)]"
                            style={{ borderRadius: "30%" }}
                          >
                            <TelegramIcon size={10} />
                          </div>
                          Telegram Devs
                        </span>
                      </div>
                      <p className="font-[650] text-sm text-[var(--ink)]">
                        Enterprise client demo moved forward: Requested custom security addendum.
                      </p>
                      <p className="text-xs text-[var(--text-muted)] font-[450] leading-relaxed">
                        David left a 2m 14s audio note on WhatsApp asking to include SOC2 Type II report before tomorrow morning&apos;s call.
                      </p>
                    </div>
                    <span className="text-xs font-[450] text-[var(--text-faint)] shrink-0">
                      7:45 AM
                    </span>
                  </div>
                </div>

                {/* Synthesis Bullet 3: Outlook Calendar conflict */}
                <div className="bg-[var(--canvas)] rounded-[16px] p-4 border border-[var(--hairline)] hover:border-[var(--ink)]/30 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--canvas-soft)] text-[11px] font-[600] text-[var(--ink)] border border-[var(--hairline-soft)]">
                          <div
                            className="w-3.5 h-3.5 flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline-soft)]"
                            style={{ borderRadius: "30%" }}
                          >
                            <OutlookIcon size={10} />
                          </div>
                          Outlook Calendar
                        </span>
                        <span className="text-[11px] font-[600] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                          Schedule Clash Resolved
                        </span>
                      </div>
                      <p className="font-[650] text-sm text-[var(--ink)]">
                        Q3 Product Roadmap Review overlapped with Investor sync at 3:00 PM.
                      </p>
                      <p className="text-xs text-[var(--text-muted)] font-[450] leading-relaxed">
                        ToyBox.ai prepared an alternative 4:30 PM slot with all 6 attendees confirmed available.
                      </p>
                    </div>
                    <span className="text-xs font-[450] text-[var(--text-faint)] shrink-0">
                      7:58 AM
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "reminders" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[var(--ink)]" />
                    <h3 className="font-[650] text-sm text-[var(--ink)]">
                      Autonomous Actionable Reminders
                    </h3>
                  </div>
                  <span className="text-xs font-[450] text-[var(--text-muted)]">
                    Detected from natural language commitments
                  </span>
                </div>

                {[
                  {
                    id: "r1",
                    app: "Slack",
                    Icon: SlackIcon,
                    channel: "#partnerships",
                    task: "Send updated API schema doc to Stripe team",
                    time: "Due today at 2:00 PM",
                    source: "You promised in thread: 'Will send doc by 2 PM'",
                  },
                  {
                    id: "r2",
                    app: "WhatsApp",
                    Icon: WhatsAppIcon,
                    channel: "+1 (415) 890-...",
                    task: "Confirm dinner reservation with Carlos at Nobu",
                    time: "Due today at 5:00 PM",
                    source: "Carlos asked: 'Can you lock in 7:30 PM table?'",
                  },
                  {
                    id: "r3",
                    app: "Gmail",
                    Icon: GmailIcon,
                    channel: "legal@company.com",
                    task: "Sign mutual NDA for EMEA expansion partner",
                    time: "Due tomorrow at 10:00 AM",
                    source: "DocuSign link awaiting your signature for 18h",
                  },
                ].map((item) => {
                  const isDone = remindersCompleted[item.id];
                  return (
                    <div
                      key={item.id}
                      className={`bg-[var(--canvas)] rounded-[16px] p-4 border transition-all flex items-center justify-between gap-4 ${
                        isDone
                          ? "opacity-50 border-[var(--hairline)]"
                          : "border-[var(--hairline)] hover:border-[var(--ink)]/30"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleReminder(item.id)}
                          className="mt-0.5 text-[var(--ink)] hover:opacity-80 transition-opacity cursor-pointer"
                        >
                          <CheckCircle2
                            className={`w-5 h-5 ${
                              isDone
                                ? "text-emerald-500 fill-emerald-500/20"
                                : "text-[var(--text-faint)] hover:text-[var(--ink)]"
                            }`}
                          />
                        </button>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--canvas-soft)] text-[11px] font-[600] text-[var(--ink)] border border-[var(--hairline-soft)]">
                              <div
                                className="w-3.5 h-3.5 flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline-soft)]"
                                style={{ borderRadius: "30%" }}
                              >
                                <item.Icon size={10} />
                              </div>
                              {item.app}
                            </span>
                            <span className="text-[11px] font-[600] text-[var(--text-muted)]">
                              {item.time}
                            </span>
                          </div>
                          <p
                            className={`font-[650] text-sm text-[var(--ink)] ${
                              isDone ? "line-through text-[var(--text-muted)]" : ""
                            }`}
                          >
                            {item.task}
                          </p>
                          <p className="text-[11px] text-[var(--text-muted)] font-[450]">
                            {item.source}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleReminder(item.id)}
                        className="hidden sm:inline-flex shrink-0 px-3 py-1.5 rounded-full text-xs font-[600] bg-[var(--canvas-soft)] hover:bg-[var(--field)] text-[var(--ink)] border border-[var(--hairline)] transition-colors cursor-pointer"
                      >
                        {isDone ? "Completed" : "Mark done"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "drafts" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[var(--ink)]" />
                    <h3 className="font-[650] text-sm text-[var(--ink)]">
                      Pre-composed Intelligent Replies
                    </h3>
                  </div>
                  <span className="text-xs font-[450] text-[var(--text-muted)]">
                    Trained on your communication style • 1-click dispatch
                  </span>
                </div>

                <div className="bg-[var(--canvas)] rounded-[16px] p-4 border border-[var(--hairline)] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--canvas-soft)] text-[11px] font-[600] text-[var(--ink)] border border-[var(--hairline-soft)]">
                        <div
                          className="w-3.5 h-3.5 flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline-soft)]"
                          style={{ borderRadius: "30%" }}
                        >
                          <WhatsAppIcon size={10} />
                        </div>
                        WhatsApp to Elena (KPMG Advisory)
                      </span>
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">Ready to send</span>
                  </div>

                  <div className="bg-[var(--canvas-soft)] p-3 rounded-[12px] text-xs font-[450] text-[var(--ink)] leading-relaxed border-l-2 border-[var(--ink)]">
                    &ldquo;Hi Elena, thanks for following up! The board agreed on the clause yesterday. I have attached the updated security annex from Marcus. Let us connect at 2:30 PM as planned.&rdquo;
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button className="px-3.5 py-1.5 rounded-full text-xs font-[600] bg-[var(--canvas-soft)] hover:bg-[var(--field)] text-[var(--ink)] border border-[var(--hairline)] transition-colors cursor-pointer">
                      Edit text
                    </button>
                    <button className="px-4 py-1.5 rounded-full text-xs font-[600] bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 transition-opacity flex items-center gap-1 cursor-pointer">
                      <span>Send via WhatsApp</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Security Banner inside Frame */}
          <div className="mt-4 pt-3 border-t border-[var(--hairline-soft)] flex flex-wrap items-center justify-between text-xs text-[var(--text-muted)] gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Zero-knowledge client tokens • No message logging or model training</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <RefreshCw className="w-3 h-3 text-[var(--text-faint)]" /> Live polling 15s
              </span>
              <span>Updated just now</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
