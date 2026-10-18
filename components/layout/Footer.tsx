import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { siteConfig } from "@/config";
import {
  GmailIcon,
  SlackIcon,
  WhatsAppIcon,
  TelegramIcon,
  OutlookIcon,
} from "@/components/icons";

export function Footer() {
  return (
    <footer className="w-full bg-[#141414] text-white rounded-t-[24px] pt-16 pb-12 px-6 sm:px-12 mt-12">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-14 border-b border-white/10">
          {/* Brand Column (Span 5) */}
          <div className="md:col-span-5 space-y-4">
            <Link href="/" className="flex items-start gap-2.5 group">
              <div
                className="w-8 h-8 bg-white text-[#141414] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 transition-transform group-hover:scale-105"
                style={{ borderRadius: "30%" }}
              >
                <Sparkles className="w-4 h-4 text-[#141414]" />
              </div>
              <div>
                <span className="font-[650] text-xl tracking-tight text-white">
                  {siteConfig.name}
                </span>
                <p className="text-xs text-[#adadad] font-normal tracking-wide mt-0.5">
                  {siteConfig.tagline}
                </p>
              </div>
            </Link>

            <p className="text-sm text-[#adadad] font-[450] max-w-sm leading-relaxed">
              Task Optimization &amp; Yield Bot for Operations and eXecution across Gmail, Slack, WhatsApp, Telegram, and Microsoft Outlook. Transforming communication noise into calm, executive action.
            </p>

            {/* Squircles row in footer */}
            <div className="flex items-center gap-2 pt-2">
              {[GmailIcon, SlackIcon, WhatsAppIcon, TelegramIcon, OutlookIcon].map(
                (Icon, idx) => (
                  <div
                    key={idx}
                    className="w-7 h-7 bg-white/10 flex items-center justify-center text-white"
                    style={{ borderRadius: "30%" }}
                  >
                    <Icon size={14} />
                  </div>
                )
              )}
            </div>
          </div>

          {/* Links Column 1: Product */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-[650] text-[#adadad] uppercase tracking-wider">
              Product
            </h4>
            <ul className="space-y-2.5 text-sm font-[450]">
              <li>
                <a
                  href="#overview"
                  className="text-[#adadad] hover:text-white transition-colors"
                >
                  Executive Briefs
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  className="text-[#adadad] hover:text-white transition-colors"
                >
                  Thread Synthesis
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  className="text-[#adadad] hover:text-white transition-colors"
                >
                  Smart Reminders
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  className="text-[#adadad] hover:text-white transition-colors"
                >
                  Voice Note Whisper
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="text-[#adadad] hover:text-white transition-colors"
                >
                  Pricing Plans
                </a>
              </li>
            </ul>
          </div>

          {/* Links Column 2: Supported Integrations */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-[650] text-[#adadad] uppercase tracking-wider">
              Integrations
            </h4>
            <ul className="space-y-2.5 text-sm font-[450]">
              <li>
                <a
                  href="#integrations"
                  className="text-[#adadad] hover:text-white transition-colors"
                >
                  Gmail Sync
                </a>
              </li>
              <li>
                <a
                  href="#integrations"
                  className="text-[#adadad] hover:text-white transition-colors"
                >
                  Slack Channels
                </a>
              </li>
              <li>
                <a
                  href="#integrations"
                  className="text-[#adadad] hover:text-white transition-colors"
                >
                  WhatsApp Multi-Device
                </a>
              </li>
              <li>
                <a
                  href="#integrations"
                  className="text-[#adadad] hover:text-white transition-colors"
                >
                  Telegram MTProto
                </a>
              </li>
              <li>
                <a
                  href="#integrations"
                  className="text-[#adadad] hover:text-white transition-colors"
                >
                  Microsoft Outlook
                </a>
              </li>
            </ul>
          </div>

          {/* Links Column 3: Trust & Company */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-[650] text-[#adadad] uppercase tracking-wider">
              Privacy & Trust
            </h4>
            <ul className="space-y-2.5 text-sm font-[450]">
              <li>
                <a
                  href="#faq"
                  className="text-[#adadad] hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>Zero-Retention Policy</span>
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className="text-[#adadad] hover:text-white transition-colors"
                >
                  Security Whitepaper
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className="text-[#adadad] hover:text-white transition-colors"
                >
                  SOC2 Compliance
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className="text-[#adadad] hover:text-white transition-colors"
                >
                  GDPR & CCPA
                </a>
              </li>
              <li>
                <a
                  href="#signup"
                  className="text-[#adadad] hover:text-white transition-colors"
                >
                  Support & Status
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Sub-footer */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#adadad] gap-4">
          <div>
            © 2026 {siteConfig.name} Intelligence Systems Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-white transition-colors cursor-pointer">
              Privacy Notice
            </span>
            <span className="hover:text-white transition-colors cursor-pointer">
              Terms of Service
            </span>
            <span className="hover:text-white transition-colors cursor-pointer">
              Cookie Preferences
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
