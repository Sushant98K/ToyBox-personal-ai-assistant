"use client";

import React, { useState } from "react";
import {
  X,
  Play,
  Copy,
  Check,
  RefreshCw,
  Terminal,
  Power,
  Pencil,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Send,
  Search,
  Users,
  UserCheck,
  Clock,
  Sparkles,
  Shield,
  Layers,
  FileText,
  Sliders,
} from "lucide-react";
import { SocialIcon } from "@/components/icons/AppIcons";
import { McpToolDefinition } from "@/types";
import { cn } from "@/lib/utils";

interface WhatsAppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDisconnect: () => void;
  onReconnect: () => void;
  phoneNumber?: string;
  tools: McpToolDefinition[];
}

export function WhatsAppSettingsModal({
  isOpen,
  onClose,
  onDisconnect,
  onReconnect,
  phoneNumber = "+91 9768368524",
  tools,
}: WhatsAppSettingsModalProps) {
  const displayPhone =
    phoneNumber && phoneNumber !== "+1 555 123 4567" && phoneNumber.trim().length > 0
      ? phoneNumber
      : "+91 9768368524";

  const [selectedTool, setSelectedTool] = useState<McpToolDefinition | null>(
    tools[0] || null
  );
  const [toolParams, setToolParams] = useState<Record<string, any>>({});
  const [toolRunning, setToolRunning] = useState(false);
  const [toolOutput, setToolOutput] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [syncMessages, setSyncMessages] = useState(true);
  const [isSyncUpdating, setIsSyncUpdating] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  // Fallback active tool if selectedTool is unselected
  const activeTool = selectedTool || tools[0] || null;

  if (!isOpen) return null;

  const handleToggleSync = async () => {
    const nextVal = !syncMessages;
    setSyncMessages(nextVal);
    setIsSyncUpdating(true);
    try {
      await fetch("/api/integrations/whatsapp/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_sync",
          syncMessages: nextVal,
        }),
      });
    } catch (e) {
      console.warn("Failed updating sync messages preference:", e);
    } finally {
      setIsSyncUpdating(false);
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

  const handleReconnectClick = async () => {
    setReconnecting(true);
    try {
      await onReconnect();
    } finally {
      setReconnecting(false);
    }
  };

  const handleRunTool = async (tool: McpToolDefinition) => {
    setToolRunning(true);
    setToolOutput(null);

    try {
      const res = await fetch("/api/integrations/whatsapp/mcp", {
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
        throw new Error(data.error || "Failed to execute MCP tool");
      }

      setToolOutput(data.result?.mcpOutput || data);
    } catch (err: any) {
      setToolOutput({ error: err.message || "Failed to execute WhatsApp MCP tool" });
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
    if (name.includes("send_message") || name.includes("send_group")) {
      return <Send className="w-3.5 h-3.5" />;
    }
    if (name.includes("search")) {
      return <Search className="w-3.5 h-3.5" />;
    }
    if (name.includes("group")) {
      return <Users className="w-3.5 h-3.5" />;
    }
    if (name.includes("contact")) {
      return <UserCheck className="w-3.5 h-3.5" />;
    }
    if (name.includes("summarize")) {
      return <Sparkles className="w-3.5 h-3.5" />;
    }
    if (name.includes("alert")) {
      return <AlertCircle className="w-3.5 h-3.5" />;
    }
    if (name.includes("recent") || name.includes("history")) {
      return <Clock className="w-3.5 h-3.5" />;
    }
    return <MessageSquare className="w-3.5 h-3.5" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
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
                name="whatsapp"
                size={30}
                className="w-7 h-7 object-contain"
                alt="WhatsApp"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-[652] text-lg sm:text-xl text-[var(--ink)] tracking-tight">
                  WhatsApp Integration Settings
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-[600] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Baileys Multi-Device Connected</span>
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-[300] mt-0.5">
                Manage your WhatsApp connection, Baileys session parameters, and test available MCP tools
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

        {/* ─── Modal Content (Scrollable) ─── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Section 1: Connection & Session Status Box (Matching diagram Section 3) */}
          <div className="p-4 sm:p-5 rounded-[22px] bg-[var(--canvas)] border border-[var(--hairline)] space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-[var(--hairline)]">
              <span className="text-xs font-[600] uppercase tracking-wider text-[var(--text-muted)]">
                Connection Parameters
              </span>
              <span className="text-[11px] font-mono text-[var(--text-faint)]">
                Engine: Baileys Web v7.0
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
              {/* Phone number */}
              <div className="p-3 rounded-[16px] bg-[var(--field)] border border-[var(--hairline-soft)] flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[var(--text-muted)] block">Phone Number</span>
                  <span className="font-mono font-[600] text-[var(--ink)] mt-0.5 block">
                    {displayPhone}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onReconnect}
                  className="p-1.5 rounded-full hover:bg-[var(--canvas)] text-[var(--text-faint)] hover:text-[var(--ink)] transition-colors"
                  title="Change Phone Number"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Connection Status */}
              <div className="p-3 rounded-[16px] bg-[var(--field)] border border-[var(--hairline-soft)] flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[var(--text-muted)] block">Connection Status</span>
                  <span className="font-[600] text-emerald-600 dark:text-emerald-400 mt-0.5 inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Connected</span>
                  </span>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>

              {/* Session active */}
              <div className="p-3 rounded-[16px] bg-[var(--field)] border border-[var(--hairline-soft)] flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[var(--text-muted)] block">Session Active</span>
                  <span className="font-[600] text-[var(--ink)] mt-0.5 block">
                    Yes (Multi-Device)
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-sky-500/10 text-sky-600 dark:text-sky-400 font-mono font-[600]">
                  Active
                </span>
              </div>
            </div>

            {/* Quick Actions Strip: Reconnect, Disconnect, Sync Messages, Tool Permissions */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--hairline)] text-xs">
              <div className="flex items-center gap-4">
                {/* Sync Messages Toggle */}
                <div className="flex items-center gap-2">
                  <span className="font-[500] text-[var(--ink)]">Sync messages</span>
                  <button
                    type="button"
                    onClick={handleToggleSync}
                    disabled={isSyncUpdating}
                    className={cn(
                      "w-10 h-5 rounded-full transition-colors relative cursor-pointer focus:outline-none",
                      syncMessages ? "bg-emerald-500" : "bg-[var(--raised)] border border-[var(--hairline)]"
                    )}
                  >
                    <span
                      className={cn(
                        "w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 shadow-xs",
                        syncMessages ? "left-5" : "left-0.5"
                      )}
                    />
                  </button>
                </div>

                {/* Tool Permissions Pill */}
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                  <Shield className="w-3.5 h-3.5 text-[#0066FF]" />
                  <span>Permissions:</span>
                  <span className="px-2 py-0.5 rounded-full bg-[var(--field)] font-[600] text-[var(--ink)]">
                    Full AI Access
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Reconnect button */}
                <button
                  type="button"
                  onClick={handleReconnectClick}
                  disabled={reconnecting}
                  className="px-3.5 py-1.5 rounded-full bg-[var(--field)] hover:bg-[var(--raised)] border border-[var(--hairline)] text-[var(--ink)] font-[600] text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={cn("w-3 h-3", reconnecting && "animate-spin text-[#0066FF]")} />
                  <span>Reconnect</span>
                </button>

                {/* Disconnect button */}
                <button
                  type="button"
                  onClick={handleDisconnectClick}
                  disabled={disconnecting}
                  className="px-3.5 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-[600] text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Power className="w-3 h-3" />
                  <span>Disconnect</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Available MCP Tools for WhatsApp (Matching diagram Section 4) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-[652] text-sm text-[var(--ink)]">
                  Available MCP Tools for WhatsApp
                </h4>
                <p className="text-xs text-[var(--text-muted)] font-[300]">
                  Exposed to autonomous AI agents for reading chats, sending messages, summarizing, and triage
                </p>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-[var(--field)] text-[var(--text-muted)] border border-[var(--hairline)]">
                {tools.length} Tools Ready
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Tool Selector List */}
              <div className="md:col-span-5 space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
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
                        "p-3 rounded-[16px] border text-left cursor-pointer transition-all flex items-start gap-3",
                        isSelected
                          ? "bg-[var(--canvas)] border-[var(--ink)] shadow-xs"
                          : "bg-[var(--canvas)]/60 border-[var(--hairline)] hover:bg-[var(--canvas)]"
                      )}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                          isSelected
                            ? "bg-[var(--ink)] text-[var(--canvas)]"
                            : "bg-[var(--field)] text-[var(--text-muted)]"
                        )}
                      >
                        {getToolIcon(tool.name)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-[652] text-xs text-[var(--ink)] truncate">
                            {tool.title}
                          </span>
                          <span
                            className={cn(
                              "text-[9px] font-mono px-1.5 py-0.2 rounded-full font-[600] uppercase shrink-0",
                              tool.category === "read"
                                ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                                : tool.category === "write"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                            )}
                          >
                            {tool.category}
                          </span>
                        </div>
                        <code className="text-[10px] font-mono text-[var(--text-faint)] block truncate mt-0.5">
                          {tool.name}
                        </code>
                        <p className="text-[11px] text-[var(--text-muted)] font-[300] mt-1 line-clamp-2">
                          {tool.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tool Execution Inspector */}
              <div className="md:col-span-7 space-y-4">
                {activeTool ? (
                  <div className="space-y-4">
                    {/* Tool Spec & Inputs */}
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

                      {/* Parameters Form */}
                      <div className="space-y-2 pt-2 border-t border-[var(--hairline)]">
                        <span className="text-[11px] font-[600] text-[var(--ink)] block">
                          Parameters ({activeTool.parameters.length})
                        </span>

                        {activeTool.parameters.length === 0 ? (
                          <p className="text-xs text-[var(--text-faint)] italic">
                            This tool requires no input arguments.
                          </p>
                        ) : (
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {activeTool.parameters.map((param) => (
                              <div
                                key={param.name}
                                className="p-2.5 rounded-[12px] bg-[var(--field)] text-xs space-y-1"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono font-[600] text-[var(--ink)]">
                                    {param.name}
                                  </span>
                                  <span className="font-mono text-[10px] text-[var(--text-muted)]">
                                    {param.type}
                                    {param.required && (
                                      <span className="text-rose-500 ml-1 font-[600]">*</span>
                                    )}
                                  </span>
                                </div>
                                <p className="text-[11px] text-[var(--text-muted)] font-[300]">
                                  {param.description}
                                </p>

                                <div className="pt-1">
                                  {param.name === "message" ? (
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
                                      value={toolParams[param.name] ?? (param.default ?? "")}
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

                      {/* Run Button */}
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
                              <span>Invoking {activeTool.name} via Baileys...</span>
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

                    {/* Output Inspector */}
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
                            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            <span>{copied ? "Copied" : "Copy JSON"}</span>
                          </button>
                        )}
                      </div>

                      <pre className="p-3.5 rounded-[14px] bg-[var(--field)] text-[11px] font-mono text-[var(--ink)] max-h-48 overflow-y-auto leading-relaxed">
                        {toolOutput
                          ? JSON.stringify(toolOutput, null, 2)
                          : JSON.stringify(
                              activeTool.sampleOutput || {
                                status: "READY",
                                protocol: "mcp/1.0",
                                tool: activeTool.name,
                                description: activeTool.description,
                              },
                              null,
                              2
                            )}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--hairline)] rounded-[20px]">
                    Select a tool from the left to view its parameters and execute.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Modal Footer ─── */}
        <div className="px-6 py-3.5 border-t border-[var(--hairline)] bg-[var(--canvas)] flex items-center justify-between text-xs text-[var(--text-muted)] shrink-0">
          <button
            type="button"
            onClick={handleDisconnectClick}
            disabled={disconnecting}
            className="text-[11px] text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 font-[500] transition-colors"
          >
            {disconnecting ? "Disconnecting..." : "Disconnect WhatsApp"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 transition-all font-[600] text-xs shadow-xs cursor-pointer"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
}
