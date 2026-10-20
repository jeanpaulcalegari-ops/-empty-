"use client";

import { useState } from "react";
import { formatDate, localDateKey } from "@/lib/format";
import Popover, { FieldButton } from "./Popover";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parse(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(d: Date, n: number) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

type Props = {
  id?: string;
  value: string; // yyyy-mm-dd or ""
  onChange: (value: string) => void;
  min?: string;
  placeholder?: string;
  clearable?: boolean;
  align?: "left" | "right";
};

export default function DatePicker({ id, value, onChange, min, placeholder = "Pick a date", clearable, align }: Props) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => {
    const d = value ? parse(value) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const toggle = () => {
    if (!open) {
      const d = value ? parse(value) : new Date();
      setView(new Date(d.getFullYear(), d.getMonth(), 1));
    }
    setOpen(!open);
  };

  const pick = (ymd: string) => {
    onChange(ymd);
    setOpen(false);
  };

  const today = localDateKey(new Date());
  const tomorrow = localDateKey(addDays(new Date(), 1));
  const year = view.getFullYear();
  const month = view.getMonth();
  const offset = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const minMonth = min ? new Date(parse(min).getFullYear(), parse(min).getMonth(), 1) : null;
  const canGoBack = !minMonth || view > minMonth;

  const cells: (string | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => localDateKey(new Date(year, month, i + 1))),
  ];

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      align={align}
      trigger={
        <FieldButton id={id} empty={!value} onClick={toggle} icon={<CalendarIcon />}>
          {value ? (value === today ? `Today, ${formatDate(value)}` : formatDate(value)) : placeholder}
        </FieldButton>
      }
    >
      <div className="w-72">
        <div className="mb-2 flex gap-2">
          {[
            { label: "Today", ymd: today },
            { label: "Tomorrow", ymd: tomorrow },
          ].map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => pick(q.ymd)}
              className={`chip h-7 border px-3 ${value === q.ymd ? "border-accent bg-accent-soft text-accent" : "border-border hover:bg-accent-soft"}`}
            >
              {q.label}
            </button>
          ))}
          {clearable && value && (
            <button type="button" onClick={() => pick("")} className="chip ml-auto h-7 px-2 text-muted hover:text-foreground">
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center justify-between py-1">
          <button
            type="button"
            aria-label="Previous month"
            disabled={!canGoBack}
            onClick={() => setView(new Date(year, month - 1, 1))}
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-accent-soft disabled:opacity-30 disabled:hover:bg-transparent"
          >
            ‹
          </button>
          <div className="text-sm font-semibold">
            {view.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </div>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setView(new Date(year, month + 1, 1))}
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-accent-soft"
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 text-center text-[11px] font-medium text-muted">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((ymd, i) => {
            if (!ymd) return <div key={`b${i}`} />;
            const disabled = !!min && ymd < min;
            const selected = ymd === value;
            const isToday = ymd === today;
            return (
              <button
                key={ymd}
                type="button"
                disabled={disabled}
                onClick={() => pick(ymd)}
                className={`h-9 rounded-full text-sm transition-colors ${
                  selected
                    ? "bg-accent font-semibold text-white dark:text-black"
                    : disabled
                      ? "text-muted/40"
                      : `hover:bg-accent-soft ${isToday ? "font-semibold text-accent" : ""}`
                }`}
              >
                {Number(ymd.slice(8))}
              </button>
            );
          })}
        </div>
      </div>
    </Popover>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}
