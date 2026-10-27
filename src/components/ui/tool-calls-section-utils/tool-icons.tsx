"use client";

import React, { ReactNode } from "react";
import {
  Mail,
  Calendar,
  MessageSquare,
  Search,
  Database,
  Cpu,
  Bot,
  Wrench,
  FileText,
  Phone,
  Code,
  Share2,
} from "lucide-react";
import { SocialIcon } from "@/components/icons/AppIcons";

export function formatToolName(name: string): string {
  if (!name) return "Tool execution";
  return name
    .replace(/[_-]/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getToolCategoryIcon(
  category: string,
  options?: { width?: number; height?: number; className?: string },
  iconUrl?: string,
): ReactNode {
  const size = options?.width || 21;
  const className = options?.className || "";

  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt={category}
        width={size}
        height={size}
        className={`rounded-md object-contain shrink-0 ${className}`}
      />
    );
  }

  const cat = (category || "").toLowerCase().trim();

  if (cat.includes("gmail") || cat.includes("email") || cat.includes("mail")) {
    return (
      <div className="flex size-7 items-center justify-center rounded-lg bg-red-500/15 border border-red-500/20 text-red-400 shrink-0">
        <SocialIcon name="gmail" size={size - 5} className={className} />
      </div>
    );
  }

  if (
    cat.includes("calendar") ||
    cat.includes("gcal") ||
    cat.includes("schedule") ||
    cat.includes("google_calendar")
  ) {
    return (
      <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/15 border border-blue-500/20 text-blue-400 shrink-0">
        <SocialIcon name="gcal" size={size - 5} className={className} />
      </div>
    );
  }

  if (cat.includes("slack")) {
    return (
      <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/15 border border-purple-500/20 text-purple-400 shrink-0">
        <SocialIcon name="slack" size={size - 5} className={className} />
      </div>
    );
  }

  if (cat.includes("whatsapp")) {
    return (
      <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 shrink-0">
        <SocialIcon name="whatsapp" size={size - 5} className={className} />
      </div>
    );
  }

  if (cat.includes("search")) {
    return (
      <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/15 border border-amber-500/20 text-amber-400 shrink-0">
        <Search size={size - 5} className={className} />
      </div>
    );
  }

  if (cat.includes("memory") || cat.includes("db") || cat.includes("database")) {
    return (
      <div className="flex size-7 items-center justify-center rounded-lg bg-cyan-500/15 border border-cyan-500/20 text-cyan-400 shrink-0">
        <Database size={size - 5} className={className} />
      </div>
    );
  }

  if (cat.includes("executor") || cat.includes("code") || cat.includes("analysis")) {
    return (
      <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 shrink-0">
        <Cpu size={size - 5} className={className} />
      </div>
    );
  }

  if (cat.includes("handoff") || cat.includes("delegat")) {
    return (
      <div className="flex size-7 items-center justify-center rounded-lg bg-violet-500/15 border border-violet-500/20 text-violet-400 shrink-0">
        <Bot size={size - 5} className={className} />
      </div>
    );
  }

  if (cat.includes("notion") || cat.includes("doc")) {
    return (
      <div className="flex size-7 items-center justify-center rounded-lg bg-zinc-500/15 border border-zinc-500/20 text-zinc-300 shrink-0">
        <FileText size={size - 5} className={className} />
      </div>
    );
  }

  return (
    <div className="flex size-7 items-center justify-center rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0">
      <Wrench size={size - 5} className={className} />
    </div>
  );
}
