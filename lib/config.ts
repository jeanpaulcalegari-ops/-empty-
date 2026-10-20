// Change the name here and it updates everywhere in the app.
export const APP_NAME = "Campus Rideshare";
export const APP_TAGLINE = "Share rides with other students: get to the airport, skip the bus.";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY ?? "";
export const isConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
