"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { DashboardTab } from "@/features/dashboard/types";

export type SystemOperationalStatus = "online" | "standby" | "active";

export interface SidebarSyncContextType {
  // Real-time metric states
  integrationsCount: number;
  isAgentRunning: boolean;
  agentRunningTaskLabel: string | null;
  hasNewBriefing: boolean;
  pendingAlertsCount: number;
  systemStatus: SystemOperationalStatus;

  // Real-time state mutators
  setIntegrationsCount: (count: number) => void;
  setIsAgentRunning: (running: boolean, taskLabel?: string | null) => void;
  setHasNewBriefing: (hasNew: boolean) => void;
  setPendingAlertsCount: (count: number) => void;
  markBriefingViewed: () => void;
  refreshSidebarState: () => Promise<void>;

  // Computed badge mappings
  badgeMap: Partial<Record<DashboardTab, string | undefined>>;
  badgeTypeMap: Partial<
    Record<DashboardTab, "accent" | "danger" | "neutral" | "success" | undefined>
  >;
}

const SidebarSyncContext = createContext<SidebarSyncContextType | null>(null);

const STORAGE_KEYS = {
  INTEGRATIONS: "toybox_synced_integrations_count",
  ALERTS: "toybox_pending_alerts_count",
  BRIEFING_VIEWED_DATE: "toybox_briefing_last_viewed_date",
};

