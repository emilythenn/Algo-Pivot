import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sprout, TrendingUp, TrendingDown, ShieldCheck, AlertTriangle, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useSettings } from "@/contexts/SettingsContext";
import { fetchCropAdvisory } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export default function CropsPage() {
  const { t, language } = useSettings();
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  const loadCrops = async () => {
    setLoading(true);
    try {
      const data = await fetchCropAdvisory("Kedah", "current", language);
      setRecommendations(data.recommendations || []);
    } catch (e: any) {
      toast({ title: "Failed to load crop advisory", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCrops(); }, [language]);

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const riskBadge = (risk: string) => {
    if (risk === "low") return <StatusBadge variant="green">Low Risk</StatusBadge>;
    if (risk === "medium") return <StatusBadge variant="warning">Medium Risk</StatusBadge>;
    return <StatusBadge variant="red">High Risk</StatusBadge>;
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-serif text-foreground mb-1">{t("crops.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("crops.subtitle")}</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadCrops} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </motion.div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold text-foreground">AI Crop Recommendations</h3>
        <div className="space-y-3">
          {recommendations.map((rec: any, i: number) => (
            <motion.div key={rec.crop} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard
                hoverable
                glowColor={rec.climate_risk === "high" ? "warning" : rec.profit_score > 75 ? "primary" : undefined}
                className="p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-foreground">{rec.crop}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{rec.advice}</p>
                    {rec.season_window && <p className="text-[11px] text-muted-foreground/70 mt-1">Season: {rec.season_window}</p>}
                    {rec.expected_yield && <p className="text-[11px] text-muted-foreground/70">Yield: {rec.expected_yield}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    {riskBadge(rec.climate_risk)}
                    {rec.market_trend === "up" ? (
                      <StatusBadge variant="green"><TrendingUp className="h-3 w-3" strokeWidth={1.5} /> Rising</StatusBadge>
                    ) : rec.market_trend === "down" ? (
                      <StatusBadge variant="red"><TrendingDown className="h-3 w-3" strokeWidth={1.5} /> Falling</StatusBadge>
                    ) : (
                      <StatusBadge variant="accent">Stable</StatusBadge>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/30">
                  <div className="text-xs text-muted-foreground">
                    Profit Score:{" "}
                    <span className={`font-bold tabular-nums text-sm ${
                      rec.profit_score > 75 ? "text-primary" : rec.profit_score > 50 ? "text-warning" : "text-destructive"
                    }`}>
                      {rec.profit_score}/100
                    </span>
                  </div>
                  <button className={`flex items-center gap-1.5 text-xs font-semibold rounded-lg px-4 py-2 transition-colors ${
                    rec.action === "avoid"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-primary/10 text-primary hover:bg-primary/20"
                  }`}>
                    {rec.action === "avoid" ? (
                      <><AlertTriangle className="h-3 w-3" strokeWidth={1.5} /> Avoid</>
                    ) : rec.action === "hold" ? (
                      <><ShieldCheck className="h-3 w-3" strokeWidth={1.5} /> Monitor</>
                    ) : (
                      <><ShieldCheck className="h-3 w-3" strokeWidth={1.5} /> Plant <ChevronRight className="h-3 w-3" strokeWidth={1.5} /></>
                    )}
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
