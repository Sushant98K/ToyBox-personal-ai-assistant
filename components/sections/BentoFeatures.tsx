"use client";

import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  Volume2,
  Filter,
  Calendar,
  Lock,
  ShieldCheck,
} from "lucide-react";
import {
  GmailIcon,
  SlackIcon,
  WhatsAppIcon,
} from "@/components/icons";

export function BentoFeatures() {
  const [filterActive, setFilterActive] = useState(false);

  return (
    <section id="features" className="py-20 md:py-32 px-4 sm:px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        {/* Section Header with terminal period and 652/300 weight pairing */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f3f3f3] text-xs font-[600] text-[#141414] mb-4">
            <span>Intelligent Core</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-[650] text-[#141414] leading-[1.1] tracking-tight">
            Engineered to quiet the noise.
          </h2>
          <p className="mt-5 text-lg sm:text-xl text-[#707070] font-[300] leading-[1.38]">
            Toybox monitors your disparate communication channels around the clock, so you only engage when your judgment is genuinely needed.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Card 1: Large Span (Col 1 to 8) - Cross-Platform Thread Synthesis */}
          <div className="md:col-span-8 bg-[#f3f3f3] rounded-[24px] p-6 sm:p-8 flex flex-col justify-between transition-all hover:bg-[#efefef]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-xs font-[600] text-[#141414]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Cross-App Thread Fusion</span>
                </span>
                <span className="text-xs font-[450] text-[#707070]">
                  Real-time rollup
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-[650] text-[#141414] leading-snug">
                One narrative across WhatsApp, Slack, and Gmail.
              </h3>
              <p className="mt-3 text-[#707070] font-[450] text-sm sm:text-base leading-relaxed max-w-xl">
                When a high-stakes deal scatters across an email thread, a Slack channel, and urgent WhatsApp pings, Toybox merges them into a single coherent timeline with direct citations.
              </p>
            </div>

            {/* Visual simulation of fragmented inputs into 1 summary */}
            <div className="mt-8 bg-white rounded-[16px] p-4 sm:p-5 border border-[#e0e0e0]/70 space-y-3">
              <div className="text-xs font-[600] text-[#707070] flex items-center justify-between">
                <span>Unified Incident / Project Rollup #408</span>
                <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-[600]">
                  Resolved in 4 min
                </span>
              </div>

              {/* Source pills */}
              <div className="flex flex-wrap gap-2 pt-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f3f3f3] text-[11px] font-[600] text-[#141414]">
                  <div
                    className="w-3.5 h-3.5 flex items-center justify-center bg-white"
                    style={{ borderRadius: "30%" }}
                  >
                    <SlackIcon size={10} />
                  </div>
                  <span>Slack #incidents: &quot;API gateway 502 spike&quot;</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f3f3f3] text-[11px] font-[600] text-[#141414]">
                  <div
                    className="w-3.5 h-3.5 flex items-center justify-center bg-white"
                    style={{ borderRadius: "30%" }}
                  >
                    <WhatsAppIcon size={10} />
                  </div>
                  <span>WhatsApp CTPO: &quot;Rollback initiated&quot;</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f3f3f3] text-[11px] font-[600] text-[#141414]">
                  <div
                    className="w-3.5 h-3.5 flex items-center justify-center bg-white"
                    style={{ borderRadius: "30%" }}
                  >
                    <GmailIcon size={10} />
                  </div>
                  <span>Gmail: AWS post-mortem report</span>
                </div>
              </div>

              {/* Result output */}
              <div className="p-3 bg-[#f3f3f3] rounded-[12px] text-xs font-[450] text-[#141414] leading-relaxed">
                <span className="font-[650] text-[#141414]">Executive Takeaway: </span>
                Outage lasted 7 minutes and is fully restored. Root cause identified in Cloudflare rule migration. Client SLA was maintained (99.98%). No executive action required.
              </div>
            </div>
          </div>

          {/* Card 2: Col 9 to 12 - Autonomous Reminders */}
          <div className="md:col-span-4 bg-white border border-[#e0e0e0] rounded-[24px] p-6 sm:p-8 flex flex-col justify-between transition-all hover:border-[#141414]/30">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f3f3f3] text-xs font-[600] text-[#141414]">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Smart Reminders</span>
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-[650] text-[#141414] leading-snug">
                Zero missed commitments.
              </h3>
              <p className="mt-3 text-[#707070] font-[450] text-sm leading-relaxed">
                Toybox reads implicit commitments like <em>&ldquo;I&apos;ll send the pitch deck tomorrow at 2 PM&rdquo;</em> and auto-schedules verified reminders.
              </p>
            </div>

            <div className="mt-6 bg-[#f3f3f3] rounded-[16px] p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-[600] text-[#141414]">
                <span>Detected in Slack DM</span>
                <span className="text-[#707070]">2h remaining</span>
              </div>
              <div className="bg-white p-3 rounded-[12px] border border-[#e0e0e0]/60 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-[650] text-[#141414]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Send Revised Cap Table</span>
                </div>
                <p className="text-[11px] text-[#707070] font-[450]">
                  Target: investor@sequoia.com • Outlook Calendar blocked
                </p>
              </div>
              <div className="text-[11px] text-[#707070] italic">
                &ldquo;Will ping you the cap table before 4 PM.&rdquo;
              </div>
            </div>
          </div>

          {/* Card 3: Col 1 to 4 - Voice Note Summarizer */}
          <div className="md:col-span-4 bg-white border border-[#e0e0e0] rounded-[24px] p-6 sm:p-8 flex flex-col justify-between transition-all hover:border-[#141414]/30">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f3f3f3] text-xs font-[600] text-[#141414]">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Audio Whisper AI</span>
                </span>
                <span className="text-xs font-[450] text-[#707070]">
                  WhatsApp & Telegram
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-[650] text-[#141414] leading-snug">
                Audio notes into instant bullet points.
              </h3>
              <p className="mt-3 text-[#707070] font-[450] text-sm leading-relaxed">
                Skip listening to 4-minute voice rambles. Toybox strips verbal filler, captures the core decision, and highlights what you owe.
              </p>
            </div>

            <div className="mt-6 bg-[#f3f3f3] rounded-[16px] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 flex items-center justify-center bg-white"
                    style={{ borderRadius: "30%" }}
                  >
                    <WhatsAppIcon size={12} />
                  </div>
                  <span className="text-xs font-[600] text-[#141414]">
                    Voice note (3m 42s)
                  </span>
                </div>
                <span className="text-[11px] font-[600] text-[#707070] bg-white px-2 py-0.5 rounded-full">
                  Transcribed
                </span>
              </div>

              {/* Fake Audio Waveform */}
              <div className="flex items-center gap-1 py-1 px-1">
                {[12, 24, 16, 32, 20, 28, 14, 30, 22, 10, 26, 18, 32, 14, 20, 28, 16, 22, 12, 18].map(
                  (height, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-[#141414] rounded-full"
                      style={{ height: `${height}px` }}
                    />
                  )
                )}
              </div>

              <div className="bg-white p-2.5 rounded-[12px] border border-[#e0e0e0]/70 text-xs text-[#141414] font-[450] leading-relaxed">
                <strong>Summary:</strong> Client agreed to move deployment date to Nov 1st provided that SSO setup is finalized this Friday.
              </div>
            </div>
          </div>

          {/* Card 4: Col 5 to 8 - VIP Noise Firewall */}
          <div className="md:col-span-4 bg-[#f3f3f3] rounded-[24px] p-6 sm:p-8 flex flex-col justify-between transition-all hover:bg-[#efefef]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-xs font-[600] text-[#141414]">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Smart Firewall</span>
                </span>
                <span className="text-xs font-[450] text-[#707070]">
                  Zero notification fatigue
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-[650] text-[#141414] leading-snug">
                VIP signals through. Noise held back.
              </h3>
              <p className="mt-3 text-[#707070] font-[450] text-sm leading-relaxed">
                Toybox silences newsletters and chat clutter while ensuring you never miss a message from your board, key partners, or family.
              </p>
            </div>

            <div className="mt-6 bg-white rounded-[16px] p-4 border border-[#e0e0e0]/70 space-y-2">
              <div className="flex items-center justify-between pb-1 text-xs">
                <span className="font-[600] text-[#141414]">Signal vs Noise</span>
                <button
                  onClick={() => setFilterActive(!filterActive)}
                  className="text-[11px] font-[600] text-[#141414] underline"
                >
                  {filterActive ? "Show all" : "Filter noise"}
                </button>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between p-2 rounded-[8px] bg-emerald-50 text-emerald-800 text-xs font-[600]">
                  <span>VIP: Lead Investor (WhatsApp)</span>
                  <span className="text-[10px] bg-emerald-100 px-1.5 py-0.5 rounded-full">
                    Instant Alert
                  </span>
                </div>
                <div
                  className={`flex items-center justify-between p-2 rounded-[8px] bg-[#f3f3f3] text-[#707070] text-xs transition-opacity ${filterActive ? "opacity-30" : "opacity-100"
                    }`}
                >
                  <span>14 Promotional Newsletters (Gmail)</span>
                  <span className="text-[10px] bg-[#e0e0e0] px-1.5 py-0.5 rounded-full text-[#141414]">
                    Batched for 6 PM
                  </span>
                </div>
                <div
                  className={`flex items-center justify-between p-2 rounded-[8px] bg-[#f3f3f3] text-[#707070] text-xs transition-opacity ${filterActive ? "opacity-30" : "opacity-100"
                    }`}
                >
                  <span>37 Telegram public channel alerts</span>
                  <span className="text-[10px] bg-[#e0e0e0] px-1.5 py-0.5 rounded-full text-[#141414]">
                    Muted
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: Col 9 to 12 - Zero-Retention Security */}
          <div className="md:col-span-4 bg-white border border-[#e0e0e0] rounded-[24px] p-6 sm:p-8 flex flex-col justify-between transition-all hover:border-[#141414]/30">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f3f3f3] text-xs font-[600] text-[#141414]">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Enterprise Privacy</span>
                </span>
                <span className="text-xs font-[450] text-[#707070]">
                  SOC2 Certified
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-[650] text-[#141414] leading-snug">
                Zero-knowledge data policy.
              </h3>
              <p className="mt-3 text-[#707070] font-[450] text-sm leading-relaxed">
                Messages are processed entirely in ephemeral RAM. Your communications are never stored on persistent disks or used to train external models.
              </p>
            </div>

            <div className="mt-6 bg-[#f3f3f3] rounded-[16px] p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-[600] text-[#141414]">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Audited Privacy Architecture</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-[600] text-[#141414]">
                <div className="bg-white p-2 rounded-[8px] text-center border border-[#e0e0e0]/70">
                  AES-256 at Rest
                </div>
                <div className="bg-white p-2 rounded-[8px] text-center border border-[#e0e0e0]/70">
                  Zero LLM Training
                </div>
                <div className="bg-white p-2 rounded-[8px] text-center border border-[#e0e0e0]/70">
                  GDPR & CCPA
                </div>
                <div className="bg-white p-2 rounded-[8px] text-center border border-[#e0e0e0]/70">
                  Volatile RAM Only
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
