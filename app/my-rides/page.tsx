"use client";

import Link from "next/link";
import RequestCard from "@/components/RequestCard";
import RideCard from "@/components/RideCard";
import { ErrorBox, Loading } from "@/components/States";
import { isPast } from "@/lib/format";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase/client";
import { REQUEST_SELECT, RIDE_SELECT, type Ride, type RideRequest } from "@/lib/types";
import { unwrap, useLoad } from "@/lib/useLoad";

function Section({ title, empty, children }: { title: string; empty: React.ReactNode; children: React.ReactNode[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children.length ? <div className="grid gap-3">{children}</div> : <div className="card p-6 text-sm text-muted">{empty}</div>}
    </section>
  );
}

export default function MyRidesPage() {
  const { userId } = useSession();

  const { data, error, loading, reload } = useLoad(async () => {
    if (!userId) return null;
    const sb = supabase();
    const joinedIds = (unwrap(await sb.from("ride_passengers").select("ride_id").eq("user_id", userId)) as { ride_id: string }[]).map(
      (r) => r.ride_id,
    );
    const [driving, riding, requests] = await Promise.all([
      sb.from("rides").select(RIDE_SELECT).eq("driver_id", userId).order("depart_at"),
      joinedIds.length
        ? sb.from("rides").select(RIDE_SELECT).in("id", joinedIds).order("depart_at")
        : Promise.resolve({ data: [], error: null }),
      sb.from("ride_requests").select(REQUEST_SELECT).eq("user_id", userId).order("date"),
    ]);
    return {
      rides: [...(unwrap(driving) as Ride[]), ...(unwrap(riding) as Ride[])],
      requests: unwrap(requests) as RideRequest[],
    };
  }, [userId]);

  if (loading || !userId) return <Loading />;
  if (error || !data) return <ErrorBox message={error ?? "Couldn't load your rides."} />;

  const upcoming = (r: Ride) => !isPast(r) && r.status === "open";
  const driving = data.rides.filter((r) => r.driver_id === userId && upcoming(r));
  const riding = data.rides.filter((r) => r.driver_id !== userId && upcoming(r));
  const history = data.rides
    .filter((r) => !upcoming(r))
    .sort((a, b) => b.depart_at.localeCompare(a.depart_at));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">My rides</h1>
      <Section
        title="Rides you posted"
        empty={<>Nothing posted yet. <Link className="text-accent hover:underline" href="/offer">Offer a ride</Link></>}
      >
        {driving.map((r) => <RideCard key={r.id} ride={r} />)}
      </Section>
      <Section
        title="Riding"
        empty={<>You haven&apos;t joined any rides. <Link className="text-accent hover:underline" href="/">Browse rides</Link></>}
      >
        {riding.map((r) => <RideCard key={r.id} ride={r} />)}
      </Section>
      <Section
        title="My requests"
        empty={<>No open requests. <Link className="text-accent hover:underline" href="/request">Request a ride</Link></>}
      >
        {data.requests.map((q) => <RequestCard key={q.id} request={q} onChange={reload} />)}
      </Section>
      {history.length > 0 && (
        <Section title="Past & cancelled" empty={null}>
          {history.map((r) => <RideCard key={r.id} ride={r} />)}
        </Section>
      )}
    </div>
  );
}
