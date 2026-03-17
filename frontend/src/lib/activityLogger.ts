import { supabase } from "@/integrations/supabase/client";

export type ActivityType = "scan" | "report_generated" | "report_downloaded" | "simulation" | "settings_updated" | "login" | "alert";

interface LogActivityParams {
  userId: string;
  activityType: ActivityType;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
}

export async function logActivity({ userId, activityType, title, description, metadata }: LogActivityParams) {
  try {
    await supabase.from("user_activities").insert({
      user_id: userId,
      activity_type: activityType,
      title,
      description: description || "",
      metadata: metadata || {},
    } as any);
  } catch (e) {
    console.error("Failed to log activity:", e);
  }
}

export async function getRecentActivities(userId: string, limit = 10) {
  const { data, error } = await supabase
    .from("user_activities" as any)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as any[];
}
