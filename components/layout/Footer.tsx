"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/config";
import { useTheme } from "@/components/theme";
import {
  GmailIcon,
  SlackIcon,
  WhatsAppIcon,
  TelegramIcon,
  OutlookIcon,
} from "@/components/icons";

export function Footer() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Theme-aware logo: dark-ToyBox.png for dark theme, light-ToyBox.png for light theme
  const isLight = mounted && theme === "light";
  const logoSrc = isLight ? "/logos/light-ToyBox.png" : "/logos/dark-ToyBox.png";

  return (
    <footer className="w-full bg-[var(--canvas-soft)] text-[var(--ink)] rounded-t-[24px] border-t border-[var(--hairline)] pt-16 pb-12 px-6 sm:px-12 mt-12 transition-colors duration-200">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-14 border-b border-[var(--hairline)]">
          {/* Brand Column (Span 5) */}
          <div className="md:col-span-5 space-y-4">
            <Link href="/" className="inline-block group">
              <Image
                key={logoSrc}
                src={logoSrc}
                alt="ToyBox.ai"
                width={1000}
                height={390}
                className="h-14 sm:h-14 w-auto object-contain transition-transform group-hover:scale-[1.02]"
                priority
              />
            </Link>

            <p className="text-sm text-[var(--text-muted)] font-[450] max-w-sm leading-relaxed">
              Task Optimization &amp; Yield Bot for Operations and eXecution across Gmail, Slack, WhatsApp, Telegram, and Microsoft Outlook. Transforming communication noise into calm, executive action.
            </p>

            {/* Squircles row in footer */}
            <div className="flex items-center gap-2 pt-2">
              {[GmailIcon, SlackIcon, WhatsAppIcon, TelegramIcon, OutlookIcon].map(
                (Icon, idx) => (
                  <div
                    key={idx}
                    className="w-7 h-7 bg-[var(--canvas)] border border-[var(--hairline)] flex items-center justify-center text-[var(--ink)] shadow-xs"
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
            <h4 className="text-xs font-[650] text-[var(--text-muted)] uppercase tracking-wider">
              Product
            </h4>
            <ul className="space-y-2.5 text-sm font-[450]">
              <li>
                <a
                  href="#overview"
                  className="text-[var(--text-muted)] hover:text-[var(--ink)] transition-colors"
                >
                  Executive Briefs
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  className="text-[var(--text-muted)] hover:text-[var(--ink)] transition-colors"
                >
                  Thread Synthesis
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  className="text-[var(--text-muted)] hover:text-[var(--ink)] transition-colors"
                >
                  Smart Reminders
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  className="text-[var(--text-muted)] hover:text-[var(--ink)] transition-colors"
                >
                  Voice Note Whisper
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="text-[var(--text-muted)] hover:text-[var(--ink)] transition-colors"
                >
                  Pricing Plans
                </a>
              </li>
            </ul>
          </div>

          {/* Links Column 2: Supported Integrations */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-[650] text-[var(--text-muted)] uppercase tracking-wider">
              Integrations
            </h4>
            <ul className="space-y-2.5 text-sm font-[450]">
              <li>
                <a
                  href="#integrations"
                  className="text-[var(--text-muted)] hover:text-[var(--ink)] transition-colors"
                >
                  Gmail Sync
                </a>
              </li>
              <li>
                <a
                  href="#integrations"
                  className="text-[var(--text-muted)] hover:text-[var(--ink)] transition-colors"
                >
                  Slack Channels
                </a>
              </li>
              <li>
                <a
                  href="#integrations"
                  className="text-[var(--text-muted)] hover:text-[var(--ink)] transition-colors"
                >
                  WhatsApp Multi-Device
                </a>
              </li>
              <li>
                <a
                  href="#integrations"
                  className="text-[var(--text-muted)] hover:text-[var(--ink)] transition-colors"
                >
                  Telegram MTProto
                </a>
              </li>
              <li>
                <a
                  href="#integrations"
                  className="text-[var(--text-muted)] hover:text-[var(--ink)] transition-colors"
                >
                  Microsoft Outlook
                </a>
              </li>
            </ul>
          </div>

          {/* Links Column 3: Trust & Company */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-[650] text-[var(--text-muted)] uppercase tracking-wider">
              Privacy & Trust
            </h4>
            <ul className="space-y-2.5 text-sm font-[450]">
              <li>
                <a
                  href="#faq"
                  className="text-[var(--text-muted)] hover:text-[var(--ink)] transition-colors flex items-center gap-1"
                >
                  <span>Zero-Retention Policy</span>
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className="text-[var(--text-muted)] hover:text-[var(--ink)] transition-colors"
                >
                  Security Whitepaper
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className="text-[var(--text-muted)] hover:text-[var(--ink)] transition-colors"
                >
                  SOC2 Compliance
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className="text-[var(--text-muted)] hover:text-[var(--ink)] transition-colors"
                >
                  GDPR & CCPA
                </a>
              </li>
              <li>
                <Link
                  href="/sign-in"
                  className="text-[var(--text-muted)] hover:text-[var(--ink)] transition-colors"
                >
                  Support & Status
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Sub-footer */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--text-muted)] gap-4">
          <div>
            © 2026 {siteConfig.name} Intelligence Systems Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-[var(--ink)] transition-colors cursor-pointer">
              Privacy Notice
            </span>
            <span className="hover:text-[var(--ink)] transition-colors cursor-pointer">
              Terms of Service
            </span>
            <span className="hover:text-[var(--ink)] transition-colors cursor-pointer">
              Cookie Preferences
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
