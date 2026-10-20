"use client";

import Link from "next/link";
import { formatDate } from "@/lib/format";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase/client";
import type { RideRequest } from "@/lib/types";
import Avatar from "./Avatar";
import Route from "./Route";

export default function RequestCard({ request, onChange }: { request: RideRequest; onChange?: () => void }) {
  const { userId } = useSession();
  const mine = request.user_id === userId;

  const offerHref = `/offer?${new URLSearchParams({ from: request.from_place, to: request.to_place, date: request.date })}`;

  const remove = async () => {
    const { error } = await supabase().from("ride_requests").delete().eq("id", request.id);
    if (error) alert(error.message);
    else onChange?.();
  };

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <Route from={request.from_place} to={request.to_place} />
        <div className="text-right shrink-0 text-sm">
          <div className="font-semibold">{formatDate(request.date)}</div>
          {request.flexible && <div className="text-xs text-muted">Flexible ±1 day</div>}
        </div>
      </div>
      {request.notes && <p className="mt-3 text-sm text-muted">{request.notes}</p>}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex items-center gap-2 text-muted">
          {request.user && <Avatar name={request.user.name} size={24} />}
          <span>{mine ? "You" : request.user?.name ?? "Unknown"}</span>
        </div>
        {mine ? (
          <button className="btn-danger h-8" onClick={remove}>
            Remove
          </button>
        ) : (
          <Link href={offerHref} className="btn-ghost h-8">
            Offer this ride
          </Link>
        )}
      </div>
    </div>
  );
}
