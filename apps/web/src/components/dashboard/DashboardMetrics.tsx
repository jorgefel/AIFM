import { motion, Variants } from "framer-motion";
import { DollarSign, Activity, ArrowDownRight, Users } from "lucide-react";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { useCurrency } from "@/contexts/CurrencyContext";

interface DashboardMetricsProps {
  isLoading: boolean;
  summary: any;
  containerVariants: Variants;
  itemVariants: Variants;
}

export function DashboardMetrics({ isLoading, summary, containerVariants, itemVariants }: DashboardMetricsProps) {
  const { formatCurrency } = useCurrency();

  if (isLoading) {
    return (
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </motion.div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      {/* Tarjeta 1: Ingresos Totales */}
      <motion.div variants={itemVariants} className="glass-panel-interactive p-6 relative overflow-hidden group">
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-400 mb-1">Ingresos Brutos (Mes)</p>
          <h3 className="text-3xl font-bold text-white tracking-tight">
            {formatCurrency(summary?.gross_income || 0)}
          </h3>
        </div>
      </motion.div>

      {/* Tarjeta 2: Ganancia Neta */}
      <motion.div variants={itemVariants} className="glass-panel-interactive p-6 relative overflow-hidden group">
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl group-hover:bg-teal-500/20 transition-all"></div>
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-teal-500/10 rounded-lg border border-teal-500/20">
            <Activity className="w-5 h-5 text-teal-400" />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-400 mb-1">Ganancia Neta (Mes)</p>
          <h3 className="text-3xl font-bold text-gradient-emerald tracking-tight">
            {formatCurrency(summary?.net_profit || 0)}
          </h3>
        </div>
      </motion.div>

      {/* Tarjeta 3: Gastos Operativos */}
      <motion.div variants={itemVariants} className="glass-panel-interactive p-6 relative overflow-hidden group">
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-coral-accent/5 rounded-full blur-2xl group-hover:bg-coral-accent/10 transition-all"></div>
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-obsidian-light rounded-lg border border-white/5">
            <ArrowDownRight className="w-5 h-5 text-coral-accent" />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-400 mb-1">Gastos Totales (Mes)</p>
          <h3 className="text-3xl font-bold text-slate-200 tracking-tight">
            {formatCurrency(summary?.total_expenses || 0)}
          </h3>
        </div>
      </motion.div>

      {/* Tarjeta 4: Ocupación */}
      <motion.div variants={itemVariants} className="glass-panel-interactive p-6 relative overflow-hidden group">
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <Users className="w-5 h-5 text-blue-400" />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-400 mb-1">Tasa de Ocupación</p>
          <h3 className="text-3xl font-bold text-white tracking-tight">
            {`${((summary?.occupancy_rate || 0) * 100).toFixed(1)}%`}
          </h3>
        </div>
      </motion.div>
    </motion.div>
  );
}
