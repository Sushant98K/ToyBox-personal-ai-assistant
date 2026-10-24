"use client";

import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Users,
} from "lucide-react";
import { SocialIcon } from "@/components/icons/AppIcons";

interface GmailConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: (data: any) => void;
  currentUserId?: string;
}

export function GmailConnectModal({
  isOpen,
  onClose,
  currentUserId,
}: GmailConnectModalProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartGoogleOAuth = async () => {
    setIsRedirecting(true);
    setErrorMsg(null);

    try {
      // Check server configuration and retrieve Google OAuth consent URL
      const currentUrl = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/dashboard?tab=integrations";
      const res = await fetch(`/api/auth/gmail?format=json&userId=${encodeURIComponent(currentUserId || "")}&returnUrl=${encodeURIComponent(currentUrl)}`);
      const data = await res.json();

      if (!res.ok || !data.configured) {
        throw new Error(
          data.error ||
          "Google OAuth credentials are not configured yet in .env. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."
        );
      }

      // Redirect user's browser directly to Google's account selection & OAuth consent screen
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Did not receive a valid authorization URL from server.");
      }
    } catch (err: any) {
      console.error("Google OAuth start error:", err);
      setErrorMsg(err.message || "Failed to initiate Google OAuth.");
      setIsRedirecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-xl bg-[var(--canvas-soft)] border border-[var(--hairline)] rounded-[24px] shadow-2xl p-6 sm:p-8 space-y-6 z-10 transition-colors animate-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline)] p-2 shrink-0 shadow-xs"
              style={{ borderRadius: "30%" }}
            >
              <SocialIcon name="gmail" size={32} className="w-8 h-8 object-contain" alt="Gmail" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--canvas)] border border-[var(--hairline)] text-[10px] font-[600] text-[var(--ink)] mb-1">
                <Sparkles className="w-3 h-3 text-[#0066FF]" />
                <span>Google Workspace · MCP</span>
              </div>
              <h3 className="font-[652] text-xl text-[var(--ink)] tracking-tight">
                Connect Google Workspace / Gmail
              </h3>
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

        {/* Informative Error Notice if Credentials Not Found */}
        {errorMsg && (
          <div className="p-4 rounded-[16px] bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-[600]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Google OAuth Configuration Needed</span>
            </div>
            <p className="font-[300] leading-relaxed text-[11px] text-[var(--text-muted)]">
              {errorMsg}
            </p>
          </div>
        )}

        {/* Modal Description */}
        <div className="space-y-4">
          <p className="text-xs text-[var(--text-muted)] font-[300] leading-relaxed">
            Connect your Google account with official OAuth 2.0. Clicking the button below will open Google&apos;s account picker window so you can choose which Gmail account to connect to ToyBox AI.
          </p>

          {/* Active MCP Tools Capabilities */}
          <div className="p-4 rounded-[18px] bg-[var(--canvas)] border border-[var(--hairline)] space-y-2.5">
            <span className="font-[600] text-[11px] uppercase tracking-wider text-[var(--text-muted)] block">
              Available MCP Tools Upon Authorization
            </span>
            <ul className="space-y-2 text-xs text-[var(--text-muted)] font-[300]">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[var(--ink)] font-[600]">gmail_list_messages:</strong> Search and query inbox with query filters and label IDs
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[var(--ink)] font-[600]">gmail_get_message:</strong> Retrieve thread context, headers, and decoded email body
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[var(--ink)] font-[600]">gmail_create_draft:</strong> Autonomously construct executive drafts for your review
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[var(--ink)] font-[600]">gmail_send_message:</strong> Dispatch approved responses through your Gmail address
                </span>
              </li>
            </ul>
          </div>

          {/* Multi-User & Privacy Guarantee */}
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[16px] bg-[var(--field)] text-xs text-[var(--text-muted)] border border-[var(--hairline-soft)]">
            <Users className="w-4 h-4 text-[#0066FF] shrink-0" />
            <span className="text-[11px] leading-relaxed">
              Multi-user architecture: Each user securely authenticates their own individual Google account. Tokens are securely encrypted in your private InsForge database.
            </span>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={handleStartGoogleOAuth}
            disabled={isRedirecting}
            className="w-full py-3 rounded-full bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 font-[600] text-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 shadow-xs"
          >
            {isRedirecting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Opening Google Account Selection...</span>
              </>
            ) : (
              <>
                <SocialIcon name="gmail" size={16} className="w-4 h-4 object-contain" />
                <span>Connect with Google (Select Account)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
