"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { siteConfig } from "@/config";
import {
  DashboardTab,
  MAIN_NAV_OPTIONS,
  PRICING_NAV_OPTION,
  NavOption,
} from "./types";
import { cn } from "@/lib/utils";

interface DashboardSidebarProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  currentUser?: {
    name?: string;
    email?: string;
    avatar_url?: string;
  } | null;
  onSignOut?: () => void;
  className?: string;
  badgeOverrides?: Partial<Record<DashboardTab, string>>;
}

export function DashboardSidebar({
  activeTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse,
  currentUser,
  onSignOut,
  className,
  badgeOverrides,
}: DashboardSidebarProps) {
  const userDisplayName =
    currentUser?.name || currentUser?.email?.split("@")[0] || "Executive";
  const userInitial = userDisplayName.charAt(0).toUpperCase();

  const mainNavItems = MAIN_NAV_OPTIONS.map((item) => {
    if (badgeOverrides && badgeOverrides[item.id] !== undefined) {
      return { ...item, badge: badgeOverrides[item.id] };
    }
    return item;
  });

  return (
    <aside
      className={cn(
        "relative flex flex-col h-full bg-[var(--canvas-soft)] border-r border-[var(--hairline)] transition-all duration-300 ease-in-out select-none z-30 shrink-0",
        isCollapsed ? "w-20" : "w-64",
        className
      )}
      aria-label="Dashboard Sidebar"
    >
      {/* ─── Top Brand Header ─── */}
      <div
        className={cn(
          "flex items-center h-16 px-3.5 border-b border-[var(--hairline)] shrink-0 transition-all duration-200",
          isCollapsed ? "justify-center" : "justify-between"
        )}
      >
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2.5 group overflow-hidden focus:outline-none",
            isCollapsed && "justify-center"
          )}
          title="Return to Landing Page"
        >
          <div className="relative shrink-0 flex items-center justify-center w-9 h-9 bg-[var(--canvas)] border border-[var(--hairline)] transition-transform duration-200 group-hover:scale-105 squircle-30 shadow-xs">
            <Image
              src="/logos/ToyBox-Logo.png"
              alt="ToyBox Logo"
              width={32}
              height={32}
              className="w-6 h-6 object-contain"
              priority
            />
          </div>

          {!isCollapsed && (
            <div className="flex flex-col min-w-0 transition-opacity duration-200">
              <span className="font-[652] text-base text-[var(--ink)] tracking-tight truncate leading-tight">
                {siteConfig.name}
              </span>
              <span className="text-[10px] font-[500] text-[var(--text-muted)] tracking-normal truncate flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Autonomous Ops</span>
              </span>
            </div>
          )}
        </Link>

        {/* Collapse toggle button */}
        {!isCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
            className="p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--ink)] hover:bg-[var(--canvas)] border border-transparent hover:border-[var(--hairline)] transition-all duration-150 focus:outline-none"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ─── Expand Toggle Button when Collapsed ─── */}
      {isCollapsed && (
        <div className="px-2 pt-2.5 flex justify-center">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Expand sidebar"
            title="Expand sidebar"
            className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--ink)] hover:bg-[var(--canvas)] border border-[var(--hairline-soft)] hover:border-[var(--hairline)] transition-all duration-150 focus:outline-none"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── Main Navigation Options ─── */}
      <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-none">
        {!isCollapsed && (
          <div className="px-2.5 pb-1.5 text-[10px] font-[600] uppercase tracking-wider text-[var(--text-faint)]">
            Main Menu
          </div>
        )}

        {mainNavItems.map((item) => (
          <NavRow
            key={item.id}
            item={item}
            isActive={activeTab === item.id}
            isCollapsed={isCollapsed}
            onClick={() => onTabChange(item.id)}
          />
        ))}
      </nav>

      {/* ─── Bottom Section: Pricing Settings & Account ─── */}
      <div className="p-2.5 border-t border-[var(--hairline)] space-y-1.5 shrink-0 bg-[var(--canvas-soft)]">
        {!isCollapsed && (
          <div className="px-2.5 text-[10px] font-[600] uppercase tracking-wider text-[var(--text-faint)]">
            Account & Billing
          </div>
        )}

        {/* Pricing Settings Option */}
        <NavRow
          item={PRICING_NAV_OPTION}
          isActive={activeTab === PRICING_NAV_OPTION.id}
          isCollapsed={isCollapsed}
          onClick={() => onTabChange(PRICING_NAV_OPTION.id)}
        />

        {/* User Profile Lockup */}
        <div
          className={cn(
            "pt-2 mt-1.5 border-t border-[var(--hairline-soft)] flex items-center transition-all duration-200",
            isCollapsed ? "flex-col gap-1.5 justify-center" : "justify-between px-1.5 py-1"
          )}
        >
          <div
            className={cn(
              "flex items-center gap-2 overflow-hidden",
              isCollapsed && "justify-center"
            )}
            title={userDisplayName}
          >
            {/* User Avatar */}
            <div
              className="w-8 h-8 bg-[var(--canvas)] border border-[var(--hairline)] flex items-center justify-center text-xs font-bold text-[var(--ink)] shrink-0 overflow-hidden shadow-2xs"
              style={{ borderRadius: "30%" }}
            >
              {currentUser?.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt={userDisplayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{userInitial}</span>
              )}
            </div>

            {!isCollapsed && (
              <div className="min-w-0 flex flex-col text-left">
                <span className="font-[600] text-xs text-[var(--ink)] truncate">
                  {userDisplayName}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] truncate">
                  {currentUser?.email || "executive@toybox.ai"}
                </span>
              </div>
            )}
          </div>

          {/* Sign Out Button */}
          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              title="Sign out"
              className={cn(
                "p-1.5 rounded-full text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors focus:outline-none",
                isCollapsed && "w-8 h-8 flex items-center justify-center"
              )}
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

