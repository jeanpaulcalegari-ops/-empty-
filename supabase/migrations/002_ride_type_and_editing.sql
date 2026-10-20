-- Run once in Supabase → SQL Editor if you set up the database before this file existed.
-- Adds "driving vs. splitting a Lyft" and lets the poster edit their ride.

alter table public.rides
  add column if not exists ride_type text not null default 'drive' check (ride_type in ('drive', 'lyft'));

-- The poster can edit ride details, but never reassign the ride to someone else.
revoke update on public.rides from authenticated;
grant update (ride_type, from_place, to_place, depart_at, seats, notes, status) on public.rides to authenticated;

-- Don't let an edit shrink the ride below the people already in it.
create or replace function public.check_ride_seats()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.seats < (select count(*) from public.ride_passengers where ride_id = new.id) then
    raise exception 'Seats can''t be fewer than the people already in this ride';
  end if;
  return new;
end;
$$;

drop trigger if exists rides_check_seats on public.rides;
create trigger rides_check_seats
  before update of seats on public.rides
  for each row execute function public.check_ride_seats();
