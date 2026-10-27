"use client";

import React, { useRef, useEffect } from "react";
import { Send, Square, Sparkles } from "lucide-react";
import { SocialIcon } from "@/components/icons/AppIcons";

interface ConnectorBadge {
  id: string;
  name: string;
  status: string;
  isConnected: boolean;
}

interface ChatInputBarProps {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  isStreaming: boolean;
  connectors?: ConnectorBadge[];
}

export function ChatInputBar({
  input,
  setInput,
  onSend,
  onStop,
  isStreaming,
  connectors = [],
}: ChatInputBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-expand textarea height up to 160px
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const nextHeight = Math.min(el.scrollHeight, 160);
    el.style.height = `${Math.max(nextHeight, 44)}px`;
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && input.trim()) {
        onSend();
      }
    }
  };

  const activeConnectors = connectors.filter((c) => c.isConnected);

  return (
    <div className="w-full shrink-0 pt-2 pb-3 bg-[#0B0F17]/95 backdrop-blur-md">
      <div className="relative rounded-[22px] bg-[#161B22] border border-[#30363D] focus-within:border-[#0066FF] focus-within:ring-1 focus-within:ring-[#0066FF]/30 transition-all shadow-lg p-2.5 sm:p-3">
        {/* Top Input Area with Multiline Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask ToyBox AI to triage emails, check calendar conflicts, draft replies, or search Slack..."
          rows={1}
          disabled={isStreaming}
          className="w-full bg-transparent text-white placeholder-[#6B7280] text-xs sm:text-sm resize-none outline-none font-[300] leading-relaxed max-h-40 px-1 disabled:opacity-60"
        />

        {/* Bottom Toolbar Row */}
        <div className="flex items-center justify-between gap-3 pt-2 mt-1 border-t border-[#1F2937]/80">
          {/* Left: Active Context Indicator showing Connected App Badges */}
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span className="text-[10px] uppercase tracking-wider text-[#6B7280] font-[600] mr-1 hidden sm:inline">
              Active Context:
            </span>

            {activeConnectors.length > 0 ? (
              activeConnectors.map((conn) => {
                const iconName =
                  conn.id === "gcal" || conn.id === "calendar"
                    ? "gcal"
                    : conn.id === "gmail"
                    ? "gmail"
                    : conn.id;

                return (
                  <div
                    key={conn.id}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0D1117] border border-[#30363D] text-[10px] text-[#D1D5DB] font-[500]"
                    title={`${conn.name} is connected`}
                  >
                    <SocialIcon name={iconName} size={12} className="w-3 h-3 object-contain" />
                    <span className="hidden md:inline">{conn.name}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  </div>
                );
              })
            ) : (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0D1117] border border-[#30363D] text-[10px] text-[#9CA3AF]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Default MCP Tools</span>
              </div>
            )}
          </div>

          {/* Right: Send & Stop Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-[600] transition-all cursor-pointer"
                title="Stop streaming response"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onSend}
                disabled={!input.trim()}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-[#0066FF] hover:bg-[#0052cc] text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:scale-105 active:scale-95"
                title="Send message (Enter)"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-2 pt-1 text-[10px] text-[#6B7280]">
        <span>Powered by Gemini 3.1 Flash-Lite & ToyBox MCP</span>
        <span className="hidden sm:inline">Press Enter to send, Shift+Enter for new line</span>
      </div>
    </div>
  );
}
