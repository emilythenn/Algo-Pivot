import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Leaf, Clock, Sprout, CalendarDays, Loader2, RefreshCw } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { fetchCropAdvisory, getScanHistory } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export default function PlannerPage() {
  const { t } = useSettings();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rescueCrops, setRescueCrops] = useState<any[]>([]);
  const [failedBatches, setFailedBatches] = useState(0);

  const loadData = async () => {
    setLoading(true);
    try {
      const [advisory, scans] = await Promise.all([
        fetchCropAdvisory("Kedah", "rescue"),
        user ? getScanHistory(user.id) : Promise.resolve([]),
      ]);
      const anomalies = scans.filter((s: any) => s.status === "anomaly").length;
      setFailedBatches(anomalies);

      const crops = (advisory.recommendations || []).map((rec: any) => ({
        name: rec.crop,
        days: rec.season_window ? parseInt(rec.season_window) || 60 : 60,
        type: rec.climate_risk === "low" ? "Quick Crop" : "Standard",
        water: rec.climate_risk === "high" ? "High" : rec.climate_risk === "medium" ? "Medium" : "Low",
        profit: `RM ${(rec.profit_score || 50) * 40}/ton`,
        window: rec.action === "plant" ? "available" : "limited",
        suitability: rec.profit_score || 50,
        advice: rec.advice,
      }));
      setRescueCrops(crops);
    } catch (e: any) {
      toast({ title: "Failed to load planner data", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [user]);

  if (loading) {
    return (
      <div className="max-w-[1000px] mx-auto flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-serif text-foreground mb-1">{t("planner.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("planner.subtitle")}</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </motion.div>

      {/* Season Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: t("planner.seasonRemaining"), value: "87 days", icon: CalendarDays, sub: "Ends: 10 Jun 2026" },
          { label: t("planner.failedBatches"), value: String(failedBatches), icon: Sprout, sub: failedBatches > 0 ? "Anomalies detected" : "All healthy" },
          { label: t("planner.recoveryOptions"), value: String(rescueCrops.length), icon: Leaf, sub: "AI-recommended crops" },
        ].map((item, i) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <item.icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
                <span className="text-xs text-muted-foreground font-medium">{item.label}</span>
              </div>
              <p className="text-2xl font-bold tabular-nums text-foreground">{item.value}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{item.sub}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Rescue Crops */}
      <div>
        <h3 className="text-base font-semibold text-foreground mb-4">Rescue Crop Options</h3>
        <div className="space-y-3">
          {rescueCrops.map((crop: any, i: number) => (
            <motion.div key={crop.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
              <GlassCard hoverable className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{crop.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{crop.type}</p>
                    {crop.advice && <p className="text-xs text-muted-foreground/70 mt-1">{crop.advice}</p>}
                  </div>
                  <StatusBadge variant={crop.window === "available" ? "green" : "warning"}>
                    {crop.window === "available" ? t("planner.available") : t("planner.limited")}
                  </StatusBadge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 text-xs">
                  <div>
                    <span className="text-muted-foreground block mb-1">{t("planner.harvestTime")}</span>
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" strokeWidth={1.5} />
                      {crop.days} days
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">{t("planner.waterNeeds")}</span>
                    <span className="font-semibold text-foreground">{crop.water}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">{t("planner.marketPrice")}</span>
                    <span className="font-semibold tabular-nums text-foreground">{crop.profit}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">{t("planner.suitability")}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 h-2 bg-secondary/40 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${crop.suitability > 80 ? "bg-primary" : crop.suitability > 60 ? "bg-warning" : "bg-destructive"}`} style={{ width: `${crop.suitability}%` }} />
                      </div>
                      <span className="font-bold tabular-nums text-foreground">{crop.suitability}%</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
