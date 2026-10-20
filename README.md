# Campus Rideshare

Students offer empty seats or post ride requests, join each other's rides, and coordinate in a chat
room for each ride. Login is required, with `.edu` emails only.

Built with Next.js and Supabase (auth, Postgres, realtime). To set it up and host it, see **[DEPLOY.md](DEPLOY.md)**.

```bash
cp .env.example .env.local   # add your Supabase URL + key
npm run dev                  # http://localhost:3000
```

## Features

- **Login / sign up**: every page requires an account (`middleware.ts`)
- **Browse**: upcoming rides and ride requests, searchable by place and filterable by date
- **Offer a ride**: route, departure time, seats, notes
- **Request a ride**: drivers can turn a request into a pre-filled ride offer
- **Ride page**: join/leave; the driver can cancel. Joining sends you to the ride's chat
- **Ride chat**: live messages, visible only to the driver and riders
- **My rides**: driving, riding, your requests, past & cancelled

## Where things are

- `supabase/schema.sql`: tables, security rules, and the `join_ride` function (stops overbooking)
- `lib/config.ts`: the app name and tagline (change the name here)
- `lib/session.tsx`: the signed-in user and their profile
- `app/`: one folder per page
