import { Bell, AlertTriangle, TrendingUp, CloudRain } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { motion } from "framer-motion";

const alerts = [
  {
    icon: CloudRain,
    type: "Weather",
    message: "Flood warning issued for Kedah & Perlis — Heavy rainfall expected next 48hrs",
    time: "2 hours ago",
    severity: "high" as const,
  },
  {
    icon: TrendingUp,
    type: "Market",
    message: "Ginger prices surged +12.1% — Consider accelerating planting schedule",
    time: "5 hours ago",
    severity: "medium" as const,
  },
  {
    icon: AlertTriangle,
    type: "Seed Integrity",
    message: "Scan SC-001: Padi Angin anomaly confirmed — Generate evidence report",
    time: "1 day ago",
    severity: "high" as const,
  },
];

export function AlertsPanel() {
  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-warning" strokeWidth={1.5} />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Active Alerts
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground">3 unread</span>
      </div>

      <div className="space-y-2">
        {alerts.map((alert, i) => (
          <motion.div
            key={i}
            className={`flex items-start gap-3 p-2.5 rounded-lg transition-colors cursor-pointer ${
              alert.severity === "high" ? "bg-destructive/5 hover:bg-destructive/10" : "bg-warning/5 hover:bg-warning/10"
            }`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <alert.icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
              alert.severity === "high" ? "text-destructive" : "text-warning"
            }`} strokeWidth={1.5} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-muted-foreground uppercase">{alert.type}</span>
                <span className="text-[10px] text-muted-foreground/60">{alert.time}</span>
              </div>
              <p className="text-xs text-foreground/90 mt-0.5 leading-relaxed">{alert.message}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}
