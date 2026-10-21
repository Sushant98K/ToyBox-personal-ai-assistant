"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardNavbar } from "./DashboardNavbar";
import { DashboardTab } from "./types";
import { DashboardOverviewView } from "./views/DashboardOverviewView";
import { AiAgentView } from "./views/AiAgentView";
import { BriefingView } from "./views/BriefingView";
import { IntegrationsView } from "./views/IntegrationsView";
import { AlertsView } from "./views/AlertsView";
import { SettingsView } from "./views/SettingsView";
import { PricingSettingsView } from "./views/PricingSettingsView";
import { insforge } from "@/lib/insforge";
import { cn } from "@/lib/utils";

export function DashboardShell() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab state derived from URL or default to "dashboard"
  const tabFromUrl = searchParams.get("tab") as DashboardTab | null;
  const [activeTab, setActiveTab] = useState<DashboardTab>(
    tabFromUrl || "dashboard"
  );

  // Sidebar collapsible state
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // User state
  const [currentUser, setCurrentUser] = useState<{
    id?: string;
    name?: string;
    email?: string;
    avatar_url?: string;
  } | null>(null);

  // Dynamic synced integrations count for sidebar badge
  const [syncedCount, setSyncedCount] = useState<number | null>(null);

  // Load user session from InsForge
  useEffect(() => {
    async function loadUser() {
      try {
        const { data } = await insforge.auth.getCurrentUser();
        if (data?.user) {
          setCurrentUser({
            id: data.user.id,
            name: data.user.profile?.name || data.user.email?.split("@")[0],
            email: data.user.email,
            avatar_url: data.user.profile?.avatar_url,
          });
        }
      } catch (err) {
        console.warn("Could not retrieve active session:", err);
      }
    }
    loadUser();
  }, []);

  // Fetch initial synced integrations count to reflect real database status in sidebar
  useEffect(() => {
    let isMounted = true;
    async function loadIntegrationCount() {
      try {
        const headers: Record<string, string> = {};
        if (currentUser?.id) headers["x-user-id"] = currentUser.id;
        if (currentUser?.email) headers["x-user-email"] = currentUser.email;
        const res = await fetch("/api/integrations", { headers, cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.integrations && Array.isArray(data.integrations)) {
            const count = data.integrations.filter((i: any) => i.status === "connected").length;
            if (isMounted) setSyncedCount(count);
          }
        }
      } catch (err) {
        console.warn("Could not check synced count:", err);
      }
    }
    loadIntegrationCount();
    return () => {
      isMounted = false;
    };
  }, [currentUser?.id, currentUser?.email]);

  // Update URL and tab state
  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab);
    setMobileSidebarOpen(false);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", tab);
    router.push(`/dashboard?${params.toString()}`, { scroll: false });
  };

  // Sign out handler
  const handleSignOut = async () => {
    try {
      await insforge.auth.signOut();
    } catch (e) {
      console.warn("Sign out err:", e);
    }
    router.push("/sign-in");
  };

  const badgeOverrides = syncedCount !== null ? { integrations: `${syncedCount} Synced` } : undefined;

  return (
    <div className="flex h-screen w-full bg-[var(--canvas)] text-[var(--ink)] overflow-hidden transition-colors duration-200">
      {/* ─── Desktop Collapsible Sidebar ─── */}
      <div className="hidden lg:flex h-full">
        <DashboardSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          currentUser={currentUser}
          onSignOut={handleSignOut}
          badgeOverrides={badgeOverrides}
        />
      </div>

      {/* ─── Mobile Sidebar Drawer Overlay ─── */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop Scrim */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className="relative z-50 flex h-full w-72 max-w-[85vw] flex-col bg-[var(--canvas-soft)] shadow-2xl animate-in slide-in-from-left duration-200">
            <DashboardSidebar
              activeTab={activeTab}
              onTabChange={handleTabChange}
              isCollapsed={false}
              onToggleCollapse={() => setMobileSidebarOpen(false)}
              currentUser={currentUser}
              onSignOut={handleSignOut}
              className="w-full h-full border-r-0"
              badgeOverrides={badgeOverrides}
            />
          </div>
        </div>
      )}

      {/* ─── Main Content Area with Header ─── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navbar */}
        <DashboardNavbar
          activeTab={activeTab}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          currentUser={currentUser}
          onQuickSync={() => {}}
        />

        {/* Scrollable Viewport Content */}
        <main
          className={cn(
            "flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 2xl:px-10 py-6 sm:py-8 w-full pb-24",
            activeTab === "integrations" ? "max-w-none" : "max-w-7xl mx-auto"
          )}
        >
          {activeTab === "dashboard" && (
            <DashboardOverviewView
              onNavigateTab={handleTabChange}
              currentUser={currentUser}
            />
          )}

          {activeTab === "ai-agent" && <AiAgentView />}

          {activeTab === "briefing" && <BriefingView />}

          {activeTab === "integrations" && (
            <IntegrationsView
              currentUser={currentUser}
              onSyncCountChange={(count) => setSyncedCount(count)}
            />
          )}

          {activeTab === "alerts" && <AlertsView />}

          {activeTab === "settings" && <SettingsView />}

          {activeTab === "pricing-settings" && <PricingSettingsView />}
        </main>
      </div>
    </div>
  );
}
