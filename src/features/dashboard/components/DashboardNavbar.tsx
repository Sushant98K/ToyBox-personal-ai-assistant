"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  RefreshCw,
  Menu,
  ArrowUpRight,
} from "lucide-react";
import { DashboardTab, MAIN_NAV_OPTIONS, PRICING_NAV_OPTION } from "../types";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme";
import { useSidebarSync } from "@/providers";
import { LiveNotificationFeed } from "@/components/ui/live-notification-feed";
import { mapAlertsToLiveNotifications } from "@/lib/alerts/notification-mapper";
import { TriggeredAlert } from "@/types/alerts";

interface DashboardNavbarProps {
  activeTab: DashboardTab;
  onOpenMobileSidebar: () => void;
  currentUser?: {
    name?: string;
    email?: string;
    avatar_url?: string;
  } | null;
  onQuickSync?: () => void;
}

export function DashboardNavbar({
  activeTab,
  onOpenMobileSidebar,
  currentUser,
  onQuickSync,
}: DashboardNavbarProps) {
  const router = useRouter();
  const {
    systemStatus,
    integrationsCount,
    agentRunningTaskLabel,
    pendingAlertsCount,
    setPendingAlertsCount,
  } = useSidebarSync();

  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [liveAlerts, setLiveAlerts] = useState<TriggeredAlert[]>([]);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Load real-time alerts from the backend
  const loadAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/alerts");
      if (res.ok) {
        const data = await res.json();
        const fetched: TriggeredAlert[] = data.alerts || [];
        setLiveAlerts(fetched);
        const unreadCount = fetched.filter(
          (a) => !a.read && a.status === "active"
        ).length;
        setPendingAlertsCount(unreadCount);
      }
    } catch (err) {
      console.warn("Could not load live alerts in navbar:", err);
    }
  }, [setPendingAlertsCount]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  // Re-fetch when the notification popover is opened
  useEffect(() => {
    if (notificationsOpen) {
      loadAlerts();
    }
  }, [notificationsOpen, loadAlerts]);

  // Close flyout when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    }
    if (notificationsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [notificationsOpen]);

  // Contextual action handling for live notification cards
  const handleNotificationAction = async (id: string, label: string) => {
    if (label === "Review") {
      setNotificationsOpen(false);
      router.push("/alerts");
      return;
    }

    if (label === "Resolve") {
      try {
        await fetch("/api/alerts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "resolve_alert", alert_id: id }),
        });
        setLiveAlerts((prev) =>
          prev.map((a) =>
            a.id === id ? { ...a, status: "resolved", read: true } : a
          )
        );
        setPendingAlertsCount(Math.max(0, pendingAlertsCount - 1));
      } catch (err) {
        console.error("Failed to resolve alert:", err);
      }
      return;
    }

    if (label === "Dismiss") {
      try {
        await fetch("/api/alerts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "dismiss_alert", alert_id: id }),
        });
        setLiveAlerts((prev) => prev.filter((a) => a.id !== id));
        setPendingAlertsCount(Math.max(0, pendingAlertsCount - 1));
      } catch (err) {
        console.error("Failed to dismiss alert:", err);
      }
    }
  };

  const handleNotificationDismiss = async (id: string) => {
    try {
      await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dismiss_alert", alert_id: id }),
      });
      setLiveAlerts((prev) => prev.filter((a) => a.id !== id));
      setPendingAlertsCount(Math.max(0, pendingAlertsCount - 1));
    } catch (err) {
      console.error("Failed to dismiss alert:", err);
    }
  };

  const handleNotificationOpen = (id: string) => {
    setLiveAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: true } : a))
    );
    setPendingAlertsCount(Math.max(0, pendingAlertsCount - 1));
  };

  // Find active navigation item title
  const currentNav =
    MAIN_NAV_OPTIONS.find((n) => n.id === activeTab) ||
    (activeTab === "pricing-settings" ? PRICING_NAV_OPTION : MAIN_NAV_OPTIONS[0]);

  const handleSyncClick = () => {
    setIsSyncing(true);
    if (onQuickSync) onQuickSync();
    loadAlerts();
    setTimeout(() => {
      setIsSyncing(false);
    }, 1000);
  };

  const liveAlertItems = mapAlertsToLiveNotifications(liveAlerts);

  return (
    <header className="sticky top-0 z-20 w-full bg-[var(--canvas)]/85 backdrop-blur-md border-b border-[var(--hairline)] transition-colors duration-200">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 gap-4">
        {/* ─── Left Section: Mobile Toggle & Breadcrumbs ─── */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Drawer Trigger (Hidden on Desktop) */}
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            aria-label="Open navigation sidebar"
            className="lg:hidden p-1.5 rounded-full text-[var(--ink)] hover:bg-[var(--canvas-soft)] border border-[var(--hairline)] transition-colors focus:outline-none"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Active Breadcrumb Lockup */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-[500] text-[var(--text-muted)]">
              <span className="hidden sm:inline">Workspace</span>
              <span className="hidden sm:inline text-[var(--text-faint)]">/</span>
              <span className="text-[var(--ink-soft)] font-[600] truncate">
                {currentNav.label}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-[652] text-[var(--ink)] tracking-tight truncate leading-tight">
              {currentNav.label === "Dashboard" ? "Executive Overview" : currentNav.label}
            </h1>
          </div>
        </div>

        {/* ─── Middle Section: Quick Command & Search Bar ─── */}
        <div className="hidden md:flex flex-1 max-w-sm mx-4">
          <div
            className={cn(
              "w-full flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--field)] transition-all duration-150 border",
              searchFocused
                ? "border-[var(--ink)] ring-1 ring-[var(--ink)]"
                : "border-transparent hover:border-[var(--hairline)]"
            )}
          >
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
            <input
              type="text"
              placeholder="Search actions, emails, briefs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="w-full bg-transparent text-xs text-[var(--ink)] placeholder:text-[var(--text-faint)] focus:outline-none font-[456]"
            />
            <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-mono font-medium text-[var(--text-muted)] bg-[var(--canvas)] border border-[var(--hairline)] select-none">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* ─── Right Section: Live Agent Pill, Quick Action & User ─── */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Live Operational Status Beacon Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--canvas-soft)] border border-[var(--hairline)] text-xs font-[600] text-[var(--ink)]">
            <span className="relative flex h-1.5 w-1.5">
              {systemStatus === "active" && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={cn(
                  "relative inline-flex rounded-full h-1.5 w-1.5",
                  systemStatus === "active" || systemStatus === "online"
                    ? "bg-emerald-500"
                    : "bg-amber-500"
                )}
              />
            </span>
            <span className="truncate">
              {systemStatus === "active"
                ? agentRunningTaskLabel || "Agent Active"
                : systemStatus === "online"
                ? `${integrationsCount} Channel${integrationsCount === 1 ? "" : "s"} Synced`
                : "Fleet Standby"}
            </span>
          </div>

          {/* Quick Sync Action Pill (Primary Mobbin Button) */}
          <button
            type="button"
            onClick={handleSyncClick}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 active:scale-98 transition-all duration-150 text-xs font-[600] shadow-xs focus:outline-none disabled:opacity-70"
            title="Trigger multi-channel intelligence sync"
          >
            <RefreshCw
              className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")}
            />
            <span className="hidden sm:inline">
              {isSyncing ? "Syncing..." : "Sync All"}
            </span>
          </button>

          {/* Theme Switcher (Left of Notification Bell) */}
          <ThemeToggle variant="inline" />

          {/* Notifications Dropdown Button */}
          <div className="relative" ref={notificationsRef}>
            <button
              type="button"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              aria-label="View system alerts & updates"
              className="relative p-2 rounded-full text-[var(--ink)] hover:bg-[var(--canvas-soft)] border border-[var(--hairline)] transition-all duration-150 focus:outline-none"
            >
              <Bell className="w-4 h-4" />
              {/* Unread Alert Pill Badge */}
              {pendingAlertsCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[var(--canvas)]" />
              )}
            </button>

            {/* Notification Glassmorphic Flyout Popover */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2.5 w-[360px] sm:w-[420px] rounded-[24px] bg-[var(--canvas-soft)]/95 backdrop-blur-xl border border-[var(--hairline)] p-3 shadow-2xl z-50 text-[var(--ink)] animate-in fade-in-50 zoom-in-95 duration-150">
                <LiveNotificationFeed
                  items={liveAlertItems}
                  title="System & App Alerts"
                  height="340px"
                  onAction={handleNotificationAction}
                  onDismiss={handleNotificationDismiss}
                  onOpen={handleNotificationOpen}
                  className="border-0 bg-transparent p-0 shadow-none text-inherit"
                />

                <div className="pt-2.5 mt-2 border-t border-[var(--hairline)] flex items-center justify-between text-xs">
                  <span className="text-[10px] text-[var(--text-faint)] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    Trigger.dev 15m condition monitor
                  </span>
                  <Link
                    href="/alerts"
                    onClick={() => setNotificationsOpen(false)}
                    className="text-[11px] font-[600] text-[#0066FF] hover:underline inline-flex items-center gap-1"
                  >
                    <span>View all in Alerts</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
