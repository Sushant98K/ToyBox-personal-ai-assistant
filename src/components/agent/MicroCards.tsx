"use client";

import React from "react";
import { SocialIcon } from "@/components/icons/AppIcons";
import { Mail, MessageSquare, Calendar, ArrowRight, Clock, Users, CornerDownRight } from "lucide-react";

export interface MicroCardItem {
  type: "email" | "slack" | "calendar" | "whatsapp" | "outlook" | "discord" | "linkedin" | "telegram";
  id: string;
  title: string;
  subtitle?: string;
  snippet?: string;
  timestamp?: string;
  attendees?: string[];
  actionLabel?: string;
  actionPrompt?: string;
}

interface MicroCardsProps {
  cards: MicroCardItem[];
  onActionClick: (prompt: string) => void;
}

export function MicroCards({ cards, onActionClick }: MicroCardsProps) {
  if (!cards || cards.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-3">
      {cards.map((card, idx) => (
        <MicroCard key={card.id || idx} card={card} onActionClick={onActionClick} />
      ))}
    </div>
  );
}

function MicroCard({
  card,
  onActionClick,
}: {
  card: MicroCardItem;
  onActionClick: (prompt: string) => void;
}) {
  const isEmail = card.type === "email" || card.type === "outlook";
  const isSlack = card.type === "slack";
  const isCalendar = card.type === "calendar";
  const isWhatsApp = card.type === "whatsapp";

  const appIconName =
    card.type === "calendar"
      ? "gcal"
      : card.type === "email"
      ? "gmail"
      : card.type;

  const handleAction = () => {
    if (card.actionPrompt) {
      onActionClick(card.actionPrompt);
    } else if (isEmail) {
      onActionClick(`Draft an executive reply to "${card.title}"`);
    } else if (isSlack) {
      onActionClick(`Respond to ${card.subtitle || "message"} in ${card.title}`);
    } else if (isCalendar) {
      onActionClick(`Reschedule event "${card.title}"`);
    } else if (isWhatsApp) {
      onActionClick(`Draft WhatsApp reply to ${card.title}`);
    }
  };

  return (
    <div className="rounded-[18px] bg-[#161B22]/90 border border-[#30363D] hover:border-[#4B5563] p-3.5 flex flex-col justify-between space-y-2.5 transition-all shadow-sm hover:shadow-md group">
      {/* Top Header Row with App Squircle Icon */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-7 h-7 flex items-center justify-center bg-[#0D1117] border border-[#30363D] shrink-0 p-1"
            style={{ borderRadius: "30%" }}
          >
            <SocialIcon name={appIconName} size={16} className="w-4 h-4 object-contain" />
          </div>

          <div className="min-w-0">
            <h4 className="text-xs sm:text-[13px] font-[652] text-white tracking-tight truncate leading-tight">
              {card.title}
            </h4>
            {card.subtitle && (
              <span className="text-[11px] text-[#9CA3AF] truncate block font-[400] mt-0.5">
                {card.subtitle}
              </span>
            )}
          </div>
        </div>

        {card.timestamp && (
          <span className="text-[10px] text-[#6B7280] font-mono shrink-0">
            {card.timestamp}
          </span>
        )}
      </div>

      {/* Snippet / Description */}
      {card.snippet && (
        <p className="text-[11px] text-[#D1D5DB] line-clamp-2 leading-relaxed font-[300] bg-[#0D1117]/60 p-2 rounded-lg border border-[#1F2937]">
          {card.snippet}
        </p>
      )}

      {/* Attendees for Calendar Card */}
      {isCalendar && card.attendees && card.attendees.length > 0 && (
        <div className="flex items-center gap-1.5 text-[10px] text-[#9CA3AF]">
          <Users className="w-3 h-3 text-[#6B7280]" />
          <span className="truncate">
            {card.attendees.length} Attendees ({card.attendees.slice(0, 2).join(", ")}
            {card.attendees.length > 2 ? "..." : ""})
          </span>
        </div>
      )}

      {/* Action Button Row */}
      <div className="pt-1.5 border-t border-[#1F2937] flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-wider font-[600] text-[#6B7280]">
          {card.type.toUpperCase()} CITATION
        </span>

        <button
          type="button"
          onClick={handleAction}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0D1117] hover:bg-[#1F2937] text-white text-[11px] font-[600] border border-[#30363D] hover:border-[#0066FF] transition-all cursor-pointer group-hover:bg-[#0066FF] group-hover:text-white"
        >
          <span>{card.actionLabel || (isEmail ? "Draft Reply" : isSlack ? "Open Thread" : isCalendar ? "Reschedule" : "Reply")}</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
