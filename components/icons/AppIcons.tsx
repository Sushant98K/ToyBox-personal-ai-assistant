import React from "react";

export interface IconProps {
  className?: string;
  size?: number;
}

// Gmail Icon
export function GmailIcon({ className = "w-6 h-6", size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M2 6.5V17.5C2 18.6 2.9 19.5 4 19.5H6.5V11L12 15L17.5 11V19.5H20C21.1 19.5 22 18.6 22 17.5V6.5C22 5.07 20.37 4.24 19.22 5.14L12 10.75L4.78 5.14C3.63 4.24 2 5.07 2 6.5Z"
        fill="#EA4335"
      />
      <path
        d="M20 6.5V7.5L12 13.5L4 7.5V6.5C4 6.3 4.1 6.1 4.28 6L12 12L19.72 6C19.9 6.1 20 6.3 20 6.5Z"
        fill="#C5221F"
      />
    </svg>
  );
}

// Slack Icon
export function SlackIcon({ className = "w-6 h-6", size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Top Left - Blue */}
      <path
        d="M5.042 10.02a2.012 2.012 0 1 1 0-4.024 2.012 2.012 0 0 1 0 4.024z"
        fill="#36C5F0"
      />
      <path
        d="M6.048 10.02a2.012 2.012 0 0 1-2.012 2.012H2.012a2.012 2.012 0 1 1 0-4.024h2.024a2.012 2.012 0 0 1 2.012 2.012z"
        fill="#36C5F0"
      />
      {/* Top Right - Green */}
      <path
        d="M10.02 5.042a2.012 2.012 0 1 1-4.024 0 2.012 2.012 0 0 1 4.024 0z"
        fill="#2EB67D"
      />
      <path
        d="M10.02 6.048a2.012 2.012 0 0 1 2.012-2.012h2.024a2.012 2.012 0 1 1 0 4.024h-2.024a2.012 2.012 0 0 1-2.012-2.012z"
        fill="#2EB67D"
      />
      {/* Bottom Right - Yellow */}
      <path
        d="M18.958 13.98a2.012 2.012 0 1 1 0 4.024 2.012 2.012 0 0 1 0-4.024z"
        fill="#ECB22E"
      />
      <path
        d="M17.952 13.98a2.012 2.012 0 0 1 2.012-2.012h2.024a2.012 2.012 0 1 1 0 4.024h-2.024a2.012 2.012 0 0 1-2.012-2.012z"
        fill="#ECB22E"
      />
      {/* Bottom Left - Red */}
      <path
        d="M13.98 18.958a2.012 2.012 0 1 1 4.024 0 2.012 2.012 0 0 1-4.024 0z"
        fill="#E01E5A"
      />
      <path
        d="M13.98 17.952a2.012 2.012 0 0 1-2.012 2.012H9.944a2.012 2.012 0 1 1 0-4.024h2.024a2.012 2.012 0 0 1 2.012 2.012z"
        fill="#E01E5A"
      />
    </svg>
  );
}

// WhatsApp Icon
export function WhatsAppIcon({ className = "w-6 h-6", size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="12" cy="12" r="11" fill="#25D366" />
      <path
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.967-.94 1.165-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.569-.346z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

// Telegram Icon
export function TelegramIcon({ className = "w-6 h-6", size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="12" cy="12" r="11" fill="#2AABEE" />
      <path
        d="M6.8 11.95L15.9 8.2c.42-.18.8.08.66.72l-1.55 7.3c-.11.53-.43.66-.87.41l-2.4-1.77-1.16 1.12c-.13.13-.24.24-.48.24l.17-2.45 4.47-4.04c.19-.17-.04-.27-.3-.1L8.9 13.13 6.52 12.4c-.52-.16-.53-.52.28-.45z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

// Outlook Icon
export function OutlookIcon({ className = "w-6 h-6", size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="7" y="5" width="14" height="14" rx="2" fill="#0078D4" />
      <path
        d="M21 7.5L14 12.5L7 7.5V5.5C7 4.67 7.67 4 8.5 4H19.5C20.33 4 21 4.67 21 5.5V7.5Z"
        fill="#28A8EA"
      />
      <rect x="3" y="6" width="10" height="12" rx="2.5" fill="#0078D4" />
      <circle cx="8" cy="12" r="3" stroke="#FFFFFF" strokeWidth="2" fill="none" />
    </svg>
  );
}
