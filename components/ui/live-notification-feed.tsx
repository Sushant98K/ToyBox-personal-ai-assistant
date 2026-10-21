"use client";

import * as React from "react";

export interface NotificationAction {
  label: string;
  /** Shown in place of the buttons once this action is picked, e.g. "Accepted". */
  done?: string;
}

interface NotificationBase {
  id: string;
  /** Service name shown above the title. */
  app: string;
  title: string;
  body?: string;
  /** Age label such as "4m". Items that land while the feed is open read "now". */
  time?: string;
  /** Brand color for the service tile and the live detail. Any CSS color. */
  accent?: string;
  read?: boolean;
  actions?: NotificationAction[];
}

export type MessageNotification = NotificationBase & { kind: "message"; from: string; text: string };
export type DeliveryNotification = NotificationBase & { kind: "delivery"; steps: string[]; step: number };
export type RideNotification = NotificationBase & { kind: "ride"; minutes: number; vehicle: string; plate: string };
export type PaymentNotification = NotificationBase & { kind: "payment"; amount: number; currency?: string; locale?: string };
export type CalendarNotification = NotificationBase & { kind: "calendar"; date: string; attendees?: string[]; locale?: string };
export type CodeNotification = NotificationBase & { kind: "code"; code: string; expiresIn?: number };
export type FlightNotification = NotificationBase & { kind: "flight"; from: string; to: string; gate: string; previousGate?: string };
export type FitnessNotification = NotificationBase & { kind: "fitness"; value: number; goal: number; unit: string; streak?: number };

export type LiveNotification =
  | MessageNotification
  | DeliveryNotification
  | RideNotification
  | PaymentNotification
  | CalendarNotification
  | CodeNotification
  | FlightNotification
  | FitnessNotification;

export type NotificationKind = LiveNotification["kind"];

export interface LiveNotificationFeedProps extends React.ComponentProps<"div"> {
  /** Notifications in the order they arrived. The newest sits on top, and items appended later land with their story. */
  items: LiveNotification[];
  title?: string;
  /** Replay the items one by one as if they were arriving now, for demos and landing pages. Off by default, so real notifications show as given. */
  autoplay?: boolean;
  /** With autoplay, how many items are already in the feed when it starts. */
  initial?: number;
  /** Milliseconds between arrivals while autoplaying. */
  interval?: number;
  /** With autoplay, clear the feed and start again after the last arrival. */
  loop?: boolean;
  /** Height of the scrolling list, any CSS length. */
  height?: string;
  onOpen?: (id: string) => void;
  onAction?: (id: string, label: string) => void;
  onDismiss?: (id: string) => void;
}

interface Entry {
  id: string;
  key: string;
  play: number;
  fresh: boolean;
  leaving: boolean;
  arrived: boolean;
  delay: number;
  leaveDelay: number;
}

type StoryProps = {
  play: number;
  delay: number;
  reduced: boolean;
};

const FIRST_ARRIVAL_MS = 450;
const ENTER_MS = 460;
const LEAVE_MS = 340;
const SWEEP_STAGGER_MS = 60;
const STORY_DELAY_MS = 260;
const RESTART_HOLD = 2.2;
const TYPING_MS = 1000;
const RIDE_MS = 1100;
const ROUTE_MS = 1700;
const RING_MS = 1100;
const SPIN_MS = 320;
const SPRING = "cubic-bezier(0.2, 0.9, 0.25, 1.12)";
const SETTLE = "cubic-bezier(0.2, 0.8, 0.2, 1)";
const EXIT = "cubic-bezier(0.4, 0, 0.2, 1)";
const DEFAULT_HEIGHT = "min(440px, calc(100svh - 12rem))";
const TINT = "color-mix(in oklab, currentColor 15%, transparent)";
const REEL = Array.from({ length: 20 }, (_, i) => i % 10);
const FLAP_CHARS = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const ROUTE = "M12 44 C 44 44, 54 14, 98 17 S 158 46, 198 35 S 248 13, 284 16";
const ROUTE_FROM = 0.05;
const ROUTE_TO = 0.78;

const ICONS: { [K in NotificationKind]: string } = {
  message: "M5.5 19v-3.4A7 7 0 0 1 4 11.2C4 7.2 7.6 4 12 4s8 3.2 8 7.2-3.6 7.2-8 7.2a9 9 0 0 1-2.7-.4Z",
  delivery: "M4 8.2 12 4l8 4.2v7.6L12 20l-8-4.2Z M4 8.2l8 4.3 8-4.3 M12 12.5V20 M8 6.1l8 4.3",
  ride: "M5 16.5V12l1.8-4.2A2 2 0 0 1 8.6 6.5h6.8a2 2 0 0 1 1.8 1.3L19 12v4.5Z M4.5 12h15 M7.5 16.5v2 M16.5 16.5v2 M8.2 14.2h.01 M15.8 14.2h.01",
  payment: "M3.5 8a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z M3.5 10h17 M7 14.5h4",
  calendar: "M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z M4 10h16 M8.5 4v4 M15.5 4v4",
  code: "M12 3.5 19 6v5.5c0 4.2-2.9 7.7-7 9-4.1-1.3-7-4.8-7-9V6Z M9.5 11.5h5v4h-5Z M10.5 11.5V10a1.5 1.5 0 0 1 3 0v1.5",
  flight: "M3.5 12.5 20.5 5 15 20.5l-3.2-6.3Z M11.8 14.2 20.5 5",
  fitness: "M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.6 4.2 4.2 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z",
};

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

function parseDay(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year ?? 2000, (month ?? 1) - 1, day ?? 1);
}

function addDays(day: Date, amount: number) {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() + amount);
}

function staticEntry(id: string, generation: number, fresh = false, delay = 0): Entry {
  return { id, key: `${id}:${generation}`, play: 0, fresh, leaving: false, arrived: false, delay, leaveDelay: 0 };
}

function useReducedMotion() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

