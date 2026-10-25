"use client";

import SchedulePicker from "@/components/ui/schedule-picker";

export default function SchedulePickerDemo() {
  return (
    <div className="w-full max-w-md mx-auto p-6 bg-background">
      <SchedulePicker
        label="When"
        where="the shared drive"
        now={new Date("2026-03-02T09:00:00")}
      />
    </div>
  );
}
