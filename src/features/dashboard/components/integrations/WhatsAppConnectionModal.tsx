"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Smartphone,
  QrCode,
  Copy,
  Check,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Lock,
} from "lucide-react";
import { SocialIcon } from "@/components/icons/AppIcons";
import { cn } from "@/lib/utils";

interface WhatsAppConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: { phoneNumber: string }) => void;
  onOpenSettings?: () => void;
  initialPhoneNumber?: string;
  currentUser?: { id?: string; email?: string } | null;
}

export function WhatsAppConnectionModal({
  isOpen,
  onClose,
  onSuccess,
  onOpenSettings,
  initialPhoneNumber = "+91 9768368524",
  currentUser,
}: WhatsAppConnectionModalProps) {
  const [step, setStep] = useState<"phone" | "code" | "connected">("phone");
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [linkingCode, setLinkingCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatusMessage, setVerifyStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const getAuthHeaders = useCallback(() => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (currentUser?.id) headers["x-user-id"] = currentUser.id;
    if (currentUser?.email) headers["x-user-email"] = currentUser.email;
    return headers;
  }, [currentUser?.id, currentUser?.email]);

  // Auto-detect when the user links their device in WhatsApp mobile app
  useEffect(() => {
    if (step !== "code" || !isOpen) return;

    let isSubscribed = true;
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/integrations/whatsapp/pair", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ action: "status" }),
        });
        if (res.ok && isSubscribed) {
          const data = await res.json();
          if (data.session?.status === "connected") {
            setStep("connected");
            setIsVerifying(false);
            clearInterval(interval);
            const verifiedPhone = data.session?.phoneNumber || phoneNumber.trim();
            onSuccess({ phoneNumber: verifiedPhone });
            onClose();
          }
        }
      } catch {
        // ignore background poll errors
      }
    }, 1200);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [step, isOpen, phoneNumber, onSuccess, onClose, getAuthHeaders]);

  if (!isOpen) return null;

  const handleGenerateCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setVerifyStatusMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/integrations/whatsapp/pair", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          action: "request_code",
          phoneNumber: phoneNumber.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate WhatsApp linking code");
      }

      setLinkingCode(data.pairingCode);
      setStep("code");
    } catch (err: any) {
      setError(err.message || "Failed to generate pairing code. Please verify your phone number.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmLinked = async () => {
    setError(null);
    setIsVerifying(true);
    setVerifyStatusMessage("Checking handshake with mobile device. Please keep WhatsApp open...");

    try {
      const res = await fetch("/api/integrations/whatsapp/pair", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          action: "verify",
          phoneNumber: phoneNumber.trim(),
        }),
      });

      const data = await res.json();

      if (data.success && data.status === "connected") {
        setStep("connected");
        setIsVerifying(false);
        const verifiedPhone = data.session?.phoneNumber || phoneNumber.trim();
        onSuccess({ phoneNumber: verifiedPhone });
        onClose();
      } else if (data.isPending) {
        setVerifyStatusMessage("WhatsApp is exchanging encryption keys. Please keep your mobile phone active...");
      } else {
        setVerifyStatusMessage("Still waiting for you to type the code inside WhatsApp > Linked Devices.");
      }
    } catch (err: any) {
      setError(err.message || "Verification request failed. Ensure your server is reachable.");
      setIsVerifying(false);
    }
  };

  const handleCopyCode = () => {
    if (!linkingCode) return;
    navigator.clipboard.writeText(linkingCode.replace(/[^a-zA-Z0-9]/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setStep("phone");
    setError(null);
    setLinkingCode("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Surface */}
      <div className="relative w-full max-w-lg bg-[var(--canvas-soft)] border border-[var(--hairline)] rounded-[24px] shadow-2xl flex flex-col z-10 overflow-hidden transition-colors animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[var(--hairline)] bg-[var(--canvas)] flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 flex items-center justify-center bg-[var(--canvas-soft)] border border-[var(--hairline)] p-2 shrink-0 shadow-xs"
              style={{ borderRadius: "30%" }}
            >
              <SocialIcon
                name="whatsapp"
                size={30}
                className="w-7 h-7 object-contain"
                alt="WhatsApp"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-[652] text-lg sm:text-xl text-[var(--ink)] tracking-tight">
                  Connect WhatsApp
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-[600] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Baileys Multi-Device
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-[300] mt-0.5">
                Generate a linking code to connect your account safely
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--ink)] hover:bg-[var(--field)] border border-transparent hover:border-[var(--hairline)] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-[16px] bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2.5">
              <span className="font-[600] shrink-0">Error:</span>
              <span>{error}</span>
            </div>
          )}

          {/* ─── STEP 1: Phone Number Input ─── */}
          {step === "phone" && (
            <form onSubmit={handleGenerateCode} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-[600] text-[var(--ink)] block">
                  Phone Number with Country Code
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-[var(--text-faint)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 555 123 4567 or +91 98765 43210"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-full bg-[var(--field)] border border-transparent focus:border-[var(--ink)] text-sm text-[var(--ink)] placeholder:text-[var(--text-faint)] outline-none transition-all font-mono"
                  />
                </div>
                <p className="text-[11px] text-[var(--text-muted)] font-[300]">
                  Include your country code (e.g. +1 for US/Canada, +44 for UK, +91 for India).
                </p>
              </div>

              {/* Informational Callout matching user's architecture */}
              <div className="p-4 rounded-[20px] bg-[var(--canvas)] border border-[var(--hairline)] space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-[600] text-[var(--ink)]">
                  <ShieldCheck className="w-4 h-4 text-[#0066FF]" />
                  <span>How the Baileys Multi-Device Connection Works</span>
                </div>
                <p className="text-xs text-[var(--text-muted)] font-[300] leading-relaxed">
                  ToyBox utilizes the open-source <strong className="text-[var(--ink)] font-[600]">Baileys</strong> WhatsApp Web protocol.
                  We never ask for your passwords or SMS verification codes. You simply enter a generated 8-character linking code inside your WhatsApp mobile app under <strong className="text-[var(--ink)] font-[600]">Linked Devices</strong>.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || !phoneNumber.trim()}
                  className="w-full py-3 rounded-full bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 font-[600] text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Generating Linking Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Next: Generate Linking Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ─── STEP 2: Code Display & Mobile Instructions ─── */}
          {step === "code" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Highlighted Linking Code Box */}
              <div className="p-5 rounded-[22px] bg-[var(--canvas)] border border-[var(--hairline)] text-center space-y-3 shadow-xs">
                <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-[600] block">
                  Your WhatsApp Linking Code
                </span>

                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-[var(--raised)] border border-[var(--hairline)]">
                  <span className="font-mono text-2xl sm:text-3xl font-[700] tracking-widest text-[var(--ink)]">
                    {linkingCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="p-2 rounded-full hover:bg-[var(--field)] text-[var(--text-muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                    title="Copy Code"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <p className="text-xs text-[var(--text-faint)] font-[300]">
                  Target phone: <span className="font-mono text-[var(--ink)]">{phoneNumber}</span>
                </p>
              </div>

              {/* Step-by-Step Instructions matching drawing */}
              <div className="p-4 rounded-[20px] bg-[var(--canvas)] border border-[var(--hairline)] space-y-3">
                <span className="text-xs font-[600] text-[var(--ink)] block">
                  Enter this code on your phone:
                </span>

                <ol className="space-y-2.5 text-xs text-[var(--text-muted)] font-[300]">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[var(--field)] text-[var(--ink)] font-[600] text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      Open the <strong className="text-[var(--ink)] font-[500]">WhatsApp</strong> app on your mobile phone.
                    </span>
                  </li>

                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[var(--field)] text-[var(--ink)] font-[600] text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Navigate to <strong className="text-[var(--ink)] font-[500]">Settings</strong> (iOS) or tap the <strong className="text-[var(--ink)] font-[500]">Menu (⋮)</strong> (Android) &gt; <strong className="text-[var(--ink)] font-[500]">Linked Devices</strong>.
                    </span>
                  </li>

                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[var(--field)] text-[var(--ink)] font-[600] text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      Tap <strong className="text-[var(--ink)] font-[500]">Link a Device</strong>, then select <strong className="text-[#0066FF] font-[600]">Link with phone number instead</strong>.
                    </span>
                  </li>

                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[var(--field)] text-[var(--ink)] font-[600] text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      4
                    </span>
                    <span>
                      Enter the 8-character code <strong className="font-mono text-[var(--ink)] font-[600]">{linkingCode}</strong> shown above.
                    </span>
                  </li>
                </ol>
              </div>

              {/* Handshake Progress Feedback */}
              {verifyStatusMessage && (
                <div className="p-3.5 rounded-[18px] bg-[#0066FF]/10 border border-[#0066FF]/20 flex items-start gap-3 animate-in fade-in duration-150">
                  <RefreshCw className={cn("w-4 h-4 text-[#0066FF] shrink-0 mt-0.5", isVerifying && "animate-spin")} />
                  <div className="text-xs space-y-0.5">
                    <p className="font-[600] text-[var(--ink)]">
                      {isVerifying ? "Verifying with Mobile Phone..." : "Status Update"}
                    </p>
                    <p className="text-[var(--text-muted)] font-[300] leading-relaxed">
                      {verifyStatusMessage}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleConfirmLinked}
                  disabled={isVerifying}
                  className="w-full py-3 rounded-full bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 font-[600] text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying with phone...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>I Have Entered the Code in WhatsApp</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs pt-1 px-1">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-[var(--text-muted)] hover:text-[var(--ink)] transition-colors"
                  >
                    Change Phone Number
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGenerateCode()}
                    disabled={isLoading}
                    className="text-[#0066FF] hover:underline font-[500] flex items-center gap-1"
                  >
                    <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
                    <span>Get New Code</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 3: Connected Success State ─── */}
          {step === "connected" && (
            <div className="space-y-5 text-center py-4 animate-in zoom-in-95 duration-150">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <h4 className="font-[652] text-xl text-[var(--ink)]">
                  WhatsApp Connected!
                </h4>
                <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto font-[300] leading-relaxed">
                  Your WhatsApp account is now active via Baileys multi-device protocol.
                  All 10 MCP tools are enabled for autonomous agent workflows.
                </p>
              </div>

              <div className="p-3.5 rounded-[16px] bg-[var(--canvas)] border border-[var(--hairline)] inline-flex items-center gap-3 text-xs font-mono text-[var(--ink)]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{phoneNumber}</span>
                <span className="text-[var(--text-faint)]">·</span>
                <span className="text-emerald-500 font-[600]">Active Session</span>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSettings?.();
                  }}
                  className="w-full py-3 rounded-full bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 font-[600] text-sm transition-all cursor-pointer shadow-xs"
                >
                  Done &amp; Open WhatsApp Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
