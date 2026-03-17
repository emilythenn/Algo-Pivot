import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Camera, Upload, ShieldCheck, AlertTriangle, FileText, Loader2, Image as ImageIcon, HelpCircle, Pencil, Sprout } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { analyzeScan, getScanHistory, createEvidenceReport } from "@/lib/api";
import { logActivity } from "@/lib/activityLogger";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const PRESET_CROPS = [
  "Padi MR220", "Padi MR297", "Ginger", "Mung Bean", "Chili",
  "Corn", "Cucumber", "Cassava", "Kangkung", "Oil Palm",
  "Durian", "Rubber", "Cocoa", "Pepper", "Tomato",
];

export default function ScannerPage() {
  const { t, language } = useSettings();
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [history, setHistory] = useState<any[]>([]);
  const [cropName, setCropName] = useState("Padi MR220");
  const [cropMode, setCropMode] = useState<"preset" | "custom" | "unknown">("preset");
  const [customCrop, setCustomCrop] = useState("");

  useEffect(() => {
    if (user) {
      getScanHistory(user.id).then(setHistory).catch(console.error);
    }
  }, [user]);

  const uploadImageToStorage = async (file: File, userId: string): Promise<string> => {
    const ext = file.name.split(".").pop() || "jpg";
    const filePath = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("scan-images").upload(filePath, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("scan-images").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setScanning(true);
    setScanResult(null);

    // Show local preview
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    try {
      // Upload image to storage
      const imageUrl = await uploadImageToStorage(file, user.id);

      let image_base64: string | undefined;
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        image_base64 = await new Promise((resolve) => {
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.readAsDataURL(file);
        });
      }

      let gps_lat: number | undefined, gps_lng: number | undefined;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
        gps_lat = pos.coords.latitude;
        gps_lng = pos.coords.longitude;
      } catch { /* GPS not available */ }

      const result = await analyzeScan({ crop_name: cropName, image_base64, gps_lat, gps_lng, language });
      setScanResult({ ...result, image_url: imageUrl });

      // Update the scan_results row with image_url (the edge function already inserted it)
      // We need to find and update the latest scan
      const { data: latestScans } = await supabase
        .from("scan_results")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (latestScans?.[0]) {
        await supabase.from("scan_results").update({ image_url: imageUrl }).eq("id", latestScans[0].id);
      }

      // Refresh history
      const updated = await getScanHistory(user.id);
      setHistory(updated);

      await logActivity({ userId: user.id, activityType: "scan", title: `Scanned ${result.crop_name || cropName}`, description: result.summary || "", metadata: { status: result.status, germination_rate: result.germination_rate } });
      toast({ title: "Scan complete!", description: result.summary });
    } catch (e: any) {
      toast({ title: "Scan failed", description: e.message, variant: "destructive" });
    } finally {
      setScanning(false);
    }
  };

  const handleGenerateReport = async (scan: any) => {
    if (!user) return;
    try {
      await createEvidenceReport({
        user_id: user.id,
        scan_id: scan.id,
        report_title: `${scan.crop_name} — ${scan.status === "anomaly" ? "Anomaly" : "Integrity"} Report`,
        report_type: scan.status === "anomaly" ? "anomaly" : "verification",
        gps_data: { lat: scan.gps_lat, lng: scan.gps_lng },
        ai_analysis: typeof scan.ai_analysis === "object" ? JSON.stringify(scan.ai_analysis) : scan.ai_analysis,
      });
      await logActivity({ userId: user.id, activityType: "report_generated", title: `Generated report: ${scan.crop_name}`, description: scan.status === "anomaly" ? "Anomaly report" : "Verification report" });
      toast({ title: "Report generated!", description: "View it in the Evidence page." });
    } catch (e: any) {
      toast({ title: "Report failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold font-serif text-foreground mb-1">{t("scanner.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("scanner.subtitle")}</p>
      </motion.div>

      {/* Crop Selection */}
      <GlassCard className="p-5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 block">Crop Type</label>
        {/* Mode selector */}
        <div className="flex gap-2 mb-3">
          {([
            { mode: "preset" as const, label: "Select Crop", icon: Sprout },
            { mode: "custom" as const, label: "Type Manually", icon: Pencil },
            { mode: "unknown" as const, label: "I Don't Know — AI Identify", icon: HelpCircle },
          ]).map(opt => (
            <button
              key={opt.mode}
              onClick={() => {
                setCropMode(opt.mode);
                if (opt.mode === "unknown") setCropName("unknown");
                else if (opt.mode === "preset") setCropName("Padi MR220");
                else setCropName(customCrop || "");
              }}
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

        {cropMode === "preset" && (
          <div className="flex flex-wrap gap-2">
            {PRESET_CROPS.map(crop => (
              <button
                key={crop}
                onClick={() => setCropName(crop)}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                  cropName === crop
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border/30 text-muted-foreground hover:bg-secondary/30 hover:border-border"
                }`}
              >
                {crop}
              </button>
            ))}
          </div>
        )}

        {cropMode === "custom" && (
          <input
            value={customCrop}
            onChange={(e) => { setCustomCrop(e.target.value); setCropName(e.target.value); }}
            placeholder="e.g. Dragon Fruit, Lemongrass, Starfruit..."
            className="w-full bg-secondary/20 border border-border/40 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
          />
        )}

        {cropMode === "unknown" && (
          <div className="flex items-center gap-3 p-3 bg-accent/5 border border-accent/20 rounded-lg">
            <HelpCircle className="h-5 w-5 text-accent flex-shrink-0" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-medium text-foreground">AI will identify your crop</p>
              <p className="text-xs text-muted-foreground mt-0.5">Upload a photo and our AI will automatically detect the crop type for you.</p>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Upload Zone */}
      <div onClick={() => !scanning && fileRef.current?.click()} className="cursor-pointer">
        <GlassCard className="p-12 border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-5 hover:border-primary/30 transition-colors group">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          {scanning ? (
            <>
              {previewUrl && (
                <div className="w-24 h-24 rounded-xl overflow-hidden border border-border/30 mb-2">
                  <img src={previewUrl} alt="Scanning" className="w-full h-full object-cover opacity-60" />
                </div>
              )}
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">AI is analyzing your seedling image...</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Upload className="h-8 w-8 text-accent" strokeWidth={1.5} />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">{t("scanner.upload")}</p>
                <p className="text-xs text-muted-foreground mt-1.5">{t("scanner.dragDrop")}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">{t("scanner.gpsNote")}</p>
              </div>
            </>
          )}
        </GlassCard>
      </div>

      {/* Latest Scan Result */}
      {scanResult && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard glowColor={scanResult.status === "anomaly" ? "destructive" : "primary"} className="p-6">
            <div className="flex items-start gap-4">
              {scanResult.image_url && (
                <div className="w-24 h-24 rounded-xl overflow-hidden border border-border/30 flex-shrink-0">
                  <img src={scanResult.image_url} alt="Scan" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Latest Scan Result</h3>
                    {scanResult.crop_name && scanResult.crop_name !== "unknown" && (
                      <p className="text-xs text-primary font-medium mt-0.5 flex items-center gap-1">
                        <Sprout className="h-3 w-3" /> Identified: {scanResult.crop_name}
                      </p>
                    )}
                  </div>
                  <StatusBadge variant={scanResult.status === "healthy" ? "green" : "red"} pulse>
                    {scanResult.status === "healthy" ? <><ShieldCheck className="h-3 w-3" /> Healthy</> : <><AlertTriangle className="h-3 w-3" /> Anomaly</>}
                  </StatusBadge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{scanResult.summary}</p>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground">Germination: <span className={`font-bold text-sm ${scanResult.germination_rate > 80 ? "text-primary" : "text-destructive"}`}>{scanResult.germination_rate}%</span></span>
                  <span className="text-xs text-muted-foreground">Confidence: <span className="font-bold text-sm text-foreground">{scanResult.confidence}%</span></span>
                </div>
              </div>
            </div>
            {scanResult.issues?.length > 0 && (
              <div className="space-y-1 mt-4">
                {scanResult.issues.map((issue: any, i: number) => (
                  <div key={i} className="text-xs bg-destructive/5 rounded-lg px-3 py-2">
                    <span className="font-semibold text-destructive">{issue.type}</span>: {issue.description}
                  </div>
                ))}
              </div>
            )}
            {scanResult.recommendations?.length > 0 && (
              <div className="space-y-1 mt-3">
                {scanResult.recommendations.map((rec: string, i: number) => (
                  <p key={i} className="text-xs text-muted-foreground">• {rec}</p>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>
      )}

      {/* Scan History from DB */}
      {history.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-foreground mb-4">{t("scanner.history")}</h3>
          <div className="space-y-4">
            {history.map((scan: any, i: number) => (
              <motion.div key={scan.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <GlassCard glowColor={scan.status === "anomaly" ? "destructive" : "primary"} className="p-6">
                  <div className="flex items-start gap-4">
                    {scan.image_url && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-border/30 flex-shrink-0">
                        <img src={scan.image_url} alt={scan.crop_name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-foreground">{scan.crop_name}</span>
                            <span className="text-xs text-muted-foreground/60 bg-secondary/30 px-2 py-0.5 rounded">{scan.id.slice(0, 8)}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{new Date(scan.created_at).toLocaleDateString()}</span>
                            {scan.gps_lat && <><span>•</span><span>{scan.gps_lat?.toFixed(4)}° N, {scan.gps_lng?.toFixed(4)}° E</span></>}
                          </div>
                        </div>
                        <StatusBadge variant={scan.status === "healthy" ? "green" : "red"} pulse>
                          {scan.status === "healthy" ? <><ShieldCheck className="h-3 w-3" /> Healthy</> : <><AlertTriangle className="h-3 w-3" /> Anomaly</>}
                        </StatusBadge>
                      </div>
                      {scan.ai_analysis?.summary && <p className="text-sm text-muted-foreground mb-3">{scan.ai_analysis.summary}</p>}
                      <div className="flex items-center justify-between pt-3 border-t border-border/30">
                        <span className="text-xs text-muted-foreground">
                          Germination: <span className={`font-bold tabular-nums text-sm ${(scan.germination_rate || 0) > 80 ? "text-primary" : "text-destructive"}`}>{scan.germination_rate}%</span>
                        </span>
                        {scan.status === "anomaly" && (
                          <button onClick={() => handleGenerateReport(scan)} className="flex items-center gap-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 px-3 py-2 rounded-lg transition-colors">
                            <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />
                            {t("scanner.generateReport")}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
