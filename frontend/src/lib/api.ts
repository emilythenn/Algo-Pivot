import { supabase } from "@/integrations/supabase/client";
// ---- Scan Analyze ----
/**
 * Analyze a crop scan using the backend edge function.
 * @param {Object} params - { crop_name, image_base64, gps_lat, gps_lng, language }
 * @returns {Promise<any>} Scan analysis result
 */
export async function analyzeScan({ crop_name, image_base64, gps_lat, gps_lng, language }) {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
  // The scan-analyze edge function is typically deployed at /functions/v1/scan-analyze on Supabase
  const url = `${backendUrl}/functions/v1/scan-analyze`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ crop_name, image_base64, gps_lat, gps_lng, language })
  });
  if (!res.ok) {
    let errorMsg = "Failed to analyze scan";
    try {
      const text = await res.text();
      errorMsg = text;
    } catch {}
    throw new Error(errorMsg);
  }
  try {
    return await res.json();
  } catch (e) {
    throw new Error("Scan Analyze API did not return valid JSON.");
  }
}

// ---- Simulator AI ----
export async function runSimulation(params: {
  crops: string[];
  weather: string;
  market_change: number;
  seed_quality: number;
  district?: string;
  language?: string;
}) {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "https://symmetrical-guide-x5prw74947q4h5p7-4000.app.github.dev";
  const url = `${backendUrl}/simulator-ai`;
  // ...existing code...
}

// ---- Weather API ----
export async function fetchWeatherData(state = "Putrajaya", district = "237", date = undefined) {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
  const url = `${backendUrl}/api/weather-ai`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state, district, date })
  });
  if (!res.ok) {
    let errorMsg = "Failed to fetch weather data";
    try {
      const text = await res.text();
      errorMsg = text;
    } catch {}
    throw new Error(errorMsg);
  }
  try {
    const result = await res.json();
    // Limit forecast to 7 days if present
    if (result.forecast && Array.isArray(result.forecast)) {
      result.forecast = result.forecast.slice(0, 7);
    }
    return result;
  } catch (e) {
    throw new Error("Weather API did not return valid JSON.");
  }
}

// ---- Market AI ----
// Duplicate fetchMarketData removed

// ---- Crop Advisory ----
// Duplicate fetchCropAdvisory removed


// ---- Database helpers ----
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, updates: Record<string, any>) {
  const { error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) throw error;
}

export async function getUserSettings(userId: string) {
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateUserSettings(userId: string, updates: Record<string, any>) {
  const { error } = await supabase
    .from("user_settings")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
  if (error) throw error;
}

export async function getScanHistory(userId: string) {
  const { data, error } = await supabase
    .from("scan_results")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getEvidenceReports(userId: string) {
  const { data, error } = await supabase
    .from("evidence_reports")
    .select("*, scan_results(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createEvidenceReport(report: {
  user_id: string;
  scan_id?: string;
  report_title: string;
  report_type: string;
  gps_data?: any;
  weather_data?: any;
  ai_analysis?: string;
}) {
  const { data, error } = await supabase
    .from("evidence_reports")
    .insert(report)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getAlerts(userId: string) {
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function markAlertRead(alertId: string) {
  const { error } = await supabase
    .from("alerts")
    .update({ read: true })
    .eq("id", alertId);
  if (error) throw error;
}

export async function markAllAlertsRead(userId: string) {
  const { error } = await supabase
    .from("alerts")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
  if (error) throw error;
}
