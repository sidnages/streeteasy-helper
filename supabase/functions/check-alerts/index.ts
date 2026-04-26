import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import { StreetEasyClient } from "https://esm.sh/streeteasy-api@0.1.11"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")

const supabase = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!)
const seClient = new StreetEasyClient()

serve(async (req) => {
  try {
    // 1. Fetch active alerts
    const { data: alerts, error: alertsError } = await supabase
      .from('alerts')
      .select('*')
      .eq('is_active', true)

    if (alertsError) throw alertsError

    const results = []

    for (const alert of alerts) {
      console.log(`Checking alert ${alert.id} for user ${alert.user_id}`)
      
      // 2. Query StreetEasy
      const response = await seClient.searchRentals({
        filters: alert.filters,
        perPage: 20,
        page: 1
      })

      const listings = response.items || []
      const newListings = []

      for (const listing of listings) {
        // 3. Check if seen
        const { data: seen, error: seenError } = await supabase
          .from('seen_listings')
          .select('id')
          .eq('alert_id', alert.id)
          .eq('listing_id', listing.id)
          .single()

        if (seenError && seenError.code !== 'PGRST116') { // PGRST116 is not found
          console.error(`Error checking seen_listings: ${seenError.message}`)
          continue
        }

        if (!seen) {
          newListings.push(listing)
          
          // 4. Record as seen
          await supabase.from('seen_listings').insert({
            alert_id: alert.id,
            listing_id: listing.id
          })
        }
      }

      if (newListings.length > 0) {
        console.log(`Found ${newListings.length} new listings for alert ${alert.id}`)
        
        // 5. Notify
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
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
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

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: `Found ${listings.length} new listings!`,
      embeds
    })
  })
}

async function notifyEmail(email: string, listings: any[]) {
  if (!RESEND_API_KEY) return

  const html = `
    <h2>New StreetEasy Listings Found!</h2>
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

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'StreetEasy Helper <alerts@resend.dev>',
      to: [email],
      subject: 'New Rental Alerts',
      html
    })
  })
}
