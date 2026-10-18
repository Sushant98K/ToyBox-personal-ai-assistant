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
        "Connect Gmail, Slack, WhatsApp Web, Telegram, and Microsoft Outlook securely. Toybox requests read-and-synthesize permissions only — your passwords are never shared.",
      badge: "Instant Setup",
      mock: (
        <div className="flex items-center justify-center gap-2 pt-2">
          {[GmailIcon, SlackIcon, WhatsAppIcon, TelegramIcon, OutlookIcon].map(
            (Icon, idx) => (
              <div
                key={idx}
                className="w-10 h-10 bg-white border border-[#e0e0e0] flex items-center justify-center transition-transform hover:scale-110"
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
      title: "Toybox distills cross-channel noise.",
      description:
        "Our specialized agents cluster threads by subject and urgency. Senders who need immediate input are flagged; low-priority chatter is condensed into executive digests.",
      badge: "Autonomous AI Engine",
      mock: (
        <div className="bg-white p-3.5 rounded-[16px] border border-[#e0e0e0]/70 text-xs text-[#141414] space-y-2">
          <div className="flex items-center justify-between text-[11px] font-[600] text-[#707070]">
            <span>Continuous Triage</span>
            <span className="text-emerald-600">Active</span>
          </div>
          <div className="p-2 rounded-[8px] bg-[#f3f3f3] text-[11px] font-[450]">
            Incoming 42 messages → 3 critical decisions identified
          </div>
        </div>
      ),
    },
    {
      step: "03",
      title: "Approve drafts and clear commitments.",
      description:
        "Review your morning brief in 90 seconds. Approve generated reply drafts, let Toybox schedule calendar blocks, and start your workday with a clear mind.",
      badge: "One-Tap Action",
      mock: (
        <div className="flex items-center gap-2 pt-1">
          <div className="flex-1 bg-white p-2.5 rounded-[12px] border border-[#e0e0e0] text-center">
            <span className="text-xs font-[650] text-[#141414]">Draft Approved</span>
          </div>
          <div className="flex-1 bg-[#141414] text-white p-2.5 rounded-[12px] text-center">
            <span className="text-xs font-[650]">Calendar Synced</span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="workflow" className="py-20 md:py-28 px-4 sm:px-6 bg-[#f3f3f3]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-xs font-[600] text-[#141414] mb-4">
            Workflow Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-[44px] font-[650] text-[#141414] leading-[1.13] tracking-tight">
            How Toybox transforms your day.
          </h2>
          <p className="mt-4 text-lg text-[#707070] font-[300] leading-[1.38]">
            From fractured communication silos to a calm, unified briefing stream in three simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-[24px] p-6 sm:p-7 border border-[#e0e0e0]/60 flex flex-col justify-between transition-all hover:border-[#141414]/30"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <span className="text-xs font-[650] text-[#707070] bg-[#f3f3f3] px-3 py-1 rounded-full">
                    {item.step}
                  </span>
                  <span className="text-[11px] font-[600] text-[#141414] bg-[#f3f3f3] px-2.5 py-1 rounded-full">
                    {item.badge}
                  </span>
                </div>
                <h3 className="text-xl font-[650] text-[#141414] leading-snug">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm text-[#707070] font-[450] leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-[#f0f0f0]">
                {item.mock}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
