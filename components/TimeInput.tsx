"use client";

import { useState } from "react";

type Period = "AM" | "PM";

function split(value: string) {
  const [h, m] = value.split(":").map(Number);
  return { hour12: h % 12 === 0 ? 12 : h % 12, minute: m, period: (h >= 12 ? "PM" : "AM") as Period };
}

function join(hour12: number, minute: number, period: Period) {
  const h = (hour12 % 12) + (period === "PM" ? 12 : 0);
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

// Accepts "7", "730", "7:30", "07:30". A 24h hour like "19:30" also works and flips to PM.
function parse(text: string): { hour12: number; minute: number; period?: Period } | null {
  const t = text.trim();
  if (!t) return null;
  let h: number, m: number;
  const colon = t.match(/^(\d{1,2}):(\d{2})$/);
  if (colon) {
    h = Number(colon[1]);
    m = Number(colon[2]);
  } else if (/^\d{1,4}$/.test(t)) {
    h = Number(t.length <= 2 ? t : t.slice(0, -2));
    m = t.length <= 2 ? 0 : Number(t.slice(-2));
  } else return null;
  if (m > 59 || h > 23) return null;
  if (h === 0) return { hour12: 12, minute: m, period: "AM" };
  if (h > 12) return { hour12: h - 12, minute: m, period: "PM" };
  return { hour12: h, minute: m };
}

type Props = {
  id?: string;
  value: string; // "HH:mm" (24h) or ""
  onChange: (value: string) => void;
};

export default function TimeInput({ id, value, onChange }: Props) {
  const initial = value ? split(value) : null;
  const [text, setText] = useState(initial ? `${initial.hour12}:${String(initial.minute).padStart(2, "0")}` : "");
  const [period, setPeriod] = useState<Period>(initial?.period ?? (new Date().getHours() >= 12 ? "PM" : "AM"));
  const invalid = text.trim() !== "" && !parse(text);

  const emit = (t: string, p: Period) => {
    const r = parse(t);
    if (r?.period && r.period !== p) {
      p = r.period;
      setPeriod(p);
    }
    onChange(r ? join(r.hour12, r.minute, p) : "");
  };

  return (
    <div className="flex gap-2">
      <input
        id={id}
        className={`input flex-1 ${invalid ? "border-danger focus:border-danger focus:ring-danger/20" : ""}`}
        inputMode="numeric"
        autoComplete="off"
        placeholder="7:30"
        maxLength={5}
        value={text}
        onChange={(e) => {
          const t = e.target.value.replace(/[^\d:]/g, "");
          setText(t);
          emit(t, period);
        }}
        onBlur={() => {
          const r = parse(text);
          if (r) setText(`${r.hour12}:${String(r.minute).padStart(2, "0")}`);
        }}
        aria-invalid={invalid}
      />
      <div className="grid shrink-0 grid-cols-2 rounded-xl border border-border p-0.5 text-sm" role="group" aria-label="AM or PM">
        {(["AM", "PM"] as Period[]).map((p) => (
          <button
            key={p}
            type="button"
            aria-pressed={period === p}
            onClick={() => {
              setPeriod(p);
              emit(text, p);
            }}
            className={`rounded-lg px-3 transition-colors ${
              period === p ? "bg-accent font-medium text-white dark:text-black" : "text-muted hover:text-foreground"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
