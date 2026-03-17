import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, CloudRain, TrendingUp, Sprout, Play, RotateCcw,
  CheckCircle, AlertTriangle, XCircle, Loader2, Camera, Pencil, Plus, X
} from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { runSimulation } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { logActivity } from "@/lib/activityLogger";

const presetCrops = [
  { id: "chili", name: "Chili", icon: "🌶️" },
  { id: "ginger", name: "Ginger", icon: "🫚" },
  { id: "cassava", name: "Cassava", icon: "🥔" },
  { id: "padi", name: "Padi MR220", icon: "🌾" },
  { id: "corn", name: "Corn", icon: "🌽" },
  { id: "cucumber", name: "Cucumber", icon: "🥒" },
  { id: "mung_bean", name: "Mung Bean", icon: "🫘" },
  { id: "oil_palm", name: "Oil Palm", icon: "🌴" },
  { id: "rubber", name: "Rubber", icon: "🌳" },
  { id: "durian", name: "Durian", icon: "🍈" },
  { id: "kangkung", name: "Kangkung", icon: "🥬" },
  { id: "tomato", name: "Tomato", icon: "🍅" },
];

type WeatherScenario = "normal" | "more_rain" | "drought" | "monsoon_shift" | "flood" | "heatwave" | "la_nina" | "el_nino";
type CropMode = "preset" | "custom" | "photo";

