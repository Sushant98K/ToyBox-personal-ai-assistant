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
  | "notion";

interface SocialIconProps extends IconProps {
  name: SocialIconName | string;
}

/**
 * SocialIcon loads brand icons directly from /icons/social/{name}.png (with /icons/social/{name}.svg fallback).
 * Users can easily customize or replace icons by dropping new files into public/icons/social/.
 */
export function SocialIcon({
  name,
  className = "w-6 h-6",
  size = 24,
  alt,
}: SocialIconProps) {
  const [srcType, setSrcType] = useState<"png" | "svg" | "fallback">("png");
  const normalized = name.toLowerCase().trim();

  const handleError = () => {
    if (srcType === "png") {
      setSrcType("svg");
    } else {
      setSrcType("fallback");
    }
  };

  const imageSrc =
    srcType === "png"
      ? `/icons/social/${normalized}.png`
      : `/icons/social/${normalized}.svg`;

  return (
    <img
      src={imageSrc}
      alt={alt || `${normalized} icon`}
      width={size}
      height={size}
      onError={handleError}
      className={`inline-block object-contain select-none ${className}`}
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
