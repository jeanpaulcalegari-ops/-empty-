"use client";

import { useEffect, useState } from "react";
import Avatar from "@/components/Avatar";
import { Loading } from "@/components/States";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase/client";

export default function ProfilePage() {
  const { ready, userId, email, profile, refreshProfile, signOut } = useSession();
  const [name, setName] = useState("");
  const [major, setMajor] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(profile?.name ?? "");
    setMajor(profile?.major ?? "");
  }, [profile]);

  if (!ready) return <Loading />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Enter your name.");
    setBusy(true);
    const { error } = await supabase()
      .from("profiles")
      .update({ name: name.trim(), major: major.trim() || null })
      .eq("id", userId);
    setBusy(false);
    if (error) return setError(error.message);
    setError("");
    setSaved(true);
    refreshProfile();
  };

  return (
    <div className="mx-auto max-w-md space-y-4">
      <form onSubmit={submit} className="card space-y-5 p-6">
        <div className="flex items-center gap-3">
          {name.trim() && <Avatar name={name} size={48} />}
          <div>
            <h1 className="text-2xl font-semibold">Your profile</h1>
            <p className="text-sm text-muted">{email}</p>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="name">Full name</label>
          <input id="name" className="input" value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} />
        </div>
        <div>
          <label className="label" htmlFor="major">Major <span className="font-normal text-muted">(optional)</span></label>
          <input id="major" className="input" value={major} onChange={(e) => { setMajor(e.target.value); setSaved(false); }} />
        </div>
        <p className="text-xs text-muted">Other students see your name and major. Your email stays private.</p>
        {error && <p className="text-sm text-danger">{error}</p>}
        {saved && <p className="text-sm text-accent">Saved.</p>}
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          Save changes
        </button>
      </form>
      <button className="btn-ghost w-full" onClick={signOut}>
        Log out
      </button>
    </div>
  );
}
