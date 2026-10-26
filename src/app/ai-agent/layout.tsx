"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/features/dashboard/components/DashboardSidebar";
import { DashboardNavbar } from "@/features/dashboard/components/DashboardNavbar";
import { DashboardTab } from "@/features/dashboard/types";
import { insforge } from "@/lib/insforge";

export default function AiAgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState<{
    id?: string;
    name?: string;
    email?: string;
    avatar_url?: string;
  } | null>(null);

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

  const handleTabChange = (tab: DashboardTab) => {
    if (tab === "ai-agent") {
      router.push("/ai-agent");
    } else if (tab === "briefing") {
      router.push("/briefings");
    } else {
      router.push(`/dashboard?tab=${tab}`);
    }
    setMobileSidebarOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await insforge.auth.signOut();
    } catch (e) {
      console.warn("Sign out err:", e);
    }
    router.push("/sign-in");
  };

  return (
    <div className="flex h-screen w-full bg-[#0B0F17] text-white overflow-hidden">
      {/* ─── Desktop Collapsible Sidebar ─── */}
      <div className="hidden lg:flex h-full shrink-0">
        <DashboardSidebar
          activeTab="ai-agent"
          onTabChange={handleTabChange}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          currentUser={currentUser}
          onSignOut={handleSignOut}
        />
      </div>

      {/* ─── Mobile Sidebar Drawer Overlay ─── */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-50 flex h-full w-72 max-w-[85vw] flex-col bg-[#0D1117] shadow-2xl animate-in slide-in-from-left duration-200">
            <DashboardSidebar
              activeTab="ai-agent"
              onTabChange={handleTabChange}
              isCollapsed={false}
              onToggleCollapse={() => setMobileSidebarOpen(false)}
              currentUser={currentUser}
              onSignOut={handleSignOut}
              className="w-full h-full border-r-0"
            />
          </div>
        </div>
      )}

      {/* ─── Main Content Area Occupying Full Remaining Width Outside Fixed Left Sidebar ─── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#0B0F17]">
        <DashboardNavbar
          activeTab="ai-agent"
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          currentUser={currentUser}
        />

        <main className="flex-1 flex flex-col min-w-0 max-w-none w-full h-[calc(100vh-theme(spacing.16))] overflow-hidden bg-[#0B0F17]">
          {children}
        </main>
      </div>
    </div>
  );
}
