"use client";

import { useState } from "react";
import { localDateKey } from "@/lib/format";
import type { RideType } from "@/lib/types";
import DatePicker from "./DatePicker";
import PlaceInput from "./PlaceInput";
import TimeInput from "./TimeInput";

export type RideFormValues = {
  ride_type: RideType;
  from_place: string;
  to_place: string;
  depart_at: string; // ISO
  seats: number;
  notes: string | null;
};

type Props = {
  title: string;
  subtitle: string;
  submitLabel: string;
  initial?: Partial<{ rideType: RideType; from: string; to: string; date: string; time: string; seats: number; notes: string }>;
  minSeats?: number; // when editing: can't drop below people already in the ride
  onSubmit: (values: RideFormValues) => Promise<string | null>; // returns an error message, or null on success
};

const SEAT_OPTIONS: Record<RideType, number[]> = {
  drive: [1, 2, 3, 4, 5, 6, 7],
  lyft: [1, 2, 3, 4, 5],
};

export default function RideForm({ title, subtitle, submitLabel, initial = {}, minSeats = 0, onSubmit }: Props) {
  const [rideType, setRideType] = useState<RideType>(initial.rideType ?? "drive");
  const [from, setFrom] = useState(initial.from ?? "");
  const [to, setTo] = useState(initial.to ?? "");
  const [date, setDate] = useState(initial.date ?? "");
  const [time, setTime] = useState(initial.time ?? "");
  const [seats, setSeats] = useState(initial.seats ?? 3);
  const [notes, setNotes] = useState(initial.notes ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const seatOptions = SEAT_OPTIONS[rideType].filter((n) => n >= minSeats);

  const chooseType = (t: RideType) => {
    setRideType(t);
    const max = Math.max(...SEAT_OPTIONS[t]);
    if (seats > max) setSeats(max);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!from.trim() || !to.trim()) return setError("Add where you're leaving from and going to.");
    if (from.trim().toLowerCase() === to.trim().toLowerCase()) return setError("Pickup and destination are the same.");
    if (!date) return setError("Pick a date.");
    if (!time) return setError("Type a departure time, like 7:30.");
    const departAt = new Date(`${date}T${time}`);
    if (isNaN(departAt.getTime())) return setError("That date or time doesn't look right.");
    if (departAt.getTime() < Date.now()) return setError("Departure time is in the past.");
    if (seats < minSeats) return setError(`There are already ${minSeats} people in this ride.`);

    setBusy(true);
    const err = await onSubmit({
      ride_type: rideType,
      from_place: from.trim(),
      to_place: to.trim(),
      depart_at: departAt.toISOString(),
      seats,
      notes: notes.trim() || null,
    });
    setBusy(false);
    if (err) setError(err);
  };

  const lyft = rideType === "lyft";

  return (
    <form onSubmit={submit} className="card mx-auto max-w-xl space-y-5 p-6">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
      </div>

      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Ride type">
        {(
          [
            { t: "drive", icon: "🚗", label: "I'm driving", hint: "My own car" },
            { t: "lyft", icon: "🚕", label: "Splitting a Lyft", hint: "I'll book it, we share the fare" },
          ] as const
        ).map((o) => (
          <button
            key={o.t}
            type="button"
            role="radio"
            aria-checked={rideType === o.t}
            onClick={() => chooseType(o.t)}
            className={`rounded-xl border p-3 text-left transition-colors ${
              rideType === o.t ? "border-accent bg-accent-soft" : "border-border hover:bg-accent-soft/50"
            }`}
          >
            <div className="text-sm font-medium">
              <span aria-hidden>{o.icon}</span> {o.label}
            </div>
            <div className="mt-0.5 text-xs text-muted">{o.hint}</div>
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="from">{lyft ? "Pickup" : "Leaving from"}</label>
          <PlaceInput id="from" value={from} onChange={setFrom} placeholder="Pick a meetup spot or type one" />
        </div>
        <div>
          <label className="label" htmlFor="to">Going to</label>
          <PlaceInput id="to" value={to} onChange={setTo} placeholder="DEN, Boulder, any city…" />
        </div>
        <div>
          <label className="label" htmlFor="date">Date</label>
          <DatePicker id="date" min={localDateKey(new Date())} value={date} onChange={setDate} />
        </div>
        <div>
          <label className="label" htmlFor="time">{lyft ? "Pickup time" : "Departure time"}</label>
          <TimeInput id="time" value={time} onChange={setTime} />
        </div>
        <div>
          <label className="label" htmlFor="seats">{lyft ? "Spots for others" : "Seats available"}</label>
          <select id="seats" className="input" value={seats} onChange={(e) => setSeats(Number(e.target.value))}>
            {seatOptions.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          {lyft && <p className="mt-1 text-xs text-muted">A regular Lyft fits 3 riders besides you; XL fits 5.</p>}
        </div>
      </div>
      <div>
        <label className="label" htmlFor="notes">Notes <span className="font-normal text-muted">(optional)</span></label>
        <textarea
          id="notes"
          className="input h-24 py-2"
          placeholder={lyft ? "Meetup spot, luggage, how you'll split the fare…" : "Pickup spot, luggage space, music taste…"}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <button type="submit" className="btn-primary w-full" disabled={busy}>
        {busy ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