interface NavRowProps {
  item: NavOption;
  isActive: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}

function NavRow({ item, isActive, isCollapsed, onClick }: NavRowProps) {
  const Icon = item.icon;

  return (
    <div className="relative group">
      <button
        type="button"
        onClick={onClick}
        aria-label={item.label}
        className={cn(
          "w-full flex items-center rounded-xl transition-all duration-150 focus:outline-none relative",
          isCollapsed
            ? "justify-center py-2 px-1"
            : "justify-start px-2.5 py-2 gap-3",
          isActive
            ? "bg-[var(--canvas)] text-[var(--ink)] border border-[var(--hairline)] shadow-2xs"
            : "hover:bg-[var(--canvas)]/70 text-[var(--text-muted)] hover:text-[var(--ink)] border border-transparent"
        )}
      >
        {/* Minimal Theme-Aligned Squircle Icon Container */}
        <div
          className={cn(
            "relative flex items-center justify-center shrink-0 transition-colors duration-150",
            isCollapsed ? "w-9 h-9" : "w-8 h-8",
            isActive
              ? item.id === "pricing-settings"
                ? "bg-[#0066FF] text-white"
                : "bg-[var(--primary)] text-[var(--on-primary)]"
              : item.id === "pricing-settings"
              ? "bg-[#0066FF]/10 text-[#0066FF] border border-[#0066FF]/20"
              : "bg-[var(--canvas)] text-[var(--ink)] border border-[var(--hairline-soft)] group-hover:border-[var(--hairline)]"
          )}
          style={{ borderRadius: "30%" }}
        >
          <Icon className="w-4 h-4 stroke-[1.8]" />

          {/* Collapsed Active Indicator Dot */}
          {isCollapsed && isActive && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--primary)] ring-2 ring-[var(--canvas-soft)]" />
          )}

          {/* Collapsed Badge Dot */}
          {isCollapsed && item.badge && !isActive && (
            <span
              className={cn(
                "absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-[var(--canvas-soft)]",
                item.badgeType === "danger"
                  ? "bg-rose-500"
                  : item.id === "pricing-settings"
                  ? "bg-[#0066FF]"
                  : "bg-emerald-500"
              )}
            />
          )}
        </div>

        {/* Expanded Row Content */}
        {!isCollapsed && (
          <div className="flex-1 flex items-center justify-between min-w-0 text-left">
            <span
              className={cn(
                "font-[600] text-[13px] tracking-tight truncate leading-tight",
                isActive ? "text-[var(--ink)]" : "text-[var(--ink-soft)]"
              )}
            >
              {item.label}
            </span>

            {/* Badges */}
            {item.badge && (
              <span
                className={cn(
                  "ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold tracking-tight shrink-0",
                  item.badgeType === "danger"
                    ? "bg-rose-500/15 text-rose-500 dark:text-rose-400 border border-rose-500/20"
                    : item.badgeType === "success"
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : item.badgeType === "accent" || item.id === "pricing-settings"
                    ? "bg-[#0066FF] text-white" // Mobbin commercial badge
                    : "bg-[var(--raised)] text-[var(--text-muted)] border border-[var(--hairline)]"
                )}
              >
                {item.badge}
              </span>
            )}
          </div>
        )}
      </button>

      {/* Floating Tooltip Pill for Collapsed State */}
      {isCollapsed && (
        <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 transform translate-x-1 group-hover:translate-x-0 hidden sm:block">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--raised)] border border-[var(--hairline)] text-[var(--ink)] text-xs font-[600] whitespace-nowrap shadow-sm">
            <span>{item.label}</span>
            {item.badge && (
              <span
                className={cn(
                  "px-1 py-0.1 rounded-full text-[9px] font-bold",
                  item.id === "pricing-settings"
                    ? "bg-[#0066FF] text-white"
                    : "bg-[var(--canvas)] text-[var(--ink)]"
                )}
              >
                {item.badge}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
