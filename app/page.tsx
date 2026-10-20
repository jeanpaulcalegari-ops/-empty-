"use client";

import Link from "next/link";
import { useState } from "react";
import DatePicker from "@/components/DatePicker";
import PlaceInput from "@/components/PlaceInput";
import RequestCard from "@/components/RequestCard";
import RideCard from "@/components/RideCard";
import { ErrorBox, Loading } from "@/components/States";
import { localDateKey, seatsLeft } from "@/lib/format";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase/client";
import { REQUEST_SELECT, RIDE_SELECT, type Ride, type RideRequest } from "@/lib/types";
import { unwrap, useLoad } from "@/lib/useLoad";

type Tab = "rides" | "requests";

export default function Home() {
  const { profile } = useSession();
  const [tab, setTab] = useState<Tab>("rides");
  const [query, setQuery] = useState("");
  const [date, setDate] = useState("");
  const [hideFull, setHideFull] = useState(false);
  const today = localDateKey(new Date());

  const { data, error, loading, reload } = useLoad(async () => {
    const sb = supabase();
    const [rides, requests] = await Promise.all([
      sb.from("rides").select(RIDE_SELECT).eq("status", "open").gte("depart_at", new Date().toISOString()).order("depart_at"),
      sb.from("ride_requests").select(REQUEST_SELECT).gte("date", today).order("date"),
    ]);
    return { rides: unwrap(rides) as Ride[], requests: unwrap(requests) as RideRequest[] };
  }, [today]);

  if (loading) return <Loading />;
  if (error || !data) return <ErrorBox message={error ?? "Couldn't load rides."} />;

  const matches = (from: string, to: string) => {
    const q = query.trim().toLowerCase();
    return !q || from.toLowerCase().includes(q) || to.toLowerCase().includes(q);
  };

  const visibleRides = data.rides
    .filter((r) => matches(r.from_place, r.to_place))
    .filter((r) => !date || localDateKey(new Date(r.depart_at)) === date)
    .filter((r) => !hideFull || seatsLeft(r) > 0);

  const visibleRequests = data.requests
    .filter((q) => matches(q.from_place, q.to_place))
    .filter((q) => !date || q.date === date);

  const list = tab === "rides" ? visibleRides : visibleRequests;

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          {profile ? `Where to, ${profile.name.split(" ")[0]}?` : "Where to?"}
        </h1>
        <p className="text-muted">
          Find a seat with a classmate heading your way, or offer the empty ones in your car.
        </p>
      </section>

      <section className="card p-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
          <PlaceInput placeholder="Search a place: DEN, Boulder, Lot D…" value={query} onChange={setQuery} />
          <DatePicker min={today} value={date} onChange={setDate} placeholder="Any date" clearable align="right" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="inline-flex rounded-full border border-border p-0.5">
            {(["rides", "requests"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-full px-3 py-1 transition-colors ${
                  tab === t ? "bg-accent text-white dark:text-black" : "text-muted hover:text-foreground"
                }`}
              >
                {t === "rides" ? `Rides offered (${visibleRides.length})` : `Ride requests (${visibleRequests.length})`}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            {tab === "rides" && (
              <label className="flex items-center gap-2 text-muted">
                <input type="checkbox" checked={hideFull} onChange={(e) => setHideFull(e.target.checked)} />
                Hide full rides
              </label>
            )}
            {(query || date) && (
              <button
                className="text-accent hover:underline"
                onClick={() => {
                  setQuery("");
                  setDate("");
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </section>

      {list.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-medium">{tab === "rides" ? "No rides match yet." : "No open requests match."}</p>
          <p className="mt-1 text-sm text-muted">
            {tab === "rides"
              ? "Post a request and drivers heading that way can find you."
              : "Driving somewhere? Offer a ride so riders can join."}
          </p>
          <Link href={tab === "rides" ? "/request" : "/offer"} className="btn-primary mt-5">
            {tab === "rides" ? "Request a ride" : "Offer a ride"}
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {tab === "rides"
            ? visibleRides.map((r) => <RideCard key={r.id} ride={r} />)
            : visibleRequests.map((q) => <RequestCard key={q.id} request={q} onChange={reload} />)}
        </div>
      )}
    </div>
  );
}
