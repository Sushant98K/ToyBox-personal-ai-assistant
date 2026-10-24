"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  Bell,
  Sparkles,
  RefreshCw,
  Menu,
  Clock,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";
import { DashboardTab, MAIN_NAV_OPTIONS, PRICING_NAV_OPTION } from "../types";
import { cn } from "@/lib/utils";

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
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Find active navigation item title
  const currentNav =
    MAIN_NAV_OPTIONS.find((n) => n.id === activeTab) ||
    (activeTab === "pricing-settings" ? PRICING_NAV_OPTION : MAIN_NAV_OPTIONS[0]);

  const handleSyncClick = () => {
    setIsSyncing(true);
    if (onQuickSync) onQuickSync();
    setTimeout(() => {
      setIsSyncing(false);
    }, 1000);
  };

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
          {/* Active Agents Beacon Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--canvas-soft)] border border-[var(--hairline)] text-xs font-[600] text-[var(--ink)]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="truncate">3 Agents Running</span>
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

          {/* Notifications Dropdown Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              aria-label="View system alerts & updates"
              className="relative p-2 rounded-full text-[var(--ink)] hover:bg-[var(--canvas-soft)] border border-[var(--hairline)] transition-all duration-150 focus:outline-none"
            >
              <Bell className="w-4 h-4" />
              {/* Unread Alert Pill Badge */}
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[var(--canvas)]" />
            </button>

            {/* Notification Quick Drawer Flyout */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2.5 w-80 sm:w-88 rounded-[20px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-4 shadow-xl z-50 text-[var(--ink)] animate-in fade-in-50 zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2.5 border-b border-[var(--hairline)]">
                  <div className="flex items-center gap-2">
                    <span className="font-[652] text-xs text-[var(--ink)]">
                      Recent Intelligence
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/15 text-rose-500">
                      2 Unread
                    </span>
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)] cursor-pointer hover:underline">
                    Mark all read
                  </span>
                </div>

                <div className="py-2 divide-y divide-[var(--hairline-soft)] space-y-2 text-xs">
                  <div className="pt-2 flex items-start gap-2.5">
                    <div
                      className="w-7 h-7 rounded-full bg-[var(--raised)] border border-[var(--hairline-soft)] text-rose-500 flex items-center justify-center shrink-0"
                      style={{ borderRadius: "30%" }}
                    >
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-[600] text-[var(--ink)] text-xs">
                        Emergency Board Call Rescheduled
                      </p>
                      <p className="text-[var(--text-muted)] text-[11px] mt-0.5">
                        Slack #executive: Moved to 4:30 PM EST. Conflict resolved.
                      </p>
                      <span className="text-[9px] text-[var(--text-faint)] mt-1 block">
                        8 mins ago
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-start gap-2.5">
                    <div
                      className="w-7 h-7 rounded-full bg-[var(--raised)] border border-[var(--hairline-soft)] text-emerald-500 flex items-center justify-center shrink-0"
                      style={{ borderRadius: "30%" }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-[600] text-[var(--ink)] text-xs">
                        WhatsApp Autonomous Reply Sent
                      </p>
                      <p className="text-[var(--text-muted)] text-[11px] mt-0.5">
                        Draft approved & sent to Series B Lead Investor regarding NDA revision.
                      </p>
                      <span className="text-[9px] text-[var(--text-faint)] mt-1 block">
                        24 mins ago
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-[var(--hairline)] text-center">
                  <Link
                    href="#alerts"
                    onClick={() => setNotificationsOpen(false)}
                    className="text-[11px] font-[600] text-[#0066FF] hover:underline inline-flex items-center gap-1"
                  >
                    <span>View all notifications in Alerts tab</span>
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
