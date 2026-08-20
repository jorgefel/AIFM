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
      case "excellent": return "text-cyan-700 bg-cyan-50 border-cyan-200";
      case "good": return "text-teal-700 bg-teal-50 border-teal-200";
      case "warning": return "text-amber-700 bg-amber-50 border-amber-200";
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
        <div className="card-surface-interactive p-6 text-center">
          <p className="text-sm font-medium text-ink-muted mb-2">Ingreso Bruto Mensual</p>
          <h3 className="text-2xl font-bold text-ink">{formatCurrency(results.grossIncome)}</h3>
        </div>
        
        <div className={`p-6 text-center rounded-xl border backdrop-blur-md transition-all duration-300 ${
          results.netIncome > 0 ? "bg-teal-50 border-teal-200" : "bg-coral-accent/10 border-coral-accent/20"
        }`}>
          <p className="text-sm font-medium text-ink-muted mb-2">Ganancia Neta Mensual</p>
          <h3 className={`text-3xl font-bold ${results.netIncome > 0 ? "text-teal-600" : "text-coral-accent"}`}>
            {formatCurrency(results.netIncome)}
          </h3>
        </div>
      </div>

      <div className="card-surface-interactive p-8 text-center relative overflow-hidden">
        <div className="absolute top-[-50%] right-[-10%] w-[60%] h-[150%] bg-violet-400/10 blur-[100px] pointer-events-none" />
        
        <h3 className="text-lg font-medium text-ink-muted mb-4">Tiempo estimado para Retorno de Inversión (ROI)</h3>
        
        {results.netIncome > 0 ? (
          <div className="flex flex-col items-center justify-center">
            <div className="text-6xl font-extrabold text-ink tracking-tighter mb-2">
              {results.yearsToROI.toFixed(1)} <span className="text-2xl text-ink-muted font-medium tracking-normal">Años</span>
            </div>
            <div className="text-lg text-teal-600 font-medium mb-6">
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
      <div className="card-surface p-6 h-[400px] flex flex-col">
        <h3 className="text-lg font-semibold text-ink mb-6">Proyección de Recuperación</h3>
        <div className="flex-1 w-full min-h-0">
          {results.netIncome > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={results.chartData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAcumulado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C5CFC" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#7C5CFC" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#9C9CAF" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9C9CAF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value)} />
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(21,19,31,0.06)" vertical={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '12px', boxShadow: '0 12px 24px -8px rgba(21,19,31,0.15)' }}
                  itemStyle={{ color: '#15131F' }}
                  labelStyle={{ color: '#6B6B7B' }}
                  formatter={(value: any, name: any) => [formatCurrency(Number(value)), name]}
                />
                
                {/* Línea de inversión inicial */}
                <ReferenceLine y={initialInvestment} stroke="#F43F5E" strokeDasharray="5 5" label={{ position: 'top', value: 'Inversión', fill: '#F43F5E', fontSize: 12 }} />
                
                <Area type="monotone" dataKey="Acumulado" stroke="#7C5CFC" strokeWidth={3} fillOpacity={1} fill="url(#colorAcumulado)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ink-muted text-sm border border-black/5 border-dashed rounded-xl bg-surface">
              Ajusta los parámetros para ver la proyección
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
