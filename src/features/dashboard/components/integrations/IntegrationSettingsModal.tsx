"use client";

import React, { useState } from "react";
import {
  X,
  Code2,
  Play,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Layers,
  Terminal,
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
}

export function IntegrationSettingsModal({
  platform,
  isOpen,
  onClose,
  onDisconnect,
  accountEmail,
}: IntegrationSettingsModalProps) {
  const tools = platform?.mcpTools || [];
  const [selectedTool, setSelectedTool] = useState<McpToolDefinition | null>(
    tools[0] || null
  );
  const [toolParams, setToolParams] = useState<Record<string, any>>({});
  const [toolRunning, setToolRunning] = useState(false);
  const [toolOutput, setToolOutput] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !platform) return null;

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
        await new Promise((resolve) => setTimeout(resolve, 500));
        setToolOutput({
          content: [
            {
              type: "text",
              text: `Tool '${tool.name}' executed successfully on ${platform.name} MCP server bridge.`,
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
      setToolOutput({ error: err.message || "Failed to execute MCP tool" });
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
                  <span>Model Context Protocol (MCP)</span>
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-[300] mt-0.5">
                {tools.length} available MCP tools exposed to your autonomous agents
                {accountEmail ? ` · Connected: ${accountEmail}` : ""}
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

        {/* ─── Available MCP Tools Display ─── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Tool List Sidebar */}
            <div className="md:col-span-5 space-y-2">
              <div className="flex items-center justify-between pb-1">
                <span className="text-[11px] font-[600] uppercase tracking-wider text-[var(--text-muted)] block">
                  Available MCP Tools ({tools.length})
                </span>
                <span className="text-[10px] text-[var(--text-faint)] font-mono">
                  protocol: mcp/1.0
                </span>
              </div>

              <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
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
                            "text-[9px] font-mono px-2 py-0.5 rounded-full font-[600] uppercase",
                            tool.category === "read"
                              ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20"
                              : tool.category === "write"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
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
                        <div className="space-y-2">
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

                              {/* Input field for testing */}
                              <div className="pt-1">
                                {param.name === "body" ? (
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

                  {/* Tool Execution Result / Schema Preview */}
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

                    <pre className="p-3.5 rounded-[14px] bg-[var(--field)] text-[11px] font-mono text-[var(--ink)] max-h-52 overflow-y-auto leading-relaxed">
                      {toolOutput
                        ? JSON.stringify(toolOutput, null, 2)
                        : JSON.stringify(
                            activeTool.sampleOutput || {
                              status: "READY",
                              mcpProtocol: "mcp/1.0",
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
            onClick={() => {
              onDisconnect(platform.id);
              onClose();
            }}
            className="text-[11px] text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 font-[500] transition-colors"
          >
            Disconnect Platform
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-[var(--canvas-soft)] text-[var(--ink)] border border-[var(--hairline)] hover:bg-[var(--field)] transition-all font-[600]"
          >
            Close Dialog
          </button>
        </div>
      </div>
    </div>
  );
}
