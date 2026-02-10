import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

interface ZohoSettings {
  id: string;
  organization_id: string;
  client_id: string;
  client_secret: string;
  refresh_token: string | null;
  access_token: string | null;
  access_token_expires_at: string | null;
  region: string;
}

async function getZohoSettings(): Promise<ZohoSettings | null> {
  const { data, error } = await supabase
    .from("zoho_settings")
    .select("*")
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

async function getAccessToken(settings: ZohoSettings): Promise<string | null> {
  if (
    settings.access_token &&
    settings.access_token_expires_at &&
    new Date(settings.access_token_expires_at) > new Date()
  ) {
    return settings.access_token;
  }

  if (!settings.refresh_token) return null;

  const regionDomains: Record<string, string> = {
    us: "https://accounts.zoho.com",
    eu: "https://accounts.zoho.eu",
    in: "https://accounts.zoho.in",
    au: "https://accounts.zoho.com.au",
    jp: "https://accounts.zoho.jp",
  };

  const authDomain = regionDomains[settings.region] || regionDomains.us;

  try {
    const response = await fetch(
      `${authDomain}/oauth/v2/token?refresh_token=${settings.refresh_token}&client_id=${settings.client_id}&client_secret=${settings.client_secret}&grant_type=refresh_token`,
      { method: "POST" }
    );

    const data = await response.json();

    if (data.access_token) {
      const expiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000);

      await supabase
        .from("zoho_settings")
        .update({
          access_token: data.access_token,
          access_token_expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", settings.id);

      return data.access_token;
    }
  } catch (error) {
    console.error("Error refreshing access token:", error);
  }

  return null;
}

function getApiDomain(region: string): string {
  const apiDomains: Record<string, string> = {
    us: "https://www.zohoapis.com",
    eu: "https://www.zohoapis.eu",
    in: "https://www.zohoapis.in",
    au: "https://www.zohoapis.com.au",
    jp: "https://www.zohoapis.jp",
  };
  return apiDomains[region] || apiDomains.us;
}

async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  clientSecret: string,
  region: string
): Promise<{ refresh_token?: string; access_token?: string; error?: string }> {
  const regionDomains: Record<string, string> = {
    us: "https://accounts.zoho.com",
    eu: "https://accounts.zoho.eu",
    in: "https://accounts.zoho.in",
    au: "https://accounts.zoho.com.au",
    jp: "https://accounts.zoho.jp",
  };

  const authDomain = regionDomains[region] || regionDomains.us;

  try {
    const response = await fetch(
      `${authDomain}/oauth/v2/token?code=${code}&client_id=${clientId}&client_secret=${clientSecret}&grant_type=authorization_code`,
      { method: "POST" }
    );

    const data = await response.json();
    return data;
  } catch (error) {
    return { error: String(error) };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (action === "setup") {
      const body = await req.json();
      const { code, client_id, client_secret, organization_id, region = "us" } = body;

      const tokenResult = await exchangeCodeForTokens(code, client_id, client_secret, region);

      if (tokenResult.error || !tokenResult.refresh_token) {
        return new Response(
          JSON.stringify({ success: false, error: tokenResult.error || "No refresh token received" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      const expiresAt = new Date(Date.now() + 3600 * 1000);

      await supabase.from("zoho_settings").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      const { error: insertError } = await supabase.from("zoho_settings").insert({
        organization_id,
        client_id,
        client_secret,
        refresh_token: tokenResult.refresh_token,
        access_token: tokenResult.access_token,
        access_token_expires_at: expiresAt.toISOString(),
        region,
      });

      if (insertError) {
        return new Response(
          JSON.stringify({ success: false, error: insertError.message }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "Zoho Invoice configured successfully" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const settings = await getZohoSettings();

    if (action === "status") {
      return new Response(
        JSON.stringify({
          configured: !!settings?.refresh_token,
          organization_id: settings?.organization_id || null,
          region: settings?.region || null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!settings || !settings.refresh_token) {
      return new Response(
        JSON.stringify({ success: false, error: "Zoho Invoice not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const accessToken = await getAccessToken(settings);
    if (!accessToken) {
      return new Response(
        JSON.stringify({ success: false, error: "Failed to get access token" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const apiDomain = getApiDomain(settings.region);
    const orgId = settings.organization_id;

    if (action === "list-invoices") {
      const customerId = url.searchParams.get("customer_id");
      const status = url.searchParams.get("status");
      let endpoint = `${apiDomain}/invoice/v3/invoices?organization_id=${orgId}`;
      if (customerId) endpoint += `&customer_id=${customerId}`;
      if (status) endpoint += `&status=${status}`;

      const response = await fetch(endpoint, {
        headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
      });

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get-invoice") {
      const invoiceId = url.searchParams.get("invoice_id");
      if (!invoiceId) {
        return new Response(
          JSON.stringify({ success: false, error: "invoice_id required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      const response = await fetch(
        `${apiDomain}/invoice/v3/invoices/${invoiceId}?organization_id=${orgId}`,
        { headers: { Authorization: `Zoho-oauthtoken ${accessToken}` } }
      );

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get-invoice-pdf") {
      const invoiceId = url.searchParams.get("invoice_id");
      if (!invoiceId) {
        return new Response(
          JSON.stringify({ success: false, error: "invoice_id required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      const response = await fetch(
        `${apiDomain}/invoice/v3/invoices/${invoiceId}?organization_id=${orgId}&accept=pdf`,
        {
          headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
            Accept: "application/pdf",
          },
        }
      );

      if (!response.ok) {
        return new Response(
          JSON.stringify({ success: false, error: "Failed to fetch PDF" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      const pdfBuffer = await response.arrayBuffer();
      return new Response(pdfBuffer, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="invoice-${invoiceId}.pdf"`,
        },
      });
    }

    if (action === "list-customers") {
      const response = await fetch(
        `${apiDomain}/invoice/v3/contacts?organization_id=${orgId}`,
        { headers: { Authorization: `Zoho-oauthtoken ${accessToken}` } }
      );

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create-customer") {
      const body = await req.json();
      const response = await fetch(
        `${apiDomain}/invoice/v3/contacts?organization_id=${orgId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create-invoice") {
      const body = await req.json();
      const response = await fetch(
        `${apiDomain}/invoice/v3/invoices?organization_id=${orgId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: false, error: "Invalid action" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
