"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import RideForm from "@/components/RideForm";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase/client";

function OfferForm() {
  const { userId } = useSession();
  const router = useRouter();
  const params = useSearchParams();

  return (
    <RideForm
      title="Offer a ride"
      subtitle="Driving somewhere or booking a Lyft? Let other students come along."
      submitLabel="Post ride"
      initial={{ from: params.get("from") ?? "", to: params.get("to") ?? "", date: params.get("date") ?? "" }}
      onSubmit={async (values) => {
        const { data, error } = await supabase()
          .from("rides")
          .insert({ ...values, driver_id: userId })
          .select("id")
          .single();
        if (error) return error.message;
        router.push(`/rides/${data.id}`);
        return null;
      }}
    />
  );
}

export default function OfferPage() {
  return (
    <Suspense>
      <OfferForm />
    </Suspense>
  );
}
