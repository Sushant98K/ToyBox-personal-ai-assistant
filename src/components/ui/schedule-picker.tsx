"use client";

/**
 * SchedulePicker
 *
 * Adapted from redrob-ui's SchedulePicker (MIT License, Copyright (c) 2026 Janghoon Lee
 * (Redrob) and contributors — https://github.com/redrob-labs/redrob-ui). The original
 * composes DatePicker / Select / TimePicker / TimeZonePicker from that design system; this
 * port reproduces the same API and behavior with self-contained native controls styled with
 * the system's own brand tokens (see global.css), so it has no runtime dependency on the
 * rest of redrob-ui.
 *
 * When something should run: once, on a repeat, or when a file arrives. The live sentence
 * under the controls states the assembled schedule back in words, in an `aria-live` region.
 */

import * as React from "react";

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function isoDay(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function shortDay(d: Date): string {
  return `${d.toLocaleDateString("en-US", { weekday: "short" })} ${d.getDate()} ${d.toLocaleDateString("en-US", { month: "short" })}`;
}

export const WEEKDAYS: Array<[string, string, string]> = [
  ["1", "Mon", "Monday"],
  ["2", "Tue", "Tuesday"],
  ["3", "Wed", "Wednesday"],
  ["4", "Thu", "Thursday"],
  ["5", "Fri", "Friday"],
  ["6", "Sat", "Saturday"],
  ["0", "Sun", "Sunday"],
];

export const DEFAULT_ZONES: Array<[string, string]> = [
  ["America/Los_Angeles", "Los Angeles"],
  ["America/New_York", "New York"],
  ["Europe/London", "London"],
  ["Europe/Berlin", "Berlin"],
  ["Asia/Kolkata", "Mumbai (IST)"],
  ["Asia/Seoul", "Seoul"],
  ["Asia/Tokyo", "Tokyo"],
  ["Australia/Sydney", "Sydney"],
];

export function zoneCity(tz?: string, zones?: Array<[string, string]>): string {
  const list = zones || DEFAULT_ZONES;
  const z = list.filter((x) => x[0] === tz)[0];
  return z ? z[1] : (tz as string) || "";
}

function andList(a: string[]): string {
  return a.length < 2
    ? a.join("")
    : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`;
}

export interface ScheduleValue {
  mode?: "once" | "repeat" | "event";
  date?: string;
  start?: string;
  time?: string;
  zone?: string;
  freq?: "daily" | "weekdays" | "weekly" | "monthly";
  days?: string[];
  dom?: string;
}

/**
 * The next time this schedule will actually fire, or null. Walks forward day by day for up to
 * 400 days rather than computing it, which is what lets a one-off whose time has passed say so.
 */
export function nextScheduledRun(w: ScheduleValue, now?: Date): Date | null {
  const at = now || new Date();
  const t = String(w.time || "09:00").split(":");
  const hh = Number(t[0]);
  const mm = Number(t[1]);
  const start = new Date(`${w.mode === "once" ? w.date : (w.start || isoDay(at))}T00:00:00`);
  if (isNaN(start.getTime())) return null;

  for (let i = 0; i < 400; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    d.setHours(hh, mm, 0, 0);
    if (d <= at) {
      if (w.mode === "once") return null;
      continue;
    }
    if (w.mode === "once") return d;
    const dow = d.getDay();
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    if (
      w.freq === "daily" ||
      (w.freq === "weekdays" && dow > 0 && dow < 6) ||
      (w.freq === "weekly" && (w.days || []).indexOf(String(dow)) >= 0) ||
      (w.freq === "monthly" &&
        (w.dom === "last"
          ? d.getDate() === last
          : d.getDate() === Number(w.dom)))
    ) {
      return d;
    }
  }
  return null;
}

/** The schedule as one sentence, including the zone by city and the next run. */
export function describeSchedule(
  w: ScheduleValue,
  opts: { where?: string; now?: Date; zones?: Array<[string, string]> } = {},
): string {
  if (w.mode === "event") {
    return `Runs each time a new file arrives in ${opts.where || "the project"}.`;
  }
  const zone = `${zoneCity(w.zone, opts.zones)} time`;
  const now = opts.now || new Date();
  const n = nextScheduledRun(w, now);

  if (w.mode === "once") {
    return n
      ? `Runs once, on ${shortDay(n)} at ${w.time} ${zone}.`
      : "That time has passed. Choose a later one.";
  }

  const names = WEEKDAYS.filter((d) => (w.days || []).indexOf(d[0]) >= 0).map(
    (d) => d[2],
  );
  const how =
    (
      {
        daily: "Every day",
        weekdays: "Every weekday",
        weekly: names.length
          ? `Every ${andList(names)}`
          : "Choose at least one day",
        monthly:
          w.dom === "last"
            ? "On the last day of each month"
            : `On day ${w.dom} of each month`,
      } as Record<string, string>
    )[w.freq as string] || "";

  return `${how} at ${w.time} ${zone}.${n ? ` Next run ${isoDay(n) === isoDay(now) ? "today" : shortDay(n)}.` : ""}`;
}

function ChevronDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CalendarClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M8 2v3" />
      <path d="M16 2v3" />
      <path d="M4 9h16" />
      <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6.5" />
      <path d="M12.5 20.5A2 2 0 0 1 11 21H6a2 2 0 0 1-2-2V7" />
      <circle cx="17" cy="17" r="4.5" />
      <path d="M17 15.5V17l1 1" />
    </svg>
  );
}

function FolderIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  );
}

export interface SchedulePickerProps {
  value?: ScheduleValue;
  defaultValue?: ScheduleValue;
  /** The moment "next run" is computed against. Pass it in tests to keep the output stable. */
  now?: Date;
  /** `[value, label]` pairs. Defaults to once / repeats / on a new file. */
  modes?: Array<[string, string]>;
  /** Where files arrive, for the event mode's sentence. */
  where?: string;
  zones?: Array<[string, string]>;
  label?: React.ReactNode;
  dateLabel?: string;
  repeatLabel?: string;
  dayOfMonthLabel?: string;
  timeLabel?: string;
  zoneLabel?: string;
  startLabel?: string;
  /** `false` hides the line about approval steps. */
  note?: React.ReactNode | false;
  className?: string;
  onChange?: (value: ScheduleValue) => void;
}

export function SchedulePicker(props: SchedulePickerProps): React.ReactElement {
  const now = props.now || new Date();
  const controlled = props.value !== undefined;
  const base: ScheduleValue = {
    mode: "repeat",
    date: isoDay(new Date(now.getTime() + 86400000)),
    start: isoDay(now),
    time: "08:30",
    zone: "Asia/Kolkata",
    freq: "daily",
    days: ["1"],
    dom: "1",
  };
  const [inner, setInner] = React.useState<ScheduleValue>({
    ...base,
    ...(props.defaultValue || {}),
  });
  const w: ScheduleValue = controlled ? { ...base, ...props.value } : inner;
  const gid = React.useId();

  function set(k: keyof ScheduleValue, v: unknown): void {
    const next = { ...w, [k]: v } as ScheduleValue;
    if (!controlled) setInner(next);
    if (props.onChange) props.onChange(next);
  }

  const modes = props.modes || [
    ["repeat", "Repeats"],
    ["once", "Once"],
  ];

  const zones = props.zones || DEFAULT_ZONES;

  const domOptions: Array<{ value: string; label: string }> = [];
  for (let i = 1; i <= 28; i++)
    domOptions.push({ value: String(i), label: String(i) });
  domOptions.push({ value: "last", label: "Last day of the month" });

  const summary = describeSchedule(w, { where: props.where, now, zones });

  const fieldLabel =
    "text-[12px] font-semibold leading-[18px] text-[color:var(--ink-soft)] uppercase tracking-wider";
  const control =
    "h-9 w-full rounded-xl border border-[color:var(--hairline)] bg-[color:var(--field)] px-3 text-[13px] text-[color:var(--ink)] outline-none transition-colors focus:border-[#0066FF]";

  return (
    <div
      className={cx("flex w-full flex-col gap-3", props.className)}
      style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}
    >
      <div className="flex items-center justify-between">
        <span id={gid} className={fieldLabel}>
          {props.label || "Schedule Frequency"}
        </span>

        <div
          role="radiogroup"
          aria-labelledby={gid}
          className="inline-flex items-center gap-1 self-start rounded-full bg-[color:var(--surface-sunken)] p-1 border border-[color:var(--hairline)]"
        >
          {modes.map((m) => (
            <button
              key={m[0]}
              type="button"
              role="radio"
              aria-checked={w.mode === m[0]}
              onClick={() => set("mode", m[0])}
              className={cx(
                "h-7 rounded-full px-3 text-[12px] font-semibold transition-colors cursor-pointer",
                w.mode === m[0]
                  ? "bg-[#0066FF] text-white shadow-xs"
                  : "text-[color:var(--ink-secondary)] hover:text-[color:var(--ink-primary)]",
              )}
            >
              {m[1]}
            </button>
          ))}
        </div>
      </div>

      {w.mode === "once" ? (
        <label className="flex flex-col gap-1.5">
          <span className={fieldLabel}>{props.dateLabel || "Execution Date"}</span>
          <input
            type="date"
            value={w.date}
            onChange={(e) => {
              if (e.target.value) set("date", e.target.value);
            }}
            className={control}
          />
        </label>
      ) : null}

      {w.mode === "repeat" ? (
        <label className="flex flex-col gap-1.5">
          <span className={fieldLabel}>{props.repeatLabel || "Repeats"}</span>
          <div className="relative">
            <select
              value={w.freq}
              onChange={(e) => set("freq", e.target.value)}
              className={cx(control, "appearance-none pr-8 cursor-pointer")}
            >
              <option value="daily">Every day</option>
              <option value="weekdays">Every weekday (Monday to Friday)</option>
              <option value="weekly">Specific days of week</option>
              <option value="monthly">Every month</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)]">
              <ChevronDownIcon width={14} height={14} />
            </span>
          </div>
        </label>
      ) : null}

      {w.mode === "repeat" && w.freq === "weekly" ? (
        <div className="flex flex-col gap-1.5">
          <span className={fieldLabel}>Select Days</span>
          <div
            role="group"
            aria-label="Days of the week"
            className="flex gap-1.5"
          >
            {WEEKDAYS.map((d) => {
              const on = (w.days || []).indexOf(d[0]) >= 0;
              return (
                <button
                  key={d[0]}
                  type="button"
                  aria-pressed={on}
                  aria-label={d[2]}
                  onClick={() =>
                    set(
                      "days",
                      on
                        ? (w.days || []).filter((x) => x !== d[0])
                        : (w.days || []).concat([d[0]]),
                    )
                  }
                  className={cx(
                    "h-8 w-8 rounded-full text-[12px] font-semibold transition-colors cursor-pointer border",
                    on
                      ? "bg-[#0066FF] border-[#0066FF] text-white"
                      : "bg-[color:var(--field)] border-[color:var(--hairline)] text-[color:var(--text-muted)] hover:text-[color:var(--ink)]",
                  )}
                >
                  {d[1].slice(0, 1)}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {w.mode === "repeat" && w.freq === "monthly" ? (
        <label className="flex flex-col gap-1.5">
          <span className={fieldLabel}>
            {props.dayOfMonthLabel || "Day of the month"}
          </span>
          <div className="relative">
            <select
              value={w.dom}
              onChange={(e) => set("dom", e.target.value)}
              className={cx(control, "appearance-none pr-8 cursor-pointer")}
            >
              {domOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)]">
              <ChevronDownIcon width={14} height={14} />
            </span>
          </div>
        </label>
      ) : null}

      {w.mode !== "event" ? (
        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1.5">
            <span className={fieldLabel}>{props.timeLabel || "Scheduled Time"}</span>
            <input
              type="time"
              value={w.time}
              onChange={(e) => set("time", e.target.value)}
              className={control}
            />
          </label>
          <label className="flex flex-1 flex-col gap-1.5">
            <span className={fieldLabel}>{props.zoneLabel || "Time Zone"}</span>
            <div className="relative">
              <select
                value={w.zone}
                onChange={(e) => set("zone", e.target.value)}
                className={cx(control, "appearance-none pr-8 cursor-pointer")}
              >
                {zones.map((z) => (
                  <option key={z[0]} value={z[0]}>
                    {z[1]}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)]">
                <ChevronDownIcon width={14} height={14} />
              </span>
            </div>
          </label>
        </div>
      ) : null}

      {w.mode === "repeat" ? (
        <label className="flex flex-col gap-1.5">
          <span className={fieldLabel}>{props.startLabel || "Starting From"}</span>
          <input
            type="date"
            value={w.start}
            onChange={(e) => {
              if (e.target.value) set("start", e.target.value);
            }}
            className={control}
          />
        </label>
      ) : null}

      <div
        aria-live="polite"
        className="flex items-start gap-2.5 text-[12px] leading-5 text-[color:var(--ink-soft)] bg-[color:var(--canvas-soft)] p-3 rounded-xl border border-[color:var(--hairline)]"
      >
        <span className="mt-0.5 flex-none text-[#0066FF]">
          {w.mode === "event" ? (
            <FolderIcon width={15} height={15} />
          ) : (
            <CalendarClockIcon width={15} height={15} />
          )}
        </span>
        <span className="font-medium text-[color:var(--ink)]">{summary}</span>
      </div>

      {props.note !== false ? (
        <p className="text-[11px] leading-[16px] text-[color:var(--text-muted)]">
          {props.note ||
            "Evaluated by 15-minute background worker. Only triggers when this precise schedule is reached."}
        </p>
      ) : null}
    </div>
  );
}

export default SchedulePicker;
