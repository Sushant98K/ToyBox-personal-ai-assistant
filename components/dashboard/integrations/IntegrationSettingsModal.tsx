"use client";

import React, { useState } from "react";
import {
  X,
  Code2,
  Terminal,
  Play,
  Key,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Mail,
  Send,
  Sparkles,
  Inbox,
  Shield,
  Layers,
} from "lucide-react";
import { SocialIcon } from "@/components/icons/AppIcons";
import { IntegrationPlatform, McpToolDefinition } from "@/types";
import { cn } from "@/lib/utils";

interface IntegrationSettingsModalProps {
  platform: IntegrationPlatform | null;
  isOpen: boolean;
  onClose: () => void;
  onDisconnect: (platformId: string) => void;
  accountEmail?: string | null;
  lastSync?: string;
  throughput?: string;
}

export function IntegrationSettingsModal({
  platform,
  isOpen,
  onClose,
  onDisconnect,
  accountEmail,
  lastSync,
  throughput,
}: IntegrationSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"tools" | "inbox" | "credentials">("tools");
  const [selectedTool, setSelectedTool] = useState<McpToolDefinition | null>(
    platform?.mcpTools?.[0] || null
  );
  const [toolParams, setToolParams] = useState<Record<string, any>>({});
  const [toolRunning, setToolRunning] = useState(false);
  const [toolOutput, setToolOutput] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Inbox test state
  const [isFetchingInbox, setIsFetchingInbox] = useState(false);
  const [inboxMessages, setInboxMessages] = useState<any[]>([]);
  const [selectedInboxMsg, setSelectedInboxMsg] = useState<any>(null);

  // Manual credentials form state
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [isSavingCreds, setIsSavingCreds] = useState(false);
  const [credsSavedSuccess, setCredsSavedSuccess] = useState(false);

  if (!isOpen || !platform) return null;

  // Initialize selected tool when platform changes
  const tools = platform.mcpTools || [];
  const activeTool = selectedTool || tools[0] || null;

  const handleRunTool = async (tool: McpToolDefinition) => {
    setToolRunning(true);
    setToolOutput(null);

    try {
      if (platform.id === "gmail") {
        const res = await fetch("/api/integrations/gmail/mcp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "call_tool",
            tool_name: tool.name,
            arguments: toolParams,
          }),
        });
        const data = await res.json();
        setToolOutput(data.result?.mcpOutput || data);
      } else {
        // Simulated execution for other MCP endpoints
        await new Promise((resolve) => setTimeout(resolve, 600));
        setToolOutput({
          content: [
            {
              type: "text",
              text: `Tool '${tool.name}' executed successfully on ${platform.name} MCP bridge.`,
            },
            {
              type: "json",
              status: "SUCCESS",
              argumentsProvided: toolParams,
              sampleResult: tool.sampleOutput || { message: "Action accepted by MCP server" },
              executedAt: new Date().toISOString(),
            },
          ],
        });
      }
    } catch (err: any) {
      setToolOutput({ error: err.message || "Failed to execute tool" });
    } finally {
      setToolRunning(false);
    }
  };

  const handleFetchInbox = async () => {
    setIsFetchingInbox(true);
    try {
      const res = await fetch("/api/integrations/gmail/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync_inbox" }),
      });
      const data = await res.json();
      if (data.messages) {
        setInboxMessages(data.messages);
        setSelectedInboxMsg(data.messages[0]);
      }
    } catch (err) {
      console.warn("Failed to fetch inbox:", err);
    } finally {
      setIsFetchingInbox(false);
    }
  };

  const handleSaveCredentials = async () => {
    setIsSavingCreds(true);
    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platformId: platform.id,
          status: "connected",
          credentials: {
            clientId: clientId.trim() || undefined,
            clientSecret: clientSecret.trim() || undefined,
            refreshToken: refreshToken.trim() || undefined,
            updatedAt: new Date().toISOString(),
          },
        }),
      });
      if (res.ok) {
        setCredsSavedSuccess(true);
        setTimeout(() => setCredsSavedSuccess(false), 2500);
      }
    } catch (e) {
      console.warn("Credentials save error:", e);
    } finally {
      setIsSavingCreds(false);
    }
  };

  const handleCopy = () => {
    if (!toolOutput) return;
    navigator.clipboard.writeText(JSON.stringify(toolOutput, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Surface */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[var(--canvas-soft)] border border-[var(--hairline)] rounded-[24px] shadow-2xl flex flex-col z-10 overflow-hidden transition-colors animate-in zoom-in-95 duration-150">
        {/* ─── Modal Header ─── */}
        <div className="p-5 sm:p-6 border-b border-[var(--hairline)] bg-[var(--canvas)] flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 flex items-center justify-center bg-[var(--canvas-soft)] border border-[var(--hairline)] p-2 shrink-0 shadow-xs"
              style={{ borderRadius: "30%" }}
            >
              <SocialIcon
                name={platform.socialIcon}
                size={32}
                className="w-8 h-8 object-contain"
                alt={platform.name}
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-[652] text-lg sm:text-xl text-[var(--ink)] tracking-tight">
                  {platform.name}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-[600] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Connected via MCP</span>
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-[300] mt-0.5">
                {platform.protocol} · {accountEmail || "Autonomous Channel"} · Synced {lastSync || "Just now"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--ink)] hover:bg-[var(--field)] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─── Navigation Tabs ─── */}
        <div className="px-6 pt-3 pb-2 border-b border-[var(--hairline)] flex items-center gap-2 overflow-x-auto shrink-0 bg-[var(--canvas-soft)]">
          <button
            type="button"
            onClick={() => setActiveTab("tools")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-[600] transition-all flex items-center gap-1.5 cursor-pointer",
              activeTab === "tools"
                ? "bg-[var(--primary)] text-[var(--on-primary)] shadow-xs"
                : "bg-[var(--canvas)] text-[var(--text-muted)] border border-[var(--hairline)] hover:text-[var(--ink)]"
            )}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>MCP Tools Catalog ({tools.length})</span>
          </button>

          {platform.id === "gmail" && (
            <button
              type="button"
              onClick={() => {
                setActiveTab("inbox");
                if (inboxMessages.length === 0) handleFetchInbox();
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-[600] transition-all flex items-center gap-1.5 cursor-pointer",
                activeTab === "inbox"
                  ? "bg-[var(--primary)] text-[var(--on-primary)] shadow-xs"
                  : "bg-[var(--canvas)] text-[var(--text-muted)] border border-[var(--hairline)] hover:text-[var(--ink)]"
              )}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Live Inbox Stream</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab("credentials")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-[600] transition-all flex items-center gap-1.5 cursor-pointer",
              activeTab === "credentials"
                ? "bg-[var(--primary)] text-[var(--on-primary)] shadow-xs"
                : "bg-[var(--canvas)] text-[var(--text-muted)] border border-[var(--hairline)] hover:text-[var(--ink)]"
            )}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Manual Credentials & InsForge</span>
          </button>
        </div>

        {/* ─── Tab Content ─── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: MCP TOOLS & ACTIONS */}
          {activeTab === "tools" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Tool List Sidebar */}
              <div className="md:col-span-5 space-y-2">
                <span className="text-[11px] font-[600] uppercase tracking-wider text-[var(--text-muted)] block">
                  Available MCP Tools
                </span>
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
                          <code className="text-xs font-mono font-semibold text-[var(--ink)] truncate">
                            {tool.name}
                          </code>
                          <span
                            className={cn(
                              "text-[9px] uppercase px-1.5 py-0.5 rounded-full font-[600] shrink-0",
                              tool.category === "read" && "bg-blue-500/10 text-blue-500 border border-blue-500/20",
                              tool.category === "write" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
                              tool.category === "manage" && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
                              tool.category === "search" && "bg-purple-500/10 text-purple-500 border border-purple-500/20"
                            )}
                          >
                            {tool.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] mt-1 line-clamp-2 font-[300]">
                          {tool.title || tool.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tool Runner & Inspector */}
              <div className="md:col-span-7 space-y-4">
                {activeTool ? (
                  <div className="rounded-[20px] bg-[var(--canvas)] border border-[var(--hairline)] p-4 sm:p-5 space-y-4">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-[652] text-sm sm:text-base text-[var(--ink)] tracking-tight">
                          {activeTool.title}
                        </h4>
                        <code className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--field)] text-[var(--ink)] border border-[var(--hairline)]">
                          {activeTool.name}
                        </code>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-1 font-[300] leading-relaxed">
                        {activeTool.description}
                      </p>
                    </div>

                    {/* Parameter Input Form */}
                    {activeTool.parameters.length > 0 && (
                      <div className="space-y-2.5 pt-2 border-t border-[var(--hairline)]">
                        <span className="text-[11px] font-[600] text-[var(--ink)] block">
                          Parameters Schema
                        </span>
                        <div className="space-y-2">
                          {activeTool.parameters.map((param) => (
                            <div key={param.name} className="space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-mono text-[var(--ink)] font-[500]">
                                  {param.name}
                                  {param.required && <span className="text-rose-500 ml-0.5">*</span>}
                                </span>
                                <span className="text-[var(--text-faint)] text-[10px]">{param.type}</span>
                              </div>
                              <input
                                type="text"
                                placeholder={param.description + (param.default !== undefined ? ` (default: ${param.default})` : "")}
                                value={toolParams[param.name] ?? ""}
                                onChange={(e) =>
                                  setToolParams({ ...toolParams, [param.name]: e.target.value })
                                }
                                className="w-full px-3 py-1.5 text-xs rounded-full bg-[var(--field)] text-[var(--ink)] border border-transparent focus:border-[var(--hairline)] outline-none"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Execution Button */}
                    <button
                      type="button"
                      onClick={() => handleRunTool(activeTool)}
                      disabled={toolRunning}
                      className="w-full py-2 rounded-full bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 font-[600] text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {toolRunning ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Invoking MCP Tool...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Execute Tool Call</span>
                        </>
                      )}
                    </button>

                    {/* Real Output Viewer */}
                    {toolOutput && (
                      <div className="rounded-[16px] bg-[var(--canvas-soft)] border border-[var(--hairline)] overflow-hidden">
                        <div className="px-3 py-1.5 border-b border-[var(--hairline)] flex items-center justify-between bg-[var(--canvas)]">
                          <span className="text-[10px] font-mono text-[var(--text-muted)] flex items-center gap-1">
                            <Terminal className="w-3 h-3 text-[#0066FF]" /> MCP Response
                          </span>
                          <button
                            type="button"
                            onClick={handleCopy}
                            className="text-[10px] text-[var(--text-muted)] hover:text-[var(--ink)] flex items-center gap-1 cursor-pointer"
                          >
                            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            <span>{copied ? "Copied" : "Copy JSON"}</span>
                          </button>
                        </div>
                        <pre className="p-3 text-[11px] font-mono text-[var(--ink)] max-h-60 overflow-y-auto overflow-x-auto whitespace-pre-wrap leading-relaxed">
                          {JSON.stringify(toolOutput, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--hairline)] rounded-[20px]">
                    Select an MCP tool on the left to inspect its schema and run test calls.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: LIVE INBOX STREAM (GMAIL) */}
          {activeTab === "inbox" && platform.id === "gmail" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-[652] text-sm text-[var(--ink)]">
                    Live Gmail Ingestion Feed
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] font-[300]">
                    Executive communications streamed via Model Context Protocol.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleFetchInbox}
                  disabled={isFetchingInbox}
                  className="px-3.5 py-1.5 rounded-full bg-[var(--canvas)] border border-[var(--hairline)] text-xs font-[600] text-[var(--ink)] hover:bg-[var(--field)] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", isFetchingInbox && "animate-spin text-[#0066FF]")} />
                  <span>{isFetchingInbox ? "Syncing..." : "Sync Inbox"}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Email Messages List */}
                <div className="md:col-span-5 space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {inboxMessages.map((msg) => {
                    const isSelected = selectedInboxMsg?.id === msg.id;
                    return (
                      <div
                        key={msg.id}
                        onClick={() => setSelectedInboxMsg(msg)}
                        className={cn(
                          "p-3 rounded-[16px] border cursor-pointer transition-all text-left",
                          isSelected
                            ? "bg-[var(--canvas)] border-[var(--ink)] shadow-xs"
                            : "bg-[var(--canvas)]/60 border-[var(--hairline)] hover:bg-[var(--canvas)]"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-[600] text-[var(--ink)] truncate">
                            {msg.from.split("<")[0]}
                          </span>
                          {msg.isUnread && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF] shrink-0" />
                          )}
                        </div>
                        <h5 className="text-xs text-[var(--ink)] font-[500] truncate">
                          {msg.subject}
                        </h5>
                        <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 mt-1 font-[300]">
                          {msg.snippet}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Email Details & Quick AI Draft */}
                <div className="md:col-span-7">
                  {selectedInboxMsg ? (
                    <div className="rounded-[20px] bg-[var(--canvas)] border border-[var(--hairline)] p-5 space-y-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          {selectedInboxMsg.labelIds?.map((l: string) => (
                            <span
                              key={l}
                              className="px-2 py-0.5 rounded-full text-[9px] font-[600] bg-[var(--field)] text-[var(--ink)] border border-[var(--hairline)]"
                            >
                              {l}
                            </span>
                          ))}
                        </div>
                        <h4 className="font-[652] text-base text-[var(--ink)] tracking-tight">
                          {selectedInboxMsg.subject}
                        </h4>
                        <div className="text-xs text-[var(--text-muted)] mt-1 flex items-center justify-between">
                          <span>From: {selectedInboxMsg.from}</span>
                          <span>{selectedInboxMsg.date?.split("T")[0] || "Today"}</span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-[16px] bg-[var(--field)] text-xs text-[var(--ink)] whitespace-pre-wrap leading-relaxed font-[300] max-h-48 overflow-y-auto">
                        {selectedInboxMsg.bodyText}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTool(
                            tools.find((t) => t.name === "gmail_create_draft") || tools[0]
                          );
                          setToolParams({
                            to: selectedInboxMsg.from,
                            subject: `Re: ${selectedInboxMsg.subject}`,
                            body: "Thank you for the update. Approved.",
                            threadId: selectedInboxMsg.threadId,
                          });
                          setActiveTab("tools");
                        }}
                        className="w-full py-2 rounded-full bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 font-[600] text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#0066FF]" />
                        <span>Prepare AI Draft via MCP</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--hairline)] rounded-[20px]">
                      Select an email message to view its synthesized content.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CREDENTIALS & INSFORGE */}
          {activeTab === "credentials" && (
            <div className="space-y-6 max-w-xl mx-auto">
              <div className="p-4 rounded-[20px] bg-[var(--canvas)] border border-[var(--hairline)] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-[652] text-sm text-[var(--ink)]">
                      Credentials & InsForge Persistence
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] font-[300]">
                      Configure manual OAuth 2.0 keys or manage cloud secrets.
                    </p>
                  </div>
                  <Shield className="w-5 h-5 text-[#0066FF]" />
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-[11px] font-[600] text-[var(--ink)] block mb-1">
                      OAuth Client ID
                    </label>
                    <input
                      type="text"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      placeholder="e.g. 109283749.apps.googleusercontent.com"
                      className="w-full px-3 py-1.5 text-xs rounded-full bg-[var(--field)] text-[var(--ink)] border border-transparent focus:border-[var(--hairline)] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-[600] text-[var(--ink)] block mb-1">
                      OAuth Client Secret
                    </label>
                    <input
                      type="password"
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                      placeholder="e.g. GOCSPX-xxxxxxxxxxxxx"
                      className="w-full px-3 py-1.5 text-xs rounded-full bg-[var(--field)] text-[var(--ink)] border border-transparent focus:border-[var(--hairline)] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-[600] text-[var(--ink)] block mb-1">
                      Refresh Token
                    </label>
                    <input
                      type="password"
                      value={refreshToken}
                      onChange={(e) => setRefreshToken(e.target.value)}
                      placeholder="e.g. 1//049x8f..."
                      className="w-full px-3 py-1.5 text-xs rounded-full bg-[var(--field)] text-[var(--ink)] border border-transparent focus:border-[var(--hairline)] outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveCredentials}
                  disabled={isSavingCreds}
                  className="w-full py-2 rounded-full bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 font-[600] text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSavingCreds ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving to InsForge PostgreSQL...</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-3.5 h-3.5" />
                      <span>{credsSavedSuccess ? "Saved to InsForge!" : "Save Credentials to InsForge"}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Danger Zone: Disconnect */}
              <div className="p-4 rounded-[20px] bg-rose-500/5 border border-rose-500/20 flex items-center justify-between gap-4">
                <div>
                  <h5 className="font-[600] text-xs text-rose-600 dark:text-rose-400">
                    Disconnect {platform.name}
                  </h5>
                  <p className="text-[11px] text-[var(--text-muted)] font-[300]">
                    Cease real-time MCP ingestion and clear active tokens.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onDisconnect(platform.id);
                    onClose();
                  }}
                  className="px-3.5 py-1.5 rounded-full text-xs font-[600] text-rose-600 dark:text-rose-400 bg-[var(--canvas)] border border-rose-500/30 hover:bg-rose-500/10 transition-all cursor-pointer shrink-0"
                >
                  Disconnect Channel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ─── Modal Footer ─── */}
        <div className="px-6 py-3.5 border-t border-[var(--hairline)] bg-[var(--canvas)] flex items-center justify-between text-xs text-[var(--text-faint)] shrink-0">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#0066FF]" />
            <span>Encrypted with InsForge PostgreSQL</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-[var(--canvas-soft)] text-[var(--ink)] border border-[var(--hairline)] hover:bg-[var(--field)] transition-all font-[600]"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
}
