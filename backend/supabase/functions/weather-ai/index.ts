// weather-ai (SAFE VERSION - NO LOVABLE)

// @ts-ignore
import { serve } from "https://deno.land/std@0.171.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const district = body.district || "Kedah";

    console.log("Weather request for:", district);

    // ✅ FAKE BUT REALISTIC DATA
    const data = {
      current: {
        temperature: 32,
        humidity: 85,
        wind_speed: 10,
        wind_direction: "North-East",
        condition: "Partly Cloudy",
        rainfall_mm: 5,
        feels_like: 36,
      },
      forecast: [
        { day: "Mon", date: "2026-03-18", icon: "☀️", temp_high: 34, temp_low: 26, rain_percent: 20, wind_kmh: 10, humidity: 80, condition: "Sunny" },
        { day: "Tue", date: "2026-03-19", icon: "🌧️", temp_high: 31, temp_low: 25, rain_percent: 70, wind_kmh: 12, humidity: 90, condition: "Rainy" },
        { day: "Wed", date: "2026-03-20", icon: "⛅", temp_high: 33, temp_low: 26, rain_percent: 30, wind_kmh: 9, humidity: 82, condition: "Cloudy" },
      ],
      alerts: [
        {
          type: "Heavy Rain",
          severity: "medium",
          message: "Possible heavy rain in the evening",
        },
      ],
    };

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: "Weather failed" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});