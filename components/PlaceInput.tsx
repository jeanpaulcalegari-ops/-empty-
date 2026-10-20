"use client";

import { useId, useMemo, useRef, useState } from "react";
import { schoolForEmail } from "@/lib/places";
import { useSession } from "@/lib/session";

type Props = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
};

// Free-text place field with grouped suggestions for the user's school. Anything typed is valid.
export default function PlaceInput({ id, value, onChange, placeholder, required }: Props) {
  const { email } = useSession();
  const school = schoolForEmail(email);
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listRef = useRef<HTMLUListElement>(null);

  const groups = useMemo(() => {
    const q = value.trim().toLowerCase();
    return school.groups
      .map((g) => ({
        label: g.label,
        places: q && !g.label.toLowerCase().includes(q) ? g.places.filter((p) => p.toLowerCase().includes(q)) : g.places,
      }))
      .filter((g) => g.places.length > 0);
  }, [school, value]);
  const flat = groups.flatMap((g) => g.places);

  const choose = (place: string) => {
    onChange(place);
    setOpen(false);
    setActive(-1);
  };

  const move = (delta: number) => {
    if (!flat.length) return;
    const next = (active + delta + flat.length) % flat.length;
    setActive(next);
    listRef.current?.querySelector(`[data-index="${next}"]`)?.scrollIntoView({ block: "nearest" });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      move(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      move(-1);
    } else if (e.key === "Enter" && open && active >= 0) {
      e.preventDefault();
      choose(flat[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  let index = -1;
  return (
    <div className="relative">
      <input
        id={id}
        className="input"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />
      {open && (
        <ul
          id={listId}
          ref={listRef}
          role="listbox"
          className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-border bg-card py-1 text-sm shadow-lg"
        >
          {groups.map((g) => (
            <li key={g.label} role="presentation">
              <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted">{g.label}</div>
              <ul role="presentation">
                {g.places.map((p) => {
                  index += 1;
                  const i = index;
                  return (
                    <li
                      key={p}
                      role="option"
                      aria-selected={i === active}
                      data-index={i}
                      // mousedown, not click, so it fires before the input's blur closes the list
                      onMouseDown={(e) => {
                        e.preventDefault();
                        choose(p);
                      }}
                      onMouseEnter={() => setActive(i)}
                      className={`cursor-pointer px-3 py-1.5 ${i === active ? "bg-accent-soft text-accent" : ""}`}
                    >
                      {p}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
          <li role="presentation" className="border-t border-border px-3 pb-1 pt-2 text-xs text-muted">
            {value.trim() && !flat.some((p) => p.toLowerCase() === value.trim().toLowerCase())
              ? <>Not listed? “{value.trim()}” works fine, just keep typing.</>
              : "Not listed? Type any place or city."}
          </li>
        </ul>
      )}
    </div>
  );
}
