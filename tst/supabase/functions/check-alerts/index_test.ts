import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { handler } from "../../../../supabase/functions/check-alerts/index.ts";

Deno.test("handler - test action sends notification", async () => {
  const originalFetch = globalThis.fetch;
  
  // Mock fetch for Supabase select and Discord/Email notification
  globalThis.fetch = async (url: string | URL | Request, init?: RequestInit) => {
    const urlStr = url.toString();
    
    // Mock Supabase Alert Select
    if (urlStr.includes("/rest/v1/alerts")) {
      return new Response(JSON.stringify({
        id: "alert-123",
        delivery_method: "discord",
        discord_webhook_url: "https://discord.test",
        filters: { price: {}, areas: [] }
      }), { status: 200 });
    }
    
    // Mock Discord Webhook
    if (urlStr.includes("discord.test")) {
      return new Response("ok", { status: 200 });
    }

    // Mock seen_listings delete (cleanup)
    if (urlStr.includes("/rest/v1/seen_listings")) {
        return new Response(JSON.stringify([]), { status: 200 });
    }

    return new Response("not found", { status: 404 });
  };

  try {
    const req = new Request("https://test.com", {
      method: "POST",
      body: JSON.stringify({ action: "test", alertId: "alert-123" })
    });
    
    const res = await handler(req);
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body.success, true);
    assertEquals(body.message, "Test notification sent");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("handler - cron action processes alerts", async () => {
    const originalFetch = globalThis.fetch;
    
    globalThis.fetch = async (url: string | URL | Request, init?: RequestInit) => {
      const urlStr = url.toString();
      
      // Mock Supabase Alerts Select (List active)
      if (urlStr.includes("/rest/v1/alerts") && init?.method === "GET") {
        return new Response(JSON.stringify([{
          id: "alert-123",
          delivery_method: "email",
          email: "test@test.com",
          filters: { price: {}, areas: [] }
        }]), { status: 200 });
      }

      // Mock ScraperAPI
      if (urlStr.includes("scraperapi.com")) {
          // Return HTML with one listing in JSON-LD
          return new Response(`
            <script type="application/ld+json">
            {
                "@graph": [{
                    "@type": "Apartment",
                    "url": "https://streeteasy.com/rental/1",
                    "address": { "streetAddress": "123 Main" },
                    "additionalProperty": [{ "name": "Monthly Rent", "value": "1000" }]
                }]
            }
            </script>
          `, { status: 200 });
      }

      // Mock Supabase Seen Listings check
      if (urlStr.includes("/rest/v1/seen_listings") && init?.method === "GET") {
          return new Response(JSON.stringify([]), { status: 200 }); // Not seen
      }

      // Mock Supabase Seen Listings insert
      if (urlStr.includes("/rest/v1/seen_listings") && init?.method === "POST") {
          return new Response(JSON.stringify({}), { status: 201 });
      }

      // Mock Resend Email
      if (urlStr.includes("api.resend.com")) {
          return new Response(JSON.stringify({ id: "1" }), { status: 200 });
      }

      // Mock seen_listings delete (cleanup)
      if (urlStr.includes("/rest/v1/seen_listings") && init?.method === "DELETE") {
        return new Response(JSON.stringify([]), { status: 200 });
      }
  
      return new Response("not found", { status: 404 });
    };
  
    try {
      const req = new Request("https://test.com", {
        method: "POST",
        body: JSON.stringify({ action: "cron" })
      });
      
      const res = await handler(req);
      assertEquals(res.status, 200);
      const body = await res.json();
      assertEquals(body.success, true);
      assertEquals(body.results.length, 1);
      assertEquals(body.results[0].found, 1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
