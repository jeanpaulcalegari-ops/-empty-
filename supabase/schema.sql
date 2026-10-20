-- Run this once in the Supabase dashboard: SQL Editor → New query → paste → Run.

-- ───────────── Tables ─────────────

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null check (length(trim(name)) between 1 and 80),
  major text check (length(major) <= 80),
  created_at timestamptz not null default now()
);

create table public.rides (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.profiles on delete cascade,
  ride_type text not null default 'drive' check (ride_type in ('drive', 'lyft')),
  from_place text not null check (length(trim(from_place)) between 1 and 120),
  to_place text not null check (length(trim(to_place)) between 1 and 120),
  depart_at timestamptz not null,
  seats int not null check (seats between 1 and 7),
  notes text check (length(notes) <= 1000),
  status text not null default 'open' check (status in ('open', 'cancelled')),
  created_at timestamptz not null default now()
);
create index rides_depart_at_idx on public.rides (depart_at);

create table public.ride_passengers (
  ride_id uuid not null references public.rides on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (ride_id, user_id)
);
create index ride_passengers_user_idx on public.ride_passengers (user_id);

create table public.ride_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  from_place text not null check (length(trim(from_place)) between 1 and 120),
  to_place text not null check (length(trim(to_place)) between 1 and 120),
  date date not null,
  flexible boolean not null default false,
  notes text check (length(notes) <= 1000),
  created_at timestamptz not null default now()
);

create table public.messages (
  id bigint generated always as identity primary key,
  ride_id uuid not null references public.rides on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  body text not null check (length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index messages_ride_idx on public.messages (ride_id, created_at);

-- ───────────── Sign-up: .edu only, auto-create profile ─────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.email is null or new.email !~* '\.edu$' then
    raise exception 'A school (.edu) email is required';
  end if;
  insert into public.profiles (id, name)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────── Helpers ─────────────

create or replace function public.is_ride_member(rid uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (select 1 from public.rides where id = rid and driver_id = auth.uid())
      or exists (select 1 from public.ride_passengers where ride_id = rid and user_id = auth.uid());
$$;

-- Joining goes through this function so two people can't grab the last seat at once.
create or replace function public.join_ride(rid uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  r public.rides;
  taken int;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select * into r from public.rides where id = rid for update;
  if not found then raise exception 'Ride not found'; end if;
  if r.status <> 'open' then raise exception 'This ride was cancelled'; end if;
  if r.depart_at < now() then raise exception 'This ride already left'; end if;
  if r.driver_id = auth.uid() then raise exception 'You are driving this ride'; end if;
  if exists (select 1 from public.ride_passengers where ride_id = rid and user_id = auth.uid()) then
    return;
  end if;
  select count(*) into taken from public.ride_passengers where ride_id = rid;
  if taken >= r.seats then raise exception 'This ride is full'; end if;
  insert into public.ride_passengers (ride_id, user_id) values (rid, auth.uid());
end;
$$;

revoke execute on function public.join_ride(uuid) from public, anon;
grant execute on function public.join_ride(uuid) to authenticated;

-- ───────────── Row level security ─────────────

alter table public.profiles enable row level security;
alter table public.rides enable row level security;
alter table public.ride_passengers enable row level security;
alter table public.ride_requests enable row level security;
alter table public.messages enable row level security;

create policy "profiles readable by signed-in users" on public.profiles
  for select to authenticated using (true);
create policy "update own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "rides readable by signed-in users" on public.rides
  for select to authenticated using (true);
create policy "post own rides" on public.rides
  for insert to authenticated with check (driver_id = auth.uid() and status = 'open');
create policy "driver updates own ride" on public.rides
  for update to authenticated using (driver_id = auth.uid()) with check (driver_id = auth.uid());

create policy "passengers readable by signed-in users" on public.ride_passengers
  for select to authenticated using (true);
create policy "leave a ride" on public.ride_passengers
  for delete to authenticated using (user_id = auth.uid());
-- (no insert policy: joining is only possible through join_ride)

create policy "requests readable by signed-in users" on public.ride_requests
  for select to authenticated using (true);
create policy "post own requests" on public.ride_requests
  for insert to authenticated with check (user_id = auth.uid());
create policy "delete own requests" on public.ride_requests
  for delete to authenticated using (user_id = auth.uid());

create policy "ride members read chat" on public.messages
  for select to authenticated using (public.is_ride_member(ride_id));
create policy "ride members post to chat" on public.messages
  for insert to authenticated with check (user_id = auth.uid() and public.is_ride_member(ride_id));

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

create trigger rides_check_seats
  before update of seats on public.rides
  for each row execute function public.check_ride_seats();
revoke update on public.profiles from authenticated;
grant update (name, major) on public.profiles to authenticated;

-- ───────────── Realtime chat ─────────────

alter publication supabase_realtime add table public.messages;
