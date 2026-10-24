"use client";

import React, { useState } from "react";
import {
  X,
  Play,
  Copy,
  Check,
  RefreshCw,
  Terminal,
  Calendar,
  Clock,
  Globe,
  Mail,
  Shield,
  Video,
  CheckCircle2,
  Trash2,
  CalendarDays,
  PlusCircle,
  FileEdit,
  Search,
} from "lucide-react";
import { SocialIcon } from "@/components/icons/AppIcons";
import { McpToolDefinition } from "@/types";
import { cn } from "@/lib/utils";

interface GoogleCalendarSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDisconnect: () => void;
  accountEmail?: string | null;
  timezone?: string;
  lastSync?: string;
  tools: McpToolDefinition[];
  initialPermissions?: {
    read_access: boolean;
    event_creation: boolean;
    auto_scheduling: boolean;
  };
}

export function GoogleCalendarSettingsModal({
  isOpen,
  onClose,
  onDisconnect,
  accountEmail = "sushant98k@gmail.com",
  timezone = "Asia/Kolkata",
  lastSync = "Just now",
  tools,
  initialPermissions = {
    read_access: true,
    event_creation: true,
    auto_scheduling: true,
  },
}: GoogleCalendarSettingsModalProps) {
  const [selectedTool, setSelectedTool] = useState<McpToolDefinition | null>(
    tools[0] || null
  );
  const [toolParams, setToolParams] = useState<Record<string, any>>({});
  const [toolRunning, setToolRunning] = useState(false);
  const [toolOutput, setToolOutput] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Permission toggles state
  const [permissions, setPermissions] = useState(initialPermissions);
  const [savingPermissions, setSavingPermissions] = useState(false);

  if (!isOpen) return null;

  const activeTool = selectedTool || tools[0] || null;

  const handleTogglePermission = async (key: keyof typeof permissions) => {
    const updated = {
      ...permissions,
      [key]: !permissions[key],
    };
    setPermissions(updated);
    setSavingPermissions(true);

    try {
      await fetch("/api/integrations/calendar/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_permissions",
          permissions: updated,
        }),
      });
    } catch (e) {
      console.warn("Failed to persist calendar permissions:", e);
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleDisconnectClick = async () => {
    setDisconnecting(true);
    try {
      await onDisconnect();
      onClose();
    } finally {
      setDisconnecting(false);
    }
  };

  const handleRunTool = async (tool: McpToolDefinition) => {
    setToolRunning(true);
    setToolOutput(null);

    try {
      const res = await fetch("/api/integrations/calendar/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "call_tool",
          tool_name: tool.name,
          arguments: toolParams,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to execute Google Calendar MCP tool");
      }

      setToolOutput(data.result?.mcpOutput || data);
    } catch (err: any) {
      setToolOutput({
        error: err.message || "Failed to execute Google Calendar MCP tool",
      });
    } finally {
      setToolRunning(false);
    }
  };

  const handleCopy = () => {
    if (!toolOutput) return;
    navigator.clipboard.writeText(JSON.stringify(toolOutput, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getToolIcon = (name: string) => {
    switch (name) {
      case "list_calendars":
        return <Calendar className="w-3.5 h-3.5" />;
      case "list_events":
        return <CalendarDays className="w-3.5 h-3.5" />;
      case "create_event":
        return <PlusCircle className="w-3.5 h-3.5" />;
      case "update_event":
        return <FileEdit className="w-3.5 h-3.5" />;
      case "delete_event":
        return <Trash2 className="w-3.5 h-3.5" />;
      case "check_availability":
        return <Search className="w-3.5 h-3.5" />;
      default:
        return <Calendar className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Surface */}
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[var(--canvas-soft)] border border-[var(--hairline)] rounded-[24px] shadow-2xl flex flex-col z-10 overflow-hidden transition-colors animate-in zoom-in-95 duration-150">
        {/* ─── Modal Header ─── */}
        <div className="p-5 sm:p-6 border-b border-[var(--hairline)] bg-[var(--canvas)] flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 flex items-center justify-center bg-[var(--canvas-soft)] border border-[var(--hairline)] p-2 shrink-0 shadow-xs"
              style={{ borderRadius: "30%" }}
            >
              <SocialIcon
                name="gcal"
                size={32}
                className="w-8 h-8 object-contain"
                alt="Google Calendar & Meet"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-[652] text-lg sm:text-xl text-[var(--ink)] tracking-tight">
                  Google Calendar & Meet
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-[600] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Connected via MCP</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#0066FF]/10 text-[#0066FF] border border-[#0066FF]/20 font-[600]">
                  Calendar API v3
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-[300] mt-0.5">
                Autonomous calendar synchronization, video meet scheduling, and attendee dossier intelligence
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

        {/* ─── Scrollable Modal Body ─── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* 1. Account Info & Connection Status Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Primary Email */}
            <div className="p-3.5 rounded-[18px] bg-[var(--canvas)] border border-[var(--hairline)] flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[var(--field)] border border-[var(--hairline)] flex items-center justify-center shrink-0 text-[var(--ink)]">
                <Mail className="w-4 h-4 text-[#0066FF]" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase tracking-wider font-[600] text-[var(--text-muted)] block">
                  Primary Account
                </span>
                <p className="text-xs font-[600] text-[var(--ink)] truncate" title={accountEmail || ""}>
                  {accountEmail || "sushant98k@gmail.com"}
                </p>
              </div>
            </div>

            {/* Timezone */}
            <div className="p-3.5 rounded-[18px] bg-[var(--canvas)] border border-[var(--hairline)] flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[var(--field)] border border-[var(--hairline)] flex items-center justify-center shrink-0 text-[var(--ink)]">
                <Globe className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase tracking-wider font-[600] text-[var(--text-muted)] block">
                  Timezone
                </span>
                <p className="text-xs font-[600] text-[var(--ink)] truncate">
                  {timezone || "Asia/Kolkata"}
                </p>
              </div>
            </div>

            {/* Connection Status & Last Synced */}
            <div className="p-3.5 rounded-[18px] bg-[var(--canvas)] border border-[var(--hairline)] flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-500">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase tracking-wider font-[600] text-[var(--text-muted)] block">
                  Status & Last Synced
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-[600] text-emerald-600 dark:text-emerald-400">
                    Active
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    · {lastSync}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Permission Toggles Section */}
          <div className="p-4 sm:p-5 rounded-[20px] bg-[var(--canvas)] border border-[var(--hairline)] space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#0066FF]" />
                <h4 className="font-[652] text-xs sm:text-sm text-[var(--ink)]">
                  Autonomous Permission Controls
                </h4>
              </div>
              {savingPermissions && (
                <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 font-mono">
                  <RefreshCw className="w-3 h-3 animate-spin text-[#0066FF]" />
                  Saving...
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Read Access Toggle */}
              <div className="p-3 rounded-[14px] bg-[var(--field)] flex items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <p className="text-xs font-[600] text-[var(--ink)]">Read access</p>
                  <p className="text-[11px] text-[var(--text-muted)] font-[300] line-clamp-1">
                    Query schedule and events
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePermission("read_access")}
                  className={cn(
                    "w-10 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 focus:outline-none p-0.5",
                    permissions.read_access
                      ? "bg-[#0066FF]"
                      : "bg-[var(--canvas)] border border-[var(--hairline)]"
                  )}
                >
                  <span
                    className={cn(
                      "w-4 h-4 rounded-full bg-white shadow-xs block transition-transform",
                      permissions.read_access ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {/* Event Creation Toggle */}
              <div className="p-3 rounded-[14px] bg-[var(--field)] flex items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <p className="text-xs font-[600] text-[var(--ink)]">Event creation</p>
                  <p className="text-[11px] text-[var(--text-muted)] font-[300] line-clamp-1">
                    Book meetings & Meet links
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePermission("event_creation")}
                  className={cn(
                    "w-10 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 focus:outline-none p-0.5",
                    permissions.event_creation
                      ? "bg-[#0066FF]"
                      : "bg-[var(--canvas)] border border-[var(--hairline)]"
                  )}
                >
                  <span
                    className={cn(
                      "w-4 h-4 rounded-full bg-white shadow-xs block transition-transform",
                      permissions.event_creation ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {/* Auto-scheduling Toggle */}
              <div className="p-3 rounded-[14px] bg-[var(--field)] flex items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <p className="text-xs font-[600] text-[var(--ink)]">Auto-scheduling</p>
                  <p className="text-[11px] text-[var(--text-muted)] font-[300] line-clamp-1">
                    Conflict clash resolution
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePermission("auto_scheduling")}
                  className={cn(
                    "w-10 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 focus:outline-none p-0.5",
                    permissions.auto_scheduling
                      ? "bg-[#0066FF]"
                      : "bg-[var(--canvas)] border border-[var(--hairline)]"
                  )}
                >
                  <span
                    className={cn(
                      "w-4 h-4 rounded-full bg-white shadow-xs block transition-transform",
                      permissions.auto_scheduling ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* 3. Available MCP Tools List & Interactive Runner */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Tool Selection Sidebar */}
            <div className="md:col-span-5 space-y-2">
              <div className="flex items-center justify-between pb-1">
                <span className="text-[11px] font-[600] uppercase tracking-wider text-[var(--text-muted)] block">
                  Available MCP Tools ({tools.length})
                </span>
                <span className="text-[10px] text-[var(--text-faint)] font-mono">
                  protocol: mcp/1.0
                </span>
              </div>

              <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
                {tools.map((tool) => {
                  const isSelected = activeTool?.name === tool.name;
                  return (
                    <div
                      key={tool.name}
                      onClick={() => {
                        setSelectedTool(tool);
                        setToolOutput(null);
                        setToolParams({});
                      }}
                      className={cn(
                        "p-3 rounded-[16px] border text-left cursor-pointer transition-all",
                        isSelected
                          ? "bg-[var(--canvas)] border-[var(--ink)] shadow-xs"
                          : "bg-[var(--canvas)]/60 border-[var(--hairline)] hover:bg-[var(--canvas)]"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[#0066FF] shrink-0">
                            {getToolIcon(tool.name)}
                          </span>
                          <code className="text-xs font-mono font-semibold text-[var(--ink)] truncate">
                            {tool.name}
                          </code>
                        </div>
                        <span
                          className={cn(
                            "text-[9px] font-mono px-2 py-0.5 rounded-full font-[600] uppercase shrink-0",
                            tool.category === "read"
                              ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20"
                              : tool.category === "write"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                              : tool.category === "manage"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                              : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                          )}
                        >
                          {tool.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] font-[300] mt-1 line-clamp-2">
                        {tool.description}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-[var(--text-faint)]">
                        <span>{tool.parameters.length} parameters</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Tool Details & Interactive Tester */}
            <div className="md:col-span-7 space-y-4">
              {activeTool ? (
                <div className="space-y-4">
                  {/* Tool Specification Card */}
                  <div className="p-4 rounded-[20px] bg-[var(--canvas)] border border-[var(--hairline)] space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono font-[700] text-[var(--ink)]">
                            {activeTool.name}
                          </code>
                          <span
                            className={cn(
                              "text-[9px] font-mono px-2 py-0.5 rounded-full font-[600] uppercase",
                              activeTool.category === "read"
                                ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20"
                                : activeTool.category === "write"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                : activeTool.category === "manage"
                                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                                : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                            )}
                          >
                            {activeTool.category}
                          </span>
                        </div>
                        <h4 className="font-[652] text-xs text-[var(--ink)] mt-1">
                          {activeTool.title}
                        </h4>
                      </div>
                    </div>

                    <p className="text-xs text-[var(--text-muted)] font-[300] leading-relaxed">
                      {activeTool.description}
                    </p>

                    {/* Parameters Schema */}
                    <div className="space-y-2 pt-2 border-t border-[var(--hairline)]">
                      <span className="text-[11px] font-[600] text-[var(--ink)] block">
                        Parameters ({activeTool.parameters.length})
                      </span>
                      {activeTool.parameters.length === 0 ? (
                        <p className="text-xs text-[var(--text-faint)] italic">
                          This tool takes no parameters.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {activeTool.parameters.map((param) => (
                            <div
                              key={param.name}
                              className="p-2.5 rounded-[12px] bg-[var(--field)] text-xs space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono font-[600] text-[var(--ink)]">
                                  {param.name}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-[10px] text-[var(--text-muted)]">
                                    {param.type}
                                  </span>
                                  {param.required ? (
                                    <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-rose-500/10 text-rose-600 dark:text-rose-400 font-[600]">
                                      Required
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-[var(--canvas)] text-[var(--text-faint)] font-[500]">
                                      Optional
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="text-[11px] text-[var(--text-muted)] font-[300]">
                                {param.description}
                              </p>

                              {/* Input field */}
                              <div className="pt-1">
                                {param.name === "description" ? (
                                  <textarea
                                    value={toolParams[param.name] ?? ""}
                                    onChange={(e) =>
                                      setToolParams((prev) => ({
                                        ...prev,
                                        [param.name]: e.target.value,
                                      }))
                                    }
                                    placeholder={`Enter ${param.name}...`}
                                    rows={2}
                                    className="w-full px-3 py-1.5 text-xs rounded-[10px] bg-[var(--canvas)] text-[var(--ink)] border border-[var(--hairline)] focus:outline-none focus:border-[var(--ink)] font-mono"
                                  />
                                ) : (
                                  <input
                                    type={param.type === "number" ? "number" : "text"}
                                    value={
                                      toolParams[param.name] ??
                                      (param.default !== undefined ? String(param.default) : "")
                                    }
                                    onChange={(e) =>
                                      setToolParams((prev) => ({
                                        ...prev,
                                        [param.name]:
                                          param.type === "number"
                                            ? Number(e.target.value)
                                            : e.target.value,
                                      }))
                                    }
                                    placeholder={
                                      param.default !== undefined
                                        ? `Default: ${param.default}`
                                        : `Enter ${param.name}...`
                                    }
                                    className="w-full px-3 py-1.5 text-xs rounded-full bg-[var(--canvas)] text-[var(--ink)] border border-[var(--hairline)] focus:outline-none focus:border-[var(--ink)] font-mono"
                                  />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Run Tool Button */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => handleRunTool(activeTool)}
                        disabled={toolRunning}
                        className="w-full py-2.5 rounded-full bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 font-[600] text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        {toolRunning ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Invoking {activeTool.name} via MCP...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Execute MCP Tool ({activeTool.name})</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Tool Execution Result / Inspector */}
                  <div className="p-4 rounded-[20px] bg-[var(--canvas)] border border-[var(--hairline)] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-[600] text-[var(--ink)] flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-[#0066FF]" />
                        <span>MCP Output Inspector</span>
                      </span>
                      {toolOutput && (
                        <button
                          type="button"
                          onClick={handleCopy}
                          className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[var(--field)] hover:bg-[var(--canvas-soft)] text-[var(--text-muted)] hover:text-[var(--ink)] flex items-center gap-1 transition-all"
                        >
                          {copied ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copied ? "Copied" : "Copy JSON"}</span>
                        </button>
                      )}
                    </div>

                    <pre className="p-3.5 rounded-[14px] bg-[var(--field)] text-[11px] font-mono text-[var(--ink)] max-h-52 overflow-y-auto leading-relaxed">
                      {toolOutput
                        ? JSON.stringify(toolOutput, null, 2)
                        : JSON.stringify(
                            {
                              status: "READY",
                              mcpProtocol: "mcp/1.0",
                              tool: activeTool.name,
                              description: activeTool.description,
                              targetPlatform: "Google Calendar & Meet",
                            },
                            null,
                            2
                          )}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--hairline)] rounded-[20px]">
                  Select an MCP tool from the list to view its schema and execute.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Modal Footer ─── */}
        <div className="px-6 py-3.5 border-t border-[var(--hairline)] bg-[var(--canvas)] flex items-center justify-between text-xs text-[var(--text-muted)] shrink-0">
          <button
            type="button"
            onClick={handleDisconnectClick}
            disabled={disconnecting}
            className="text-[11px] text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 font-[500] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {disconnecting ? "Disconnecting..." : "Disconnect Platform"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-[var(--canvas-soft)] text-[var(--ink)] border border-[var(--hairline)] hover:bg-[var(--field)] transition-all font-[600] cursor-pointer"
          >
            Close Dialog
          </button>
        </div>
      </div>
    </div>
  );
}
