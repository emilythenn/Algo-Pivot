import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, CloudRain, TrendingUp, AlertTriangle, Camera, Check, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { getAlerts, markAlertRead, markAllAlertsRead } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

const severityBg = {
  high: "border-l-destructive/60",
  medium: "border-l-warning/60",
  low: "border-l-muted-foreground/30",
};

const typeIcons: Record<string, any> = {
  Weather: CloudRain,
  Market: TrendingUp,
  "Seed Integrity": Camera,
  Scan: Camera,
};

export default function AlertsPage() {
  const { t } = useSettings();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);

  const loadAlerts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getAlerts(user.id);
      setAlerts(data);
    } catch (e: any) {
      toast({ title: "Failed to load alerts", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAlerts(); }, [user]);

  const handleMarkRead = async (id: string) => {
    try {
      await markAlertRead(id);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      await markAllAlertsRead(user.id);
      setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
      toast({ title: "All alerts marked as read" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const unreadCount = alerts.filter((a) => !a.read).length;

  if (loading) {
    return (
      <div className="max-w-[1000px] mx-auto flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold font-serif text-foreground mb-1">{t("alerts.title")}</h2>
            <p className="text-sm text-muted-foreground">{unreadCount} unread alert{unreadCount !== 1 ? "s" : ""}</p>
          </div>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors bg-secondary/30 px-3 py-2 rounded-lg">
              <Check className="h-3.5 w-3.5" strokeWidth={1.5} />
              {t("alerts.markAllRead")}
            </button>
          )}
        </div>
      </motion.div>

      {alerts.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">No alerts yet. They will appear here as events occur.</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert: any, i: number) => {
            const Icon = typeIcons[alert.type] || AlertTriangle;
            const sev = (alert.severity || "medium") as keyof typeof severityBg;
            return (
              <motion.div key={alert.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <div onClick={() => !alert.read && handleMarkRead(alert.id)} className="cursor-pointer">
              <GlassCard
                className={`p-5 border-l-4 ${severityBg[sev] || severityBg.medium} ${alert.read ? "opacity-50" : ""}`}
              >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      sev === "high" ? "bg-destructive/10" : sev === "medium" ? "bg-warning/10" : "bg-secondary/40"
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        sev === "high" ? "text-destructive" : sev === "medium" ? "text-warning" : "text-muted-foreground"
                      }`} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <StatusBadge variant={sev === "high" ? "red" : sev === "medium" ? "warning" : "accent"}>
                          {alert.type}
                        </StatusBadge>
                        {!alert.read && <span className="w-2 h-2 bg-primary rounded-full" />}
                        <span className="text-[10px] text-muted-foreground ml-auto bg-secondary/30 px-2 py-0.5 rounded">
                          {new Date(alert.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground mb-0.5">{alert.title}</p>
                      <p className="text-sm leading-relaxed text-foreground/90">{alert.message}</p>
                    </div>
                  </div>
                </GlassCard>
              </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
