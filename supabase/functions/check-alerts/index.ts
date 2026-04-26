import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import { StreetEasyClient } from "https://esm.sh/streeteasy-api@0.1.11"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")

const supabase = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!)
const seClient = new StreetEasyClient()

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, alertId } = await req.json().catch(() => ({}));

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
        await notifyEmail(alert.email, [sampleListing]);
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
      const response = await seClient.searchRentals({
        filters: alert.filters,
        perPage: 20,
        page: 1
      })

      const listings = response.items || []
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
          await notifyEmail(alert.email, newListings)
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

async function notifyDiscord(webhookUrl: string, listings: any[]) {
  const embeds = listings.slice(0, 10).map(listing => ({
    title: `${listing.street}${listing.unit ? ' ' + listing.unit : ''}`,
    description: `${listing.areaName} - $${listing.price}/mo\n${listing.bedroomCount} bed, ${listing.fullBathroomCount} bath`,
    url: `https://streeteasy.com${listing.urlPath}`,
    color: 0x646cff
  }))

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: `🔔 Test notification from StreetEasy Helper!`,
      embeds
    })
  })
  if (!res.ok) throw new Error(`Discord Webhook failed: ${res.statusText}`);
}

async function notifyEmail(email: string, listings: any[]) {
  if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured in Supabase secrets');

  const html = `
    <h2>Test Notification Found!</h2>
    <p>This is a sample listing to verify your email setup.</p>
    <ul>
      ${listings.map(l => `
        <li>
          <strong><a href="https://streeteasy.com${l.urlPath}">${l.street} ${l.unit || ''}</a></strong><br>
          ${l.areaName} - $${l.price}/mo<br>
          ${l.bedroomCount} bed, ${l.fullBathroomCount} bath
        </li>
      `).join('')}
    </ul>
  `

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'StreetEasy Helper <alerts@resend.dev>',
      to: [email],
      subject: '🔔 Test Alert',
      html
    })
  })
  if (!res.ok) {
    const error = await res.json();
    throw new Error(`Email failed: ${error.message || res.statusText}`);
  }
}
