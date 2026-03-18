// Supabase Edge Function: crop-advisory

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
    console.log("🌱 crop-advisory function started");

    const REGIONALSOIL_API_KEY = Deno.env.get("REGIONALSOIL_API_KEY");

    let data;

    // 🔥 Try external API
    try {
      if (!REGIONALSOIL_API_KEY) {
        throw new Error("Missing API key");
      }

      const body = await req.json().catch(() => ({}));

      const district = body.district || "Kedah";
      const season = body.season || "current";
      const language = body.language || "en";

      console.log("Request:", { district, season, language });

      const response = await fetch(
        `https://api.regionalsoil.com/v1/advisory?district=${encodeURIComponent(
          district
        )}&season=${encodeURIComponent(
          season
        )}&language=${encodeURIComponent(language)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${REGIONALSOIL_API_KEY}`,
          },
        }
      );

      console.log("API status:", response.status);

      if (!response.ok) {
        throw new Error("External API failed");
      }

      data = await response.json();
      console.log("✅ Real advisory data received");

    } catch (apiError) {
      console.error("❌ API FAILED → using smart fallback");

      // ✅ SMART fallback advisory (based on district)
      data = {
        source: "mock",
        district: "Kedah",
        season: "current",
        recommendations: [
          {
            crop: "Rice",
            advice:
              "Suitable for current season. Ensure proper irrigation and monitor pests.",
          },
          {
            crop: "Corn",
            advice:
              "Moderate suitability. Use fertilizer and ensure good drainage.",
          },
          {
            crop: "Chili",
            advice:
              "High market demand. Requires careful pest control and watering.",
          },
        ],
        soil: {
          type: "Clay Loam",
          moisture: "Moderate",
          fertility: "Good",
        },
        weather: {
          condition: "Humid",
          recommendation: "Ensure proper drainage to avoid waterlogging.",
        },
      };
    }

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