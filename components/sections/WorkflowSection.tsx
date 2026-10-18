import React from "react";
import {
  GmailIcon,
  SlackIcon,
  WhatsAppIcon,
  TelegramIcon,
  OutlookIcon,
} from "@/components/icons";

export function WorkflowSection() {
  const steps = [
    {
      step: "01",
      title: "One-click OAuth authentication.",
      description:
        "Connect Gmail, Slack, WhatsApp Web, Telegram, and Microsoft Outlook securely. ToyBox.ai requests read-and-synthesize permissions only — your passwords are never shared.",
      badge: "Instant Setup",
      mock: (
        <div className="flex items-center justify-center gap-2 pt-2">
          {[GmailIcon, SlackIcon, WhatsAppIcon, TelegramIcon, OutlookIcon].map(
            (Icon, idx) => (
              <div
                key={idx}
                className="w-10 h-10 bg-[var(--canvas)] border border-[var(--hairline)] flex items-center justify-center transition-transform hover:scale-110"
                style={{ borderRadius: "30%" }}
              >
                <Icon size={20} />
              </div>
            )
          )}
        </div>
      ),
    },
    {
      step: "02",
      title: "ToyBox.ai distills cross-channel noise.",
      description:
        "Our specialized agents cluster threads by subject and urgency. Senders who need immediate input are flagged; low-priority chatter is condensed into executive digests.",
      badge: "Autonomous AI Engine",
      mock: (
        <div className="bg-[var(--canvas)] p-3.5 rounded-[16px] border border-[var(--hairline)] text-xs text-[var(--ink)] space-y-2">
          <div className="flex items-center justify-between text-[11px] font-[600] text-[var(--text-muted)]">
            <span>Continuous Triage</span>
            <span className="text-emerald-500">Active</span>
          </div>
          <div className="p-2 rounded-[8px] bg-[var(--canvas-soft)] text-[11px] font-[450] text-[var(--ink)]">
            Incoming 42 messages → 3 critical decisions identified
          </div>
        </div>
      ),
    },
    {
      step: "03",
      title: "Approve drafts and clear commitments.",
      description:
        "Review your morning brief in 90 seconds. Approve generated reply drafts, let ToyBox.ai schedule calendar blocks, and start your workday with a clear mind.",
      badge: "One-Tap Action",
      mock: (
        <div className="flex items-center gap-2 pt-1">
          <div className="flex-1 bg-[var(--canvas)] p-2.5 rounded-[12px] border border-[var(--hairline)] text-center">
            <span className="text-xs font-[650] text-[var(--ink)]">Draft Approved</span>
          </div>
          <div className="flex-1 bg-[var(--primary)] text-[var(--on-primary)] p-2.5 rounded-[12px] text-center">
            <span className="text-xs font-[650]">Calendar Synced</span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="workflow" className="py-20 md:py-28 px-4 sm:px-6 bg-[var(--canvas-soft)] border-y border-[var(--hairline-soft)] transition-colors duration-200">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--canvas)] text-xs font-[600] text-[var(--ink)] mb-4 border border-[var(--hairline)]">
            Workflow Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-[44px] font-[650] text-[var(--ink)] leading-[1.13] tracking-tight">
            How ToyBox.ai transforms your day.
          </h2>
          <p className="mt-4 text-lg text-[var(--text-muted)] font-[300] leading-[1.38]">
            From fractured communication silos to a calm, unified briefing stream in three simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((item, index) => (
            <div
              key={index}
              className="bg-[var(--canvas)] rounded-[24px] p-6 sm:p-7 border border-[var(--hairline)] flex flex-col justify-between transition-all hover:border-[var(--ink)]/30"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <span className="text-xs font-[650] text-[var(--text-muted)] bg-[var(--canvas-soft)] px-3 py-1 rounded-full border border-[var(--hairline-soft)]">
                    {item.step}
                  </span>
                  <span className="text-[11px] font-[600] text-[var(--ink)] bg-[var(--canvas-soft)] px-2.5 py-1 rounded-full border border-[var(--hairline-soft)]">
                    {item.badge}
                  </span>
                </div>
                <h3 className="text-xl font-[650] text-[var(--ink)] leading-snug">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm text-[var(--text-muted)] font-[450] leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-[var(--hairline-soft)]">
                {item.mock}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
