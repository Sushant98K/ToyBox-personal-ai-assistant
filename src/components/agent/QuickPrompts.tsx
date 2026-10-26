"use client";

import React from "react";
import { MessageSquare, Calendar, Mail, Send, CheckCircle2 } from "lucide-react";

interface QuickPromptsProps {
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
}

const DEFAULT_PROMPTS = [
  {
    icon: MessageSquare,
    text: "Summarize unread Slack messages",
    color: "text-emerald-400",
  },
  {
    icon: Calendar,
    text: "What meetings do I have today?",
    color: "text-amber-400",
  },
  {
    icon: Mail,
    text: "Find urgent emails requiring replies",
    color: "text-sky-400",
  },
  {
    icon: Send,
    text: "Draft a WhatsApp follow-up to latest client",
    color: "text-teal-400",
  },
  {
    icon: CheckCircle2,
    text: "Any overdue follow-ups or tasks?",
    color: "text-rose-400",
  },
];

export function QuickPrompts({ onSelectPrompt, disabled = false }: QuickPromptsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none py-1">
      {DEFAULT_PROMPTS.map((p, idx) => {
        const Icon = p.icon;
        return (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onSelectPrompt(p.text)}
            className="shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#161B22]/70 hover:bg-[#21262D] border border-[#30363D] hover:border-[#4B5563] text-white text-xs font-[500] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xs group"
          >
            <Icon className={`w-3.5 h-3.5 ${p.color} shrink-0 group-hover:scale-110 transition-transform`} />
            <span className="truncate">{p.text}</span>
          </button>
        );
      })}
    </div>
  );
}
