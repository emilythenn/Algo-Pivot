import { Camera, FileText, ShieldCheck, AlertTriangle, Upload, Leaf, Clock } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { StatusBadge } from "./StatusBadge";
import { motion } from "framer-motion";
import { useState } from "react";

interface ScanResult {
  id: string;
  crop: string;
  date: string;
  status: "healthy" | "anomaly";
  germination: string;
  notes: string;
}

const scanHistory: ScanResult[] = [
  {
    id: "SC-001",
    crop: "Padi MR220",
    date: "14 Mar 2026",
    status: "anomaly",
    germination: "62%",
    notes: "Padi Angin detected in 38% of samples. Early weedy rice growth pattern identified.",
  },
  {
    id: "SC-002",
    crop: "Mung Bean",
    date: "12 Mar 2026",
    status: "healthy",
    germination: "94%",
    notes: "Uniform growth. Leaf morphology consistent with Golden Standard.",
  },
  {
    id: "SC-003",
    crop: "Ginger",
    date: "10 Mar 2026",
    status: "healthy",
    germination: "91%",
    notes: "Healthy rhizome development. Proceed with scheduled fertilization.",
  },
];

const rescueCrops = [
  { name: "Mung Bean", days: 60, window: "Available" },
  { name: "Kangkung", days: 30, window: "Available" },
  { name: "Sweet Potato", days: 90, window: "Limited" },
];

export function SeedIntegrityPanel() {
  const [activeTab, setActiveTab] = useState<"scanner" | "evidence" | "planner">("scanner");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Camera className="h-4 w-4 text-accent" strokeWidth={1.5} />
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Seed Integrity AI
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-secondary/30">
        {(["scanner", "evidence", "planner"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors capitalize ${
              activeTab === tab
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "scanner" ? "Scanner" : tab === "evidence" ? "Evidence Locker" : "Catch-Up Plan"}
          </button>
        ))}
      </div>

      {activeTab === "scanner" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          {/* Upload Zone */}
          <GlassCard className="p-6 border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/30 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Upload className="h-5 w-5 text-accent" strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Upload Seedling Photo</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                7–14 day old seedlings for AI analysis
              </p>
            </div>
          </GlassCard>

          {/* Recent Scans */}
          {scanHistory.map((scan, i) => (
            <motion.div
              key={scan.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <GlassCard
                className="p-3"
                glowColor={scan.status === "anomaly" ? "destructive" : "primary"}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{scan.crop}</span>
                      <span className="text-[10px] text-muted-foreground">{scan.id}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{scan.date}</span>
                  </div>
                  {scan.status === "healthy" ? (
                    <StatusBadge variant="green" pulse>
                      <ShieldCheck className="h-3 w-3" strokeWidth={1.5} /> Healthy
                    </StatusBadge>
                  ) : (
                    <StatusBadge variant="red" pulse>
                      <AlertTriangle className="h-3 w-3" strokeWidth={1.5} /> Anomaly
                    </StatusBadge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-2">{scan.notes}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Germination: <span className={`font-medium tabular-nums ${
                      parseInt(scan.germination) > 80 ? "text-primary" : "text-destructive"
                    }`}>{scan.germination}</span>
                  </span>
                  {scan.status === "anomaly" && (
                    <button className="flex items-center gap-1 text-[10px] font-medium bg-foreground/10 hover:bg-foreground/20 text-foreground px-2 py-1 rounded-md transition-colors">
                      <FileText className="h-3 w-3" strokeWidth={1.5} />
                      Generate Evidence
                    </button>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      )}

      {activeTab === "evidence" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <GlassCard className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-accent" strokeWidth={1.5} />
              <span className="text-sm font-medium">Evidence Reports</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-border/30">
                <div>
                  <div className="text-sm font-medium">Padi MR220 — Anomaly Report</div>
                  <div className="text-[10px] text-muted-foreground">14 Mar 2026 • GPS: 6.1184° N, 100.3685° E</div>
                </div>
                <StatusBadge variant="red">Signed PDF</StatusBadge>
              </div>
              <p className="text-xs text-muted-foreground font-serif-display italic">
                "AI analysis confirms presence of Padi Angin (Oryza rufipogon) in 38% of sampled seedlings, 
                inconsistent with certified MR220 seed stock. Evidence compiled under Consumer Protection Act 2026."
              </p>
              <button className="w-full mt-2 flex items-center justify-center gap-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 px-3 py-2 rounded-lg transition-colors">
                <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />
                Download Report
              </button>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {activeTab === "planner" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <GlassCard className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Leaf className="h-4 w-4 text-primary" strokeWidth={1.5} />
              <span className="text-sm font-medium">Rescue Crop Planner</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Season window remaining: <span className="text-foreground font-medium tabular-nums">87 days</span>. 
              Recommended rescue crops based on remaining time and current conditions.
            </p>
            <div className="space-y-2">
              {rescueCrops.map((crop) => (
                <div key={crop.name} className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <Sprout className="h-4 w-4 text-primary" strokeWidth={1.5} />
                    <div>
                      <div className="text-sm font-medium">{crop.name}</div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" strokeWidth={1.5} />
                        {crop.days} days to harvest
                      </div>
                    </div>
                  </div>
                  <StatusBadge variant={crop.window === "Available" ? "green" : "warning"}>
                    {crop.window}
                  </StatusBadge>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      )}
    </div>
  );
}

function Sprout(props: React.SVGProps<SVGSVGElement> & { strokeWidth?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M7 20h10"/>
      <path d="M10 20c5.5-2.5.8-6.4 3-10"/>
      <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/>
      <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>
    </svg>
  );
}