function Icon({ d, className }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const BELL = "M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 1.5h-15Z M10 20.5a2.2 2.2 0 0 0 4 0";
const CLOSE = "M7 7l10 10M17 7 7 17";
const CHECK = "M5 12.5l4.2 4.2L19 7";

function AppTile({ kind, accent, play, delay, reduced }: { kind: NotificationKind; accent?: string; play: number; delay: number; reduced: boolean }) {
  const ringRef = React.useRef(null as HTMLSpanElement | null);
  React.useEffect(() => {
    if (play === 0 || reduced) return;
    const animation = ringRef.current?.animate(
      [
        { transform: "scale(1)", opacity: 0.6 },
        { transform: "scale(1.75)", opacity: 0 },
      ],
      { duration: 900, delay, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)" },
    );
    return () => animation?.cancel();
  }, [play, delay, reduced]);
  return (
    <span data-tile className={cx("relative grid size-9 shrink-0 place-items-center rounded-xl", !accent && "text-primary")} style={{ color: accent, background: TINT }}>
      <Icon d={ICONS[kind]} className="size-[18px]" />
      <span ref={ringRef} aria-hidden className="pointer-events-none absolute inset-0 rounded-xl border-2 border-current opacity-0" />
    </span>
  );
}

function MessageDetail({ item, play, delay, reduced }: StoryProps & { item: MessageNotification }) {
  const animate = play > 0 && !reduced;
  const [typing, setTyping] = React.useState(animate);
  const wordsRef = React.useRef(null as HTMLSpanElement | null);
  const dotsRef = React.useRef(null as HTMLSpanElement | null);

  React.useEffect(() => {
    if (!animate) {
      setTyping(false);
      return;
    }
    setTyping(true);
    const timer = window.setTimeout(() => setTyping(false), delay + TYPING_MS);
    return () => window.clearTimeout(timer);
  }, [play, animate, delay]);

  React.useEffect(() => {
    if (!typing) return;
    const bounce = Array.from(dotsRef.current?.children ?? []).map((dot, i) =>
      dot.animate(
        [
          { transform: "translateY(0)", opacity: 0.35 },
          { transform: "translateY(-3px)", opacity: 1 },
          { transform: "translateY(0)", opacity: 0.35 },
        ],
        { duration: 760, delay: i * 130, iterations: Infinity, easing: "ease-in-out" },
      ),
    );
    return () => bounce.forEach((animation) => animation.cancel());
  }, [typing]);

  React.useEffect(() => {
    if (!animate || typing) return;
    const reveal = Array.from(wordsRef.current?.children ?? []).map((word, i) =>
      word.animate(
        [
          { opacity: 0, transform: "translateY(4px)", filter: "blur(2px)" },
          { opacity: 1, transform: "none", filter: "blur(0)" },
        ],
        { duration: 260, delay: i * 40, easing: "ease-out", fill: "backwards" },
      ),
    );
    return () => reveal.forEach((animation) => animation.cancel());
  }, [typing, animate]);

  const words = item.text.split(/\s+/).filter(Boolean);
  return (
    <div data-detail="message" className="flex items-end gap-2">
      <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-semibold" style={{ background: TINT }}>
        {initialsOf(item.from)}
      </span>
      <div className="min-w-0 rounded-2xl rounded-bl-md bg-muted px-3 py-2 text-[13px] leading-snug text-foreground">
        {typing ? (
          <span ref={dotsRef} aria-hidden data-typing className="flex h-[18px] items-center gap-1">
            <span className="size-1.5 rounded-full bg-muted-foreground" />
            <span className="size-1.5 rounded-full bg-muted-foreground" />
            <span className="size-1.5 rounded-full bg-muted-foreground" />
          </span>
        ) : (
          <span ref={wordsRef} data-text>
            {words.map((word, i) => (
              <React.Fragment key={i}>
                {i > 0 && " "}
                <span className="inline-block">{word}</span>
              </React.Fragment>
            ))}
          </span>
        )}
      </div>
    </div>
  );
}

function DeliveryDetail({ item, play, delay, reduced }: StoryProps & { item: DeliveryNotification }) {
  const animate = play > 0 && !reduced;
  const n = Math.max(1, item.steps.length);
  const step = Math.min(Math.max(0, Math.round(item.step)), n - 1);
  const at = (i: number) => (n > 1 ? (i / (n - 1)) * 100 : 100);
  const [progress, setProgress] = React.useState(() => at(step));
  const [moving, setMoving] = React.useState(false);
  const parcelRef = React.useRef(null as HTMLSpanElement | null);

  React.useEffect(() => {
    const target = n > 1 ? (step / (n - 1)) * 100 : 100;
    if (!animate) {
      setMoving(false);
      setProgress(target);
      return;
    }
    const from = n > 1 ? (Math.max(0, step - 1) / (n - 1)) * 100 : 0;
    const start = Math.max(80, delay);
    setMoving(false);
    setProgress(from);
    const go = window.setTimeout(() => {
      setMoving(true);
      setProgress(target);
    }, start);
    const land = window.setTimeout(() => {
      parcelRef.current?.animate(
        [
          { transform: "translateY(0) rotate(0deg)" },
          { transform: "translateY(-6px) rotate(-8deg)" },
          { transform: "translateY(0) rotate(0deg)" },
          { transform: "translateY(-2px) rotate(0deg)" },
          { transform: "translateY(0) rotate(0deg)" },
        ],
        { duration: 480, easing: "ease-out" },
      );
    }, start + RIDE_MS - 60);
    return () => {
      window.clearTimeout(go);
      window.clearTimeout(land);
    };
  }, [play, animate, delay, step, n]);

  const ease = "cubic-bezier(0.55, 0, 0.25, 1)";
  const transition = moving ? `left ${RIDE_MS}ms ${ease}, width ${RIDE_MS}ms ${ease}` : "none";
  return (
    <div data-detail="delivery" className="px-2">
      <div className="relative h-6">
        <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-muted" />
        <span data-fill className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full" style={{ width: `${progress}%`, background: "currentColor", transition }} />
        {item.steps.map((label, i) => {
          const reached = at(i) <= progress + 0.01;
          return (
            <span
              key={`${label}-${i}`}
              data-stop={i}
              data-reached={reached ? "" : undefined}
              className={cx("absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card", !reached && "bg-muted-foreground/30")}
              style={{
                left: `${at(i)}%`,
                background: reached ? "currentColor" : undefined,
                transition: moving && i === step ? `background-color 160ms ease ${RIDE_MS - 80}ms` : undefined,
              }}
            />
          );
        })}
        <span data-parcel className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${progress}%`, transition }}>
          <span ref={parcelRef} className="grid size-5 place-items-center rounded-md shadow-[0_2px_6px_-1px_rgba(0,0,0,0.35)]" style={{ background: "currentColor" }}>
            <svg viewBox="0 0 16 16" aria-hidden className="size-3 text-white" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round">
              <path d="M3 5.4 8 3l5 2.4v5.2L8 13l-5-2.4Z M3 5.4 8 7.8l5-2.4 M8 7.8V13" />
            </svg>
          </span>
        </span>
      </div>
      <div className="relative mt-1 h-3.5">
        {item.steps.map((label, i) => (
          <span
            key={`${label}-${i}`}
            className={cx("absolute top-0 whitespace-nowrap text-[10px] leading-none", i === step ? "font-medium text-foreground" : "text-muted-foreground")}
            style={{ left: `${at(i)}%`, transform: `translateX(${i === 0 ? "0" : i === n - 1 ? "-100%" : "-50%"})` }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function RideDetail({ item, play, delay, reduced }: StoryProps & { item: RideNotification }) {
  const animate = play > 0 && !reduced;
  const pathRef = React.useRef(null as SVGPathElement | null);
  const trailRef = React.useRef(null as SVGPathElement | null);
  const carRef = React.useRef(null as SVGGElement | null);
  const pinRef = React.useRef(null as SVGCircleElement | null);
  const [eta, setEta] = React.useState(item.minutes);

  React.useLayoutEffect(() => {
    const path = pathRef.current;
    const trail = trailRef.current;
    const car = carRef.current;
    if (!path || !trail || !car) return;
    const total = path.getTotalLength();
    trail.style.strokeDasharray = `${total}`;
    const place = (t: number) => {
      const length = total * t;
      const point = path.getPointAtLength(length);
      const ahead = path.getPointAtLength(Math.min(total, length + 1));
      const angle = (Math.atan2(ahead.y - point.y, ahead.x - point.x) * 180) / Math.PI;
      car.setAttribute("transform", `translate(${point.x} ${point.y}) rotate(${angle})`);
      car.style.opacity = "1";
      trail.style.strokeDashoffset = `${total - length}`;
    };
    if (!animate) {
      place(ROUTE_TO);
      setEta(item.minutes);
      return;
    }
    const extra = 3;
    place(ROUTE_FROM);
    setEta(item.minutes + extra);
    const pulse = pinRef.current?.animate(
      [
        { transform: "scale(1)", opacity: 0.35 },
        { transform: "scale(2.2)", opacity: 0 },
      ],
      { duration: 1100, delay, iterations: 2, easing: "ease-out" },
    );
    const start = performance.now() + Math.max(80, delay);
    let frame = 0;
    const tick = (now: number) => {
      const k = Math.min(1, Math.max(0, (now - start) / ROUTE_MS));
      const eased = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      place(ROUTE_FROM + (ROUTE_TO - ROUTE_FROM) * eased);
      setEta(item.minutes + Math.round(extra * (1 - eased)));
      if (k < 1) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frame);
      pulse?.cancel();
    };
  }, [play, animate, delay, item.minutes]);

  return (
    <div data-detail="ride" data-eta={eta}>
      <div className="relative overflow-hidden rounded-xl border border-border bg-muted/60">
        <svg viewBox="0 0 300 60" aria-hidden className="block h-auto w-full">
          <g className="text-border" stroke="currentColor" strokeWidth={6} strokeLinecap="round" fill="none">
            <path d="M-10 30 H 310" />
            <path d="M70 -10 V 70" />
            <path d="M176 -10 V 70" />
            <path d="M232 -10 L 300 54" />
          </g>
          <path ref={pathRef} d={ROUTE} fill="none" className="text-muted-foreground" stroke="currentColor" strokeWidth={2} strokeDasharray="1 5" strokeLinecap="round" opacity={0.7} />
          <path ref={trailRef} d={ROUTE} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
          <g transform="translate(284 16)">
            <circle ref={pinRef} r={6} fill="currentColor" opacity={0} style={{ transformBox: "fill-box", transformOrigin: "center" }} />
            <circle r={4.5} fill="currentColor" stroke="white" strokeWidth={2} />
          </g>
          <g ref={carRef} data-car style={{ opacity: 0 }}>
            <rect x={-8} y={-5} width={16} height={10} rx={3.5} fill="currentColor" />
            <rect x={2} y={-3.5} width={3.5} height={7} rx={1.2} fill="white" opacity={0.85} />
          </g>
        </svg>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
        <span data-eta-chip className="rounded-full px-2 py-0.5 font-semibold tabular-nums" style={{ background: TINT }}>
          <span className="text-foreground">{eta} min</span>
        </span>
        <span className="rounded-full border border-border px-2 py-0.5 font-mono font-medium text-foreground">{item.plate}</span>
        <span className="text-muted-foreground">{item.vehicle}</span>
      </div>
    </div>
  );
}

function PaymentDetail({ item, play, delay, reduced }: StoryProps & { item: PaymentNotification }) {
  const animate = play > 0 && !reduced;
  const formatted = React.useMemo(
    () => new Intl.NumberFormat(item.locale ?? "en-US", { style: "currency", currency: item.currency ?? "USD" }).format(Math.abs(item.amount)),
    [item.amount, item.currency, item.locale],
  );
  const text = `${item.amount < 0 ? "−" : "+"}${formatted}`;
  const [rolled, setRolled] = React.useState(!animate);
  const badgeRef = React.useRef(null as HTMLSpanElement | null);
  const chars = Array.from(text);
  const digitCount = chars.filter((ch) => /\d/.test(ch)).length;
  const rollMs = (order: number) => 900 + order * 110;

  React.useEffect(() => {
    if (!animate) {
      setRolled(true);
      return;
    }
    setRolled(false);
    const start = Math.max(80, delay);
    const timer = window.setTimeout(() => setRolled(true), start);
    const pop = badgeRef.current?.animate(
      [
        { transform: "scale(0)", opacity: 0 },
        { transform: "scale(1.25)", opacity: 1, offset: 0.6 },
        { transform: "scale(1)", opacity: 1 },
      ],
      { duration: 380, delay: start + rollMs(Math.max(0, digitCount - 1)), easing: "ease-out", fill: "backwards" },
    );
    return () => {
      window.clearTimeout(timer);
      pop?.cancel();
    };
  }, [play, animate, delay, digitCount]);

  let order = 0;
  return (
    <div data-detail="payment" data-amount={text} className="flex items-center gap-2">
      <span className="sr-only">{text}</span>
      <span aria-hidden className="flex items-baseline text-2xl font-semibold leading-none tracking-tight text-foreground tabular-nums">
        {chars.map((ch, i) => {
          if (!/\d/.test(ch)) return <span key={i}>{ch}</span>;
          const digit = Number(ch);
          const index = order++;
          return (
            <span key={i} className="relative inline-block h-[1.15em] overflow-hidden leading-[1.15]">
              <span className="invisible">0</span>
              <span
                data-reel={digit}
                className="absolute inset-x-0 top-0 flex flex-col"
                style={{
                  transform: `translateY(-${(rolled ? 10 + digit : 0) * 1.15}em)`,
                  transition: rolled && animate ? `transform ${rollMs(index)}ms cubic-bezier(0.15, 0.85, 0.25, 1)` : "none",
                }}
              >
                {REEL.map((n, k) => (
                  <span key={k}>{n}</span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
      <span ref={badgeRef} aria-hidden className="grid size-5 place-items-center rounded-full" style={{ background: "currentColor" }}>
        <Icon d={CHECK} className="size-3 text-white" />
      </span>
    </div>
  );
}

function DateSheet({ day, locale }: { day: Date; locale: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-lg border border-border bg-card shadow-sm" style={{ transformOrigin: "50% 0%", backfaceVisibility: "hidden" }}>
      <div style={{ background: "currentColor" }}>
        <span className="block text-center text-[9px] font-semibold uppercase leading-[15px] tracking-wide text-white">{day.toLocaleDateString(locale, { month: "short" })}</span>
      </div>
      <div className="flex flex-col items-center pt-1">
        <span className="text-lg font-semibold leading-none text-foreground tabular-nums">{day.getDate()}</span>
        <span className="mt-0.5 text-[9px] uppercase leading-none text-muted-foreground">{day.toLocaleDateString(locale, { weekday: "short" })}</span>
      </div>
    </div>
  );
}

function CalendarDetail({ item, play, delay, reduced }: StoryProps & { item: CalendarNotification }) {
  const animate = play > 0 && !reduced;
  const locale = item.locale ?? "en-US";
  const event = React.useMemo(() => parseDay(item.date), [item.date]);
  const torn = React.useMemo(() => [1, 2, 3, 4].map((back) => addDays(event, -back)), [event]);
  const sheetsRef = React.useRef(null as HTMLDivElement | null);
  const peopleRef = React.useRef(null as HTMLDivElement | null);
  const people = item.attendees ?? [];

  React.useEffect(() => {
    if (!animate) return;
    const start = Math.max(80, delay);
    const sheets = Array.from(sheetsRef.current?.children ?? []);
    const tears = sheets.map((sheet, i) =>
      sheet.animate(
        [
          { transform: "rotateX(0deg) translateY(0)", opacity: 1 },
          { transform: "rotateX(-70deg) translateY(-3px)", opacity: 1, offset: 0.55 },
          { transform: "rotateX(-110deg) translateY(-12px)", opacity: 0 },
        ],
        { duration: 300, delay: start + (sheets.length - 1 - i) * 150, easing: "cubic-bezier(0.4, 0, 0.6, 1)", fill: "both" },
      ),
    );
    const afterTears = start + sheets.length * 150 + 120;
    const pops = Array.from(peopleRef.current?.children ?? []).map((person, i) =>
      person.animate(
        [
          { transform: "scale(0)", opacity: 0 },
          { transform: "scale(1.15)", opacity: 1, offset: 0.6 },
          { transform: "scale(1)", opacity: 1 },
        ],
        { duration: 320, delay: afterTears + i * 90, easing: "ease-out", fill: "backwards" },
      ),
    );
    return () => [...tears, ...pops].forEach((animation) => animation.cancel());
  }, [play, animate, delay]);

  return (
    <div data-detail="calendar" className="flex items-center gap-3">
      <div className="relative h-14 w-12 shrink-0 [perspective:420px]">
        <DateSheet day={event} locale={locale} />
        {animate && (
          <div ref={sheetsRef} data-sheets className="absolute inset-0">
            {torn.map((day) => (
              <DateSheet key={day.getTime()} day={day} locale={locale} />
            ))}
          </div>
        )}
      </div>
      {people.length > 0 && (
        <div className="flex items-center">
          <div ref={peopleRef} className="flex -space-x-1.5">
            {people.slice(0, 3).map((name) => (
              <span key={name} className="grid size-6 place-items-center rounded-full border-2 border-card bg-muted text-[9px] font-semibold text-foreground">
                {initialsOf(name)}
              </span>
            ))}
          </div>
          {people.length > 3 && <span className="ml-1.5 text-[11px] text-muted-foreground">+{people.length - 3}</span>}
        </div>
      )}
    </div>
  );
}

function CodeDetail({ item, play, delay, reduced }: StoryProps & { item: CodeNotification }) {
  const animate = play > 0 && !reduced;
  const digits = Array.from(item.code);
  const total = Math.max(0, Math.round(item.expiresIn ?? 0));
  const [left, setLeft] = React.useState(total);
  const [copy, setCopy] = React.useState<"idle" | "done" | "blocked">("idle");
  const slotsRef = React.useRef(null as HTMLSpanElement | null);

  React.useEffect(() => {
    const slots = Array.from(slotsRef.current?.querySelectorAll("[data-digit]") ?? []);
    const settle = () => slots.forEach((slot, i) => (slot.textContent = item.code[i] ?? ""));
    if (!animate) {
      settle();
      return;
    }
    const timers: number[] = [];
    const spins: number[] = [];
    slots.forEach((slot, i) => {
      slot.textContent = "";
      timers.push(
        window.setTimeout(() => {
          const spin = window.setInterval(() => (slot.textContent = String(Math.floor(Math.random() * 10))), 45);
          spins.push(spin);
          timers.push(
            window.setTimeout(() => {
              window.clearInterval(spin);
              slot.textContent = item.code[i] ?? "";
              slot.parentElement?.animate([{ transform: "scale(1.2)" }, { transform: "scale(1)" }], { duration: 260, easing: "cubic-bezier(0.3, 1.6, 0.5, 1)" });
            }, SPIN_MS),
          );
        }, Math.max(80, delay) + i * 110),
      );
    });
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      spins.forEach((spin) => window.clearInterval(spin));
      settle();
    };
  }, [play, animate, delay, item.code]);

  React.useEffect(() => {
    setLeft(total);
    if (total <= 0) return;
    const started = Date.now();
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, total - Math.floor((Date.now() - started) / 1000));
      setLeft(remaining);
      if (remaining === 0) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [play, total]);

  React.useEffect(() => {
    if (copy === "idle") return;
    const timer = window.setTimeout(() => setCopy("idle"), 1600);
    return () => window.clearTimeout(timer);
  }, [copy]);

  const copyCode = (event: React.MouseEvent) => {
    event.stopPropagation();
    const clipboard = typeof navigator === "undefined" ? undefined : navigator.clipboard;
    if (!clipboard) {
      setCopy("blocked");
      return;
    }
    clipboard.writeText(item.code).then(
      () => setCopy("done"),
      () => setCopy("blocked"),
    );
  };

  const expired = total > 0 && left === 0;
  const half = Math.ceil(digits.length / 2);
  return (
    <div data-detail="code" data-left={left}>
      <div className="flex items-center gap-2">
        <span ref={slotsRef} role="img" aria-label={`Code ${digits.join(" ")}`} className="flex items-center gap-1">
          {digits.map((digit, i) => (
            <React.Fragment key={i}>
              {i === half && <span aria-hidden className="mx-0.5 h-px w-2 bg-border" />}
              <span className={cx("grid h-8 w-6 place-items-center rounded-md border border-border bg-background font-mono text-base font-semibold text-foreground", expired && "opacity-40")}>
                <span data-digit>{digit}</span>
              </span>
            </React.Fragment>
          ))}
        </span>
        <button
          type="button"
          data-copy={copy}
          onClick={copyCode}
          className="relative z-[1] ml-auto h-7 shrink-0 rounded-full border border-border bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {copy === "done" ? "Copied" : copy === "blocked" ? "Copy blocked" : "Copy"}
        </button>
      </div>
      {total > 0 && (
        <div className="mt-2 flex items-center gap-2">
          <span className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
            <span data-expiry className="block h-full rounded-full" style={{ width: `${(left / total) * 100}%`, background: "currentColor", transition: reduced ? "none" : "width 1s linear" }} />
          </span>
          <span className="text-[11px] tabular-nums text-muted-foreground">{expired ? "Expired" : `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`}</span>
        </div>
      )}
    </div>
  );
}

function FlightDetail({ item, play, delay, reduced }: StoryProps & { item: FlightNotification }) {
  const animate = play > 0 && !reduced;
  const target = item.gate.toUpperCase();
  const from = (item.previousGate ?? item.gate).toUpperCase().slice(-target.length).padStart(target.length, " ");
  const flapsRef = React.useRef(null as HTMLSpanElement | null);
  const planeRef = React.useRef(null as HTMLSpanElement | null);

  React.useEffect(() => {
    const cells = Array.from(flapsRef.current?.querySelectorAll("[data-flap]") ?? []);
    const settle = () => cells.forEach((cell, i) => (cell.textContent = target[i] ?? " "));
    if (!animate) {
      settle();
      return;
    }
    const start = Math.max(80, delay);
    const timers: number[] = [];
    const flips: Animation[] = [];
    cells.forEach((cell, i) => {
      cell.textContent = from[i] ?? " ";
      const a = FLAP_CHARS.indexOf(from[i] ?? " ");
      const b = FLAP_CHARS.indexOf(target[i] ?? " ");
      const distance = a < 0 || b < 0 ? 1 : (b - a + FLAP_CHARS.length) % FLAP_CHARS.length;
      const count = Math.min(distance, 8);
      for (let s = 0; s < count; s++) {
        const ch = FLAP_CHARS[(b - (count - 1 - s) + FLAP_CHARS.length) % FLAP_CHARS.length]!;
        timers.push(
          window.setTimeout(() => {
            cell.textContent = ch;
            flips.push(cell.animate([{ transform: "rotateX(-88deg)", filter: "brightness(1.8)" }, { transform: "rotateX(0deg)", filter: "brightness(1)" }], { duration: 70, easing: "ease-out" }));
          }, start + 200 + i * 90 + s * 75),
        );
      }
    });
    const taxi = planeRef.current?.animate([{ left: "10%" }, { left: "50%" }], { duration: 900, delay: start, easing: "cubic-bezier(0.3, 0.7, 0.2, 1)", fill: "backwards" });
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      flips.forEach((flip) => flip.cancel());
      taxi?.cancel();
      settle();
    };
  }, [play, animate, delay, target, from]);

  return (
    <div data-detail="flight" className="flex items-center gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-2 font-mono text-sm font-semibold text-foreground">
        <span>{item.from}</span>
        <span className="relative h-px flex-1 border-t border-dashed border-muted-foreground/40">
          <span ref={planeRef} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45">
            <Icon d={ICONS.flight} className="size-3.5" />
          </span>
        </span>
        <span>{item.to}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Gate</span>
        <span ref={flapsRef} data-gate={item.gate} className="flex gap-0.5 [perspective:200px]">
          {Array.from(target).map((ch, i) => (
            <span key={i} className="relative grid h-7 w-5 place-items-center overflow-hidden rounded-[4px] bg-foreground font-mono text-sm font-bold text-background">
              <span data-flap className="block">
                {ch}
              </span>
              <span aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-background/30" />
            </span>
          ))}
        </span>
        {item.previousGate && <span className="text-[11px] text-muted-foreground line-through">{item.previousGate}</span>}
      </div>
    </div>
  );
}

function FitnessDetail({ item, play, delay, reduced }: StoryProps & { item: FitnessNotification }) {
  const animate = play > 0 && !reduced;
  const ratio = item.goal > 0 ? Math.min(1, Math.max(0, item.value / item.goal)) : 0;
  const radius = 15;
  const circumference = 2 * Math.PI * radius;
  const streak = Math.max(0, Math.min(7, Math.round(item.streak ?? 0)));
  const [drawn, setDrawn] = React.useState(!animate);
  const ringRef = React.useRef(null as SVGSVGElement | null);
  const burstRef = React.useRef(null as HTMLSpanElement | null);
  const daysRef = React.useRef(null as HTMLSpanElement | null);

  React.useEffect(() => {
    if (!animate) {
      setDrawn(true);
      return;
    }
    setDrawn(false);
    const start = Math.max(80, delay);
    const timers = [window.setTimeout(() => setDrawn(true), start)];
    const effects: Animation[] = [];
    if (ratio >= 1) {
      timers.push(
        window.setTimeout(() => {
          const ring = ringRef.current?.animate([{ transform: "scale(1)" }, { transform: "scale(1.12)" }, { transform: "scale(1)" }], { duration: 380, easing: "ease-out" });
          if (ring) effects.push(ring);
          const dots = Array.from(burstRef.current?.children ?? []);
          dots.forEach((dot, i) => {
            const angle = (i / dots.length) * Math.PI * 2;
            effects.push(
              dot.animate(
                [
                  { transform: `translate(${Math.cos(angle) * 17}px, ${Math.sin(angle) * 17}px) scale(1)`, opacity: 1 },
                  { transform: `translate(${Math.cos(angle) * 28}px, ${Math.sin(angle) * 28}px) scale(0.3)`, opacity: 0 },
                ],
                { duration: 600, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)" },
              ),
            );
          });
          const today = streak > 0 ? daysRef.current?.children[streak - 1] : undefined;
          const pop = today?.animate([{ transform: "scale(0)" }, { transform: "scale(1.35)" }, { transform: "scale(1)" }], { duration: 420, easing: "ease-out" });
          if (pop) effects.push(pop);
        }, start + RING_MS - 100),
      );
    }
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      effects.forEach((effect) => effect.cancel());
    };
  }, [play, animate, delay, ratio, streak]);

  return (
    <div data-detail="fitness" data-drawn={drawn ? "" : undefined} className="flex items-center gap-3">
      <span className="relative grid size-11 shrink-0 place-items-center">
        <svg ref={ringRef} viewBox="0 0 40 40" aria-hidden className="size-11">
          <g transform="rotate(-90 20 20)">
            <circle cx={20} cy={20} r={radius} fill="none" stroke="currentColor" strokeOpacity={0.16} strokeWidth={5} />
            <circle
              data-ring
              cx={20}
              cy={20}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - (drawn ? ratio : 0))}
              style={{ transition: animate && drawn ? `stroke-dashoffset ${RING_MS}ms cubic-bezier(0.3, 0.7, 0.2, 1)` : "none" }}
            />
          </g>
        </svg>
        <span ref={burstRef} aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
          {Array.from({ length: 8 }, (_, i) => (
            <span key={i} className="absolute size-1.5 rounded-full opacity-0" style={{ background: "currentColor" }} />
          ))}
        </span>
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold tabular-nums text-foreground">
          {item.value.toLocaleString("en-US")}
          <span className="font-normal text-muted-foreground">
            {" "}
            / {item.goal.toLocaleString("en-US")} {item.unit}
          </span>
        </div>
        {streak > 0 && (
          <span ref={daysRef} role="img" aria-label={`${streak}-day streak`} className="mt-1.5 flex gap-1">
            {Array.from({ length: 7 }, (_, i) => (
              <span key={i} className={cx("size-2 rounded-full", i >= streak && "bg-muted")} style={i < streak ? { background: "currentColor" } : undefined} />
            ))}
          </span>
        )}
      </div>
    </div>
  );
}

function Detail({ item, play, delay, reduced }: { item: LiveNotification; play: number; delay: number; reduced: boolean }) {
  switch (item.kind) {
    case "message":
      return <MessageDetail item={item} play={play} delay={delay} reduced={reduced} />;
    case "delivery":
      return <DeliveryDetail item={item} play={play} delay={delay} reduced={reduced} />;
    case "ride":
      return <RideDetail item={item} play={play} delay={delay} reduced={reduced} />;
    case "payment":
      return <PaymentDetail item={item} play={play} delay={delay} reduced={reduced} />;
    case "calendar":
      return <CalendarDetail item={item} play={play} delay={delay} reduced={reduced} />;
    case "code":
      return <CodeDetail item={item} play={play} delay={delay} reduced={reduced} />;
    case "flight":
      return <FlightDetail item={item} play={play} delay={delay} reduced={reduced} />;
    case "fitness":
      return <FitnessDetail item={item} play={play} delay={delay} reduced={reduced} />;
  }
}

function NotificationCard({
  item,
  entry,
  read,
  done,
  reduced,
  onOpen,
  onAction,
  onDismiss,
}: {
  item: LiveNotification;
  entry: Entry;
  read: boolean;
  done: string | undefined;
  reduced: boolean;
  onOpen: () => void;
  onAction: (action: NotificationAction) => void;
  onDismiss: () => void;
}) {
  const [entered, setEntered] = React.useState(!entry.fresh || reduced);
  React.useEffect(() => {
    if (entered) return;
    let second = 0;
    const first = window.requestAnimationFrame(() => {
      second = window.requestAnimationFrame(() => setEntered(true));
    });
    return () => {
      window.cancelAnimationFrame(first);
      window.cancelAnimationFrame(second);
    };
  }, [entered]);

  const shown = entered && !entry.leaving;
  const duration = entry.leaving ? LEAVE_MS : ENTER_MS;
  const lag = entry.leaving ? entry.leaveDelay : entry.delay;
  const rowTransition = reduced ? "none" : `grid-template-rows ${duration}ms ${entry.leaving ? EXIT : SETTLE} ${lag}ms`;
  const cardTransition = reduced
    ? "none"
    : `transform ${duration}ms ${entry.leaving ? EXIT : SPRING} ${lag}ms, opacity ${Math.round(duration * 0.7)}ms ease ${lag}ms`;
  const storyDelay = entry.fresh ? STORY_DELAY_MS + entry.delay : 0;
  const accentScope = { color: item.accent };
  const accentClass = item.accent ? undefined : "text-primary";

  return (
    <div
      role="listitem"
      data-notification={item.id}
      data-kind={item.kind}
      data-read={read ? "" : undefined}
      data-leaving={entry.leaving ? "" : undefined}
      data-play={entry.play}
      className="grid"
      style={{ gridTemplateRows: shown ? "1fr" : "0fr", transition: rowTransition }}
    >
      <div className="min-h-0 overflow-hidden">
        <div className="px-1 pb-2 pt-0.5">
          <article
            aria-label={`${item.app}: ${item.title}`}
            className="group relative rounded-2xl border border-border bg-card p-3 text-card-foreground shadow-sm"
            style={{ transform: shown ? "none" : entry.leaving ? "translateX(18%) scale(0.98)" : "translateY(-16px) scale(0.96)", opacity: shown ? 1 : 0, transition: cardTransition }}
          >
            <div className="flex gap-3">
              <AppTile kind={item.kind} accent={item.accent} play={entry.play} delay={storyDelay} reduced={reduced} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 pr-6 text-xs text-muted-foreground">
                  <span className="truncate font-medium">{item.app}</span>
                  <span aria-hidden>·</span>
                  <span data-time className="shrink-0 tabular-nums">
                    {entry.arrived ? "now" : (item.time ?? "")}
                  </span>
                </div>
                <button
                  type="button"
                  data-open
                  onClick={onOpen}
                  onKeyDown={(event) => {
                    if (event.key !== "Delete" && event.key !== "Backspace") return;
                    event.preventDefault();
                    onDismiss();
                  }}
                  className="mt-0.5 block w-full text-left text-sm font-semibold leading-snug outline-none after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-ring"
                >
                  {item.title}
                </button>
                {item.body && <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{item.body}</p>}
                <div className={cx("mt-2.5", accentClass)} style={accentScope}>
                  <Detail item={item} play={entry.play} delay={storyDelay} reduced={reduced} />
                  {item.actions && item.actions.length > 0 && (
                    <div className="relative z-[1] mt-2.5 flex flex-wrap items-center gap-2">
                      {done ? (
                        <span data-done className="inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium" style={{ background: TINT }}>
                          <Icon d={CHECK} className="size-3.5" />
                          <span className="text-foreground">{done}</span>
                        </span>
                      ) : (
                        item.actions.map((action, i) => (
                          <button
                            key={action.label}
                            type="button"
                            data-action={action.label}
                            onClick={(event) => {
                              event.stopPropagation();
                              onAction(action);
                            }}
                            className={cx(
                              "h-7 rounded-full px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                              i === 0 ? "bg-foreground text-background hover:bg-foreground/85" : "border border-border bg-background text-foreground hover:bg-muted",
                            )}
                          >
                            {action.label}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {!read && (
              <span
                data-unread
                aria-hidden
                className={cx("absolute right-3.5 top-3.5 size-2 rounded-full transition-opacity group-hover:opacity-0", !item.accent && "bg-primary")}
                style={item.accent ? { background: item.accent } : undefined}
              />
            )}
            <button
              type="button"
              data-dismiss
              aria-label={`Dismiss ${item.title}`}
              onClick={(event) => {
                event.stopPropagation();
                onDismiss();
              }}
              className="absolute right-2 top-2 z-[2] grid size-6 place-items-center rounded-full text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100"
            >
              <Icon d={CLOSE} className="size-3.5" />
            </button>
          </article>
        </div>
      </div>
    </div>
  );
}

export function LiveNotificationFeed({
  items,
  title = "Notifications",
  autoplay = false,
  initial = 2,
  interval = 1500,
  loop = false,
  height = DEFAULT_HEIGHT,
  onOpen,
  onAction,
  onDismiss,
  ref,
  className,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  ...rest
}: LiveNotificationFeedProps) {
  const reduced = useReducedMotion();
  const startCount = autoplay ? Math.min(Math.max(0, Math.round(initial)), items.length) : items.length;
  const [entries, setEntries] = React.useState(() => items.slice(0, startCount).map((item) => staticEntry(item.id, 0)));
  const [readIds, setReadIds] = React.useState(() => new Set(items.filter((item) => item.read).map((item) => item.id)));
  const [done, setDone] = React.useState((): { [id: string]: string } => ({}));
  const [announcement, setAnnouncement] = React.useState("");
  const cursor = React.useRef(startCount);
  const generation = React.useRef(0);
  const paused = React.useRef(false);
  const timers = React.useRef([] as number[]);
  const bellRef = React.useRef(null as SVGSVGElement | null);
  const itemsRef = React.useRef(items);
  itemsRef.current = items;
  const initialRef = React.useRef(initial);
  initialRef.current = initial;
  const reducedRef = React.useRef(reduced);
  reducedRef.current = reduced;
  const entriesRef = React.useRef(entries);
  entriesRef.current = entries;
  const handlers = React.useRef({ onOpen, onAction, onDismiss });
  handlers.current = { onOpen, onAction, onDismiss };

  const itemsKey = items.map((item) => item.id).join("\u0000");
  const byId = React.useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const showAll = !autoplay || reduced;

  React.useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const later = React.useCallback((run: () => void, ms: number) => {
    timers.current.push(window.setTimeout(run, ms));
  }, []);

  const ringBell = React.useCallback(() => {
    if (reducedRef.current) return;
    bellRef.current?.animate(
      [
        { transform: "rotate(0deg)" },
        { transform: "rotate(16deg)" },
        { transform: "rotate(-12deg)" },
        { transform: "rotate(7deg)" },
        { transform: "rotate(-3deg)" },
        { transform: "rotate(0deg)" },
      ],
      { duration: 720, easing: "ease-out" },
    );
  }, []);

  const arrive = React.useCallback(
    (id: string) => {
      const item = itemsRef.current.find((candidate) => candidate.id === id);
      if (!item) return;
      generation.current += 1;
      const entry: Entry = { id, key: `${id}:${generation.current}`, play: 1, fresh: !reducedRef.current, leaving: false, arrived: true, delay: 0, leaveDelay: 0 };
      setEntries((prev) => [...prev.filter((e) => e.id !== id), entry]);
      setReadIds((prev) => {
        if (prev.has(id) === Boolean(item.read)) return prev;
        const next = new Set(prev);
        if (item.read) next.add(id);
        else next.delete(id);
        return next;
      });
      setDone((prev) => {
        if (!(id in prev)) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setAnnouncement(`${item.app}: ${item.title}`);
      ringBell();
    },
    [ringBell],
  );

  const removeKeys = React.useCallback(
    (keys: string[], after: number) => {
      later(() => setEntries((prev) => prev.filter((e) => !keys.includes(e.key))), after);
    },
    [later],
  );

  const clearAll = React.useCallback(() => {
    const visible = entriesRef.current.filter((e) => !e.leaving).reverse();
    if (visible.length === 0) return 0;
    const step = reducedRef.current ? 0 : SWEEP_STAGGER_MS;
    const order = new Map(visible.map((e, i) => [e.key, i]));
    setEntries((prev) => prev.map((e) => (order.has(e.key) ? { ...e, leaving: true, leaveDelay: order.get(e.key)! * step } : e)));
    const total = reducedRef.current ? 0 : LEAVE_MS + (visible.length - 1) * step;
    removeKeys(
      visible.map((e) => e.key),
      total,
    );
    return total;
  }, [removeKeys]);

  const restart = React.useCallback(() => {
    const list = itemsRef.current;
    const count = Math.min(Math.max(0, Math.round(initialRef.current)), list.length);
    cursor.current = count;
    generation.current += 1;
    const gen = generation.current;
    setEntries(list.slice(0, count).map((item, i) => staticEntry(item.id, gen, !reducedRef.current, (count - 1 - i) * 90)));
    setReadIds(new Set(list.filter((item) => item.read).map((item) => item.id)));
    setDone({});
  }, []);

  React.useEffect(() => {
    if (showAll || itemsRef.current.length === 0) return;
    let timer = 0;
    const step = () => {
      if (paused.current) {
        timer = window.setTimeout(step, 300);
        return;
      }
      const list = itemsRef.current;
      if (cursor.current < list.length) {
        const next = list[cursor.current]!;
        cursor.current += 1;
        arrive(next.id);
        timer = window.setTimeout(step, cursor.current < list.length ? interval : interval * RESTART_HOLD);
        return;
      }
      if (!loop) return;
      const took = clearAll();
      timer = window.setTimeout(() => {
        restart();
        timer = window.setTimeout(step, FIRST_ARRIVAL_MS + 500);
      }, took + 200);
    };
    timer = window.setTimeout(step, FIRST_ARRIVAL_MS);
    return () => window.clearTimeout(timer);
  }, [showAll, interval, loop, itemsKey, arrive, clearAll, restart]);

  const lastShowAll = React.useRef(showAll);
  const lastItemsKey = React.useRef(itemsKey);
  React.useEffect(() => {
    const modeChanged = lastShowAll.current !== showAll;
    const itemsChanged = lastItemsKey.current !== itemsKey;
    const previousIds = new Set(lastItemsKey.current.split("\u0000"));
    lastShowAll.current = showAll;
    lastItemsKey.current = itemsKey;
    if (!modeChanged && !itemsChanged) return;
    const list = itemsRef.current;
    if (!showAll) {
      restart();
      return;
    }
    if (modeChanged) {
      generation.current += 1;
      const gen = generation.current;
      setEntries((prev) => {
        const kept = new Map(prev.filter((e) => !e.leaving).map((e) => [e.id, e]));
        return list.map((item) => kept.get(item.id) ?? staticEntry(item.id, gen));
      });
      cursor.current = list.length;
      return;
    }
    const ids = new Set(list.map((item) => item.id));
    setEntries((prev) => prev.filter((e) => ids.has(e.id)));
    list.filter((item) => !previousIds.has(item.id)).forEach((item) => arrive(item.id));
  }, [showAll, itemsKey, restart, arrive]);

  const markRead = (id: string) => setReadIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));

  const live = entries.filter((e) => !e.leaving);
  const unread = live.filter((e) => !readIds.has(e.id)).length;
  const ordered = [...entries].reverse();
  const pause = (value: boolean) => {
    paused.current = value;
  };

  return (
    <div
      ref={ref}
      data-slot="live-notification-feed"
      data-unread={unread}
      className={cx("w-full rounded-[28px] border border-border bg-muted/60 p-2 text-foreground shadow-sm backdrop-blur-xl", className)}
      onPointerEnter={(event) => {
        pause(true);
        onPointerEnter?.(event);
      }}
      onPointerLeave={(event) => {
        pause(event.currentTarget.contains(document.activeElement));
        onPointerLeave?.(event);
      }}
      onFocus={(event) => {
        pause(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) pause(event.currentTarget.matches(":hover"));
        onBlur?.(event);
      }}
      {...rest}
    >
      <div className="flex items-center gap-2 px-3 pb-2.5 pt-2">
        <svg
          ref={bellRef}
          viewBox="0 0 24 24"
          aria-hidden
          className="size-[18px]"
          style={{ transformOrigin: "50% 12%" }}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={BELL} />
        </svg>
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        <span
          data-count
          aria-label={`${unread} unread`}
          className={cx("min-w-5 rounded-full bg-foreground px-1.5 text-center text-[11px] font-semibold leading-5 text-background tabular-nums transition-opacity", unread === 0 && "opacity-0")}
        >
          {unread}
        </span>
        <div className="ml-auto flex items-center gap-0.5">
          <button
            type="button"
            data-read-all
            disabled={unread === 0}
            onClick={() => setReadIds((prev) => new Set([...prev, ...live.map((e) => e.id)]))}
            className="rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
          >
            Read all
          </button>
          <button
            type="button"
            data-clear
            disabled={live.length === 0}
            onClick={clearAll}
            className="rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
          >
            Clear
          </button>
        </div>
      </div>
      <div className="relative">
        <div
          role="list"
          aria-label={title}
          className="overflow-y-auto overscroll-contain px-0.5 pb-6 [scrollbar-width:thin]"
          style={{
            height,
            maskImage: "linear-gradient(to bottom, black calc(100% - 28px), transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, black calc(100% - 28px), transparent)",
          }}
        >
          {ordered.map((entry) => {
            const item = byId.get(entry.id);
            if (!item) return null;
            return (
              <NotificationCard
                key={entry.key}
                item={item}
                entry={entry}
                read={readIds.has(entry.id)}
                done={done[entry.id]}
                reduced={reduced}
                onOpen={() => {
                  markRead(entry.id);
                  setEntries((prev) => prev.map((e) => (e.key === entry.key ? { ...e, play: e.play + 1, fresh: false, delay: 0 } : e)));
                  handlers.current.onOpen?.(entry.id);
                }}
                onAction={(action) => {
                  markRead(entry.id);
                  setDone((prev) => ({ ...prev, [entry.id]: action.done ?? action.label }));
                  handlers.current.onAction?.(entry.id, action.label);
                }}
                onDismiss={() => {
                  setEntries((prev) => prev.map((e) => (e.key === entry.key ? { ...e, leaving: true, leaveDelay: 0 } : e)));
                  removeKeys([entry.key], reduced ? 0 : LEAVE_MS);
                  handlers.current.onDismiss?.(entry.id);
                }}
              />
            );
          })}
        </div>
        {entries.length === 0 && (
          <div data-empty className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <div>
              <span className="mx-auto grid size-10 place-items-center rounded-full bg-background text-muted-foreground">
                <Icon d={CHECK} className="size-5" />
              </span>
              <p className="mt-2 text-sm font-medium">You're all caught up</p>
              <p className="text-xs text-muted-foreground">New notifications will land here.</p>
            </div>
          </div>
        )}
      </div>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}

export default LiveNotificationFeed;
