"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Calculator, DollarSign, Percent, Calendar, RefreshCcw, TrendingUp } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Button } from "@/components/ui/Button";

export default function ROICalculator() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  // State
  const [initialInvestment, setInitialInvestment] = useState(50000);
  const [pricePerNight, setPricePerNight] = useState(100);
  const [daysOccupied, setDaysOccupied] = useState(20);
  const [platformFee, setPlatformFee] = useState(15);
  const [operatingExpenses, setOperatingExpenses] = useState(500);
  const [fixedExpenses, setFixedExpenses] = useState(200);
  
  // Results
  const [results, setResults] = useState({
    grossIncome: 0,
    netIncome: 0,
    monthsToROI: 0,
    yearsToROI: 0,
    roiStatus: "good",
    chartData: [] as any[]
  });

  // Calculation logic
  useEffect(() => {
    const calculateROI = () => {
      // Monthly calculations
      const grossIncome = pricePerNight * daysOccupied;
      const feeAmount = grossIncome * (platformFee / 100);
      const netIncome = grossIncome - feeAmount - operatingExpenses - fixedExpenses;
      
      let months = 0;
      let years = 0;
      let status = "bad";
      
      const newChartData = [];
      let accumulated = 0;
      
      if (netIncome > 0) {
        months = initialInvestment / netIncome;
        years = months / 12;
        
        status = years < 2 ? "excellent" : years < 5 ? "good" : "warning";
        
        // Generate chart data up to ROI completion + 12 months (or max 120 months)
        const projectionMonths = Math.min(Math.ceil(months) + 12, 120);
        
        for (let i = 0; i <= projectionMonths; i++) {
          if (i % 3 === 0 || i === projectionMonths) { // Plot every quarter for performance
            newChartData.push({
              month: `Mes ${i}`,
              valor: i,
              Acumulado: Math.round(accumulated),
              Inversión: initialInvestment
            });
          }
          accumulated += netIncome;
        }
      } else {
        // Generar un gráfico plano si hay pérdidas
        for (let i = 0; i <= 12; i++) {
            newChartData.push({
                month: `Mes ${i}`,
                valor: i,
                Acumulado: 0,
                Inversión: initialInvestment
            });
        }
      }

      setResults({
        grossIncome,
        netIncome,
        monthsToROI: isFinite(months) ? months : 0,
        yearsToROI: isFinite(years) ? years : 0,
        roiStatus: status,
        chartData: newChartData
      });
    };

    calculateROI();
  }, [initialInvestment, pricePerNight, daysOccupied, platformFee, operatingExpenses, fixedExpenses]);

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
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Calculator className="w-8 h-8 text-emerald-400" />
            Calculadora de ROI
          </h1>
          <p className="text-slate-400 mt-1">
            Simula escenarios y descubre en cuánto tiempo recuperarás tu inversión inicial.
          </p>
        </div>
        <Button 
          onClick={() => {
            setInitialInvestment(50000);
            setPricePerNight(100);
            setDaysOccupied(20);
            setPlatformFee(15);
            setOperatingExpenses(500);
            setFixedExpenses(200);
          }}
          className="bg-obsidian-light/50 border-white/10 hover:bg-white/5 text-slate-300"
        >
          <RefreshCcw className="w-4 h-4 mr-2" />
          Reiniciar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* PANEL IZQUIERDO: FORMULARIO */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="lg:col-span-5 space-y-6"
        >
          {/* Inversión y Precio */}
          <motion.div variants={itemVariants} className="glass-panel p-6 space-y-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              Inversión y Tarifas
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="flex justify-between text-sm font-medium text-slate-300 mb-2">
                  <span>Inversión Inicial</span>
                  <span className="text-emerald-400 font-bold">${initialInvestment.toLocaleString()}</span>
                </label>
                <input 
                  type="range" 
                  min="5000" max="500000" step="1000"
                  value={initialInvestment} 
                  onChange={(e) => setInitialInvestment(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <label className="flex justify-between text-sm font-medium text-slate-300 mb-2">
                  <span>Precio por Noche</span>
                  <span className="text-emerald-400 font-bold">${pricePerNight}</span>
                </label>
                <input 
                  type="range" 
                  min="20" max="1000" step="5"
                  value={pricePerNight} 
                  onChange={(e) => setPricePerNight(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
            </div>
          </motion.div>

          {/* Ocupación y Gastos */}
          <motion.div variants={itemVariants} className="glass-panel p-6 space-y-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-teal-400" />
              Ocupación y Gastos Mensuales
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="flex justify-between text-sm font-medium text-slate-300 mb-2">
                  <span>Días Ocupados por Mes</span>
                  <span className="text-teal-400 font-bold">{daysOccupied} días ({(daysOccupied/30*100).toFixed(0)}%)</span>
                </label>
                <input 
                  type="range" 
                  min="1" max="30" step="1"
                  value={daysOccupied} 
                  onChange={(e) => setDaysOccupied(Number(e.target.value))}
                  className="w-full accent-teal-500"
                />
              </div>

              <div>
                <label className="flex justify-between text-sm font-medium text-slate-300 mb-2">
                  <span>Gastos Operativos (Limpieza, insumos)</span>
                  <span className="text-teal-400 font-bold">${operatingExpenses}</span>
                </label>
                <input 
                  type="range" 
                  min="0" max="2000" step="50"
                  value={operatingExpenses} 
                  onChange={(e) => setOperatingExpenses(Number(e.target.value))}
                  className="w-full accent-teal-500"
                />
              </div>

              <div>
                <label className="flex justify-between text-sm font-medium text-slate-300 mb-2">
                  <span>Gastos Fijos (Luz, agua, internet)</span>
                  <span className="text-teal-400 font-bold">${fixedExpenses}</span>
                </label>
                <input 
                  type="range" 
                  min="0" max="2000" step="50"
                  value={fixedExpenses} 
                  onChange={(e) => setFixedExpenses(Number(e.target.value))}
                  className="w-full accent-teal-500"
                />
              </div>
            </div>
          </motion.div>

          {/* Comisiones */}
          <motion.div variants={itemVariants} className="glass-panel p-6 space-y-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <Percent className="w-5 h-5 text-amber-400" />
              Comisiones
            </h3>
            
            <div>
              <label className="flex justify-between text-sm font-medium text-slate-300 mb-2">
                <span>Comisión de Plataforma</span>
                <span className="text-amber-400 font-bold">{platformFee}%</span>
              </label>
              <input 
                type="range" 
                min="0" max="35" step="1"
                value={platformFee} 
                onChange={(e) => setPlatformFee(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>
          </motion.div>
        </motion.div>


        {/* PANEL DERECHO: RESULTADOS */}
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
              <h3 className="text-2xl font-bold text-white">${results.grossIncome.toLocaleString()}</h3>
            </div>
            
            <div className={`p-6 text-center rounded-xl border backdrop-blur-md transition-all duration-300 ${
              results.netIncome > 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-coral-accent/10 border-coral-accent/20"
            }`}>
              <p className="text-sm font-medium text-slate-400 mb-2">Ganancia Neta Mensual</p>
              <h3 className={`text-3xl font-bold ${results.netIncome > 0 ? "text-emerald-400" : "text-coral-accent"}`}>
                ${results.netIncome.toLocaleString()}
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
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                      itemStyle={{ color: '#e2e8f0' }}
                      formatter={(value: any, name: any) => [`$${Number(value).toLocaleString()}`, name]}
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
        
      </div>
    </DashboardLayout>
  );
}
