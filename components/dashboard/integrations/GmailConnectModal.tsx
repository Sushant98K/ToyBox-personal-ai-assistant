"use client";

import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  Lock,
  Sparkles,
  Server,
  Key,
  Mail,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { SocialIcon } from "@/components/icons/AppIcons";
import { cn } from "@/lib/utils";

interface GmailConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: (data: any) => void;
  defaultEmail?: string;
}

export function GmailConnectModal({
  isOpen,
  onClose,
  onConnected,
  defaultEmail = "sushant98k@gmail.com",
}: GmailConnectModalProps) {
  const [mode, setMode] = useState<"quick" | "manual">("quick");
  const [accountEmail, setAccountEmail] = useState(defaultEmail);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [mcpServerUrl, setMcpServerUrl] = useState("http://localhost:3000/api/integrations/gmail/mcp");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnect = async (isManual: boolean) => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload: any = {
        action: "connect",
        credentials: {
          accountEmail: accountEmail.trim(),
          mode: isManual ? "manual_google_oauth" : "mcp_quick_connect",
          client_id: clientId.trim() || undefined,
          client_secret: clientSecret.trim() || undefined,
          refresh_token: refreshToken.trim() || undefined,
          mcp_server_url: mcpServerUrl.trim() || undefined,
        },
      };

      const res = await fetch("/api/integrations/gmail/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to connect Gmail via MCP");
      }

      onConnected(data.integration);
      onClose();
    } catch (err: any) {
      console.error("Connect error:", err);
      setErrorMsg(err.message || "An error occurred while connecting Gmail.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
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
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--canvas)] border border-[var(--hairline)] text-[10px] font-[600] text-[var(--ink)] mb-1">
                <Sparkles className="w-3 h-3 text-[#0066FF]" />
                <span>Model Context Protocol (MCP)</span>
              </div>
              <h3 className="font-[652] text-xl text-[var(--ink)] tracking-tight">
                Connect Google Workspace / Gmail
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--ink)] hover:bg-[var(--canvas)] border border-transparent hover:border-[var(--hairline)] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection: Fast Track vs Manual Credentials */}
        <div className="flex items-center gap-1 p-1 rounded-full bg-[var(--canvas)] border border-[var(--hairline)]">
          <button
            type="button"
            onClick={() => setMode("quick")}
            className={cn(
              "flex-1 py-1.5 text-xs font-[600] rounded-full transition-all flex items-center justify-center gap-1.5",
              mode === "quick"
                ? "bg-[var(--primary)] text-[var(--on-primary)] shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--ink)]"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instant MCP Connect</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={cn(
              "flex-1 py-1.5 text-xs font-[600] rounded-full transition-all flex items-center justify-center gap-1.5",
              mode === "manual"
                ? "bg-[var(--primary)] text-[var(--on-primary)] shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--ink)]"
            )}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Manual Credentials</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-[16px] bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Mode 1: Quick MCP Connect */}
        {mode === "quick" && (
          <div className="space-y-4">
            <p className="text-xs text-[var(--text-muted)] font-[300] leading-relaxed">
              Connect your Gmail account via ToyBox&apos;s verified Model Context Protocol server.
              Enables autonomous VIP triage, thread synthesis, and 1-click draft creation.
              You can add custom Google Cloud OAuth credentials anytime from settings.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-[600] text-[var(--ink)] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#0066FF]" />
                <span>Google Account Email</span>
              </label>
              <input
                type="email"
                value={accountEmail}
                onChange={(e) => setAccountEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-3.5 py-2 text-xs rounded-full bg-[var(--field)] border border-transparent focus:border-[var(--hairline)] text-[var(--ink)] outline-none transition-all font-[456]"
              />
            </div>

            {/* MCP Capabilities Summary */}
            <div className="p-3.5 rounded-[16px] bg-[var(--canvas)] border border-[var(--hairline)] space-y-2 text-xs">
              <span className="font-[600] text-[var(--ink)] block text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                Active MCP Server Tools
              </span>
              <ul className="space-y-1.5 text-[11px] text-[var(--text-muted)]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>
                    <strong className="text-[var(--ink)] font-[600]">gmail_list_messages:</strong> Search inbox with filters & labels
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>
                    <strong className="text-[var(--ink)] font-[600]">gmail_get_message:</strong> Retrieve thread context & attachments
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>
                    <strong className="text-[var(--ink)] font-[600]">gmail_create_draft:</strong> Autonomously prepare executive replies
                  </span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => handleConnect(false)}
              disabled={isSubmitting || !accountEmail}
              className="w-full py-2.5 rounded-full bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 font-[600] text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Connecting via MCP...</span>
                </>
              ) : (
                <>
                  <span>Connect Gmail with MCP</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Mode 2: Manual Credentials */}
        {mode === "manual" && (
          <div className="space-y-4">
            <p className="text-xs text-[var(--text-muted)] font-[300] leading-relaxed">
              Provide your own Google Cloud Platform OAuth 2.0 Client credentials. All credentials
              are persisted securely in your InsForge backend.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-[600] text-[var(--ink)] block mb-1">
                  Google Account Email
                </label>
                <input
                  type="email"
                  value={accountEmail}
                  onChange={(e) => setAccountEmail(e.target.value)}
                  placeholder="sushant98k@gmail.com"
                  className="w-full px-3 py-1.5 text-xs rounded-full bg-[var(--field)] text-[var(--ink)] outline-none border border-transparent focus:border-[var(--hairline)]"
                />
              </div>

              <div>
                <label className="text-[11px] font-[600] text-[var(--ink)] block mb-1">
                  OAuth Client ID
                </label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="xxxx.apps.googleusercontent.com"
                  className="w-full px-3 py-1.5 text-xs rounded-full bg-[var(--field)] text-[var(--ink)] outline-none border border-transparent focus:border-[var(--hairline)]"
                />
              </div>

              <div>
                <label className="text-[11px] font-[600] text-[var(--ink)] block mb-1">
                  OAuth Client Secret
                </label>
                <input
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="GOCSPX-xxxxxxxx"
                  className="w-full px-3 py-1.5 text-xs rounded-full bg-[var(--field)] text-[var(--ink)] outline-none border border-transparent focus:border-[var(--hairline)]"
                />
              </div>

              <div>
                <label className="text-[11px] font-[600] text-[var(--ink)] block mb-1">
                  Refresh Token (Optional / Add later)
                </label>
                <input
                  type="password"
                  value={refreshToken}
                  onChange={(e) => setRefreshToken(e.target.value)}
                  placeholder="1//04xxxxxx"
                  className="w-full px-3 py-1.5 text-xs rounded-full bg-[var(--field)] text-[var(--ink)] outline-none border border-transparent focus:border-[var(--hairline)]"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleConnect(true)}
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-full bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 font-[600] text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving & Connecting...</span>
                </>
              ) : (
                <>
                  <Key className="w-3.5 h-3.5" />
                  <span>Save Credentials & Connect via MCP</span>
                </>
              )}
            </button>
          </div>
        )}

        <div className="pt-2 border-t border-[var(--hairline)] flex items-center justify-between text-[11px] text-[var(--text-faint)]">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3" /> Zero data training retention
          </span>
          <span className="font-[600] text-[var(--text-muted)]">InsForge BaaS Protected</span>
        </div>
      </div>
    </div>
  );
}
