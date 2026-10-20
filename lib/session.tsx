"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase/client";
import type { Profile } from "./types";

type Session = {
  ready: boolean;
  userId: string | null;
  email: string | null;
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const loadProfile = useCallback(async (id: string | null) => {
    if (!id) return setProfile(null);
    const { data } = await supabase().from("profiles").select("id,name,major").eq("id", id).single();
    setProfile((data as Profile) ?? null);
  }, []);

  useEffect(() => {
    const sb = supabase();
    sb.auth.getUser().then(async ({ data }) => {
      setUserId(data.user?.id ?? null);
      setEmail(data.user?.email ?? null);
      await loadProfile(data.user?.id ?? null);
      setReady(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      const id = session?.user.id ?? null;
      setUserId(id);
      setEmail(session?.user.email ?? null);
      // Defer the query so it doesn't run inside the auth callback.
      setTimeout(() => loadProfile(id), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const value: Session = {
    ready,
    userId,
    email,
    profile,
    refreshProfile: () => loadProfile(userId),
    signOut: async () => {
      await supabase().auth.signOut();
      window.location.href = "/login";
    },
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}
