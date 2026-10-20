export type Profile = {
  id: string;
  name: string;
  major: string | null;
};

export type RideType = "drive" | "lyft";

export type Ride = {
  id: string;
  driver_id: string;
  ride_type: RideType;
  from_place: string;
  to_place: string;
  depart_at: string;
  seats: number;
  notes: string | null;
  status: "open" | "cancelled";
  created_at: string;
  driver: Profile | null;
  passengers: { user_id: string; profile: Profile | null }[];
};

export type RideRequest = {
  id: string;
  user_id: string;
  from_place: string;
  to_place: string;
  date: string; // yyyy-mm-dd
  flexible: boolean;
  notes: string | null;
  created_at: string;
  user: Profile | null;
};

export type Message = {
  id: number;
  ride_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

// Embeds used with .select() so every page gets the same shape.
// rides reaches profiles two ways (driver_id, and via ride_passengers), so the driver embed names its foreign key.
export const RIDE_SELECT = "*, driver:profiles!rides_driver_id_fkey(id,name,major), passengers:ride_passengers(user_id, profile:profiles(id,name,major))";
export const REQUEST_SELECT = "*, user:profiles(id,name,major)";
