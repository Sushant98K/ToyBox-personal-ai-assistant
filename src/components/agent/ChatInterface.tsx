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
import { ToolCallsSection, ToolCallEntry } from "@/components/ui/tool-calls-section";
import { insforge } from "@/lib/insforge";

interface MessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  metadata?: {
    toolsUsed?: string[];
    toolCalls?: ToolCallEntry[];
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
  // Current user state
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name?: string;
    email?: string;
    avatar_url?: string;
  } | null>(null);

  // State
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentToolLabel, setCurrentToolLabel] = useState<string | null>(null);
  const [activeToolsInFlight, setActiveToolsInFlight] = useState<string[]>([]);
  const [summaryData, setSummaryData] = useState<SummaryBarData | null>(null);
  const [connectors, setConnectors] = useState<Connector[]>([]);

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

  // Load authenticated user from InsForge
  useEffect(() => {
    async function loadUser() {
      try {
        const { data } = await insforge.auth.getCurrentUser();
        if (data?.user) {
          setCurrentUser({
            id: data.user.id,
            name: data.user.profile?.name || data.user.email?.split("@")[0] || "User",
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

  // Load summary and connectors
  useEffect(() => {
    let isMounted = true;
    async function loadSummary() {
      try {
        const headers: Record<string, string> = {};
        if (currentUser?.id) {
          headers["x-user-id"] = currentUser.id;
        }
        if (currentUser?.email) {
          headers["x-user-email"] = currentUser.email;
        }

        const res = await fetch("/api/agent/summary", {
          cache: "no-store",
          headers,
        });

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
  }, [currentUser]);

  // Fetch or initialize active conversation
  useEffect(() => {
    let isMounted = true;
    async function initConversation() {
      try {
        const headers: Record<string, string> = {};
        if (currentUser?.id) {
          headers["x-user-id"] = currentUser.id;
        }
        if (currentUser?.email) {
          headers["x-user-email"] = currentUser.email;
        }

        const res = await fetch("/api/agent/conversations", {
          cache: "no-store",
          headers,
        });

        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.conversations && json.conversations.length > 0) {
            const activeConv = json.conversations[0];
            setConversationId(activeConv.id);

            // Fetch messages for active conversation
            const msgRes = await fetch(`/api/agent/conversations/${activeConv.id}`, {
              cache: "no-store",
              headers,
            });
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

        // If no messages exist yet, show personalized welcoming greeting
        if (isMounted && messages.length === 0) {
          const hour = new Date().getHours();
          const greetingTime = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
          const userName = currentUser?.name || currentUser?.email?.split("@")[0] || "there";

          const activeConns = connectors.filter((c) => c.isConnected);
          const connectedNames = activeConns.map((c) => c.name);

          const connectionDescription =
            connectedNames.length > 0
              ? `I am connected to your live workspace integrations (**${connectedNames.join("**, **")}**) with full Model Context Protocol (MCP) tool access.`
              : `I am ready to manage your schedule and workspace intelligence. You have not connected any integrations yet. Connect **Gmail**, **Google Calendar**, **Slack**, or **WhatsApp** in the Integrations dashboard to unlock autonomous workflows.`;

          setMessages([
            {
              id: "welcome_init",
              role: "assistant",
              content: `${greetingTime}, ${userName}. I am your **ToyBox AI Chief of Staff**.\n\n${connectionDescription}\n\nHere is how I can assist you right now:\n* **Email Gatekeeper:** Triage urgent unread emails and draft executive responses.\n* **Calendar Negotiator:** Check meeting agendas, resolve conflicts, or schedule focus time.\n* **Team Pulse:** Search Slack discussions and monitor incoming priority communications.\n\nSelect a suggestion above or ask me any question below.`,
              createdAt: new Date().toISOString(),
              metadata: {
                followups: [
                  "What meetings do I have today?",
                  "Find urgent emails requiring replies",
                  "Summarize unread messages",
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
  }, [currentUser, connectors.length]);

  // Handle "New Conversation" action
  const handleNewConversation = async () => {
    if (isStreaming && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (currentUser?.id) {
      headers["x-user-id"] = currentUser.id;
    }
    if (currentUser?.email) {
      headers["x-user-email"] = currentUser.email;
    }

    try {
      const res = await fetch("/api/agent/conversations", {
        method: "POST",
        headers,
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
        content: `Fresh executive thread initiated. All previous temporary context has been cleared.\n\nHow can I help coordinate your schedule or communications right now?`,
        createdAt: new Date().toISOString(),
        metadata: {
          followups: [
            "What meetings do I have today?",
            "Find urgent emails requiring replies",
            "Summarize unread messages",
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

  // Core Send Message function
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
        toolCalls: [],
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
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (currentUser?.id) {
        headers["x-user-id"] = currentUser.id;
      }
      if (currentUser?.email) {
        headers["x-user-email"] = currentUser.email;
      }

      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers,
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
      const streamedToolCalls: ToolCallEntry[] = [];
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

              // 2. Structured Tool Call for ToolCallsSection
              if (event.type === "tool_call" && event.toolCall) {
                streamedToolCalls.push(event.toolCall);
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantTempId
                      ? {
                          ...m,
                          metadata: {
                            ...m.metadata,
                            toolCalls: [...streamedToolCalls],
                          },
                        }
                      : m
                  )
                );
              }

              // 3. Tool finished
              if (event.type === "tool_end") {
                setCurrentToolLabel(null);
              }

              // 4. Text chunk streamed
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
                            toolCalls: streamedToolCalls,
                          },
                        }
                      : m
                  )
                );
              }

              // 5. Cards received
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
                            toolCalls: streamedToolCalls,
                          },
                        }
                      : m
                  )
                );
              }

              // 6. Dynamic follow-up chips
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
                            toolCalls: streamedToolCalls,
                          },
                        }
                      : m
                  )
                );
              }

              // 7. Done event
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
        {/* Left Lockup: Title, Online Green Indicator Badge, Model Tag */}
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
              gemini-3.1-flash-lite
            </span>
          </div>

          <p className="text-xs text-[#9CA3AF] font-[300]">
            Live executive assistant connected to your workspace communications and calendars.
          </p>
        </div>

        {/* Right Action Buttons: "New Conversation" + "Active Connectors" Badge List */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Active Connectors Badge List */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#161B22] border border-[#30363D] text-xs font-[500]">
            <span className="text-[#9CA3AF] text-[11px] font-[600]">Connectors:</span>
            <div className="flex items-center gap-1">
              {["gmail", "slack", "whatsapp", "gcal"].map((connId) => {
                const isConn = connectors.find((c) => c.id === connId)?.isConnected ?? false;
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
                    {/* Header Row: Agent Name, Timestamp */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-[652] text-white">ToyBox AI</span>

                      <span className="text-[10px] text-[#6B7280] font-mono">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* Rich Response Container */}
                    <div className="rounded-[22px] bg-[#0D1117]/80 border border-[#1F2937] p-4 sm:p-5 shadow-xs">
                      {/* Integrated Tool Calls Section Component */}
                      {msg.metadata?.toolCalls && msg.metadata.toolCalls.length > 0 && (
                        <div className="mb-3 pb-2 border-b border-[#1F2937]/70">
                          <ToolCallsSection
                            toolCalls={msg.metadata.toolCalls}
                            defaultExpanded={false}
                          />
                        </div>
                      )}

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
                  Executing verified MCP tool on connected workspace...
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
