# StreetEasy Alert Helper

Automated rental alerts for StreetEasy listings, sent directly to your Discord or Email.

## Features
- **Custom Filters**: Search by neighborhood, price range, beds/baths, and amenities.
- **Smart Deduplication**: Only get notified about listings you haven't seen yet.
- **Discord Integration**: Instant push notifications via Discord webhooks.
- **Email Alerts**: Reliable updates via Resend.
- **Zero Cost**: Built entirely on free-tier services.

## Setup Instructions

### 1. Supabase Setup
- Create a new project at [supabase.com](https://supabase.com/).
- Go to the **SQL Editor** and run the contents of `supabase/schema.sql`.
- Enable **Email Auth** or **Magic Links** in the Auth settings.

### 2. Edge Function Deployment
- Install the [Supabase CLI](https://supabase.com/docs/guides/cli).
- Login and link your project: `supabase login` and `supabase link --project-ref your-project-ref`.
- Deploy the function: `supabase functions deploy check-alerts`.
- Set secrets for the function:
  ```bash
  supabase secrets set RESEND_API_KEY=your_resend_key
  supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
  ```

### 3. Schedule the Checker
In the Supabase Dashboard, go to **Database > Cron** (if enabled) or use an external trigger to call your function endpoint every 30 minutes:
`POST https://your-project.supabase.co/functions/v1/check-alerts` (use service role key for auth).

### 4. Frontend Deployment
- Create a `.env` file based on `.env.example`.
- Run `npm install` and `npm run build`.
- Deploy to Vercel, Netlify, or similar by connecting your GitHub repo.

## Tech Stack
- **Frontend**: React, TypeScript, Vite, CSS Modules.
- **Database**: Supabase (PostgreSQL).
- **Backend**: Supabase Edge Functions (Deno).
- **Notifications**: Resend (Email), Discord Webhooks.
