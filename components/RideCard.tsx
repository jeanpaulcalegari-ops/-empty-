"use client";

import Link from "next/link";
import { formatDateTime, isPast, rideTypeLabel, seatsLeft } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { Ride } from "@/lib/types";
import Avatar from "./Avatar";
import Route from "./Route";

export default function RideCard({ ride }: { ride: Ride }) {
  const { userId } = useSession();
  const left = seatsLeft(ride);
  const mine = ride.driver_id === userId;
  const joined = ride.passengers.some((p) => p.user_id === userId);

  let badge: { text: string; cls: string } | null = null;
  if (ride.status === "cancelled") badge = { text: "Cancelled", cls: "bg-danger/10 text-danger" };
  else if (isPast(ride)) badge = { text: "Departed", cls: "bg-border text-muted" };
  else if (mine) badge = { text: ride.ride_type === "lyft" ? "You're organizing" : "You're driving", cls: "bg-accent-soft text-accent" };
  else if (joined) badge = { text: "Joined", cls: "bg-accent-soft text-accent" };
  else if (left <= 0) badge = { text: "Full", cls: "bg-border text-muted" };

  return (
    <Link href={`/rides/${ride.id}`} className="card block p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <Route from={ride.from_place} to={ride.to_place} />
        <div className="text-right shrink-0 text-sm">
          <div className="font-semibold">{formatDateTime(ride.depart_at)}</div>
          <div className="mt-0.5 text-xs text-muted">{rideTypeLabel(ride)}</div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex items-center gap-2 text-muted">
          {ride.driver && <Avatar name={ride.driver.name} size={24} />}
          <span>{mine ? "You" : ride.driver?.name ?? "Unknown"}</span>
        </div>
        <div className="flex items-center gap-2">
          {badge && <span className={`chip ${badge.cls}`}>{badge.text}</span>}
          {ride.status === "open" && !isPast(ride) && left > 0 && (
            <span className="text-muted">
              {left} seat{left === 1 ? "" : "s"} left
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
