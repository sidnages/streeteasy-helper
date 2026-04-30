import { CONFIG } from "./constants.ts";

export async function cleanUpOldListings(supabase: any) {
  const retentionDate = new Date();
  retentionDate.setDate(retentionDate.getDate() - CONFIG.SEEN_LISTINGS_RETENTION_DAYS);
  
  const { error: cleanupError } = await supabase
    .from('seen_listings')
    .delete()
    .lt('created_at', retentionDate.toISOString());
  
  if (cleanupError) console.error('Cleanup Error:', cleanupError.message);
  else console.log(`Successfully cleaned up seen_listings older than ${CONFIG.SEEN_LISTINGS_RETENTION_DAYS} days.`);
}

export function convertFiltersToStreetEasyUrl(filters: any) {
  const priceLower = filters.price.lowerBound ?? ''
  const priceUpper = filters.price.upperBound ?? ''
  const bedroomsLower = filters.bedrooms.lowerBound ?? ''
  const bathroomsLower = filters.bathrooms.lowerBound ?? ''
  const areas = filters.areas
  const amenities = filters.amenities

  let url = 'https://streeteasy.com/for-rent/nyc/'
  let criteria = []
  
  if (priceLower || priceUpper) {
    criteria.push(`price:${priceLower}-${priceUpper}`)
  }
  if (areas?.length) {
    criteria.push(`area:${areas.join()}`)
  }
  if (bedroomsLower) {
    criteria.push(`beds>=${bedroomsLower}`)
  }
  if (bathroomsLower) {
    criteria.push(`baths>=${bathroomsLower}`)
  }
  if (amenities?.length) {
    criteria.push(`amenities:${amenities.join()}`)
  }

  if (criteria.length > 0) {
    url += criteria.join('|')
  }
  
  url += '?sort_by=listed_desc'
  return url
}

export function convertHtmlResponseToListings(html: string) {
  const listings = []
  const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  
  if (jsonLdMatch) {
    try {
      const data = JSON.parse(jsonLdMatch[1]);
      const graph = data['@graph'] || [];
      
      for (const item of graph) {
        if (item['@type'] === 'Apartment' || item['@type'] === 'Accommodation') {
          const priceStr = item.additionalProperty?.find((p: any) => p.name === 'Monthly Rent')?.value || '0';
          const price = parseInt(priceStr.replace(/[^0-9]/g, '')) || 0;
          
          const urlObj = new URL(item.url);
          
          listings.push({
            id: item['@id'] || item.url,
            street: item.address?.streetAddress || 'Unknown Street',
            unit: item.name?.split('#')[1] || '',
            areaName: item.address?.addressLocality || 'Unknown Area',
            price: price,
            bedroomCount: item.numberOfBedrooms || 0,
            fullBathroomCount: item.numberOfFullBathrooms || 0,
            urlPath: urlObj.pathname
          });
        }
      }
    } catch (e) {
      console.error(`Error parsing JSON-LD:`, e);
    }
  }
  return listings;
}

export async function notifyDiscord(webhookUrl: string, listings: any[]) {
  const embeds = listings.slice(0, CONFIG.MAX_DISCORD_EMBEDS).map(listing => ({
    title: `${listing.street}${listing.unit ? ' ' + listing.unit : ''}`,
    description: `${listing.areaName} - $${listing.price}/mo\n${listing.bedroomCount} bed, ${listing.fullBathroomCount} bath`,
    url: `https://streeteasy.com${listing.urlPath}`,
    color: 0x646cff
  }))

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: `🔔 ${listings.length > 1 ? 'New listings found!' : 'New listing found!'}`,
      embeds
    })
  })
  if (!res.ok) throw new Error(`Discord Webhook failed: ${res.statusText}`);
}

export async function notifyEmail(email: string, listings: any[], resendApiKey: string | undefined) {
  if (!resendApiKey) throw new Error('RESEND_API_KEY is not configured in Supabase secrets');

  const html = `
    <h2>New Listings Found!</h2>
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
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: CONFIG.EMAIL_FROM_ADDRESS,
      to: [email],
      subject: `🔔 ${listings.length} New StreetEasy Alert${listings.length > 1 ? 's' : ''}`,
      html
    })
  })
  if (!res.ok) {
    const error = await res.json();
    throw new Error(`Email failed: ${error.message || res.statusText}`);
  }
}
