"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Play,
  Copy,
  Check,
  RefreshCw,
  Terminal,
  Hash,
  Lock,
  MessageSquare,
  Users,
  CornerDownRight,
  Send,
  Layers,
  Sparkles,
  ShieldCheck,
  Trash2,
  CheckCircle2,
  Search,
  ExternalLink,
} from "lucide-react";
import { SocialIcon } from "@/components/icons/AppIcons";
import { McpToolDefinition } from "@/types";
import { cn } from "@/lib/utils";

interface SlackChannel {
  id: string;
  name: string;
  is_private: boolean;
  is_general?: boolean;
  num_members: number;
  topic?: string;
  purpose?: string;
}

interface SlackSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDisconnect: () => void;
  workspaceName?: string | null;
  botId?: string | null;
  lastSync?: string;
  tools: McpToolDefinition[];
}

export function SlackSettingsModal({
  isOpen,
  onClose,
  onDisconnect,
  workspaceName = "Enterprise Workspace",
  botId = "B04A92K1L",
  lastSync = "Just now",
  tools,
}: SlackSettingsModalProps) {
  // Channel state
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>("");
  const [channelSearch, setChannelSearch] = useState("");
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [channelDropdownOpen, setChannelDropdownOpen] = useState(false);
  const [liveMode, setLiveMode] = useState(false);

  // Synced MCP tools state
  const [selectedTool, setSelectedTool] = useState<McpToolDefinition | null>(
    tools[0] || null
  );
  const [toolParams, setToolParams] = useState<Record<string, any>>({});
  const [toolRunning, setToolRunning] = useState(false);
  const [toolOutput, setToolOutput] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [copiedBotId, setCopiedBotId] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Fetch channels from /api/integrations/slack/channels
  const fetchChannels = useCallback(async () => {
    setChannelsLoading(true);
    try {
      const res = await fetch("/api/integrations/slack/channels", {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.channels && Array.isArray(data.channels)) {
          setChannels(data.channels);
          setLiveMode(!!data.live);
          if (data.selectedChannel) {
            setSelectedChannelId(data.selectedChannel);
          } else if (data.channels.length > 0) {
            setSelectedChannelId(data.channels[0].id);
          }
        }
      }
    } catch (err) {
      console.warn("Could not load Slack channels:", err);
    } finally {
      setChannelsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchChannels();
    }
  }, [isOpen, fetchChannels]);

  // Set default parameters when tool or selected channel changes
  useEffect(() => {
    if (!selectedTool) return;

    const initialParams: Record<string, any> = {};
    selectedTool.parameters.forEach((param) => {
      if (param.name === "channel") {
        initialParams[param.name] = selectedChannelId || "C01A2B3C4D";
      } else if (param.default !== undefined) {
        initialParams[param.name] = param.default;
      } else if (param.name === "text") {
        initialParams[param.name] = "Executive briefing digest compiled from autonomous agent triage.";
      } else if (param.name === "thread_ts") {
        initialParams[param.name] = "1729752000.001";
      }
    });

    setToolParams(initialParams);
    setToolOutput(null);
  }, [selectedTool, selectedChannelId]);

  if (!isOpen) return null;

  const activeTool = selectedTool || tools[0] || null;

  // Handle channel change & persist
  const handleSelectChannel = async (channel: SlackChannel) => {
    setSelectedChannelId(channel.id);
    setChannelDropdownOpen(false);

    // Persist choice to backend
    try {
      await fetch("/api/integrations/slack/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: channel.id,
          channelName: channel.name,
        }),
      });
    } catch (e) {
      console.warn("Could not persist channel selection:", e);
    }
  };

  // Run MCP tool
  const handleRunTool = async (tool: McpToolDefinition) => {
    setToolRunning(true);
    setToolOutput(null);

    try {
      const res = await fetch("/api/integrations/slack/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool_name: tool.name,
          arguments: toolParams,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to execute Slack MCP tool");
      }

      setToolOutput(data.result || data);
    } catch (err: any) {
      setToolOutput({
        error: err.message || "Failed to execute Slack MCP tool",
      });
    } finally {
      setToolRunning(false);
    }
  };

  const handleCopyOutput = () => {
    if (!toolOutput) return;
    navigator.clipboard.writeText(JSON.stringify(toolOutput, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyBotId = () => {
    if (!botId) return;
    navigator.clipboard.writeText(botId);
    setCopiedBotId(true);
    setTimeout(() => setCopiedBotId(false), 2000);
  };

  const handleDisconnectClick = async () => {
    setDisconnecting(true);
    try {
      await fetch("/api/integrations/slack/disconnect", { method: "POST" });
      onDisconnect();
      onClose();
    } catch (e) {
      console.error("Disconnect error:", e);
      onDisconnect();
      onClose();
    } finally {
      setDisconnecting(false);
    }
  };

  const getToolIcon = (name: string) => {
    switch (name) {
      case "slack_list_channels":
        return <Layers className="w-3.5 h-3.5" />;
      case "slack_get_channel_history":
        return <MessageSquare className="w-3.5 h-3.5" />;
      case "slack_post_message":
        return <Send className="w-3.5 h-3.5" />;
      case "slack_reply_thread":
        return <CornerDownRight className="w-3.5 h-3.5" />;
      case "slack_list_users":
        return <Users className="w-3.5 h-3.5" />;
      default:
        return <MessageSquare className="w-3.5 h-3.5" />;
    }
  };

  const filteredChannels = channels.filter((ch) =>
    ch.name.toLowerCase().includes(channelSearch.toLowerCase())
  );

  const selectedChannelObj =
    channels.find((c) => c.id === selectedChannelId) || channels[0];

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
                name="slack"
                size={32}
                className="w-8 h-8 object-contain"
                alt="Slack Enterprise"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-[652] text-lg sm:text-xl text-[var(--ink)] tracking-tight">
                  Slack Enterprise
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-[600] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Connected via MCP</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#0066FF]/10 text-[#0066FF] border border-[#0066FF]/20 font-[600]">
                  Slack Web API
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-[300] mt-0.5">
                Executive channel monitoring, automated thread replies, and Model Context Protocol bridge
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[var(--hairline)] bg-[var(--canvas)] hover:bg-[var(--field)] text-[var(--text-muted)] hover:text-[var(--ink)] flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ─── Modal Body ─── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Top Info Banner: Workspace Name, Bot ID & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Workspace Name */}
            <div className="rounded-[18px] bg-[var(--canvas)] border border-[var(--hairline)] p-4 space-y-1">
              <span className="text-[11px] font-[500] text-[var(--text-muted)] block">
                Workspace Name
              </span>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[var(--field)] flex items-center justify-center text-[var(--ink)] font-bold text-xs shrink-0">
                  #
                </div>
                <span className="font-[652] text-sm text-[var(--ink)] truncate" title={workspaceName || "Slack Workspace"}>
                  {workspaceName || "Slack Workspace"}
                </span>
              </div>
              <span className="text-[10px] text-emerald-500 font-[500] flex items-center gap-1 pt-0.5">
                <CheckCircle2 className="w-3 h-3" />
                <span>Enterprise Verified</span>
              </span>
            </div>

            {/* Bot ID */}
            <div className="rounded-[18px] bg-[var(--canvas)] border border-[var(--hairline)] p-4 space-y-1">
              <span className="text-[11px] font-[500] text-[var(--text-muted)] block">
                Bot ID
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-[600] text-[var(--ink)] truncate">
                  {botId || "B04A92K1L"}
                </span>
                <button
                  type="button"
                  onClick={handleCopyBotId}
                  className="px-2 py-0.5 text-[10px] rounded-full bg-[var(--field)] border border-[var(--hairline)] hover:bg-[var(--canvas-soft)] text-[var(--text-muted)] hover:text-[var(--ink)] flex items-center gap-1 transition-colors cursor-pointer"
                  title="Copy Bot ID"
                >
                  {copiedBotId ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span className="text-emerald-500 font-[600]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <span className="text-[10px] text-[var(--text-faint)] block pt-0.5 font-mono">
                Model Context Protocol Agent
              </span>
            </div>

            {/* Ingestion Status & Protocol */}
            <div className="rounded-[18px] bg-[var(--canvas)] border border-[var(--hairline)] p-4 space-y-1">
              <span className="text-[11px] font-[500] text-[var(--text-muted)] block">
                Sync Engine
              </span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="font-[652] text-sm text-[var(--ink)]">
                  Real-time Event API
                </span>
              </div>
              <span className="text-[10px] text-[var(--text-muted)] block pt-0.5">
                Last checked: {lastSync}
              </span>
            </div>
          </div>

          {/* ─── Dynamic Channel Selector (conversations.list) ─── */}
          <div className="rounded-[20px] bg-[var(--canvas)] border border-[var(--hairline)] p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="font-[652] text-sm text-[var(--ink)]">
                    Dynamic Channel Selector
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--field)] text-[var(--text-muted)] border border-[var(--hairline)]">
                    conversations.list
                  </span>
                  {liveMode && (
                    <span className="text-[9px] font-[600] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      Live Workspace
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--text-muted)] font-[300]">
                  Select the primary channel for executive briefings and alert triage.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchChannels}
                disabled={channelsLoading}
                className="px-3 py-1.5 rounded-full text-xs font-[600] bg-[var(--field)] border border-[var(--hairline)] hover:bg-[var(--canvas-soft)] text-[var(--ink)] flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
              >
                <RefreshCw
                  className={cn("w-3 h-3", channelsLoading && "animate-spin text-[#0066FF]")}
                />
                <span>Refresh Channels</span>
              </button>
            </div>

            {/* Selected Channel Bar / Dropdown Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setChannelDropdownOpen(!channelDropdownOpen)}
                className="w-full flex items-center justify-between p-3 rounded-full bg-[var(--field)] border border-[var(--hairline)] hover:border-[var(--ink-soft)]/40 transition-all text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-7 h-7 rounded-full bg-[var(--canvas)] border border-[var(--hairline)] flex items-center justify-center shrink-0 text-[var(--ink)] font-bold text-xs">
                    {selectedChannelObj?.is_private ? (
                      <Lock className="w-3.5 h-3.5 text-amber-500" />
                    ) : (
                      <Hash className="w-3.5 h-3.5 text-[#0066FF]" />
                    )}
                  </div>
                  <div className="truncate">
                    <span className="font-[600] text-xs text-[var(--ink)] mr-2">
                      #{selectedChannelObj?.name || "select-channel"}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      ({selectedChannelObj?.id || selectedChannelId})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline">
                    {selectedChannelObj?.num_members || 0} members
                  </span>
                  <span className="text-xs text-[var(--text-faint)]">▼</span>
                </div>
              </button>

              {/* Channel Dropdown Menu */}
              {channelDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 z-30 rounded-[18px] bg-[var(--canvas)] border border-[var(--hairline)] shadow-xl p-3 space-y-2 animate-in fade-in-50 duration-150">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[var(--text-faint)] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={channelSearch}
                      onChange={(e) => setChannelSearch(e.target.value)}
                      placeholder="Search workspace channels..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-full bg-[var(--field)] border border-transparent focus:border-[var(--hairline)] text-[var(--ink)] placeholder:text-[var(--text-faint)] outline-none"
                    />
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1">
                    {filteredChannels.length === 0 ? (
                      <div className="py-4 text-center text-xs text-[var(--text-muted)]">
                        No channels matching &ldquo;{channelSearch}&rdquo;
                      </div>
                    ) : (
                      filteredChannels.map((channel) => {
                        const isSelected = channel.id === selectedChannelId;
                        return (
                          <div
                            key={channel.id}
                            onClick={() => handleSelectChannel(channel)}
                            className={cn(
                              "flex items-center justify-between p-2.5 rounded-full cursor-pointer transition-colors text-xs",
                              isSelected
                                ? "bg-[var(--primary)] text-[var(--on-primary)] font-[600]"
                                : "hover:bg-[var(--field)] text-[var(--ink)]"
                            )}
                          >
                            <div className="flex items-center gap-2 truncate">
                              {channel.is_private ? (
                                <Lock className="w-3.5 h-3.5 shrink-0 opacity-70" />
                              ) : (
                                <Hash className="w-3.5 h-3.5 shrink-0 opacity-70" />
                              )}
                              <span className="truncate">#{channel.name}</span>
                              <span className="text-[10px] opacity-60 font-mono truncate">
                                {channel.id}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] opacity-70">
                                {channel.num_members} members
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Active Channel Details / Topic */}
            {selectedChannelObj?.topic && (
              <div className="text-[11px] text-[var(--text-muted)] bg-[var(--canvas-soft)] px-3 py-1.5 rounded-full border border-[var(--hairline)] flex items-center gap-2">
                <span className="font-[600] text-[var(--ink)]">Topic:</span>
                <span className="truncate">{selectedChannelObj.topic}</span>
              </div>
            )}
          </div>

          {/* ─── Synced Tools Section (5 Tools) ─── */}
          <div className="rounded-[20px] bg-[var(--canvas)] border border-[var(--hairline)] p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="font-[652] text-sm text-[var(--ink)]">
                    Synced MCP Tools
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-[600] bg-[#0066FF]/10 text-[#0066FF] border border-[#0066FF]/20">
                    5 Tools Active
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] font-[300]">
                  Model Context Protocol tools exposed to autonomous agent workflows.
                </p>
              </div>
            </div>

            {/* Tool Selector Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {tools.map((tool) => {
                const isSelected = activeTool?.name === tool.name;
                return (
                  <button
                    key={tool.name}
                    type="button"
                    onClick={() => setSelectedTool(tool)}
                    className={cn(
                      "p-2.5 rounded-[16px] border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2",
                      isSelected
                        ? "bg-[var(--primary)] text-[var(--on-primary)] border-[var(--primary)] shadow-sm"
                        : "bg-[var(--canvas-soft)] border-[var(--hairline)] text-[var(--ink)] hover:border-[var(--ink-soft)]/30"
                    )}
                  >
                    <div className="flex items-center justify-between gap-1 w-full">
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs",
                          isSelected
                            ? "bg-[var(--on-primary)]/10 text-[var(--on-primary)]"
                            : "bg-[var(--field)] text-[#0066FF]"
                        )}
                      >
                        {getToolIcon(tool.name)}
                      </div>
                      <span
                        className={cn(
                          "text-[9px] uppercase font-mono px-1.5 py-0.2 rounded-full font-[600]",
                          isSelected
                            ? "bg-[var(--on-primary)]/20 text-[var(--on-primary)]"
                            : "bg-[var(--field)] text-[var(--text-muted)]"
                        )}
                      >
                        {tool.category}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="font-mono text-[10px] font-[600] block truncate">
                        {tool.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Tool Interactive Sandbox / Test Drawer */}
            {activeTool && (
              <div className="rounded-[18px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-4 sm:p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h5 className="font-[652] text-sm text-[var(--ink)]">
                        {activeTool.title}
                      </h5>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[var(--field)] text-[#0066FF] border border-[var(--hairline)]">
                        {activeTool.name}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] font-[300]">
                      {activeTool.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRunTool(activeTool)}
                    disabled={toolRunning}
                    className="px-3.5 py-1.5 rounded-full text-xs font-[600] bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 flex items-center gap-1.5 cursor-pointer shrink-0 transition-opacity disabled:opacity-50"
                  >
                    {toolRunning ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Running...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Test Tool</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Tool Input Parameters */}
                {activeTool.parameters && activeTool.parameters.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[var(--hairline)]">
                    <span className="text-[11px] font-[600] text-[var(--ink)] block">
                      Tool Arguments:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeTool.parameters.map((param) => (
                        <div key={param.name} className="space-y-1">
                          <label className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                            <span className="font-mono font-[600] text-[var(--ink)]">
                              {param.name}
                            </span>
                            {param.required && (
                              <span className="text-rose-500 font-bold">*</span>
                            )}
                            <span className="text-[10px] text-[var(--text-faint)]">
                              ({param.type})
                            </span>
                          </label>
                          <input
                            type="text"
                            value={toolParams[param.name] ?? ""}
                            onChange={(e) =>
                              setToolParams((prev) => ({
                                ...prev,
                                [param.name]: e.target.value,
                              }))
                            }
                            placeholder={param.description}
                            className="w-full px-3 py-1.5 text-xs rounded-full bg-[var(--field)] border border-transparent focus:border-[var(--hairline)] text-[var(--ink)] placeholder:text-[var(--text-faint)] outline-none transition-all font-mono"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* MCP Output Console */}
                {toolOutput && (
                  <div className="space-y-2 pt-2 border-t border-[var(--hairline)]">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-[var(--text-muted)] font-mono">
                        <Terminal className="w-3.5 h-3.5 text-[#0066FF]" />
                        <span>MCP Execution Output</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyOutput}
                        className="px-2.5 py-1 rounded-full bg-[var(--field)] border border-[var(--hairline)] hover:bg-[var(--canvas)] text-[10px] text-[var(--ink)] flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-500 font-[600]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy JSON</span>
                          </>
                        )}
                      </button>
                    </div>

                    <pre className="p-3.5 rounded-[16px] bg-[var(--canvas)] border border-[var(--hairline)] font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-48 leading-relaxed">
                      {JSON.stringify(toolOutput, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ─── Modal Footer: Disconnect & Close ─── */}
        <div className="p-4 sm:p-5 border-t border-[var(--hairline)] bg-[var(--canvas)] flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleDisconnectClick}
            disabled={disconnecting}
            className="px-4 py-2 rounded-full text-xs font-[600] border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            {disconnecting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Disconnecting Slack...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Disconnect Workspace</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full text-xs font-[600] bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
