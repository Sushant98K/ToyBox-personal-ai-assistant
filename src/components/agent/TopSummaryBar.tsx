"use client";

import React, { useState } from "react";
import { Sparkles, MessageSquare, Calendar, ChevronDown, ChevronUp, Clock, AlertCircle } from "lucide-react";

export interface SummaryBarData {
  todaysBrief: {
    title: string;
    snippet: string;
    timestamp: string;
    id?: string;
  };
  importantMessages: {
    unreadCount: number;
    label: string;
  };
  scheduleAlert: {
    title: string;
    time: string;
    urgency: string;
  };
}

interface TopSummaryBarProps {
  data: SummaryBarData | null;
  onSelectQuery: (query: string) => void;
}

export function TopSummaryBar({ data, onSelectQuery }: TopSummaryBarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!data) return null;

  return (
    <div className="w-full bg-[#0D1117]/80 backdrop-blur-md border border-[#1F2937] rounded-[20px] p-3 sm:p-3.5 transition-all shadow-sm">
      {/* Bar Header & Collapse Toggle */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1F2937]/60">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#0066FF] animate-pulse" />
          <span className="text-[11px] font-[600] uppercase tracking-wider text-[#9CA3AF]">
            Executive Workspace Pulse
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1 text-[11px] font-[500] text-[#9CA3AF] hover:text-white px-2 py-0.5 rounded-full hover:bg-[#161B22] transition-colors cursor-pointer"
          title={isCollapsed ? "Expand Briefings Bar" : "Collapse Briefings Bar"}
        >
          <span>{isCollapsed ? "Show Briefings" : "Collapse"}</span>
          {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Summary Cards Row */}
      {!isCollapsed && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 animate-in fade-in duration-200">
          {/* Card 1: Today's Brief */}
          <button
            type="button"
            onClick={() => onSelectQuery("Give me a comprehensive executive breakdown of today's briefing")}
            className="flex flex-col text-left p-3 rounded-[16px] bg-[#161B22]/60 hover:bg-[#161B22] border border-[#30363D]/60 hover:border-[#0066FF]/60 transition-all cursor-pointer group space-y-1.5"
          >
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 font-[600] text-white">
                <Sparkles className="w-3.5 h-3.5 text-[#0066FF]" />
                <span>Today's Brief</span>
              </div>
              <span className="text-[10px] text-[#6B7280] font-mono flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {data.todaysBrief.timestamp}
              </span>
            </div>
            <p className="text-[11px] text-[#D1D5DB] line-clamp-2 leading-relaxed font-[300] group-hover:text-white">
              {data.todaysBrief.snippet}
            </p>
          </button>

          {/* Card 2: Important Messages */}
          <button
            type="button"
            onClick={() => onSelectQuery("Summarize my urgent unread messages across Slack and WhatsApp")}
            className="flex flex-col text-left p-3 rounded-[16px] bg-[#161B22]/60 hover:bg-[#161B22] border border-[#30363D]/60 hover:border-emerald-500/60 transition-all cursor-pointer group space-y-1.5"
          >
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 font-[600] text-white">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Important Messages</span>
              </div>
              <span className="px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-[600]">
                {data.importantMessages.unreadCount} Unread
              </span>
            </div>
            <p className="text-[11px] text-[#D1D5DB] line-clamp-2 leading-relaxed font-[300] group-hover:text-white">
              {data.importantMessages.label}
            </p>
          </button>

          {/* Card 3: Schedule & Alerts */}
          <button
            type="button"
            onClick={() => onSelectQuery("What is my next meeting and do I have any schedule conflicts or urgent alerts?")}
            className="flex flex-col text-left p-3 rounded-[16px] bg-[#161B22]/60 hover:bg-[#161B22] border border-[#30363D]/60 hover:border-amber-500/60 transition-all cursor-pointer group space-y-1.5"
          >
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 font-[600] text-white">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Schedule & Alerts</span>
              </div>
              <span className="text-[10px] text-amber-400 font-mono font-[600]">
                {data.scheduleAlert.time}
              </span>
            </div>
            <p className="text-[11px] text-[#D1D5DB] line-clamp-2 leading-relaxed font-[300] group-hover:text-white">
              {data.scheduleAlert.title}
            </p>
          </button>
        </div>
      )}
    </div>
  );
}
