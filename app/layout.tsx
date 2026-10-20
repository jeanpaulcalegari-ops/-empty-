import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import { APP_NAME, APP_TAGLINE, isConfigured } from "@/lib/config";
import { SessionProvider } from "@/lib/session";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_TAGLINE,
};

function NotConfigured() {
  return (
    <main className="mx-auto max-w-lg px-4 py-20">
      <div className="card space-y-3 p-6 text-sm">
        <h1 className="text-xl font-semibold">Almost there: connect Supabase</h1>
        <p className="text-muted">
          Copy <code>.env.example</code> to <code>.env.local</code>, fill in your Supabase project URL and key, then
          restart <code>npm run dev</code>. Full steps are in <code>DEPLOY.md</code>.
        </p>
      </div>
    </main>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        {isConfigured ? (
          <SessionProvider>
            <Nav />
            <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
          </SessionProvider>
        ) : (
          <NotConfigured />
        )}
      </body>
    </html>
  );
}