export default function SimulatorPage() {
  const { t, language } = useSettings();
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [cropMode, setCropMode] = useState<CropMode>("preset");
  const [customInput, setCustomInput] = useState("");
  const [identifying, setIdentifying] = useState(false);
  const [weather, setWeather] = useState<WeatherScenario>("normal");
  const [marketChange, setMarketChange] = useState(0);
  const [seedQuality, setSeedQuality] = useState(90);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [assessment, setAssessment] = useState("");
  const [hasSimulated, setHasSimulated] = useState(false);

  const togglePresetCrop = (cropName: string) => {
    setSelectedCrops((prev) =>
      prev.includes(cropName) ? prev.filter((c) => c !== cropName) : [...prev, cropName]
    );
    setHasSimulated(false);
  };

  const addCustomCrop = () => {
    const name = customInput.trim();
    if (!name || selectedCrops.includes(name)) return;
    setSelectedCrops((prev) => [...prev, name]);
    setCustomInput("");
    setHasSimulated(false);
  };

  const removeCrop = (cropName: string) => {
    setSelectedCrops((prev) => prev.filter((c) => c !== cropName));
    setHasSimulated(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIdentifying(true);
    try {
      let image_base64: string | undefined;
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        image_base64 = await new Promise((resolve) => {
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.readAsDataURL(file);
        });
      }

      // Only identify the crop — do NOT save to scan_results or storage
      // This is purely for crop identification in the simulator
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/scan-analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ crop_name: "unknown", image_base64, language, identify_only: true }),
      });
      if (!resp.ok) throw new Error("Identification failed");
      const result = await resp.json();
      const identified = result.crop_name;

      if (identified && identified !== "unknown" && !selectedCrops.includes(identified)) {
        setSelectedCrops((prev) => [...prev, identified]);
        toast({ title: `Crop identified: ${identified}`, description: "Added to your crop plan." });
      } else if (identified && selectedCrops.includes(identified)) {
        toast({ title: `${identified} already in plan`, description: "This crop is already selected." });
      }
    } catch (err: any) {
      toast({ title: "Identification failed", description: err.message, variant: "destructive" });
    } finally {
      setIdentifying(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSimulate = async () => {
    if (selectedCrops.length === 0) return;
    setLoading(true);
    try {
      const data = await runSimulation({
        crops: selectedCrops,
        weather,
        market_change: marketChange,
        seed_quality: seedQuality,
        district: "Kedah",
        language,
      });
      setResults(data.results || []);
      setAssessment(data.overall_assessment || "");
      setHasSimulated(true);
      if (user) {
        await logActivity({ userId: user.id, activityType: "simulation", title: `Simulated ${selectedCrops.join(", ")}`, description: `Weather: ${weather}, Market: ${marketChange}%`, metadata: { crops: selectedCrops, weather, market_change: marketChange } });
      }
    } catch (e: any) {
      toast({ title: "Simulation failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSelectedCrops([]);
    setCropMode("preset");
    setCustomInput("");
    setWeather("normal");
    setMarketChange(0);
    setSeedQuality(90);
    setHasSimulated(false);
    setResults([]);
    setAssessment("");
  };

  const totalRevenue = results.reduce((s, r) => s + (r.expected_revenue || 0), 0);
  const avgRisk = results.length ? Math.round(results.reduce((s, r) => s + (r.failure_risk || 0), 0) / results.length) : 0;
  const overallLevel = avgRisk < 25 ? "green" : avgRisk < 50 ? "yellow" : "red";
  const riskIcon = { green: CheckCircle, yellow: AlertTriangle, red: XCircle };
  const riskColor = { green: "text-primary", yellow: "text-warning", red: "text-destructive" };
  const riskBarColor = { green: "bg-primary", yellow: "bg-warning", red: "bg-destructive" };

  return (
    <div className="max-w-[1000px] mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold font-serif text-foreground mb-1">{t("simulator.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("simulator.subtitle")}</p>
      </motion.div>

      {/* Step 1: Crop Selection */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sprout className="h-4 w-4 text-primary" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-foreground">{t("simulator.selectCrops")}</h3>
        </div>

        {/* Mode selector */}
        <div className="flex gap-2 mb-4">
          {([
            { mode: "preset" as const, label: t("simulator.cropPreset"), icon: Sprout },
            { mode: "custom" as const, label: t("simulator.cropCustom"), icon: Pencil },
            { mode: "photo" as const, label: t("simulator.cropPhoto"), icon: Camera },
          ]).map(opt => (
            <button
              key={opt.mode}
              onClick={() => setCropMode(opt.mode)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                cropMode === opt.mode
                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                  : "border-border/40 text-muted-foreground hover:bg-secondary/30"
              }`}
            >
              <opt.icon className="h-3.5 w-3.5" strokeWidth={1.5} />
              {opt.label}
            </button>
          ))}
        </div>

        {/* Preset grid */}
        {cropMode === "preset" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {presetCrops.map((crop) => {
              const selected = selectedCrops.includes(crop.name);
              return (
                <button key={crop.id} onClick={() => togglePresetCrop(crop.name)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    selected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border bg-card hover:border-primary/40"
                  }`}>
                  <span className="text-xl">{crop.icon}</span>
                  <p className="text-sm font-medium text-foreground">{crop.name}</p>
                  {selected && <CheckCircle className="h-4 w-4 text-primary ml-auto" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Custom input */}
        {cropMode === "custom" && (
          <div className="flex gap-2">
            <input
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustomCrop()}
              placeholder="e.g. Dragon Fruit, Lemongrass, Starfruit..."
              className="flex-1 bg-secondary/20 border border-border/40 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            />
            <Button onClick={addCustomCrop} disabled={!customInput.trim()} size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> {t("simulator.addCustomCrop")}
            </Button>
          </div>
        )}

        {/* Photo identify */}
        {cropMode === "photo" && (
          <div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
            <button
              onClick={() => !identifying && fileRef.current?.click()}
              disabled={identifying}
              className="w-full flex items-center justify-center gap-3 p-6 border-2 border-dashed border-border/50 rounded-xl hover:border-primary/30 transition-colors group"
            >
              {identifying ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">{t("simulator.identifyingCrop")}</span>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Camera className="h-6 w-6 text-accent" strokeWidth={1.5} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">{t("simulator.cropPhoto")}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t("simulator.cropPhotoDesc")}</p>
                  </div>
                </>
              )}
            </button>
          </div>
        )}

        {/* Selected crops chips */}
        {selectedCrops.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/30">
            <span className="text-xs text-muted-foreground self-center mr-1">{t("simulator.cropsPlanned")}:</span>
            {selectedCrops.map((name) => {
              const preset = presetCrops.find((c) => c.name === name);
              return (
                <span key={name} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                  {preset?.icon && <span>{preset.icon}</span>}
                  {name}
                  <button onClick={() => removeCrop(name)} className="ml-0.5 hover:text-destructive transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* Step 2: Scenario Inputs */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <Zap className="h-4 w-4 text-primary" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-foreground">{t("simulator.scenarios")}</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <CloudRain className="h-3.5 w-3.5" /> {t("simulator.weatherChange")}
            </Label>
            <Select value={weather} onValueChange={(v) => setWeather(v as WeatherScenario)}>
              <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">{t("simulator.weatherNormal")}</SelectItem>
                <SelectItem value="more_rain">{t("simulator.weatherMoreRain")}</SelectItem>
                <SelectItem value="drought">{t("simulator.weatherDrought")}</SelectItem>
                <SelectItem value="monsoon_shift">{t("simulator.weatherMonsoon")}</SelectItem>
                <SelectItem value="flood">{t("simulator.weatherFlood")}</SelectItem>
                <SelectItem value="heatwave">{t("simulator.weatherHeatwave")}</SelectItem>
                <SelectItem value="la_nina">{t("simulator.weatherLaNina")}</SelectItem>
                <SelectItem value="el_nino">{t("simulator.weatherElNino")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" /> {t("simulator.marketFluctuation")}
            </Label>
            <Slider value={[marketChange]} onValueChange={(v) => setMarketChange(v[0])} min={-30} max={30} step={5} className="mt-3" />
            <p className="text-xs text-center font-medium text-foreground tabular-nums">{marketChange > 0 ? "+" : ""}{marketChange}%</p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Sprout className="h-3.5 w-3.5" /> {t("simulator.seedQuality")}
            </Label>
            <Slider value={[seedQuality]} onValueChange={(v) => setSeedQuality(v[0])} min={50} max={100} step={5} className="mt-3" />
            <p className="text-xs text-center font-medium text-foreground tabular-nums">{seedQuality}%</p>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button onClick={handleSimulate} disabled={selectedCrops.length === 0 || loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {loading ? "Simulating..." : t("simulator.runSimulation")}
          </Button>
          <Button variant="outline" onClick={reset} className="gap-2">
            <RotateCcw className="h-4 w-4" /> {t("simulator.reset")}
          </Button>
        </div>
      </GlassCard>

      {/* Results */}
      <AnimatePresence>
        {hasSimulated && results.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            {assessment && (
              <GlassCard className="p-5">
                <p className="text-sm text-foreground/80 italic">"{assessment}"</p>
              </GlassCard>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <GlassCard className="p-5">
                <p className="text-xs text-muted-foreground mb-1">{t("simulator.totalRevenue")}</p>
                <p className="text-2xl font-bold tabular-nums text-foreground">RM {totalRevenue.toLocaleString()}</p>
              </GlassCard>
              <GlassCard className="p-5">
                <p className="text-xs text-muted-foreground mb-1">{t("simulator.avgFailureRisk")}</p>
                <div className="flex items-center gap-2">
                  {(() => { const Icon = riskIcon[overallLevel as keyof typeof riskIcon]; return <Icon className={`h-5 w-5 ${riskColor[overallLevel as keyof typeof riskColor]}`} />; })()}
                  <p className="text-2xl font-bold tabular-nums text-foreground">{avgRisk}%</p>
                </div>
              </GlassCard>
              <GlassCard className="p-5">
                <p className="text-xs text-muted-foreground mb-1">{t("simulator.cropsPlanned")}</p>
                <p className="text-2xl font-bold tabular-nums text-foreground">{results.length}</p>
              </GlassCard>
            </div>
            <div className="space-y-3">
              {results.map((result: any, i: number) => {
                const rLevel = result.risk_level || (result.failure_risk < 25 ? "green" : result.failure_risk < 50 ? "yellow" : "red");
                const crop = presetCrops.find((c) => c.name === result.crop_name);
                return (
                  <motion.div key={result.crop_name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                    <GlassCard className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{crop?.icon || "🌱"}</span>
                          <div>
                            <h4 className="text-lg font-bold text-foreground">{result.crop_name}</h4>
                            {result.advice && <p className="text-xs text-muted-foreground mt-0.5">{result.advice}</p>}
                          </div>
                        </div>
                        <StatusBadge variant={rLevel === "green" ? "green" : rLevel === "yellow" ? "warning" : "red"}>
                          {rLevel === "green" ? t("simulator.profitable") : rLevel === "yellow" ? t("simulator.moderateRiskLabel") : t("simulator.highRiskLabel")}
                        </StatusBadge>
                      </div>
                      <div className="grid grid-cols-3 gap-5 text-xs">
                        <div>
                          <span className="text-muted-foreground block mb-1">{t("simulator.estYield")}</span>
                          <span className="font-semibold text-foreground">{result.estimated_yield} ton/ha</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block mb-1">{t("simulator.estRevenue")}</span>
                          <span className="font-semibold tabular-nums text-foreground">RM {result.expected_revenue?.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block mb-1">{t("simulator.failureRisk")}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex-1 h-2 bg-secondary/40 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-700 ${riskBarColor[rLevel as keyof typeof riskBarColor] || "bg-warning"}`} style={{ width: `${result.failure_risk}%` }} />
                            </div>
                            <span className="font-bold tabular-nums text-foreground">{result.failure_risk}%</span>
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
