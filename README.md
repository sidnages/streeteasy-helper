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

### 2. Resend Setup
- Create a free account at [resend.com](https://resend.com).
- In the dashboard, navigate to **API Keys** in the sidebar.
- Click **Create API Key**, give it a name (e.g., "StreetEasy Helper"), and copy the key immediately.
- *Note*: By default, you can send emails to your own account email. To send to others, you would need to verify a domain, but for personal alerts, the default setup is sufficient.

### 3. Edge Function Deployment
- Login and link your project: `npx supabase login` and `npx supabase link --project-ref your-project-ref`.
- Deploy the function: `npx supabase functions deploy check-alerts`.
- Set secrets for the function:
  ```bash
  npx supabase secrets set RESEND_API_KEY=your_resend_key
  npx supabase secrets set SERVICE_ROLE_KEY=your_service_role_key
  ```
- **RESEND_API_KEY**: The key you just generated in Resend.
- **SERVICE_ROLE_KEY**: Found in your Supabase Dashboard under **Project Settings > API**. 
  - *Note*: Use the `service_role` key (secret), NOT the `anon` key, as the function needs full database access to bypass Row Level Security and check/update listings for all users.np

### 4. Schedule the Checker
In the Supabase Dashboard, go to **Database > Cron** (if enabled) or use an external trigger to call your function endpoint every 30 minutes:
`POST https://your-project.supabase.co/functions/v1/check-alerts` (use service role key for auth).

### 6. Building The Project
- **Create a `.env` file**: 
 1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
  2. Select your project.
  3. Click on the **Settings** (gear icon) at the bottom of the left sidebar.
  4. Click on **API Keys** in the sidebar. Find the `anon` `public` key for `VITE_SUPABASE_ANON_KEY`.
  5. Click on **Data API** in the sidebar. Under **API URL**, find the `URL` for `VITE_SUPABASE_URL`.
  6. **Save these in a local `.env` file** in the root directory of this project (see `.env.example` for format).
- **Install and Build**: Run `npm install` followed by `npm run build`.

### 6. Local Development & Testing
You can test the frontend locally before deploying:
- **Development Mode**: Run `npm run dev` to start a development server at `http://localhost:5173`.
- **Production Preview**: Run `npm run build` then `npm run preview` to test the final optimized build at `http://localhost:4173`.

#### Important for Local Authentication:
1. **Magic Link Redirects**: In your Supabase Dashboard, go to **Auth > URL Configuration**.
   - Set **Site URL** to `http://localhost:5173`.
   - Add `http://localhost:5173/**` to the **Redirect URLs** list.
2. **Environment Changes**: If you modify your `.env` file, you **must restart** the development server (`Ctrl+C` then `npm run dev`) for the changes to take effect.
3. **Verification**: Open your browser console (F12) to see if Supabase has initialized correctly.

### 7. Frontend Deployment
- Connect your GitHub repository to a platform like Vercel or Netlify. Ensure you also add your `.env` variables to the platform's "Environment Variables" settings during deployment.

## Tech Stack
- **Frontend**: React, TypeScript, Vite, CSS Modules.
- **Database**: Supabase (PostgreSQL).
- **Backend**: Supabase Edge Functions (Deno).
- **Notifications**: Resend (Email), Discord Webhooks.
