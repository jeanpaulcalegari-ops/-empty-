import type { Ride } from "./types";

export function isEduEmail(email: string) {
  return /^[^@\s]+@[^@\s]+\.edu$/i.test(email.trim());
}

// Matches the Supabase password policy on this project.
export function passwordProblem(pw: string) {
  if (pw.length < 8 || !/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/\d/.test(pw) || !/[^a-zA-Z0-9]/.test(pw)) {
    return "Password needs 8+ characters with an uppercase letter, a lowercase letter, a number, and a symbol.";
  }
  return null;
}

export function seatsLeft(ride: Ride) {
  return ride.seats - ride.passengers.length;
}

export function isPast(ride: Ride) {
  return new Date(ride.depart_at).getTime() < Date.now();
}

// The person who posted the ride: drives it, or books the Lyft.
export function hostLabel(ride: Ride) {
  return ride.ride_type === "lyft" ? "Organizer" : "Driver";
}

export function rideTypeLabel(ride: Ride) {
  return ride.ride_type === "lyft" ? "🚕 Splitting a Lyft" : "🚗 Driving";
}

export function isMember(ride: Ride, userId: string | null) {
  return !!userId && (ride.driver_id === userId || ride.passengers.some((p) => p.user_id === userId));
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function formatDate(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function localDateKey(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}
