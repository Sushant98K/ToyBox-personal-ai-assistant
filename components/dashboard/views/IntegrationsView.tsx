"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Puzzle,
  Search,
  RefreshCw,
  Sparkles,
  Settings,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SocialIcon } from "@/components/icons/AppIcons";
import { platformsCatalog, getPlatformById } from "@/config/integrations";
import { IntegrationPlatform } from "@/types";
import { IntegrationSettingsModal } from "@/components/dashboard/integrations/IntegrationSettingsModal";
import { WhatsAppConnectionModal } from "@/components/dashboard/integrations/WhatsAppConnectionModal";
import { WhatsAppSettingsModal } from "@/components/dashboard/integrations/WhatsAppSettingsModal";

export interface IntegrationItem {
  id: string;
  name: string;
  category: "Email & Messaging" | "Productivity & Docs" | "Community & Chat";
  description: string;
  status: "connected" | "disconnected";
  lastSync: string;
  syncFrequency: string;
  messagesProcessed: string;
  socialIcon: string;
  protocol?: string;
  accountEmail?: string | null;
  hasCustomCredentials?: boolean;
}

interface IntegrationsViewProps {
  currentUser?: {
    id?: string;
    name?: string;
    email?: string;
    avatar_url?: string;
  } | null;
  onSyncCountChange?: (count: number) => void;
}

// Generate default disconnected platforms strictly from platformsCatalog
// All platforms default to disconnected so there is never a false "Connected" flash
const createDefaultIntegrations = (): IntegrationItem[] => {
  return platformsCatalog.map((platform) => ({
    id: platform.id,
    name: platform.name,
    category: platform.category,
    description: platform.description,
    status: "disconnected", // Database-backed: disconnected by default
    lastSync: "Never",
    syncFrequency: platform.defaultSyncFrequency,
    messagesProcessed: "0 items",
    socialIcon: platform.socialIcon,
    protocol: platform.protocol,
    accountEmail: null,
    hasCustomCredentials: false,
  }));
};

