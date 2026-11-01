"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Bell,
  AlertCircle,
  Plus,
  Filter,
  RefreshCw,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  SlidersHorizontal,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Eye,
  Check,
} from "lucide-react";
import { SocialIcon } from "@/components/icons/AppIcons";
import {
  TriggeredAlert,
  AlertRule,
  AlertStats,
  SuggestedAlert,
  AlertPriority,
  AlertPlatform,
} from "@/types/alerts";
import { AlertDetailModal } from "./AlertDetailModal";
import { CreateAlertRuleModal } from "./CreateAlertRuleModal";
import { useSidebarSync } from "@/providers";
import { cn } from "@/lib/utils";

export function AlertsManager() {
  const { setPendingAlertsCount } = useSidebarSync();

  const [alerts, setAlerts] = useState<TriggeredAlert[]>([]);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [stats, setStats] = useState<AlertStats>({
    activeRulesCount: 0,
    triggeredTodayCount: 0,
    highPriorityCount: 0,
    pausedResolvedCount: 0,
  });
  const [suggestedAlerts, setSuggestedAlerts] = useState<SuggestedAlert[]>([]);

  // Filter states
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Loading & Action states
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Modals
  const [selectedAlert, setSelectedAlert] = useState<TriggeredAlert | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SuggestedAlert | null>(null);

  // Fetch alerts data from API
  const fetchAlertsData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (platformFilter !== "all") params.set("app", platformFilter);
      if (priorityFilter !== "all") params.set("priority", priorityFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/alerts?${params.toString()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
        if (data.rules) setRules(data.rules);
        if (data.stats) {
          setStats(data.stats);
          setPendingAlertsCount(data.stats.highPriorityCount);
        }
        if (data.suggestedAlerts) setSuggestedAlerts(data.suggestedAlerts);
      }
    } catch (err) {
      console.warn("Could not load alerts hub data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [platformFilter, priorityFilter, statusFilter, setPendingAlertsCount]);

  useEffect(() => {
    fetchAlertsData();
  }, [fetchAlertsData]);

  // Run On-Demand Trigger.dev Condition Evaluation Scan
  const handleRunScan = async () => {
    setIsScanning(true);
    setScanMessage(null);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run_check" }),
      });
      if (res.ok) {
        const data = await res.json();
        const createdCount = data.checkResult?.newAlertsCreated || 0;
        setScanMessage(
          createdCount > 0
            ? `Scan finished: Detected ${createdCount} new priority alerts!`
            : "Scan complete: All connected channels verified. No new blocker conditions."
        );
        fetchAlertsData();
      }
    } catch (err: any) {
      setScanMessage("Scan failed: Please verify network connection.");
    } finally {
      setIsScanning(false);
      setTimeout(() => setScanMessage(null), 4000);
    }
  };

  // Resolve Alert Handler
  const handleResolveAlert = async (alertId: string) => {
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resolve_alert", alertId }),
      });
      if (res.ok) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === alertId ? { ...a, status: "resolved", read: true } : a))
        );
        fetchAlertsData();
      }
    } catch (err) {
      console.warn("Failed to resolve alert:", err);
    }
  };

  // Snooze Alert Handler
  const handleSnoozeAlert = async (alertId: string, hours: number) => {
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "snooze_alert", alertId, hours }),
      });
      if (res.ok) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === alertId ? { ...a, status: "snoozed", read: true } : a))
        );
        fetchAlertsData();
      }
    } catch (err) {
      console.warn("Failed to snooze alert:", err);
    }
  };

  // Toggle Rule Active Status
  const handleToggleRule = async (ruleId: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_rule",
          ruleId,
          is_active: !currentStatus,
        }),
      });
      if (res.ok) {
        setRules((prev) =>
          prev.map((r) => (r.id === ruleId ? { ...r, is_active: !currentStatus } : r))
        );
        fetchAlertsData();
      }
    } catch (err) {
      console.warn("Failed to toggle rule:", err);
    }
  };

  // Delete Rule Handler
  const handleDeleteRule = async (ruleId: string) => {
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_rule", ruleId }),
      });
      if (res.ok) {
        setRules((prev) => prev.filter((r) => r.id !== ruleId));
        fetchAlertsData();
      }
    } catch (err) {
      console.warn("Failed to delete rule:", err);
    }
  };

  // Open Template in Creator Modal
  const handleAddFromTemplate = (template: SuggestedAlert) => {
    setSelectedTemplate(template);
    setCreateModalOpen(true);
  };

  // Open Detail Modal
  const handleOpenDetail = (alert: TriggeredAlert) => {
    setSelectedAlert(alert);
    setDetailModalOpen(true);
  };

  return (
    <div className="flex-1 w-full min-w-0 max-w-none px-6 py-6 md:px-8 space-y-6 bg-[#0B0F17] text-white">
      {/* ─── A. Header & Top Actions ─── */}
      <div className="rounded-[24px] bg-[#121824] border border-[#1E293B] p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B0F17] border border-[#1E293B] text-xs font-[600] text-white">
            <ShieldAlert className="w-3.5 h-3.5 text-[#0066FF]" />
            <span>Autonomous Security & Condition Radar</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-[652] tracking-tight text-white">
            System & App Alerts
          </h1>
          <p className="text-sm text-[#94A3B8] max-w-2xl font-[300]">
            Live alerts, AI-detected triggers, and automated condition monitoring across connected apps.
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Platform Filter */}
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="px-3 py-1.5 rounded-full text-xs font-[600] bg-[#0B0F17] border border-[#1E293B] text-white focus:outline-none focus:border-[#0066FF]"
            aria-label="Filter by app"
          >
            <option value="all">All Apps</option>
            <option value="gmail">Gmail</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="slack">Slack</option>
            <option value="calendar">Calendar</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-full text-xs font-[600] bg-[#0B0F17] border border-[#1E293B] text-white focus:outline-none focus:border-[#0066FF]"
            aria-label="Filter by priority"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-full text-xs font-[600] bg-[#0B0F17] border border-[#1E293B] text-white focus:outline-none focus:border-[#0066FF]"
            aria-label="Filter by status"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="resolved">Resolved</option>
            <option value="snoozed">Snoozed</option>
          </select>

          {/* Run Scan Button */}
          <button
            type="button"
            onClick={handleRunScan}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-[600] bg-[#0B0F17] border border-[#1E293B] text-[#94A3B8] hover:text-white hover:border-[#334155] transition-all disabled:opacity-60"
            title="Evaluate live connected app conditions right now"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isScanning && "animate-spin text-[#0066FF]")} />
            <span>{isScanning ? "Scanning..." : "Run Check"}</span>
          </button>

          {/* Create Alert Primary Button */}
          <button
            type="button"
            onClick={() => {
              setSelectedTemplate(null);
              setCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-[652] bg-[#0066FF] text-white hover:bg-[#0066FF]/90 transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Create New Alert</span>
          </button>
        </div>
      </div>

      {scanMessage && (
        <div className="p-3 rounded-2xl bg-[#0066FF]/10 border border-[#0066FF]/20 text-[#60A5FA] text-xs font-[500] flex items-center justify-between animate-in fade-in-50 duration-150">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#0066FF] shrink-0" />
            <span>{scanMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setScanMessage(null)}
            className="text-[#94A3B8] hover:text-white text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ─── B. Top Stats Row (4 Metric Cards) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Active Rules */}
        <div className="rounded-[20px] bg-[#121824] border border-[#1E293B] p-5 space-y-1">
          <div className="flex items-center justify-between text-[#94A3B8] text-xs font-[500]">
            <span>Active Alert Rules</span>
            <SlidersHorizontal className="w-4 h-4 text-[#0066FF]" />
          </div>
          <div className="text-2xl sm:text-3xl font-[652] tracking-tight text-white">
            {stats.activeRulesCount}
          </div>
          <p className="text-[11px] text-[#64748B]">Automated monitoring conditions</p>
        </div>

        {/* Metric 2: Triggered Today */}
        <div className="rounded-[20px] bg-[#121824] border border-[#1E293B] p-5 space-y-1">
          <div className="flex items-center justify-between text-[#94A3B8] text-xs font-[500]">
            <span>Triggered Today</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-[652] tracking-tight text-white">
            {stats.triggeredTodayCount}
          </div>
          <p className="text-[11px] text-[#64748B]">Fired in the last 24 hours</p>
        </div>

        {/* Metric 3: High Priority */}
        <div className="rounded-[20px] bg-[#121824] border border-[#1E293B] p-5 space-y-1">
          <div className="flex items-center justify-between text-[#94A3B8] text-xs font-[500]">
            <span>High Priority</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-[652] tracking-tight text-rose-400">
            {stats.highPriorityCount}
          </div>
          <p className="text-[11px] text-[#64748B]">Urgent items awaiting review</p>
        </div>

        {/* Metric 4: Paused / Resolved */}
        <div className="rounded-[20px] bg-[#121824] border border-[#1E293B] p-5 space-y-1">
          <div className="flex items-center justify-between text-[#94A3B8] text-xs font-[500]">
            <span>Resolved / Snoozed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-[652] tracking-tight text-white">
            {stats.pausedResolvedCount}
          </div>
          <p className="text-[11px] text-[#64748B]">Completed executive actions</p>
        </div>
      </div>

      {/* ─── C. Main Content Grid (Two-Column Layout on Desktop) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Main Column (Recent Alerts Timeline) - 7 cols */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-[652] text-white tracking-tight">
                Triggered Alerts Stream
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1E293B] text-[#94A3B8]">
                {alerts.length}
              </span>
            </div>

            <span className="text-[11px] text-[#64748B]">Click any card for AI details & reply</span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center rounded-[24px] bg-[#121824] border border-[#1E293B] space-y-3">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#0066FF]" />
              <p className="text-xs text-[#94A3B8]">Loading active alert queue...</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="p-12 text-center rounded-[24px] bg-[#121824] border border-[#1E293B] space-y-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-[652] text-white">All Clear • No Active Alerts</h3>
              <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
                No alerts match your current filter. Your connected platforms are running within defined thresholds.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleOpenDetail(item)}
                  className={cn(
                    "rounded-[20px] bg-[#121824] border p-4 sm:p-5 transition-all duration-150 cursor-pointer space-y-3 hover:border-[#334155] group relative",
                    item.status === "resolved"
                      ? "opacity-60 border-[#1E293B]"
                      : item.priority === "urgent"
                      ? "border-rose-500/30 hover:border-rose-500/50"
                      : "border-[#1E293B]"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* App Squircle Icon */}
                      <div
                        className="w-10 h-10 flex items-center justify-center bg-[#0B0F17] border border-[#1E293B] shadow-2xs shrink-0 group-hover:scale-105 transition-transform"
                        style={{ borderRadius: "30%" }}
                      >
                        <SocialIcon name={item.app} size={20} className="w-5 h-5 object-contain" />
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                            {item.app}
                          </span>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight",
                              item.priority === "urgent"
                                ? "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                                : item.priority === "high"
                                ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                                : "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                            )}
                          >
                            {item.priority}
                          </span>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize",
                              item.status === "active"
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                                : "bg-[#1E293B] text-[#94A3B8]"
                            )}
                          >
                            {item.status}
                          </span>
                        </div>

                        <h3 className="font-[652] text-sm text-white tracking-tight truncate leading-tight group-hover:text-[#60A5FA] transition-colors">
                          {item.title}
                        </h3>

                        <p className="text-xs text-[#94A3B8] font-[300] line-clamp-2 leading-relaxed">
                          {item.message}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-[10px] text-[#64748B] whitespace-nowrap">
                        {new Date(item.triggered_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>

                      <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100">
                        {item.status === "active" && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResolveAlert(item.id);
                            }}
                            className="p-1 rounded-full text-[#94A3B8] hover:text-emerald-400 hover:bg-[#0B0F17] transition-colors"
                            title="Mark as resolved"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        <ChevronRight className="w-4 h-4 text-[#64748B] group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: AI Suggested Alerts & Active Rules - 5 cols */}
        <div className="lg:col-span-5 space-y-6">
          {/* Section 1: AI Suggested Alerts */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0066FF]" />
                <h2 className="text-base font-[652] text-white tracking-tight">
                  AI Suggested Alert Rules
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1E293B] text-[#94A3B8]">
                gemini-3.5-flash-lite
              </span>
            </div>

            <div className="space-y-2.5">
              {suggestedAlerts.map((sug) => (
                <div
                  key={sug.id}
                  className="rounded-[20px] bg-[#121824] border border-[#1E293B] p-4 space-y-3 hover:border-[#334155] transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 flex items-center justify-center bg-[#0B0F17] border border-[#1E293B] shrink-0"
                        style={{ borderRadius: "30%" }}
                      >
                        <SocialIcon name={sug.app} size={16} className="w-4 h-4 object-contain" />
                      </div>
                      <div>
                        <h4 className="font-[652] text-xs sm:text-sm text-white">{sug.name}</h4>
                        <span className="text-[10px] text-[#0066FF] font-[600]">{sug.badgeText}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddFromTemplate(sug)}
                      className="px-2.5 py-1 rounded-full text-xs font-[600] bg-[#0066FF]/15 text-[#60A5FA] border border-[#0066FF]/20 hover:bg-[#0066FF] hover:text-white transition-all flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Alert</span>
                    </button>
                  </div>

                  <p className="text-xs text-[#94A3B8] font-[300] leading-relaxed">
                    {sug.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Active Rules Management */}
          <div className="space-y-3 pt-2 border-t border-[#1E293B]">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#94A3B8]" />
                <h2 className="text-base font-[652] text-white tracking-tight">
                  Active Monitoring Rules
                </h2>
              </div>
              <span className="text-xs text-[#64748B]">{rules.length} Configured</span>
            </div>

            <div className="space-y-2">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="rounded-[18px] bg-[#121824] border border-[#1E293B] p-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-7 h-7 flex items-center justify-center bg-[#0B0F17] border border-[#1E293B] shrink-0"
                      style={{ borderRadius: "30%" }}
                    >
                      <SocialIcon name={rule.app} size={14} className="w-3.5 h-3.5 object-contain" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-[600] text-white truncate">{rule.name}</p>
                      <span className="text-[10px] text-[#64748B] capitalize">
                        {rule.condition_type} • {rule.priority}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleRule(rule.id, rule.is_active)}
                      className={cn(
                        "text-xs font-[600] p-1 rounded-md transition-colors",
                        rule.is_active ? "text-emerald-400" : "text-[#64748B]"
                      )}
                      title={rule.is_active ? "Rule is active (click to mute)" : "Rule is paused (click to activate)"}
                    >
                      {rule.is_active ? (
                        <ToggleRight className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-[#64748B]" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-1 rounded-md text-[#64748B] hover:text-rose-400 transition-colors"
                      title="Delete rule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Detail & Action Modal ─── */}
      <AlertDetailModal
        alert={selectedAlert}
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onResolve={handleResolveAlert}
        onSnooze={handleSnoozeAlert}
        onRefresh={fetchAlertsData}
      />

      {/* ─── Create Alert Rule Modal ─── */}
      <CreateAlertRuleModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setSelectedTemplate(null);
        }}
        onCreated={fetchAlertsData}
        initialTemplate={selectedTemplate}
      />
    </div>
  );
}
