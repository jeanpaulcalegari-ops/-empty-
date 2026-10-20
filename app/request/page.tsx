"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import DatePicker from "@/components/DatePicker";
import PlaceInput from "@/components/PlaceInput";
import { localDateKey } from "@/lib/format";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase/client";

export default function RequestPage() {
  const { userId } = useSession();
  const router = useRouter();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [flexible, setFlexible] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return setError("Pick a date.");
    if (from.trim().toLowerCase() === to.trim().toLowerCase()) return setError("Pickup and destination are the same.");
    setBusy(true);
    const { error } = await supabase().from("ride_requests").insert({
      user_id: userId,
      from_place: from.trim(),
      to_place: to.trim(),
      date,
      flexible,
      notes: notes.trim() || null,
    });
    setBusy(false);
    if (error) return setError(error.message);
    router.push("/my-rides");
  };

  return (
    <form onSubmit={submit} className="card mx-auto max-w-xl space-y-5 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Request a ride</h1>
        <p className="mt-1 text-sm text-muted">
          Post where you need to go. Drivers browsing requests can offer you a seat.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="from">From</label>
          <PlaceInput id="from" required value={from} onChange={setFrom} placeholder="Pick a meetup spot or type one" />
        </div>
        <div>
          <label className="label" htmlFor="to">To</label>
          <PlaceInput id="to" required value={to} onChange={setTo} placeholder="DEN, Boulder, any city…" />
        </div>
        <div>
          <label className="label" htmlFor="date">Date</label>
          <DatePicker id="date" min={localDateKey(new Date())} value={date} onChange={setDate} />
        </div>
        <label className="flex items-center gap-2 text-sm sm:pt-7">
          <input type="checkbox" checked={flexible} onChange={(e) => setFlexible(e.target.checked)} />
          My dates are flexible (±1 day)
        </label>
      </div>
      <div>
        <label className="label" htmlFor="notes">Notes <span className="font-normal text-muted">(optional)</span></label>
        <textarea
          id="notes"
          className="input h-24 py-2"
          placeholder="Preferred time, luggage…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <button type="submit" className="btn-primary w-full" disabled={busy}>
        {busy ? "Posting…" : "Post request"}
      </button>
    </form>
  );
}
