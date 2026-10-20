"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME } from "@/lib/config";
import { useSession } from "@/lib/session";
import Avatar from "./Avatar";

const LINKS = [
  { href: "/", label: "Browse" },
  { href: "/offer", label: "Offer a ride" },
  { href: "/request", label: "Request" },
  { href: "/my-rides", label: "My rides" },
];

export default function Nav() {
  const pathname = usePathname();
  const { profile } = useSession();

  if (pathname === "/login") return null;

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 h-14">
        <Link href="/" className="flex items-center gap-2 font-semibold shrink-0">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-white dark:text-black text-sm">
            ⇄
          </span>
          <span className="hidden sm:inline">{APP_NAME}</span>
        </Link>
        <nav className="flex flex-1 items-center gap-1 overflow-x-auto text-sm">
          {LINKS.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 transition-colors ${
                  active ? "bg-accent-soft text-accent font-medium" : "text-muted hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <Link href="/profile" className="shrink-0" aria-label="Profile">
          {profile ? <Avatar name={profile.name} /> : <span className="block h-8 w-8 rounded-full bg-border" />}
        </Link>
      </div>
    </header>
  );
}
