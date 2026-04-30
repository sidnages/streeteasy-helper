import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { 
  convertFiltersToStreetEasyUrl, 
  convertHtmlResponseToListings,
  cleanUpOldListings,
  notifyDiscord,
  notifyEmail
} from "../../../../supabase/functions/check-alerts/utils.ts";

Deno.test("convertFiltersToStreetEasyUrl - empty filters", () => {
  const filters = {
    price: { lowerBound: null, upperBound: null },
    bedrooms: { lowerBound: null, upperBound: null },
    bathrooms: { lowerBound: null, upperBound: null },
    areas: [],
    amenities: []
  };
  const url = convertFiltersToStreetEasyUrl(filters);
  assertEquals(url, "https://streeteasy.com/for-rent/nyc/?sort_by=listed_desc");
});

Deno.test("convertFiltersToStreetEasyUrl - with price and areas", () => {
  const filters = {
    price: { lowerBound: 2000, upperBound: 5000 },
    bedrooms: { lowerBound: 1, upperBound: null },
    bathrooms: { lowerBound: 1, upperBound: null },
    areas: [1, 2],
    amenities: ['gym']
  };
  const url = convertFiltersToStreetEasyUrl(filters);
  assertEquals(url, "https://streeteasy.com/for-rent/nyc/price:2000-5000|area:1,2|beds>=1|baths>=1|amenities:gym?sort_by=listed_desc");
});

Deno.test("convertHtmlResponseToListings - parses JSON-LD correctly", () => {
  const html = `
    <html>
      <script type="application/ld+json">
        {
          "@graph": [
            {
              "@type": "Apartment",
              "@id": "listing-1",
              "url": "https://streeteasy.com/rental/123",
              "name": "Apt #4B",
              "address": {
                "streetAddress": "123 Main St",
                "addressLocality": "Manhattan"
              },
              "additionalProperty": [
                { "name": "Monthly Rent", "value": "$3,500" }
              ],
              "numberOfBedrooms": 1,
              "numberOfFullBathrooms": 1
            }
          ]
        }
      </script>
    </html>
  `;
  const listings = convertHtmlResponseToListings(html);
  assertEquals(listings.length, 1);
  assertEquals(listings[0].street, "123 Main St");
  assertEquals(listings[0].price, 3500);
  assertEquals(listings[0].unit, "4B");
  assertEquals(listings[0].urlPath, "/rental/123");
});

Deno.test("convertHtmlResponseToListings - returns empty on no match", () => {
  const html = "<html><body>No listings here</body></html>";
  const listings = convertHtmlResponseToListings(html);
  assertEquals(listings.length, 0);
});

Deno.test("cleanUpOldListings - calls delete on supabase", async () => {
  let called = false;
  const mockSupabase = {
    from: (table: string) => {
      assertEquals(table, "seen_listings");
      return {
        delete: () => ({
          lt: (column: string, _date: string) => {
            assertEquals(column, "created_at");
            called = true;
            return Promise.resolve({ error: null });
          }
        })
      };
    }
  };
  
  await cleanUpOldListings(mockSupabase);
  assertEquals(called, true);
});

Deno.test("notifyDiscord - sends POST request to webhook", async () => {
  const originalFetch = globalThis.fetch;
  let fetchCalled = false;
  
  globalThis.fetch = async (url: string | URL | Request, init?: RequestInit) => {
    fetchCalled = true;
    assertEquals(url, "https://discord.com/api/webhooks/test");
    assertEquals(init?.method, "POST");
    const body = JSON.parse(init?.body as string);
    assertEquals(body.embeds.length, 1);
    assertEquals(body.embeds[0].title, "Main St");
    return new Response("ok", { status: 200 });
  };

  try {
    await notifyDiscord("https://discord.com/api/webhooks/test", [{ street: "Main St", price: 1000, urlPath: "/1" }]);
    assertEquals(fetchCalled, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("notifyEmail - sends POST request to Resend", async () => {
  const originalFetch = globalThis.fetch;
  let fetchCalled = false;
  
  globalThis.fetch = async (url: string | URL | Request, init?: RequestInit) => {
    fetchCalled = true;
    assertEquals(url, "https://api.resend.com/emails");
    const headers = init?.headers as any;
    assertEquals(headers["Authorization"], "Bearer test-key");
    const body = JSON.parse(init?.body as string);
    assertEquals(body.to[0], "test@example.com");
    return new Response(JSON.stringify({ id: "1" }), { status: 200 });
  };

  try {
    await notifyEmail("test@example.com", [{ street: "Main St", price: 1000, urlPath: "/1" }], "test-key");
    assertEquals(fetchCalled, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
