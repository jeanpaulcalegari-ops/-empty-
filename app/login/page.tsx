"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";
import { isEduEmail, passwordProblem } from "@/lib/format";
import { supabase } from "@/lib/supabase/client";

function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

type Mode = "signin" | "signup" | "forgot";

function LoginForm() {
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(params.get("error") === "confirm" ? "That link is invalid or expired." : "");
  const [sent, setSent] = useState<"confirm" | "reset" | null>(null);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const sb = supabase();
    const callback = (to: string) => `${window.location.origin}/auth/callback?next=${encodeURIComponent(to)}`;

    if (mode === "forgot") {
      setBusy(true);
      const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: callback("/reset-password") });
      setBusy(false);
      if (error) return setError(error.message);
      return setSent("reset");
    }

    if (mode === "signup") {
      if (!name.trim()) return setError("Enter your name.");
      if (!isEduEmail(email)) return setError("Use your school email (ending in .edu).");
      const problem = passwordProblem(password);
      if (problem) return setError(problem);
    }

    setBusy(true);
    const result =
      mode === "signin"
        ? await sb.auth.signInWithPassword({ email: email.trim(), password })
        : await sb.auth.signUp({
            email: email.trim(),
            password,
            options: { data: { name: name.trim() }, emailRedirectTo: callback(next) },
          });
    setBusy(false);

    if (result.error) {
      const msg = result.error.message;
      return setError(/database error/i.test(msg) ? "A school (.edu) email is required." : msg);
    }
    if (result.data.session) {
      // Full reload so the server sees the new session cookie.
      window.location.href = next;
    } else {
      setSent("confirm");
    }
  };

  if (sent) {
    return (
      <div className="card p-8 text-center">
        <h1 className="text-xl font-semibold">Check your email</h1>
        <p className="mt-2 text-sm text-muted">
          We sent a {sent === "reset" ? "password reset" : "confirmation"} link to{" "}
          <span className="font-medium text-foreground">{email}</span>.{" "}
          {sent === "reset" ? "Click it to choose a new password." : "Click it to finish signing up."}
        </p>
        <button className="mt-4 text-sm text-accent hover:underline" onClick={() => { setSent(null); switchMode("signin"); }}>
          Back to log in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      {mode === "forgot" ? (
        <div>
          <h2 className="font-semibold">Reset your password</h2>
          <p className="mt-1 text-sm text-muted">Enter your email and we&apos;ll send you a link to set a new one.</p>
        </div>
      ) : (
        <div className="inline-flex w-full rounded-full border border-border p-0.5 text-sm">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={`flex-1 rounded-full py-1.5 transition-colors ${
                mode === m ? "bg-accent text-white dark:text-black" : "text-muted hover:text-foreground"
              }`}
            >
              {m === "signin" ? "Log in" : "Sign up"}
            </button>
          ))}
        </div>
      )}
      {mode === "signup" && (
        <div>
          <label className="label" htmlFor="name">Full name</label>
          <input id="name" className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
      )}
      <div>
        <label className="label" htmlFor="email">School email</label>
        <input
          id="email"
          className="input"
          type="email"
          required
          autoComplete="email"
          placeholder="you@school.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      {mode !== "forgot" && (
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-medium" htmlFor="password">Password</label>
            {mode === "signin" && (
              <button type="button" className="text-xs text-accent hover:underline" onClick={() => switchMode("forgot")}>
                Forgot password?
              </button>
            )}
          </div>
          <input
            id="password"
            className="input"
            type="password"
            required
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {mode === "signup" && (
            <p className="mt-1.5 text-xs text-muted">8+ characters with uppercase, lowercase, a number, and a symbol.</p>
          )}
        </div>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
      <button type="submit" className="btn-primary w-full" disabled={busy}>
        {busy ? "One sec…" : mode === "signin" ? "Log in" : mode === "signup" ? "Create account" : "Send reset link"}
      </button>
      {mode === "forgot" && (
        <button type="button" className="w-full text-sm text-muted hover:text-foreground" onClick={() => switchMode("signin")}>
          Back to log in
        </button>
      )}
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm space-y-6 pt-10">
      <div className="text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-accent text-xl text-white dark:text-black">
          ⇄
        </div>
        <h1 className="mt-4 text-2xl font-semibold">{APP_NAME}</h1>
        <p className="mt-1 text-sm text-muted">{APP_TAGLINE}</p>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
