"use client";

import { useEffect, useRef } from "react";

// Field button + floating panel that closes on outside click or Escape.
export default function Popover({
  open,
  onOpenChange,
  trigger,
  children,
  align = "left",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onOpenChange(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onOpenChange(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  return (
    <div ref={ref} className="relative">
      {trigger}
      {open && (
        <div
          className={`absolute z-30 mt-1 rounded-2xl border border-border bg-card p-3 shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function FieldButton({
  id,
  empty,
  onClick,
  icon,
  children,
}: {
  id?: string;
  empty: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button id={id} type="button" onClick={onClick} className="input flex items-center gap-2 text-left">
      <span className="text-muted">{icon}</span>
      <span className={`flex-1 truncate ${empty ? "text-muted" : ""}`}>{children}</span>
    </button>
  );
}
