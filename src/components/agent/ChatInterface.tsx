"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  Bot,
  Sparkles,
  Plus,
  RefreshCw,
  Wrench,
  CornerDownRight,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { SocialIcon } from "@/components/icons/AppIcons";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { MicroCards, MicroCardItem } from "./MicroCards";
import { TopSummaryBar, SummaryBarData } from "./TopSummaryBar";
import { QuickPrompts } from "./QuickPrompts";
import { ChatInputBar } from "./ChatInputBar";

interface MessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  metadata?: {
    toolsUsed?: string[];
    cards?: MicroCardItem[];
    followups?: string[];
  };
}

interface Connector {
  id: string;
  name: string;
  status: string;
  isConnected: boolean;
}

export function ChatInterface() {
  // State
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentToolLabel, setCurrentToolLabel] = useState<string | null>(null);
  const [activeToolsInFlight, setActiveToolsInFlight] = useState<string[]>([]);
  const [summaryData, setSummaryData] = useState<SummaryBarData | null>(null);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [userId, setUserId] = useState<string>("a727d188-4197-409c-855d-2aa5201cebc7");

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom smoothly on message updates or streaming chunks
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "end",
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, currentToolLabel, scrollToBottom]);

  // Load summary and connectors
  useEffect(() => {
    let isMounted = true;
    async function loadSummary() {
      try {
        const res = await fetch("/api/agent/summary", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (isMounted) {
            setSummaryData({
              todaysBrief: json.todaysBrief,
              importantMessages: json.importantMessages,
              scheduleAlert: json.scheduleAlert,
            });
            if (json.connectors) {
              setConnectors(json.connectors);
            }
          }
        }
      } catch (err) {
        console.warn("Failed to load agent summary:", err);
      }
    }

    loadSummary();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch or initialize active conversation
  useEffect(() => {
    let isMounted = true;
    async function initConversation() {
      try {
        const res = await fetch("/api/agent/conversations", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.conversations && json.conversations.length > 0) {
            const activeConv = json.conversations[0];
            setConversationId(activeConv.id);

            // Fetch messages for active conversation
            const msgRes = await fetch(`/api/agent/conversations/${activeConv.id}`, { cache: "no-store" });
            if (msgRes.ok) {
              const msgJson = await msgRes.json();
              if (msgJson.messages && Array.isArray(msgJson.messages) && msgJson.messages.length > 0) {
                setMessages(
                  msgJson.messages.map((m: any) => ({
                    id: m.id,
                    role: m.role,
                    content: m.content,
                    createdAt: m.created_at,
                    metadata: m.metadata || {},
                  }))
                );
                return;
              }
            }
          }
        }

        // If no messages exist yet, show welcoming chief of staff greeting
        if (isMounted && messages.length === 0) {
          setMessages([
            {
              id: "welcome_init",
              role: "assistant",
              content: `Good evening, Alex. I am your **ToyBox AI Chief of Staff**.\n\nI am connected to your live workspace integrations (**Gmail**, **Google Calendar**, and **Slack**) with full Model Context Protocol (MCP) tool access.\n\nHere is how I can assist you right now:\n* **Email Gatekeeper:** Triage urgent emails requiring sign-offs or vendor approvals.\n* **Calendar Negotiator:** Check meeting agendas, resolve conflicts, or schedule focus time.\n* **Team Pulse:** Search Slack discussions, pull executive updates, and draft channel replies.\n\nSelect a suggestion above or ask me any question below.`,
              createdAt: new Date().toISOString(),
              metadata: {
                followups: [
                  "Summarize unread Slack messages",
                  "What meetings do I have today?",
                  "Find urgent emails requiring replies",
                ],
              },
            },
          ]);
        }
      } catch (err) {
        console.warn("Error initializing conversation:", err);
      }
    }

    initConversation();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle "New Conversation" action
  const handleNewConversation = async () => {
    if (isStreaming && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    try {
      const res = await fetch("/api/agent/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Conversation" }),
      });

      if (res.ok) {
        const json = await res.json();
        setConversationId(json.conversation.id);
      } else {
        setConversationId(null);
      }
    } catch {
      setConversationId(null);
    }

    setMessages([
      {
        id: `welcome_${Date.now()}`,
        role: "assistant",
        content: `Fresh executive thread initiated. All temporary context from earlier has been cleared.\n\nHow can I help coordinate your schedule or communications right now?`,
        createdAt: new Date().toISOString(),
        metadata: {
          followups: [
            "Summarize unread Slack messages",
            "What meetings do I have today?",
            "Find urgent emails requiring replies",
          ],
        },
      },
    ]);
  };

  // Stop Generation handler
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setCurrentToolLabel(null);
  };

  // Core Send Message function (invoked via input bar, prompt chips, follow-up chips, or micro-card actions)
  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend !== undefined ? textToSend : input).trim();
    if (!prompt || isStreaming) return;

    setInput("");

    const userMessageId = `user_${Date.now()}`;
    const userMsg: MessageItem = {
      id: userMessageId,
      role: "user",
      content: prompt,
      createdAt: new Date().toISOString(),
    };

    const assistantTempId = `assistant_${Date.now()}`;
    const assistantMsg: MessageItem = {
      id: assistantTempId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
      metadata: {
        toolsUsed: [],
        cards: [],
        followups: [],
      },
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);
    setCurrentToolLabel(null);
    setActiveToolsInFlight([]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          conversationId,
          message: prompt,
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Chat API error (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      let streamingText = "";
      const streamedCards: MicroCardItem[] = [];
      const streamedTools: string[] = [];
      let streamedFollowups: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ")) {
            const dataStr = trimmed.slice(6);
            try {
              const event = JSON.parse(dataStr);

              // 1. Tool started
              if (event.type === "tool_start") {
                setCurrentToolLabel(event.label);
                streamedTools.push(event.tool);
                setActiveToolsInFlight((prev) => [...prev, event.tool]);
              }

              // 2. Tool finished
              if (event.type === "tool_end") {
                setCurrentToolLabel(null);
              }

              // 3. Text chunk streamed
              if (event.type === "chunk") {
                streamingText += event.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantTempId
                      ? {
                          ...m,
                          content: streamingText,
                          metadata: {
                            ...m.metadata,
                            toolsUsed: streamedTools,
                          },
                        }
                      : m
                  )
                );
              }

              // 4. Cards received
              if (event.type === "cards" && Array.isArray(event.cards)) {
                streamedCards.push(...event.cards);
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantTempId
                      ? {
                          ...m,
                          metadata: {
                            ...m.metadata,
                            cards: streamedCards,
                          },
                        }
                      : m
                  )
                );
              }

              // 5. Dynamic follow-up chips
              if (event.type === "followups" && Array.isArray(event.suggestions)) {
                streamedFollowups = event.suggestions;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantTempId
                      ? {
                          ...m,
                          metadata: {
                            ...m.metadata,
                            followups: streamedFollowups,
                          },
                        }
                      : m
                  )
                );
              }

              // 6. Done event
              if (event.type === "done") {
                if (event.conversationId) {
                  setConversationId(event.conversationId);
                }
              }
            } catch (jsonErr) {
              console.warn("Error parsing stream chunk:", jsonErr);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Generation aborted by user.");
      } else {
        console.error("Chat error:", err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantTempId
              ? {
                  ...m,
                  content:
                    m.content ||
                    "I encountered an error connecting to the AI agent service. Please verify your GEMINI_API_KEY and connected platforms.",
                }
              : m
          )
        );
      }
    } finally {
      setIsStreaming(false);
      setCurrentToolLabel(null);
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="flex flex-col h-full w-full min-w-0 max-w-none text-white overflow-hidden">
      {/* ─── 1. Header Bar ─── */}
      <header className="shrink-0 pb-3 mb-2 border-b border-[#1F2937] flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left Lockup: Title, Online Green Indicator Badge, Subtitle */}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-[652] tracking-tight text-white flex items-center gap-2">
              <span>ToyBox AI Agent</span>
            </h1>

            {/* Online Green Indicator Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-[600]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Online</span>
            </div>

            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#161B22] border border-[#30363D] text-[#9CA3AF] font-mono">
              gemini-3.5-flash-lite
            </span>
          </div>

          <p className="text-xs text-[#9CA3AF] font-[300]">
            Live assistant connected to your workspace communications and calendars.
          </p>
        </div>

        {/* Right Action Buttons: "New Conversation" + "Active Connectors" Badge List */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Active Connectors Badge List */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#161B22] border border-[#30363D] text-xs font-[500]">
            <span className="text-[#9CA3AF] text-[11px] font-[600]">Connectors:</span>
            <div className="flex items-center gap-1">
              {["gmail", "slack", "whatsapp", "gcal"].map((connId) => {
                const isConn = connectors.find((c) => c.id === connId)?.isConnected ?? true;
                return (
                  <div
                    key={connId}
                    className="relative w-6 h-6 flex items-center justify-center bg-[#0D1117] border border-[#30363D] p-1"
                    style={{ borderRadius: "30%" }}
                    title={`${connId.toUpperCase()}: ${isConn ? "Connected" : "Disconnected"}`}
                  >
                    <SocialIcon name={connId} size={14} className="w-3.5 h-3.5 object-contain" />
                    <span
                      className={`w-1.5 h-1.5 rounded-full absolute -top-0.5 -right-0.5 ${
                        isConn ? "bg-emerald-500" : "bg-gray-500"
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* New Conversation Button */}
          <button
            type="button"
            onClick={handleNewConversation}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#161B22] hover:bg-[#21262D] text-white border border-[#30363D] hover:border-[#4B5563] text-xs font-[600] transition-all cursor-pointer shadow-xs active:scale-95"
            title="Clear chat and start a fresh 24h thread"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Conversation</span>
          </button>
        </div>
      </header>

      {/* ─── 2. Top Collapsible / Compact Sections ─── */}
      <div className="shrink-0 space-y-2 mb-3">
        {/* Recent Summary Bar */}
        <TopSummaryBar data={summaryData} onSelectQuery={handleSendMessage} />

        {/* Quick Suggestion Prompts */}
        <QuickPrompts onSelectPrompt={handleSendMessage} disabled={isStreaming} />
      </div>

      {/* ─── 3. Message History Area (Scrollable with Auto-Scroll) ─── */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-5 scrollbar-thin scrollbar-thumb-[#30363D] scrollbar-track-transparent">
        {messages.map((msg) => {
          const isUser = msg.role === "user";

          return (
            <div
              key={msg.id}
              className={`flex w-full ${isUser ? "justify-end" : "justify-start"} animate-in fade-in duration-200`}
            >
              {/* AI Bubble Left-Aligned */}
              {!isUser && (
                <div className="flex items-start gap-3 max-w-4xl w-full">
                  {/* ToyBox AI Robot Avatar */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-[#161B22] border border-[#30363D] text-[#0066FF] shadow-xs shrink-0 mt-0.5"
                    style={{ borderRadius: "30%" }}
                  >
                    <Bot className="w-4 h-4 stroke-[2]" />
                  </div>

                  {/* Bubble Content Body */}
                  <div className="space-y-2 min-w-0 flex-1">
                    {/* Header Row: Agent Name, Timestamp, Tools Used Status Tag */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-[652] text-white">ToyBox AI</span>

                      <span className="text-[10px] text-[#6B7280] font-mono">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>

                      {/* Status Tag: Connected Tools Used */}
                      {msg.metadata?.toolsUsed && msg.metadata.toolsUsed.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#161B22] border border-[#30363D] text-[10px] font-[500] text-[#38BDF8]">
                          <Wrench className="w-2.5 h-2.5" />
                          <span>Connected Tools Used ({msg.metadata.toolsUsed.length})</span>
                        </span>
                      )}
                    </div>

                    {/* Rich Markdown Response */}
                    <div className="rounded-[22px] bg-[#0D1117]/80 border border-[#1F2937] p-4 sm:p-5 shadow-xs">
                      {msg.content ? (
                        <MarkdownRenderer content={msg.content} />
                      ) : (
                        <div className="flex items-center gap-2 py-2 text-xs text-[#9CA3AF]">
                          <div className="w-3 h-3 rounded-full border-2 border-[#0066FF] border-t-transparent animate-spin" />
                          <span>Synthesizing response...</span>
                        </div>
                      )}

                      {/* Generative UI Micro-Cards */}
                      {msg.metadata?.cards && msg.metadata.cards.length > 0 && (
                        <MicroCards
                          cards={msg.metadata.cards}
                          onActionClick={handleSendMessage}
                        />
                      )}
                    </div>

                    {/* Dynamic Follow-up Suggestions Chips */}
                    {msg.metadata?.followups && msg.metadata.followups.length > 0 && !isStreaming && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] uppercase tracking-wider text-[#6B7280] font-[600] block">
                          Suggested Next Steps
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                          {msg.metadata.followups.map((chip, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSendMessage(chip)}
                              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#161B22] hover:bg-[#21262D] text-[#D1D5DB] hover:text-white border border-[#30363D] hover:border-[#0066FF] text-xs font-[500] transition-all cursor-pointer group shadow-2xs"
                            >
                              <CornerDownRight className="w-3 h-3 text-[#0066FF] group-hover:translate-x-0.5 transition-transform" />
                              <span>{chip}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* User Bubble Right-Aligned */}
              {isUser && (
                <div className="max-w-2xl rounded-[22px] bg-[#161B22] border border-[#30363D] text-white px-4 py-3 shadow-md">
                  <p className="text-xs sm:text-sm font-[300] leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                  <span className="text-[9px] text-[#6B7280] font-mono block text-right mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* Thinking / Tool Call Indicator Shimmer Banner */}
        {currentToolLabel && (
          <div className="flex items-start gap-3 max-w-xl animate-in fade-in duration-150">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center bg-[#161B22] border border-[#30363D] text-[#0066FF] shrink-0"
              style={{ borderRadius: "30%" }}
            >
              <RefreshCw className="w-4 h-4 animate-spin text-[#0066FF]" />
            </div>

            <div className="rounded-[18px] bg-[#161B22] border border-[#0066FF]/40 px-4 py-2.5 flex items-center gap-3 shadow-md">
              <span className="w-2 h-2 rounded-full bg-[#0066FF] animate-ping" />
              <div className="space-y-0.5">
                <span className="text-xs font-[600] text-white block">
                  {currentToolLabel}
                </span>
                <span className="text-[10px] text-[#9CA3AF] block font-[300]">
                  Model executing verified MCP protocol action...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ─── 4. Input Bar & Controls (Fixed Bottom Container) ─── */}
      <ChatInputBar
        input={input}
        setInput={setInput}
        onSend={() => handleSendMessage()}
        onStop={handleStopGeneration}
        isStreaming={isStreaming}
        connectors={connectors}
      />
    </div>
  );
}
