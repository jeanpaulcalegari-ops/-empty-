# Putting the site online

Two free services:

- **Supabase**: accounts/login, the database, and live chat
- **Vercel**: hosts the website and gives you a URL (`your-app.vercel.app`, or your own domain)

Takes about 15 minutes.

## 1. Create the Supabase project

1. Sign up at https://supabase.com and click **New project**. Pick any name, set a database password (save it somewhere), choose the region closest to your campus.
2. When it's ready, open **SQL Editor → New query**, paste the whole contents of `supabase/schema.sql`, and click **Run**. You should see "Success. No rows returned".
3. Open **Authentication → Sign In / Providers → Email** and decide on email confirmation:
   - **To get going quickly:** turn **Confirm email** off. People can sign up and log in right away, but nobody proves they own the `.edu` address.
   - **For the real launch:** leave it on and set up custom email under **Authentication → Emails → SMTP Settings** (Resend has a free tier). Supabase's built-in email is heavily rate-limited and is only meant for testing.
4. Open **Project Settings → API** (or the **Connect** button) and copy the **Project URL** and the **publishable key** (or "anon" key). Do not use the secret / service_role key.

## 2. Run it locally against Supabase

```bash
cp .env.example .env.local   # then paste the URL and key into .env.local
npm run dev
```

Open http://localhost:3000, sign up with a `.edu` email, and try it. Use a second browser (or a private window) with another account to test joining and chat.

## 3. Put the code on GitHub

1. Create a new **empty** repository at https://github.com/new (no README).
2. In this folder:

```bash
git add -A
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

## 4. Deploy on Vercel

1. Sign up at https://vercel.com with your GitHub account, click **Add New → Project**, and import the repo.
2. Under **Environment Variables** add the same two values from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_KEY`
3. Click **Deploy**. You'll get a URL like `https://your-app.vercel.app`.
4. Back in Supabase, **Authentication → URL Configuration**:
   - **Site URL**: your Vercel URL
   - **Redirect URLs**: add `https://your-app.vercel.app/**` and `http://localhost:3000/**`

From now on, every `git push` redeploys the site automatically.

## 5. Custom domain (optional)

Buy a domain (Vercel, Namecheap, Cloudflare…), then in Vercel **Project → Settings → Domains** add it and follow the DNS instructions. Update the Supabase Site URL and Redirect URLs to the new domain.
