import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import { CONFIG } from "./constants.ts"
import { cleanUpOldListings, convertFiltersToStreetEasyUrl, convertHtmlResponseToListings, notifyDiscord, notifyEmail } from "./utils.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
const SCRAPER_API_KEY = Deno.env.get("SCRAPER_API_KEY")
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")

const supabase = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!)

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, alertId } = await req.json().catch(() => ({}));

    // Cleanup: Delete seen_listings older than retention limit
    await cleanUpOldListings(supabase);

    // Test notification
    if (action === 'test' && alertId) {
      console.log(`Test requested for alert: ${alertId}`)
      
      const { data: alert, error: alertError } = await supabase
        .from('alerts')
        .select('*')
        .eq('id', alertId)
        .single();
      
      if (alertError || !alert) throw new Error(alertError?.message || 'Alert not found in database');

      const sampleListing = {
        id: 'test-123',
        street: '123 Test Street',
        unit: '4B',
        areaName: 'Manhattan',
        price: 5000,
        bedroomCount: 2,
        fullBathroomCount: 2,
        urlPath: '/rental/1234567'
      };

      if (alert.delivery_method === 'discord' && alert.discord_webhook_url) {
        await notifyDiscord(alert.discord_webhook_url, [sampleListing]);
      } else if (alert.delivery_method === 'email' && alert.email) {
        await notifyEmail(alert.email, [sampleListing], RESEND_API_KEY);
      } else {
        throw new Error('No valid delivery method configured for this alert');
      }

      return new Response(JSON.stringify({ success: true, message: 'Test notification sent' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default cron logic
    const { data: alerts, error: alertsError } = await supabase
      .from('alerts')
      .select('*')
      .eq('is_active', true)

    if (alertsError) throw alertsError

    const results = []

    for (const alert of alerts) {
      const url = convertFiltersToStreetEasyUrl(alert.filters)
      const fetchRequest = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(url)}&max_cost=${CONFIG.SCRAPER_MAX_COST}`
      
      console.log(`Checking alert ${alert.id} with URL: ${url}`)
      const response = await fetch(fetchRequest)
      const html = await response.text()

      const listings = convertHtmlResponseToListings(html)
      const newListings = []

      for (const listing of listings) {
        const { data: seen } = await supabase
          .from('seen_listings')
          .select('id')
          .eq('alert_id', alert.id)
          .eq('listing_id', listing.id)
          .single()

        if (!seen) {
          newListings.push(listing)
          await supabase.from('seen_listings').insert({
            alert_id: alert.id,
            listing_id: listing.id
          })
        }
      }

      if (newListings.length > 0) {
        if (alert.delivery_method === 'discord' && alert.discord_webhook_url) {
          await notifyDiscord(alert.discord_webhook_url, newListings)
        }
        if (alert.delivery_method === 'email' && alert.email) {
          await notifyEmail(alert.email, newListings, RESEND_API_KEY)
        }
      }
      results.push({ alertId: alert.id, found: newListings.length })
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    console.error(`Error: ${err.message}`)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
