"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import RideForm from "@/components/RideForm";
import { ErrorBox, Loading } from "@/components/States";
import { isPast, localDateKey } from "@/lib/format";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase/client";
import { RIDE_SELECT, type Ride } from "@/lib/types";
import { unwrap, useLoad } from "@/lib/useLoad";

export default function EditRidePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { userId } = useSession();

  const { data: ride, error, loading } = useLoad(
    async () => unwrap(await supabase().from("rides").select(RIDE_SELECT).eq("id", id).maybeSingle()) as Ride | null,
    [id],
  );

  if (loading || !userId) return <Loading />;
  if (error) return <ErrorBox message={error} />;
  if (!ride) return <ErrorBox message="This ride doesn't exist." />;

  const back = (
    <Link href={`/rides/${id}`} className="btn-ghost mt-5">
      Back to ride
    </Link>
  );
  if (ride.driver_id !== userId) {
    return <div className="card p-10 text-center"><p className="font-medium">Only the person who posted this ride can edit it.</p>{back}</div>;
  }
  if (ride.status === "cancelled" || isPast(ride)) {
    return <div className="card p-10 text-center"><p className="font-medium">This ride is {ride.status === "cancelled" ? "cancelled" : "over"} and can&apos;t be edited.</p>{back}</div>;
  }

  const d = new Date(ride.depart_at);
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

  return (
    <RideForm
      title="Edit ride"
      subtitle={ride.passengers.length ? "Riders will see the changes. Mention them in the ride chat too." : "Update the details of your ride."}
      submitLabel="Save changes"
      initial={{
        rideType: ride.ride_type,
        from: ride.from_place,
        to: ride.to_place,
        date: localDateKey(d),
        time,
        seats: ride.seats,
        notes: ride.notes ?? "",
      }}
      minSeats={Math.max(1, ride.passengers.length)}
      onSubmit={async (values) => {
        const { error } = await supabase().from("rides").update(values).eq("id", id);
        if (error) return error.message;
        router.push(`/rides/${id}`);
        return null;
      }}
    />
  );
}
