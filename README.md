# StreetEasy Alert Helper

This is a personal utility built for the sake of making a fun project and for individual use. It is not intended for commercial use or high-volume traffic. Use at your own risk, and please don't spam Streeteasy with traffic.

Automated rental alerts for StreetEasy listings, sent directly to your Discord or Email.

## Features
- **Custom Filters**: Search by neighborhood, price range, beds/baths, and amenities.
- **Smart Deduplication**: Only get notified about listings you haven't seen yet.
- **Discord Integration**: Instant push notifications via Discord webhooks.
- **Email Alerts**: Reliable updates via Resend.
- **Zero Cost**: Built entirely on free-tier services.

## How it Works
1. **Alert Creation**: Users define search criteria (neighborhood, price, beds, etc.) in the React frontend.
2. **Secure Storage**: Alerts are stored in a Supabase PostgreSQL database. Row Level Security (RLS) ensures users only see their own alerts.
3. **Automated Scanning**: A Supabase Edge Function runs on a schedule. It iterates through active alerts and queries the StreetEasy API via **ScraperAPI** to reliably fetch listing data while bypassing anti-bot protections.
4. **Intelligent Deduplication**: The app tracks `seen_listings` for each alert. You are only notified about new apartments that hit the market since the last check.
5. **Instant Delivery**: Notifications are dispatched via Discord Webhooks or Resend (Email), providing direct links to the new listings.

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

### 3. ScraperAPI Setup
- Create an account at [scraperapi.com](https://www.scraperapi.com/).
- From your dashboard, copy your **API Key**.
- ScraperAPI is used to handle StreetEasy's anti-bot protections, ensuring the Edge Function can reliably fetch new listings.

### 4. Edge Function Deployment
- Login and link your project: `npx supabase login` and `npx supabase link --project-ref your-project-ref`.
- Deploy the function: `npx supabase functions deploy check-alerts`.
- Set secrets for the function:
  ```bash
  npx supabase secrets set RESEND_API_KEY=your_resend_key
  npx supabase secrets set SERVICE_ROLE_KEY=your_service_role_key
  npx supabase secrets set SCRAPER_API_KEY=your_scraperapi_key
  ```
- **RESEND_API_KEY**: The key you just generated in Resend.
- **SERVICE_ROLE_KEY**: Found in your Supabase Dashboard under **Project Settings > API**. 
  - *Note*: Use the `service_role` key (secret), NOT the `anon` key, as the function needs full database access to bypass Row Level Security and check/update listings for all users.
- **SCRAPER_API_KEY**: The API key from your ScraperAPI dashboard.

### 5. Schedule the Checker
To automate the checking process, you must schedule the Edge Function using the Supabase Cron integration:

1. In the Supabase Dashboard, select **Database > Integrations > Cron**.
2. Click **Create job**.
3. Configure the job with the following:
   - **Name**: `check-alerts-cron`
   - **Schedule**: [configure this how you please - reccommended is twice a day]
     - Note that Scraper API free-tier allows 5000 monthly credits and each alert uses 10 credits
   - **HTTP Method**: `POST`
   - **URL**: `https://your-project.supabase.co/functions/v1/check-alerts`
   - **Body**: `{"action": "cron"}`
   - **Headers**: 
     - Click **Add Header** to add the following:
       - `Authorization`: `Bearer {YOUR_SERVICE_ROLE_KEY}`
       - `apikey`: `{YOUR_SERVICE_ROLE_KEY}`
       - `Content-Type`: `application/json`

*Note: Replace `your-project.supabase.co` with your actual project URL and `YOUR_SERVICE_ROLE_KEY` with the `service_role` key from your **Project Settings > API**.*

### 6. Building The Project
- **Create a `.env` file**: 
 1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
  2. Select your project.
  3. Click on the **Settings** (gear icon) at the bottom of the left sidebar.
  4. Click on **API Keys** in the sidebar. Find the `anon` `public` key for `VITE_SUPABASE_ANON_KEY`.
  5. Click on **Data API** in the sidebar. Under **API URL**, find the `URL` for `VITE_SUPABASE_URL`.
  6. **Save these in a local `.env` file** in the root directory of this project (see `.env.example` for format).
- **Install and Build**: Run `npm install` followed by `npm run build`.

### 7. Local Development & Testing
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
- **Backend**: Supabase Edge Functions (Deno), ScraperAPI.
- **Notifications**: Resend (Email), Discord Webhooks.
