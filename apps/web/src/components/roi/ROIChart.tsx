import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface ROIChartProps {
  results: {
    grossIncome: number;
    netIncome: number;
    monthsToROI: number;
    yearsToROI: number;
    roiStatus: string;
    chartData: any[];
  };
  initialInvestment: number;
  formatCurrency: (value: number) => string;
}

export function ROIChart({ results, initialInvestment, formatCurrency }: ROIChartProps) {
  const getStatusColor = () => {
    switch(results.roiStatus) {
      case "excellent": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "good": return "text-teal-400 bg-teal-500/10 border-teal-500/20";
      case "warning": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      default: return "text-coral-accent bg-coral-accent/10 border-coral-accent/20";
    }
  };

  const getStatusText = () => {
    switch(results.roiStatus) {
      case "excellent": return "Excelente (< 2 años)";
      case "good": return "Bueno (2 - 5 años)";
      case "warning": return "Lento (> 5 años)";
      default: return "No rentable (Pérdida mensual)";
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.3 }}
      className="lg:col-span-7 space-y-6"
    >
      {/* Tarjetas de Resultados */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-panel-interactive p-6 text-center">
          <p className="text-sm font-medium text-slate-400 mb-2">Ingreso Bruto Mensual</p>
          <h3 className="text-2xl font-bold text-white">{formatCurrency(results.grossIncome)}</h3>
        </div>
        
        <div className={`p-6 text-center rounded-xl border backdrop-blur-md transition-all duration-300 ${
          results.netIncome > 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-coral-accent/10 border-coral-accent/20"
        }`}>
          <p className="text-sm font-medium text-slate-400 mb-2">Ganancia Neta Mensual</p>
          <h3 className={`text-3xl font-bold ${results.netIncome > 0 ? "text-emerald-400" : "text-coral-accent"}`}>
            {formatCurrency(results.netIncome)}
          </h3>
        </div>
      </div>

      <div className="glass-panel-interactive p-8 text-center relative overflow-hidden">
        <div className="absolute top-[-50%] right-[-10%] w-[60%] h-[150%] bg-emerald-500/5 blur-[100px] pointer-events-none" />
        
        <h3 className="text-lg font-medium text-slate-300 mb-4">Tiempo estimado para Retorno de Inversión (ROI)</h3>
        
        {results.netIncome > 0 ? (
          <div className="flex flex-col items-center justify-center">
            <div className="text-6xl font-extrabold text-white tracking-tighter mb-2">
              {results.yearsToROI.toFixed(1)} <span className="text-2xl text-slate-400 font-medium tracking-normal">Años</span>
            </div>
            <div className="text-lg text-emerald-400 font-medium mb-6">
              (Aprox. {Math.ceil(results.monthsToROI)} meses)
            </div>
            
            <div className={`px-4 py-1.5 rounded-full border text-sm font-bold flex items-center gap-2 ${getStatusColor()}`}>
              <TrendingUp className="w-4 h-4" />
              {getStatusText()}
            </div>
          </div>
        ) : (
          <div className="py-8 text-coral-accent font-bold text-xl">
            Tus gastos superan tus ingresos. <br/> No hay retorno de inversión posible.
          </div>
        )}
      </div>

      {/* Gráfica de Proyección */}
      <div className="glass-panel p-6 h-[400px] flex flex-col">
        <h3 className="text-lg font-semibold text-white mb-6">Proyección de Recuperación</h3>
        <div className="flex-1 w-full min-h-0">
          {results.netIncome > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={results.chartData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAcumulado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value)} />
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                  formatter={(value: any, name: any) => [formatCurrency(Number(value)), name]}
                />
                
                {/* Línea de inversión inicial */}
                <ReferenceLine y={initialInvestment} stroke="#ff7b72" strokeDasharray="5 5" label={{ position: 'top', value: 'Inversión', fill: '#ff7b72', fontSize: 12 }} />
                
                <Area type="monotone" dataKey="Acumulado" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAcumulado)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm border border-white/5 border-dashed rounded-xl bg-obsidian-light/20">
              Ajusta los parámetros para ver la proyección
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
