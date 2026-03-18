// Supabase Edge Function: market-ai

declare const Deno: any;

// @ts-ignore
import { serve } from "https://deno.land/std@0.171.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🚀 market-ai function started");

    const APRIFEAKS_API_KEY = Deno.env.get("APRIFEAKS_API_KEY");

    let data;

    // 🔥 Try real API first
    try {
      if (!APRIFEAKS_API_KEY) {
        throw new Error("Missing API key");
      }

      console.log("📡 Calling external API...");

      const response = await fetch("https://api.aprifeaks.com/v1/market", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${APRIFEAKS_API_KEY}`,
          "Content-Type": "application/json",
        },
      });

      console.log("API status:", response.status);

      if (!response.ok) {
        throw new Error("External API failed");
      }

      data = await response.json();
      console.log("✅ Real API data received");

    } catch (apiError) {
      console.error("❌ API FAILED → using mock data");

      // ✅ Fallback data (ALWAYS WORKS)
      data = {
        source: "mock",
        crops: [
          {
            name: "Rice",
            price: 1200,
            change: "+2%",
            weekHigh: 1250,
            weekLow: 1150,
            volume: 300,
          },
          {
            name: "Corn",
            price: 800,
            change: "-1%",
            weekHigh: 850,
            weekLow: 780,
            volume: 200,
          },
          {
            name: "Palm Oil",
            price: 3500,
            change: "+0.5%",
            weekHigh: 3600,
            weekLow: 3400,
            volume: 500,
          },
        ],
      };
    }

    // ✅ Always return response
    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });

  } catch (e: any) {
    console.error("💥 FUNCTION ERROR:", e);

    return new Response(
      JSON.stringify({
        error: e?.message || "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});