// Shimmering Skeleton for Integration Cards matching exact dimensions and tokens
export function IntegrationCardSkeleton() {
  return (
    <div className="rounded-[20px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-5 flex flex-col justify-between space-y-4 shadow-xs select-none">
      <div className="space-y-3.5">
        {/* Top squircle icon & status badge */}
        <div className="flex items-start justify-between gap-3">
          <div
            className="w-12 h-12 bg-[var(--field)] border border-[var(--hairline)] shrink-0 animate-pulse"
            style={{ borderRadius: "30%" }}
          />
          <div className="h-5 w-24 rounded-full bg-[var(--field)] border border-[var(--hairline)] animate-pulse" />
        </div>

        {/* Title, Category & Description */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="h-5 w-36 rounded-md bg-[var(--field)] animate-pulse" />
            <div className="h-4 w-16 rounded-full bg-[var(--field)]/60 animate-pulse" />
          </div>
          <div className="h-3 w-24 rounded-md bg-[var(--field)]/70 animate-pulse" />
          <div className="pt-1 space-y-1.5 min-h-[36px]">
            <div className="h-3 w-full rounded-md bg-[var(--field)]/50 animate-pulse" />
            <div className="h-3 w-4/5 rounded-md bg-[var(--field)]/40 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Footer metadata & Action button */}
      <div className="pt-3 border-t border-[var(--hairline)] space-y-2 text-xs">
        <div className="flex items-center justify-between text-[11px]">
          <div className="h-3 w-16 rounded-md bg-[var(--field)]/60 animate-pulse" />
          <div className="h-3 w-14 rounded-md bg-[var(--field)] animate-pulse" />
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <div className="h-3 w-16 rounded-md bg-[var(--field)]/60 animate-pulse" />
          <div className="h-3 w-20 rounded-md bg-[var(--field)] animate-pulse" />
        </div>
        <div className="pt-1.5">
          <div className="w-full h-8 rounded-full bg-[var(--field)] border border-[var(--hairline)] animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function IntegrationsView({ currentUser, onSyncCountChange }: IntegrationsViewProps) {
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<
    "all" | "connected" | "email-messaging" | "productivity"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [isLoadingDb, setIsLoadingDb] = useState(true);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [oauthStatus, setOauthStatus] = useState<{
    type: "success" | "error";
    message: string;
    email?: string;
  } | null>(null);

  // Floating toast notification state
  const [toast, setToast] = useState<{
    id: string;
    title: string;
    message: string;
    email?: string;
  } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Modals state
  const [settingsPlatform, setSettingsPlatform] = useState<IntegrationPlatform | null>(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [whatsAppConnectionOpen, setWhatsAppConnectionOpen] = useState(false);
  const [whatsAppSettingsOpen, setWhatsAppSettingsOpen] = useState(false);

  // Initialize state with clean disconnected platforms
  const [integrations, setIntegrations] = useState<IntegrationItem[]>(createDefaultIntegrations);

  // Fetch real database status from InsForge PostgreSQL via /api/integrations
  const fetchDatabaseIntegrations = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (currentUser?.id) {
        headers["x-user-id"] = currentUser.id;
      }
      if (currentUser?.email) {
        headers["x-user-email"] = currentUser.email;
      }

      const res = await fetch("/api/integrations", {
        headers,
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        if (data.integrations && Array.isArray(data.integrations)) {
          setIntegrations((prev) => {
            return data.integrations.map((incoming: IntegrationItem) => {
              const current = prev.find((p) => p.id === incoming.id);
              // If user is currently disconnecting this item, keep it disconnected
              if (disconnectingId === incoming.id) {
                return { ...incoming, status: "disconnected" };
              }
              // Protect newly connected status from being reverted by stale DB response
              if (connectingId === incoming.id && current?.status === "connected" && incoming.status === "disconnected") {
                return current;
              }
              return incoming;
            });
          });
        }
      }
    } catch (err) {
      console.warn("Could not retrieve integration states from InsForge DB:", err);
    } finally {
      setIsLoadingDb(false);
    }
  }, [currentUser?.id, currentUser?.email, connectingId, disconnectingId]);

  useEffect(() => {
    fetchDatabaseIntegrations();
  }, [fetchDatabaseIntegrations]);

  // Re-sync integrations when user returns to browser tab
  useEffect(() => {
    const handleFocus = () => {
      fetchDatabaseIntegrations();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchDatabaseIntegrations]);

  // Synchronize connected platforms count with parent DashboardShell safely in an effect
  useEffect(() => {
    const count = integrations.filter((i) => i.status === "connected").length;
    onSyncCountChange?.(count);
  }, [integrations, onSyncCountChange]);

  // Handle Google OAuth callback redirect notification
  useEffect(() => {
    const connectedParam = searchParams.get("connected");
    const emailParam = searchParams.get("email");
    const errorParam = searchParams.get("error");

    if (connectedParam === "gmail") {
      setOauthStatus({
        type: "success",
        message: "Google Workspace / Gmail successfully connected via MCP!",
        email: emailParam || undefined,
      });
      fetchDatabaseIntegrations();
      // Clean query params from URL without refreshing
      if (typeof window !== "undefined") {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("connected");
        newUrl.searchParams.delete("email");
        window.history.replaceState({}, "", newUrl.toString());
      }
    } else if (errorParam) {
      setOauthStatus({
        type: "error",
        message: `Google OAuth connection could not be completed: ${errorParam}`,
      });
      if (typeof window !== "undefined") {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("error");
        window.history.replaceState({}, "", newUrl.toString());
      }
    }
  }, [searchParams, fetchDatabaseIntegrations]);

  // Connect click handler
  const handleConnectClick = async (platformId: string) => {
    if (platformId === "whatsapp") {
      setConnectingId("whatsapp");
      setWhatsAppConnectionOpen(true);
      return;
    }
    if (platformId === "gmail") {
      setConnectingId("gmail");
      try {
        const currentUrl =
          typeof window !== "undefined"
            ? window.location.pathname + window.location.search
            : "/dashboard?tab=integrations";
        const res = await fetch(
          `/api/auth/gmail?format=json&userId=${encodeURIComponent(currentUser?.id || "")}&returnUrl=${encodeURIComponent(currentUrl)}`
        );
        const data = await res.json();

        if (!res.ok || !data.configured || !data.url) {
          setOauthStatus({
            type: "error",
            message:
              data.error ||
              "Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file to connect Gmail.",
          });
          setConnectingId(null);
          return;
        }

        // Navigate immediately to Google's account selection window
        window.location.href = data.url;
      } catch (err: any) {
        setOauthStatus({
          type: "error",
          message: err.message || "Failed to initiate Google account connection.",
        });
        setConnectingId(null);
      }
      return;
    }
    toggleConnect(platformId);
  };

  // Toggle connection status and save directly in InsForge DB
  const toggleConnect = async (id: string) => {
    const target = integrations.find((i) => i.id === id);
    if (!target) return;

    const isDisconnecting = target.status === "connected";
    const nextStatus: "connected" | "disconnected" = isDisconnecting ? "disconnected" : "connected";

    if (isDisconnecting) {
      setDisconnectingId(id);
    } else {
      setConnectingId(id);
    }

    // Persist to backend service & InsForge database
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (currentUser?.id) headers["x-user-id"] = currentUser.id;
      if (currentUser?.email) headers["x-user-email"] = currentUser.email;

      if (id === "gmail") {
        await fetch("/api/integrations/gmail/mcp", {
          method: "POST",
          headers,
          body: JSON.stringify({
            action: nextStatus === "connected" ? "connect" : "disconnect",
            credentials: {
              accountEmail: currentUser?.email || "sushant98k@gmail.com",
            },
          }),
        });
      } else if (id === "whatsapp") {
        await fetch("/api/integrations/whatsapp/pair", {
          method: "POST",
          headers,
          body: JSON.stringify({
            action: nextStatus === "connected" ? "verify" : "disconnect",
          }),
        });
      } else {
        await fetch("/api/integrations", {
          method: "POST",
          headers,
          body: JSON.stringify({
            platformId: id,
            status: nextStatus,
          }),
        });
      }

      // Update local state after action completes successfully
      setIntegrations((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: nextStatus,
                lastSync: nextStatus === "connected" ? "Just now" : item.lastSync,
                messagesProcessed: nextStatus === "connected" ? "Active" : "0 items",
                accountEmail: nextStatus === "connected" ? item.accountEmail : null,
              }
            : item
        )
      );
    } catch (err) {
      console.error("Failed to persist integration change to InsForge:", err);
    } finally {
      setConnectingId(null);
      setDisconnectingId(null);
      fetchDatabaseIntegrations();
    }
  };

  const handleOpenSettings = (platformId: string) => {
    if (platformId === "whatsapp") {
      setWhatsAppSettingsOpen(true);
      return;
    }
    const platformDef = getPlatformById(platformId);
    if (platformDef) {
      setSettingsPlatform(platformDef);
      setSettingsModalOpen(true);
    }
  };

  const handleWhatsAppConnected = (data: { phoneNumber: string }) => {
    const cleanNum = data.phoneNumber.trim();
    setConnectingId(null);
    setDisconnectingId(null);
    setIntegrations((prev) =>
      prev.map((item) =>
        item.id === "whatsapp"
          ? {
              ...item,
              status: "connected" as const,
              lastSync: "Just now",
              messagesProcessed: "Active",
              accountEmail: cleanNum,
            }
          : item
      )
    );

    // Trigger toast notification
    setToast({
      id: `toast-${Date.now()}`,
      title: "WhatsApp Connected",
      message: "WhatsApp connected successfully via Baileys Multi-Device protocol!",
      email: cleanNum,
    });

    setOauthStatus({
      type: "success",
      message: "WhatsApp connected successfully via Baileys Multi-Device protocol!",
      email: cleanNum,
    });

    // Refresh database integration status in staggered intervals to ensure backend writes settle smoothly
    fetchDatabaseIntegrations();
    setTimeout(() => fetchDatabaseIntegrations(), 1200);
    setTimeout(() => fetchDatabaseIntegrations(), 3000);
  };

  const handleGmailConnected = (savedData: any) => {
    setIntegrations((prev) =>
      prev.map((item) =>
        item.id === "gmail"
          ? {
              ...item,
              status: "connected" as const,
              lastSync: "Just now",
              messagesProcessed: "Active",
              accountEmail:
                savedData?.metadata?.account_email ||
                currentUser?.email ||
                "sushant98k@gmail.com",
            }
          : item
      )
    );
    // Refresh database state
    fetchDatabaseIntegrations();
  };

  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (currentUser?.id) headers["x-user-id"] = currentUser.id;
      if (currentUser?.email) headers["x-user-email"] = currentUser.email;

      await fetch("/api/integrations/gmail/mcp", {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "sync_inbox" }),
      });
      await fetchDatabaseIntegrations();
    } catch (e) {
      console.warn("Sync error:", e);
    } finally {
      setIsSyncingAll(false);
    }
  };

  const filteredIntegrations = integrations.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === "connected") return item.status === "connected";
    if (filter === "email-messaging") return item.category === "Email & Messaging";
    if (filter === "productivity")
      return item.category === "Productivity & Docs" || item.category === "Community & Chat";

    return true;
  });

  const connectedCount = integrations.filter((i) => i.status === "connected").length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in-50 duration-200">
      {/* ─── Floating Toast Notification ─── */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-full bg-[var(--canvas-soft)] border border-[var(--hairline)] shadow-xl backdrop-blur-md animate-in slide-in-from-top-4 fade-in duration-200"
        >
          <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <p className="font-[600] text-[var(--ink)] leading-snug">
              {toast.title}
            </p>
            <p className="text-[var(--text-muted)] font-[300]">
              {toast.message} {toast.email && <span className="font-mono text-[var(--ink)] font-[500]">({toast.email})</span>}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="p-1 rounded-full text-[var(--text-faint)] hover:text-[var(--ink)] hover:bg-[var(--field)] transition-colors cursor-pointer ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ─── OAuth Status Banner ─── */}
      {oauthStatus && (
        <div
          className={cn(
            "p-4 rounded-[20px] text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200 border",
            oauthStatus.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
          )}
        >
          <div className="flex items-center gap-2.5">
            {oauthStatus.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            )}
            <div>
              <span className="font-[600]">{oauthStatus.message}</span>
              {oauthStatus.email && (
                <span className="block text-[11px] opacity-80 mt-0.5">
                  Connected account: {oauthStatus.email}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOauthStatus(null)}
            className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ─── Header Banner ─── */}
      <div className="rounded-[24px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--canvas)] border border-[var(--hairline)] text-xs font-[600] text-[var(--ink)]">
            <Puzzle className="w-3.5 h-3.5 text-[#0066FF]" />
            <span>Connected Communication Feeds</span>
            <span className="w-1 h-1 rounded-full bg-[var(--text-faint)]" />
            {isLoadingDb ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="w-14 h-3.5 rounded-full bg-[var(--field)] animate-pulse inline-block" />
              </span>
            ) : (
              <span className={cn(
                "font-bold transition-colors",
                connectedCount > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-[var(--text-muted)]"
              )}>
                {connectedCount} Active
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-[652] text-[var(--ink)] tracking-tight">
            Multi-Platform Integration Hub
          </h2>
          <p className="text-sm text-[var(--text-muted)] max-w-2xl font-[300] leading-relaxed">
            Connect and synchronize all your executive communication channels. ToyBox securely ingests
            and synthesizes incoming streams with zero data training retention via Model Context Protocol (MCP).
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleSyncAll}
            disabled={isSyncingAll || isLoadingDb}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[var(--canvas)] border border-[var(--hairline)] hover:bg-[var(--field)] text-[var(--ink)] transition-all font-[600] text-xs sm:text-sm focus:outline-none disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isSyncingAll && "animate-spin text-[#0066FF]")} />
            <span>{isSyncingAll ? "Syncing..." : "Sync All"}</span>
          </button>

          <button
            type="button"
            onClick={() => handleConnectClick("gmail")}
            disabled={isSyncingAll || isLoadingDb || connectingId === "gmail"}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 transition-all font-[600] text-xs sm:text-sm shadow-xs focus:outline-none cursor-pointer disabled:opacity-50"
          >
            {connectingId === "gmail" ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <span>Connect</span>
            )}
          </button>
        </div>
      </div>

      {/* ─── Search & Category Filter Pills ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-[600] transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5",
              filter === "all"
                ? "bg-[var(--primary)] text-[var(--on-primary)] shadow-xs"
                : "bg-[var(--canvas-soft)] text-[var(--text-muted)] border border-[var(--hairline)] hover:text-[var(--ink)]"
            )}
          >
            <span>All Channels</span>
            {isLoadingDb ? (
              <span className="w-4 h-3 rounded-full bg-[var(--field)] animate-pulse inline-block" />
            ) : (
              <span>({integrations.length})</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setFilter("connected")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-[600] transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer",
              filter === "connected"
                ? "bg-[var(--primary)] text-[var(--on-primary)] shadow-xs"
                : "bg-[var(--canvas-soft)] text-[var(--text-muted)] border border-[var(--hairline)] hover:text-[var(--ink)]"
            )}
          >
            <span className={cn(
              "w-1.5 h-1.5 rounded-full",
              connectedCount > 0 ? "bg-emerald-500" : "bg-gray-400"
            )} />
            <span>Connected</span>
            {isLoadingDb ? (
              <span className="w-4 h-3 rounded-full bg-[var(--field)] animate-pulse inline-block" />
            ) : (
              <span>({connectedCount})</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setFilter("email-messaging")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-[600] transition-all whitespace-nowrap cursor-pointer",
              filter === "email-messaging"
                ? "bg-[var(--primary)] text-[var(--on-primary)] shadow-xs"
                : "bg-[var(--canvas-soft)] text-[var(--text-muted)] border border-[var(--hairline)] hover:text-[var(--ink)]"
            )}
          >
            Email & Messaging
          </button>
          <button
            type="button"
            onClick={() => setFilter("productivity")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-[600] transition-all whitespace-nowrap cursor-pointer",
              filter === "productivity"
                ? "bg-[var(--primary)] text-[var(--on-primary)] shadow-xs"
                : "bg-[var(--canvas-soft)] text-[var(--text-muted)] border border-[var(--hairline)] hover:text-[var(--ink)]"
            )}
          >
            Productivity & Community
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[var(--text-faint)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search integrations..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-full bg-[var(--field)] border border-transparent focus:border-[var(--hairline)] text-[var(--ink)] placeholder:text-[var(--text-faint)] outline-none transition-all"
          />
        </div>
      </div>

      {/* ─── Integrations Grid / Skeleton Loading State ─── */}
      {isLoadingDb ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
          {Array.from({ length: 10 }).map((_, idx) => (
            <IntegrationCardSkeleton key={`skeleton-${idx}`} />
          ))}
        </div>
      ) : filteredIntegrations.length === 0 ? (
        <div className="py-16 text-center space-y-3 rounded-[24px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-8">
          <div className="w-12 h-12 rounded-full bg-[var(--canvas)] border border-[var(--hairline)] flex items-center justify-center mx-auto text-[var(--text-faint)]">
            <Puzzle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-[652] text-sm text-[var(--ink)]">No channels found</h3>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
              No integration platforms match &ldquo;{searchQuery}&rdquo;. Clear your search or change the category filter.
            </p>
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="px-3.5 py-1.5 rounded-full text-xs font-[600] bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 transition-all cursor-pointer"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
          {filteredIntegrations.map((item) => {
            const isConnected = item.status === "connected";
            const isConnecting = connectingId === item.id;
            const isDisconnecting = disconnectingId === item.id;

            return (
              <div
                key={item.id}
                className="rounded-[20px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-5 flex flex-col justify-between space-y-4 hover:border-[var(--ink-soft)]/30 transition-all group shadow-xs"
              >
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    {/* Brand Icon in iOS 30% Squircle */}
                    <div
                      className="w-12 h-12 flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline)] p-2 shrink-0 transition-transform group-hover:scale-105 shadow-xs"
                      style={{ borderRadius: "30%" }}
                    >
                      <SocialIcon
                        name={item.socialIcon}
                        size={28}
                        className="w-7 h-7 object-contain"
                        alt={item.name}
                      />
                    </div>

                    {/* Connection Status Badge (Real DB Status) */}
                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-[600] border flex items-center gap-1.5 transition-colors",
                        isConnected
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : isConnecting
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          : "bg-[var(--canvas)] text-[var(--text-muted)] border-[var(--hairline)]"
                      )}
                    >
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full transition-colors",
                          isConnected
                            ? "bg-emerald-500 animate-pulse"
                            : isConnecting
                            ? "bg-amber-500 animate-ping"
                            : "bg-gray-400"
                        )}
                      />
                      <span>
                        {isConnected
                          ? "Connected"
                          : isConnecting
                          ? "Syncing..."
                          : "Disconnected"}
                      </span>
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="font-[652] text-sm sm:text-base text-[var(--ink)] tracking-tight">
                        {item.name}
                      </h3>
                      {(item.id === "gmail" || item.id === "whatsapp") && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-[#0066FF]/10 text-[#0066FF] border border-[#0066FF]/20 font-[600]">
                          MCP Enabled
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[var(--text-muted)] font-[500] block mt-0.5">
                      {item.category}
                    </span>
                    <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed font-[300] min-h-[36px]">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Status and Statistics Footer */}
                <div className="pt-3 border-t border-[var(--hairline)] space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                    <span>Last Synced:</span>
                    <span className="font-[600] text-[var(--ink)]">{item.lastSync}</span>
                  </div>

                  {/* Action Buttons: Connect vs Disconnect + Settings */}
                  <div className="pt-1.5 flex items-center gap-2">
                    {isConnected ? (
                      <>
                        {/* Settings Button: Opens MCP Tools Dialog */}
                        <button
                          type="button"
                          onClick={() => handleOpenSettings(item.id)}
                          className="flex-1 py-2 rounded-full text-xs font-[600] transition-all bg-[var(--canvas)] border border-[var(--hairline)] hover:bg-[var(--field)] text-[var(--ink)] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs focus:outline-none"
                        >
                          <Settings className="w-3.5 h-3.5 text-[#0066FF]" />
                          <span>Settings</span>
                        </button>

                        {/* Disconnect Button */}
                        <button
                          type="button"
                          onClick={() => toggleConnect(item.id)}
                          disabled={isDisconnecting}
                          className="py-2 px-3.5 rounded-full text-xs font-[600] transition-all border border-[var(--hairline)] bg-[var(--canvas)] text-[var(--text-muted)] hover:text-rose-500 hover:border-rose-500/30 cursor-pointer focus:outline-none disabled:opacity-50"
                          title="Disconnect this channel"
                        >
                          {isDisconnecting ? (
                            <span className="flex items-center gap-1 text-rose-500">
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>Disconnecting...</span>
                            </span>
                          ) : (
                            "Disconnect"
                          )}
                        </button>
                      </>
                    ) : (
                      /* Connect Button */
                      <button
                        type="button"
                        onClick={() => handleConnectClick(item.id)}
                        disabled={isConnecting}
                        className="w-full py-2 rounded-full text-xs font-[600] transition-all border border-transparent bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 shadow-xs focus:outline-none cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {isConnecting ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Connecting...</span>
                          </>
                        ) : (
                          <span>Connect</span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Modals ─── */}
      <IntegrationSettingsModal
        platform={settingsPlatform}
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        onDisconnect={(id) => toggleConnect(id)}
        accountEmail={
          settingsPlatform?.id === "gmail"
            ? integrations.find((i) => i.id === "gmail")?.accountEmail || currentUser?.email || "sushant98k@gmail.com"
            : null
        }
      />

      {/* ─── Dedicated WhatsApp Modals ─── */}
      <WhatsAppConnectionModal
        isOpen={whatsAppConnectionOpen}
        onClose={() => {
          setWhatsAppConnectionOpen(false);
          setConnectingId((prev) => (prev === "whatsapp" ? null : prev));
        }}
        onSuccess={handleWhatsAppConnected}
        onOpenSettings={() => setWhatsAppSettingsOpen(true)}
        initialPhoneNumber={
          integrations.find((i) => i.id === "whatsapp")?.accountEmail || "+91 9768368524"
        }
        currentUser={currentUser}
      />

      <WhatsAppSettingsModal
        isOpen={whatsAppSettingsOpen}
        onClose={() => setWhatsAppSettingsOpen(false)}
        onDisconnect={() => toggleConnect("whatsapp")}
        onReconnect={() => {
          setWhatsAppSettingsOpen(false);
          setConnectingId("whatsapp");
          setWhatsAppConnectionOpen(true);
        }}
        phoneNumber={
          integrations.find((i) => i.id === "whatsapp")?.accountEmail || "+91 9768368524"
        }
        tools={getPlatformById("whatsapp")?.mcpTools || []}
      />
    </div>
  );
}
