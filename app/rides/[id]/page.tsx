"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Avatar from "@/components/Avatar";
import Route from "@/components/Route";
import { ErrorBox, Loading } from "@/components/States";
import { formatDateTime, hostLabel, isMember, isPast, rideTypeLabel, seatsLeft } from "@/lib/format";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase/client";
import { RIDE_SELECT, type Ride } from "@/lib/types";
import { unwrap, useLoad } from "@/lib/useLoad";

export default function RideDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { userId } = useSession();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const { data: ride, error, loading, reload } = useLoad(
    async () => unwrap(await supabase().from("rides").select(RIDE_SELECT).eq("id", id).maybeSingle()) as Ride | null,
    [id],
  );

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;
  if (!ride) {
    return (
      <div className="card p-10 text-center">
        <p className="font-medium">This ride doesn&apos;t exist.</p>
        <Link href="/" className="btn-ghost mt-4">Back to rides</Link>
      </div>
    );
  }

  const left = seatsLeft(ride);
  const isDriver = ride.driver_id === userId;
  const member = isMember(ride, userId);
  const past = isPast(ride);
  const cancelled = ride.status === "cancelled";

  const act = async (fn: () => PromiseLike<{ error: { message: string } | null }>, after?: () => void) => {
    setBusy(true);
    setActionError("");
    const { error } = await fn();
    setBusy(false);
    if (error) {
      setActionError(error.message);
      reload();
    } else if (after) after();
    else reload();
  };

  const join = () =>
    act(
      () => supabase().rpc("join_ride", { rid: ride.id }),
      () => router.push(`/rides/${ride.id}/chat`),
    );
  const leave = () =>
    act(() => supabase().from("ride_passengers").delete().eq("ride_id", ride.id).eq("user_id", userId!));
  const cancel = () => {
    if (confirm("Cancel this ride? Riders will see it as cancelled.")) {
      act(() => supabase().from("rides").update({ status: "cancelled" }).eq("id", ride.id));
    }
  };

  const chatLink = (
    <Link href={`/rides/${ride.id}/chat`} className="btn-primary w-full">
      Open ride chat
    </Link>
  );

  let action: React.ReactNode;
  if (cancelled) action = <p className="text-sm text-danger">The {hostLabel(ride).toLowerCase()} cancelled this ride.</p>;
  else if (past) action = member ? chatLink : <p className="text-sm text-muted">This ride has already departed.</p>;
  else if (isDriver)
    action = (
      <div className="space-y-2">
        {chatLink}
        <Link href={`/rides/${ride.id}/edit`} className="btn-ghost w-full">
          Edit ride
        </Link>
        <button className="btn-danger w-full" disabled={busy} onClick={cancel}>
          Cancel ride
        </button>
      </div>
    );
  else if (member)
    action = (
      <div className="space-y-2">
        {chatLink}
        <button className="btn-ghost w-full" disabled={busy} onClick={leave}>
          Leave ride
        </button>
      </div>
    );
  else if (left <= 0) action = <p className="text-sm text-muted">This ride is full.</p>;
  else
    action = (
      <button className="btn-primary w-full" disabled={busy} onClick={join}>
        {busy ? "Joining…" : "Join ride"}
      </button>
    );

  return (
    <div className="space-y-4">
      <button onClick={() => router.back()} className="text-sm text-muted hover:text-foreground">
        ← Back
      </button>

      <div className="grid gap-4 md:grid-cols-[1fr_280px]">
        <div className="card space-y-6 p-6">
          <span className="chip bg-accent-soft text-accent">{rideTypeLabel(ride)}</span>
          <Route from={ride.from_place} to={ride.to_place} large />
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted">{ride.ride_type === "lyft" ? "Pickup" : "Departs"}</dt>
              <dd className="font-medium">{formatDateTime(ride.depart_at)}</dd>
            </div>
            <div>
              <dt className="text-muted">Seats</dt>
              <dd className="font-medium">
                {Math.max(left, 0)} of {ride.seats} open
              </dd>
            </div>
          </dl>
          {ride.notes && (
            <div>
              <h2 className="text-sm text-muted">Notes from the {hostLabel(ride).toLowerCase()}</h2>
              <p className="mt-1 whitespace-pre-line">{ride.notes}</p>
            </div>
          )}

          <div>
            <h2 className="text-sm text-muted">Riders</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {Array.from({ length: Math.max(ride.seats, ride.passengers.length) }).map((_, i) => {
                const p = ride.passengers[i];
                return p ? (
                  <div key={p.user_id} className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3 text-sm">
                    <Avatar name={p.profile?.name ?? "?"} size={24} />
                    {p.user_id === userId ? "You" : p.profile?.name ?? "Rider"}
                  </div>
                ) : (
                  <div key={`open-${i}`} className="rounded-full border border-dashed border-border px-3 py-1 text-sm text-muted">
                    Open seat
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <h2 className="text-sm text-muted">{hostLabel(ride)}</h2>
            {ride.driver && (
              <div className="mt-3 flex items-center gap-3">
                <Avatar name={ride.driver.name} size={44} />
                <div className="min-w-0">
                  <div className="font-medium">{isDriver ? "You" : ride.driver.name}</div>
                  {ride.driver.major && <div className="text-sm text-muted">{ride.driver.major}</div>}
                </div>
              </div>
            )}
            {!member && !cancelled && !past && (
              <p className="mt-4 text-xs text-muted">Join to chat with the {hostLabel(ride).toLowerCase()} and other riders.</p>
            )}
          </div>
          <div className="card p-5">
            {action}
            {actionError && <p className="mt-2 text-sm text-danger">{actionError}</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}
