"use client";

import { LiveNotificationFeed } from "@/components/ui/live-notification-feed";
import type { LiveNotification } from "@/components/ui/live-notification-feed";

const settings = {
  autoplay: true,
  interval: 1500,
  initial: 3,
  loop: true,
};

const NOTIFICATIONS: LiveNotification[] = [
  {
    id: "payment",
    kind: "payment",
    app: "Wallet",
    title: "Money received",
    body: "Mina Park sent you her half of dinner.",
    time: "18m",
    accent: "#10b981",
    read: true,
    amount: 48.5,
    currency: "USD",
  },
  {
    id: "calendar",
    kind: "calendar",
    app: "Calendar",
    title: "Design review",
    body: "Thursday · 10:00 – 10:30 · Room 4B",
    time: "9m",
    accent: "#ef4444",
    date: "2026-10-15",
    attendees: ["Ava Chen", "Noah Kim", "Mia Lopez", "Leo Park", "Zoe Adams"],
    actions: [
      { label: "Accept", done: "Accepted" },
      { label: "Decline", done: "Declined" },
    ],
  },
  {
    id: "fitness",
    kind: "fitness",
    app: "Health",
    title: "Move goal closed",
    body: "Six days in a row. Keep the streak going.",
    time: "2m",
    accent: "#ec4899",
    value: 620,
    goal: 600,
    unit: "kcal",
    streak: 6,
  },
  {
    id: "parcel",
    kind: "delivery",
    app: "Parcel",
    title: "Out for delivery",
    body: "Order #4821 arrives today by 6 PM.",
    accent: "#f59e0b",
    steps: ["Packed", "Shipped", "On the way", "Delivered"],
    step: 2,
  },
  {
    id: "message",
    kind: "message",
    app: "Messages",
    title: "Jules Moreau",
    accent: "#3b82f6",
    from: "Jules Moreau",
    text: "Running five minutes late. Grab us a table by the window?",
  },
  {
    id: "code",
    kind: "code",
    app: "Account",
    title: "Your sign-in code",
    body: "Never share it, not even with support.",
    accent: "#6366f1",
    code: "482913",
    expiresIn: 300,
  },
  {
    id: "ride",
    kind: "ride",
    app: "Ride",
    title: "Your driver is almost here",
    body: "Meet them at the north entrance.",
    accent: "#a855f7",
    minutes: 2,
    vehicle: "White sedan",
    plate: "7KX 204",
  },
  {
    id: "flight",
    kind: "flight",
    app: "Airline",
    title: "Gate changed",
    body: "KE 703 to Tokyo · Boarding 14:20",
    accent: "#0ea5e9",
    from: "ICN",
    to: "NRT",
    gate: "C4",
    previousGate: "B12",
  },
];

const GLOWS = [
  { className: "left-[8%] top-[10%] size-72", color: "#f59e0b" },
  { className: "right-[6%] top-[22%] size-80", color: "#6366f1" },
  { className: "bottom-[6%] left-[18%] size-72", color: "#ec4899" },
  { className: "bottom-[14%] right-[16%] size-64", color: "#0ea5e9" },
];

const CCGATHER_URL = "https://ccgather.com/?utm_source=21st&utm_medium=component&utm_campaign=live_notification_feed";

export default function Demo(props: Partial<typeof settings>) {
  const s = { ...settings, ...props };
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center gap-5 overflow-hidden bg-background p-6 text-foreground">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-25">
        {GLOWS.map((glow) => (
          <span key={glow.color} className={`absolute rounded-full blur-3xl ${glow.className}`} style={{ background: glow.color }} />
        ))}
      </div>
      <LiveNotificationFeed items={NOTIFICATIONS} autoplay={s.autoplay} interval={s.interval} initial={s.initial} loop={s.loop} className="relative max-w-md" />
      <p className="relative max-w-md text-center text-xs text-muted-foreground">
        Each notification acts out its news as it lands. Hover to pause, click a card to replay it.{" "}
        <a href={CCGATHER_URL} target="_blank" rel="noreferrer" className="underline underline-offset-4 transition-colors hover:text-foreground">
          By the CCgather team
        </a>
      </p>
    </div>
  );
}
