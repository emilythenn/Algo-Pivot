import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { motion } from "framer-motion";

const marketData = [
  { crop: "Padi", price: "RM 1,250", unit: "/ton", change: "+5.2%", trend: "up" as const },
  { crop: "Ginger", price: "RM 8,400", unit: "/ton", change: "+12.1%", trend: "up" as const },
  { crop: "Chili", price: "RM 6,200", unit: "/ton", change: "-3.8%", trend: "down" as const },
  { crop: "Mung Bean", price: "RM 3,800", unit: "/ton", change: "+1.2%", trend: "up" as const },
  { crop: "Kangkung", price: "RM 2,100", unit: "/ton", change: "0.0%", trend: "stable" as const },
  { crop: "Corn", price: "RM 1,450", unit: "/ton", change: "+2.7%", trend: "up" as const },
  { crop: "Oil Palm", price: "RM 4,120", unit: "/ton", change: "+1.8%", trend: "up" as const },
  { crop: "Rubber", price: "RM 5,600", unit: "/ton", change: "-1.4%", trend: "down" as const },
  { crop: "Durian", price: "RM 32,000", unit: "/ton", change: "+8.5%", trend: "up" as const },
  { crop: "Cocoa", price: "RM 9,800", unit: "/ton", change: "+3.1%", trend: "up" as const },
  { crop: "Pepper", price: "RM 22,500", unit: "/ton", change: "-2.3%", trend: "down" as const },
  { crop: "Cassava", price: "RM 900", unit: "/ton", change: "+0.8%", trend: "up" as const },
  { crop: "Tomato", price: "RM 3,200", unit: "/ton", change: "-4.1%", trend: "down" as const },
  { crop: "Cucumber", price: "RM 2,800", unit: "/ton", change: "+1.5%", trend: "up" as const },
  { crop: "Coconut", price: "RM 1,800", unit: "/ton", change: "+0.3%", trend: "stable" as const },
  { crop: "Banana", price: "RM 2,400", unit: "/ton", change: "+2.1%", trend: "up" as const },
  { crop: "Pineapple", price: "RM 1,950", unit: "/ton", change: "-0.7%", trend: "down" as const },
  { crop: "Watermelon", price: "RM 1,600", unit: "/ton", change: "+4.3%", trend: "up" as const },
];

const trendIcon = { up: TrendingUp, down: TrendingDown, stable: Minus };
const trendColor = { up: "text-primary", down: "text-destructive", stable: "text-muted-foreground" };

export function MarketTicker() {
  return (
    <GlassCard className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="h-4 w-4 text-primary" strokeWidth={1.5} />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Market Prices
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground/50">{marketData.length} commodities</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
        {marketData.map((item, i) => {
          const Icon = trendIcon[item.trend];
          return (
            <motion.div
              key={item.crop}
              className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2.5 min-w-0 overflow-hidden"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.3 }}
            >
              <div className="min-w-0 overflow-hidden">
                <div className="text-xs text-muted-foreground truncate">{item.crop}</div>
                <div className="text-sm font-medium tabular-nums truncate">
                  {item.price}<span className="text-[10px] text-muted-foreground">{item.unit}</span>
                </div>
              </div>
              <div className={`flex items-center gap-1 ${trendColor[item.trend]}`}>
                <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span className="text-xs font-medium tabular-nums">{item.change}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="mt-2 text-right">
        <span className="text-[10px] text-muted-foreground/60">Updated: {new Date().toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}</span>
      </div>
    </GlassCard>
  );
}
