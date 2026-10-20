"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import { ErrorBox, Loading } from "@/components/States";
import { formatDateTime, formatTime, hostLabel, isMember } from "@/lib/format";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase/client";
import { RIDE_SELECT, type Message, type Ride } from "@/lib/types";
import { unwrap, useLoad } from "@/lib/useLoad";

type ChatMessage = Message & { sender: { name: string } | null };

export default function RideChat() {
  const { id } = useParams<{ id: string }>();
  const { userId } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: ride, error, loading } = useLoad(async () => {
    const sb = supabase();
    const ride = unwrap(await sb.from("rides").select(RIDE_SELECT).eq("id", id).maybeSingle()) as Ride | null;
    const msgs = unwrap(
      await sb.from("messages").select("*, sender:profiles(name)").eq("ride_id", id).order("created_at").limit(500),
    ) as ChatMessage[];
    setMessages(msgs);
    return ride;
  }, [id]);

  const member = !!ride && isMember(ride, userId);

  // Names for messages that arrive live (realtime payloads don't include joins).
  const names = new Map<string, string>();
  if (ride?.driver) names.set(ride.driver_id, ride.driver.name);
  ride?.passengers.forEach((p) => p.profile && names.set(p.user_id, p.profile.name));
  const namesRef = useRef(names);
  namesRef.current = names;

  useEffect(() => {
    if (!member) return;
    const sb = supabase();
    const channel = sb
      .channel(`ride-chat:${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `ride_id=eq.${id}` },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) =>
            prev.some((x) => x.id === m.id)
              ? prev
              : [...prev, { ...m, sender: { name: namesRef.current.get(m.user_id) ?? "Rider" } }],
          );
        },
      )
      .subscribe();
    return () => {
      sb.removeChannel(channel);
    };
  }, [id, member]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;
  if (!ride) return <ErrorBox message="This ride doesn't exist." />;
  if (!member) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <p className="font-medium">Only people in this ride can see its chat.</p>
        <Link href={`/rides/${id}`} className="btn-primary mt-5">
          View ride
        </Link>
      </div>
    );
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    setSendError("");
    const { data, error } = await supabase()
      .from("messages")
      .insert({ ride_id: id, user_id: userId, body })
      .select("*, sender:profiles(name)")
      .single();
    setSending(false);
    if (error) return setSendError(error.message);
    setDraft("");
    const m = data as ChatMessage;
    setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
  };

  const memberCount = 1 + ride.passengers.length;

  return (
    <div className="card mx-auto flex h-[calc(100dvh-8rem)] max-w-2xl flex-col overflow-hidden">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Link href={`/rides/${id}`} className="text-muted hover:text-foreground" aria-label="Back to ride">
          ←
        </Link>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">
            {ride.from_place} → {ride.to_place}
          </div>
          <div className="text-xs text-muted">
            {formatDateTime(ride.depart_at)} · {memberCount} {memberCount === 1 ? "person" : "people"}
            {ride.status === "cancelled" && <span className="text-danger"> · Cancelled</span>}
          </div>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">
            You&apos;re in! Say hi and sort out the pickup spot.
          </p>
        )}
        {messages.map((m, i) => {
          const mine = m.user_id === userId;
          const name = m.sender?.name ?? names.get(m.user_id) ?? "Rider";
          const showName = !mine && messages[i - 1]?.user_id !== m.user_id;
          return (
            <div key={m.id} className={`flex items-end gap-2 ${mine ? "justify-end" : ""}`}>
              {!mine && (showName ? <Avatar name={name} size={28} /> : <span className="w-7 shrink-0" />)}
              <div className={`max-w-[75%] ${mine ? "text-right" : ""}`}>
                {showName && (
                  <div className="mb-0.5 text-xs text-muted">
                    {name}
                    {m.user_id === ride.driver_id && ` · ${hostLabel(ride)}`}
                  </div>
                )}
                <div
                  className={`inline-block whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-left text-sm ${
                    mine ? "bg-accent text-white dark:text-black" : "bg-accent-soft"
                  }`}
                >
                  {m.body}
                </div>
                <div className="mt-0.5 text-[10px] text-muted">{formatTime(m.created_at)}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="border-t border-border p-3">
        {sendError && <p className="mb-2 text-sm text-danger">{sendError}</p>}
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="Message the ride…"
            value={draft}
            maxLength={2000}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button type="submit" className="btn-primary" disabled={sending || !draft.trim()}>
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