export function SidebarSyncProvider({ children }: { children: React.ReactNode }) {
  // 1. Integrations count (starts from cached or 0, updated by live API)
  const [integrationsCount, setIntegrationsCountState] = useState<number>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(STORAGE_KEYS.INTEGRATIONS);
        if (cached !== null && !isNaN(Number(cached))) {
          return Math.max(0, Number(cached));
        }
      } catch {}
    }
    return 0;
  });

  // 2. AI Agent live execution state (never hardcoded to "3 Active")
  const [isAgentRunning, setIsAgentRunningState] = useState<boolean>(false);
  const [agentRunningTaskLabel, setAgentRunningTaskLabel] = useState<string | null>(null);

  // 3. Pending critical alerts count
  const [pendingAlertsCount, setPendingAlertsCountState] = useState<number>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(STORAGE_KEYS.ALERTS);
        if (cached !== null && !isNaN(Number(cached))) {
          return Math.max(0, Number(cached));
        }
      } catch {}
    }
    return 2; // Initial default pending critical alerts from AlertsView
  });

  // 4. Briefing status
  const [hasNewBriefing, setHasNewBriefingState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const todayStr = new Date().toISOString().split("T")[0];
        const lastViewed = localStorage.getItem(STORAGE_KEYS.BRIEFING_VIEWED_DATE);
        return lastViewed !== todayStr;
      } catch {}
    }
    return true;
  });

  // Updaters with localStorage synchronization
  const setIntegrationsCount = useCallback((count: number) => {
    const validCount = Math.max(0, count);
    setIntegrationsCountState(validCount);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEYS.INTEGRATIONS, String(validCount));
      } catch {}
    }
  }, []);

  const setIsAgentRunning = useCallback(
    (running: boolean, taskLabel: string | null = null) => {
      setIsAgentRunningState(running);
      setAgentRunningTaskLabel(running ? taskLabel : null);
    },
    []
  );

  const setPendingAlertsCount = useCallback((count: number) => {
    const validCount = Math.max(0, count);
    setPendingAlertsCountState(validCount);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEYS.ALERTS, String(validCount));
      } catch {}
    }
  }, []);

  const setHasNewBriefing = useCallback((hasNew: boolean) => {
    setHasNewBriefingState(hasNew);
  }, []);

  const markBriefingViewed = useCallback(() => {
    setHasNewBriefingState(false);
    if (typeof window !== "undefined") {
      try {
        const todayStr = new Date().toISOString().split("T")[0];
        localStorage.setItem(STORAGE_KEYS.BRIEFING_VIEWED_DATE, todayStr);
      } catch {}
    }
  }, []);

  // Fetch real database status on mount to sync all pages
  const refreshSidebarState = useCallback(async () => {
    try {
      // 1. Sync live integrations count
      const res = await fetch("/api/integrations", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.integrations && Array.isArray(data.integrations)) {
          const connected = data.integrations.filter(
            (i: any) => i.status === "connected"
          ).length;
          setIntegrationsCount(connected);
        }
      }
    } catch (err) {
      console.warn("Could not sync live sidebar integrations count:", err);
    }

    try {
      // 2. Sync briefing status
      const todayStr = new Date().toISOString().split("T")[0];
      const lastViewed = typeof window !== "undefined"
        ? localStorage.getItem(STORAGE_KEYS.BRIEFING_VIEWED_DATE)
        : null;

      if (lastViewed === todayStr) {
        setHasNewBriefingState(false);
      } else {
        const summaryRes = await fetch("/api/agent/summary", { credentials: "omit" });
        if (summaryRes.ok) {
          const summary = await summaryRes.json();
          if (summary.todaysBrief?.id) {
            setHasNewBriefingState(true);
          }
        }
      }
    } catch (err) {
      console.warn("Could not sync live briefing status:", err);
    }
  }, [setIntegrationsCount]);

  useEffect(() => {
    refreshSidebarState();
  }, [refreshSidebarState]);

  // Derived overall system status
  const systemStatus: SystemOperationalStatus = useMemo(() => {
    if (isAgentRunning) return "active";
    if (integrationsCount > 0) return "online";
    return "standby";
  }, [isAgentRunning, integrationsCount]);

  // Dynamic badge labels
  const badgeMap = useMemo<Partial<Record<DashboardTab, string | undefined>>>(() => {
    return {
      dashboard: undefined,
      "ai-agent": isAgentRunning ? "Running" : undefined,
      briefing: hasNewBriefing ? "New" : undefined,
      integrations: integrationsCount > 0 ? `${integrationsCount} Synced` : undefined,
      alerts: pendingAlertsCount > 0 ? String(pendingAlertsCount) : undefined,
      settings: undefined,
      "pricing-settings": "PRO",
    };
  }, [isAgentRunning, hasNewBriefing, integrationsCount, pendingAlertsCount]);

  // Dynamic badge pill styles aligned with Mobbin guidelines
  const badgeTypeMap = useMemo<
    Partial<
      Record<DashboardTab, "accent" | "danger" | "neutral" | "success" | undefined>
    >
  >(() => {
    return {
      dashboard: undefined,
      "ai-agent": isAgentRunning ? "success" : undefined,
      briefing: hasNewBriefing ? "success" : undefined,
      integrations: "neutral",
      alerts: "danger",
      settings: undefined,
      "pricing-settings": "accent",
    };
  }, [isAgentRunning, hasNewBriefing]);

  const contextValue = useMemo(
    () => ({
      integrationsCount,
      isAgentRunning,
      agentRunningTaskLabel,
      hasNewBriefing,
      pendingAlertsCount,
      systemStatus,
      setIntegrationsCount,
      setIsAgentRunning,
      setHasNewBriefing,
      setPendingAlertsCount,
      markBriefingViewed,
      refreshSidebarState,
      badgeMap,
      badgeTypeMap,
    }),
    [
      integrationsCount,
      isAgentRunning,
      agentRunningTaskLabel,
      hasNewBriefing,
      pendingAlertsCount,
      systemStatus,
      setIntegrationsCount,
      setIsAgentRunning,
      setHasNewBriefing,
      setPendingAlertsCount,
      markBriefingViewed,
      refreshSidebarState,
      badgeMap,
      badgeTypeMap,
    ]
  );

  return (
    <SidebarSyncContext.Provider value={contextValue}>
      {children}
    </SidebarSyncContext.Provider>
  );
}

export function useSidebarSync(): SidebarSyncContextType {
  const context = useContext(SidebarSyncContext);
  if (!context) {
    // Provide a safe fallback if used outside of provider
    return {
      integrationsCount: 0,
      isAgentRunning: false,
      agentRunningTaskLabel: null,
      hasNewBriefing: false,
      pendingAlertsCount: 0,
      systemStatus: "standby",
      setIntegrationsCount: () => {},
      setIsAgentRunning: () => {},
      setHasNewBriefing: () => {},
      setPendingAlertsCount: () => {},
      markBriefingViewed: () => {},
      refreshSidebarState: async () => {},
      badgeMap: {
        "pricing-settings": "PRO",
      },
      badgeTypeMap: {
        "pricing-settings": "accent",
      },
    };
  }
  return context;
}
