declare const Deno: any;

// @ts-ignore: Deno runtime and remote imports are not recognized by VS Code/TypeScript
import { serve } from "https://deno.land/std@0.171.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const REGIONALSOIL_API_KEY = Deno.env.get("REGIONALSOIL_API_KEY");
    if (!REGIONALSOIL_API_KEY) throw new Error("REGIONALSOIL_API_KEY is not configured");

    const { district = "Kedah", season = "current", language = "en" } = await req.json();
    const response = await fetch(`https://api.regionalsoil.com/v1/advisory?district=${encodeURIComponent(district)}&season=${encodeURIComponent(season)}&language=${encodeURIComponent(language)}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${REGIONALSOIL_API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
  return new Response(JSON.stringify({ error: e?.message || String(e) }), {
    status: 500,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
});