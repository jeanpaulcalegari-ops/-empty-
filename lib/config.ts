// Change the name here and it updates everywhere in the app.
export const APP_NAME = "UniRide";
export const APP_TAGLINE = "Don't panic. Rides with other students, to DEN, home, or the slopes.";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY ?? "";
export const isConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
