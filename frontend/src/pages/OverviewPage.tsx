import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { WeatherTicker } from "@/components/WeatherTicker";
import { GlassCard } from "@/components/GlassCard";
import { AlertTriangle, ShieldCheck, TrendingUp, TrendingDown, Minus, Camera, BarChart3, Loader2, FileText, Download, FlaskConical, Settings, Clock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { getScanHistory, getAlerts, getEvidenceReports } from "@/lib/api";
import { getRecentActivities } from "@/lib/activityLogger";

const marketPreview = [
  { crop: "Padi", price: "RM 1,250", unit: "/ton", change: "+5.2%", trend: "up" as const },
  { crop: "Oil Palm", price: "RM 4,120", unit: "/ton", change: "+1.8%", trend: "up" as const },
  { crop: "Chili", price: "RM 6,200", unit: "/ton", change: "-3.8%", trend: "down" as const },
  { crop: "Rubber", price: "RM 5,600", unit: "/ton", change: "-1.4%", trend: "down" as const },
  { crop: "Durian", price: "RM 32,000", unit: "/ton", change: "+8.5%", trend: "up" as const },
  { crop: "Ginger", price: "RM 8,400", unit: "/ton", change: "+12.1%", trend: "up" as const },
];

const trendIcon = { up: TrendingUp, down: TrendingDown, stable: Minus };
const trendColor = { up: "text-primary", down: "text-destructive", stable: "text-muted-foreground" };

function MarketTickerPreview() {
  return (
    <GlassCard className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="h-4 w-4 text-primary" strokeWidth={1.5} />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Market Prices</span>
        <span className="ml-auto text-[10px] text-muted-foreground/50">Top {marketPreview.length} crops</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {marketPreview.map((item, i) => {
          const Icon = trendIcon[item.trend];
          return (
            <motion.div key={item.crop} className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2.5 min-w-0 overflow-hidden" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <div className="min-w-0 overflow-hidden">
                <div className="text-xs text-muted-foreground truncate">{item.crop}</div>
                <div className="text-sm font-medium tabular-nums truncate">{item.price}<span className="text-[10px] text-muted-foreground">{item.unit}</span></div>
              </div>
              <div className={`flex items-center gap-1 ${trendColor[item.trend]}`}>
                <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span className="text-xs font-medium tabular-nums">{item.change}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </GlassCard>
  );
}

const activityIcons: Record<string, any> = {
  scan: Camera,
  report_generated: FileText,
  report_downloaded: Download,
  simulation: FlaskConical,
  settings_updated: Settings,
  login: ShieldCheck,
  alert: AlertTriangle,
};

const activityColors: Record<string, string> = {
  scan: "bg-accent/10 text-accent",
  report_generated: "bg-primary/10 text-primary",
  report_downloaded: "bg-primary/10 text-primary",
  simulation: "bg-warning/10 text-warning",
  settings_updated: "bg-muted text-muted-foreground",
  login: "bg-primary/10 text-primary",
  alert: "bg-destructive/10 text-destructive",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-MY", { day: "numeric", month: "short" });
}

export default function OverviewPage() {
  const navigate = useNavigate();
  const { t } = useSettings();
  const { user } = useAuth();
  const [stats, setStats] = useState({ scans: 0, alerts: 0, reports: 0, anomalies: 0 });
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getScanHistory(user.id),
      getAlerts(user.id),
      getEvidenceReports(user.id),
      getRecentActivities(user.id, 8),
    ]).then(([scans, alerts, reports, recentActs]) => {
      setStats({
        scans: scans.length,
        alerts: alerts.filter((a: any) => !a.read).length,
        reports: reports.length,
        anomalies: scans.filter((s: any) => s.status === "anomaly").length,
      });
      setActivities(recentActs);
    }).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  const quickStats = [
    { label: t("overview.activeCrops"), value: String(stats.scans), icon: TrendingUp, color: "text-primary" },
    { label: t("overview.pendingScans"), value: String(stats.anomalies), icon: Camera, color: "text-accent" },
    { label: t("overview.alerts"), value: String(stats.alerts), icon: AlertTriangle, color: "text-warning" },
    { label: t("overview.reports"), value: String(stats.reports), icon: BarChart3, color: "text-primary" },
  ];

  return (
    <div className="max-w-[1200px] mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
        <h2 className="text-2xl font-bold font-serif text-foreground">
          {t("overview.status")} <span className="text-primary">{t("overview.operational")}</span>
        </h2>
        <p className="text-sm text-muted-foreground">{t("overview.risks")}</p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <GlassCard hoverable className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-lg bg-secondary/50 flex items-center justify-center">
                  <stat.icon className={`h-4.5 w-4.5 ${stat.color}`} strokeWidth={1.5} />
                </div>
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{stat.label}</span>
              </div>
              <p className="text-3xl font-bold tabular-nums text-foreground">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stat.value}
              </p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Weather Forecast */}
      <div>
        <div className="cursor-pointer" onClick={() => navigate("/dashboard/weather")}>
          <WeatherTicker />
        </div>
        <div className="flex justify-end mt-2">
          <button
            onClick={() => navigate("/dashboard/weather")}
            className="text-[11px] font-medium text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors"
          >
            View Full Forecast <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Market Prices — limited preview */}
      <div>
        <div className="cursor-pointer" onClick={() => navigate("/dashboard/market")}>
          <MarketTickerPreview />
        </div>
        <div className="flex justify-end mt-2">
          <button
            onClick={() => navigate("/dashboard/market")}
            className="text-[11px] font-medium text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors"
          >
            View All Prices <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Recent Activity — Real Data */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" strokeWidth={1.5} />
            <h3 className="text-base font-semibold text-foreground">{t("overview.recentActivity")}</h3>
          </div>
          {activities.length > 0 && (
            <span className="text-[10px] text-muted-foreground/60 bg-secondary/30 px-2 py-0.5 rounded-md">
              {activities.length} recent
            </span>
          )}
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-xl bg-secondary/30 flex items-center justify-center mx-auto mb-3">
              <Clock className="h-6 w-6 text-muted-foreground/30" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No recent activity</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Start by scanning your crops or running a simulation!</p>
          </div>
        ) : (
          <div className="space-y-1">
            {activities.map((activity: any, i: number) => {
              const Icon = activityIcons[activity.activity_type] || Clock;
              const colorClass = activityColors[activity.activity_type] || "bg-secondary/30 text-muted-foreground";
              return (
                <motion.div
                  key={activity.id}
                  className="flex items-center gap-3.5 py-3 px-3 rounded-xl hover:bg-secondary/20 transition-colors group"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.04 }}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
                    {activity.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{activity.description}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground/60 flex-shrink-0 whitespace-nowrap">
                    {timeAgo(activity.created_at)}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
