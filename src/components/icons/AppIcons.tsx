"use client";

import React, { useState } from "react";

export interface IconProps {
  className?: string;
  size?: number;
  alt?: string;
}

export type SocialIconName =
  | "gmail"
  | "slack"
  | "whatsapp"
  | "telegram"
  | "outlook"
  | "gcal"
  | "notion"
  | "discord"
  | "linkedin";

interface SocialIconProps extends IconProps {
  name: SocialIconName | string;
}

export function resolveSocialIconName(name: string): string {
  const clean = name.toLowerCase().trim();
  switch (clean) {
    case "gcal":
    case "google-calendar":
    case "google_calendar":
    case "calendar":
    case "meet":
      return "gcal";
    case "gmail":
    case "google-workspace":
    case "workspace":
    case "mail":
    case "email":
      return "gmail";
    case "slack":
      return "slack";
    case "whatsapp":
    case "wa":
      return "whatsapp";
    case "telegram":
    case "tg":
      return "telegram";
    case "outlook":
    case "microsoft":
    case "microsoft-365":
    case "office":
    case "m365":
      return "outlook";
    case "notion":
      return "notion";
    case "discord":
      return "discord";
    case "linkedin":
    case "in":
      return "linkedin";
    default:
      return clean;
  }
}

/**
 * SocialIcon loads brand icons directly from /icons/social/{name}.svg (with /icons/social/{name}.png fallback).
 * Users can easily customize or replace icons by dropping new files into public/icons/social/.
 */
export function SocialIcon({
  name,
  className = "w-6 h-6",
  size = 24,
  alt,
}: SocialIconProps) {
  const [srcType, setSrcType] = useState<"svg" | "png" | "fallback">("svg");
  const normalized = resolveSocialIconName(name);

  const handleError = () => {
    if (srcType === "svg") {
      setSrcType("png");
    } else {
      setSrcType("fallback");
    }
  };

  const imageSrc =
    srcType === "svg"
      ? `/icons/social/${normalized}.svg`
      : `/icons/social/${normalized}.png`;

  return (
    <img
      src={imageSrc}
      alt={alt || `${normalized} icon`}
      width={size}
      height={size}
      onError={handleError}
      className={`inline-block object-contain select-none shrink-0 ${className}`}
      loading="lazy"
      decoding="async"
    />
  );
}

// Individual named wrappers for seamless drop-in usage across all components
export function GmailIcon(props: IconProps) {
  return <SocialIcon name="gmail" alt="Gmail" {...props} />;
}

export function SlackIcon(props: IconProps) {
  return <SocialIcon name="slack" alt="Slack" {...props} />;
}

export function WhatsAppIcon(props: IconProps) {
  return <SocialIcon name="whatsapp" alt="WhatsApp" {...props} />;
}

export function TelegramIcon(props: IconProps) {
  return <SocialIcon name="telegram" alt="Telegram" {...props} />;
}

export function OutlookIcon(props: IconProps) {
  return <SocialIcon name="outlook" alt="Microsoft Outlook" {...props} />;
}

export function GCalIcon(props: IconProps) {
  return <SocialIcon name="gcal" alt="Google Calendar" {...props} />;
}

export function NotionIcon(props: IconProps) {
  return <SocialIcon name="notion" alt="Notion" {...props} />;
}

export function DiscordIcon(props: IconProps) {
  return <SocialIcon name="discord" alt="Discord" {...props} />;
}

export function LinkedInIcon(props: IconProps) {
  return <SocialIcon name="linkedin" alt="LinkedIn" {...props} />;
}
