import { motion, Variants } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { SkeletonList } from "@/components/ui/Skeleton";
import { useCurrency } from "@/contexts/CurrencyContext";

interface ActivityListProps {
  isLoading: boolean;
  recentActivity: any[];
  itemVariants: Variants;
}

export function ActivityList({ isLoading, recentActivity, itemVariants }: ActivityListProps) {
  const { formatCurrency } = useCurrency();

  if (isLoading) {
    return <SkeletonList />;
  }

  return (
    <motion.div variants={itemVariants} className="glass-panel p-6 h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Actividad Reciente</h3>
        <button className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
          Ver todo
        </button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto pr-2">
        
        {recentActivity.length === 0 ? (
          <div className="text-slate-500 text-sm text-center mt-4">No hay actividad reciente.</div>
        ) : recentActivity.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer border border-transparent hover:border-white/5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                item.type === "reservation" ? "bg-emerald-500/10 text-emerald-400" : "bg-coral-accent/10 text-coral-accent"
              }`}>
                {item.type === "reservation" ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors truncate max-w-[150px]">{item.title}</p>
                <p className="text-xs text-slate-500">{item.date.toLocaleDateString()}</p>
              </div>
            </div>
            <p className={`text-sm font-bold ${item.type === "reservation" ? "text-emerald-400" : "text-slate-300"}`}>
              {item.type === "reservation" ? "+" : "-"}{formatCurrency(item.amount)}
            </p>
          </div>
        ))}
        
      </div>
    </motion.div>
  );
}
