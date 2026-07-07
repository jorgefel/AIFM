"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ArrowUpRight, ArrowDownRight, DollarSign, Users, Activity, Filter, Download, Sparkles, Loader2, Building2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { api } from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { motion, Variants } from "framer-motion";

export default function Home() {
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
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  
  const [summary, setSummary] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Recent activity
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  // AI Report State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportState, setReportState] = useState<"idle" | "loading" | "completed" | "error">("idle");
  const [reportResult, setReportResult] = useState<any>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await api.get("/properties/");
        setProperties(data);
        if (data.length > 0) {
          setSelectedPropertyId(data[0].id);
        } else {
          setIsLoading(false);
        }
      } catch (e) {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!selectedPropertyId) return;

    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const date = new Date();
        const currentYear = date.getFullYear();
        const currentMonth = date.getMonth() + 1;

        // Fetch current month summary
        const summaryRes = await api.get(`/analysis/summary?property_id=${selectedPropertyId}&year=${currentYear}&month=${currentMonth}`);
        setSummary(summaryRes.data);

        // Fetch last 6 months for the chart
        const newChartData = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(currentYear, date.getMonth() - i, 1);
          const y = d.getFullYear();
          const m = d.getMonth() + 1;
          
          try {
            const res = await api.get(`/analysis/summary?property_id=${selectedPropertyId}&year=${y}&month=${m}`);
            newChartData.push({
              name: d.toLocaleString('es', { month: 'short' }),
              Ingresos: res.data.gross_income,
              Gastos: res.data.total_expenses
            });
          } catch (e) {
            newChartData.push({
              name: d.toLocaleString('es', { month: 'short' }),
              Ingresos: 0,
              Gastos: 0
            });
          }
        }
        setChartData(newChartData);

        // Fetch recent activity
        const [resData, expData] = await Promise.all([
          api.get(`/reservations/?property_id=${selectedPropertyId}`),
          api.get(`/expenses/?property_id=${selectedPropertyId}`)
        ]);

        const activities = [
          ...resData.data.map((r: any) => ({
            id: `res-${r.id}`,
            type: "reservation",
            title: `Reserva: ${r.guest_name}`,
            date: new Date(r.created_at),
            amount: r.net_amount,
            platform: r.platform
          })),
          ...expData.data.map((e: any) => ({
            id: `exp-${e.id}`,
            type: "expense",
            title: `Gasto: ${e.category}`,
            date: new Date(e.date),
            amount: e.amount
          }))
        ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

        setRecentActivity(activities);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedPropertyId]);

  // Export CSV Action
  const handleExportCSV = async () => {
    if (!selectedPropertyId) return;
    try {
      const response = await api.get(`/export/csv?property_id=${selectedPropertyId}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `export_${selectedPropertyId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      alert("Error al exportar los datos.");
    }
  };

  // Generate AI Report Action
  const handleGenerateReport = async () => {
    if (!selectedPropertyId) return;
    setIsReportModalOpen(true);
    setReportState("loading");
    setReportResult(null);
    setReportError(null);

    try {
      const date = new Date();
      // Encolar trabajo de IA
      const { data: jobInit } = await api.post("/analysis/ai-insights", {
        property_id: selectedPropertyId,
        year: date.getFullYear(),
        month: date.getMonth() + 1
      });

      const jobId = jobInit.job_id;

      // Polling cada 2.5 segundos
      const pollInterval = setInterval(async () => {
        try {
          const { data: jobStatus } = await api.get(`/jobs/${jobId}`);
          
          if (jobStatus.status === "completed") {
            clearInterval(pollInterval);
            setReportState("completed");
            setReportResult(jobStatus.result);
          } else if (jobStatus.status === "failed") {
            clearInterval(pollInterval);
            setReportState("error");
            setReportError(jobStatus.error || "Error desconocido en el agente de IA");
          }
        } catch (pollErr) {
          clearInterval(pollInterval);
          setReportState("error");
          setReportError("Error al consultar el estado del reporte.");
        }
      }, 2500);

    } catch (error: any) {
      setReportState("error");
      setReportError(error.response?.data?.detail || "Error al solicitar el reporte a la IA.");
    }
  };

  return (
    <DashboardLayout>
      {/* Header de la vista */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Resumen Financiero
          </h1>
          <p className="text-slate-400 mt-1">
            Métricas clave y rendimiento de tus propiedades.
          </p>
        </div>
        <div className="flex gap-3 items-center">
          {properties.length > 0 && (
            <div className="flex items-center bg-obsidian-light/50 border border-white/10 rounded-lg px-3 py-1">
              <Filter className="w-4 h-4 text-slate-400 mr-2" />
              <select 
                className="bg-transparent text-white text-sm focus:outline-none border-none py-1"
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
              >
                {properties.map(p => (
                  <option key={p.id} value={p.id} className="bg-obsidian">{p.name}</option>
                ))}
              </select>
            </div>
          )}
          
          <button 
            onClick={handleExportCSV}
            disabled={!selectedPropertyId || isLoading}
            className="flex items-center px-4 py-2 text-sm font-medium text-slate-300 bg-obsidian-light/40 border border-white/10 rounded-lg hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </button>

          <button 
            onClick={handleGenerateReport}
            disabled={!selectedPropertyId || isLoading}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-500/20 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.15)] disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 mr-2 text-emerald-400" />
            Reporte IA
          </button>
        </div>
      </div>

      {!selectedPropertyId && !isLoading && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 p-12 rounded-2xl glass-panel border border-white/10 flex flex-col items-center justify-center text-center"
        >
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Bienvenido a LuxeLedger</h3>
          <p className="text-slate-400 max-w-md">
            Aún no tienes propiedades registradas. Para comenzar a ver tu resumen financiero y estadísticas, primero añade tu primera propiedad.
          </p>
          <button onClick={() => window.location.href='/properties'} className="mt-6 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors shadow-lg shadow-emerald-500/20">
            Añadir Propiedad
          </button>
        </motion.div>
      )}

      {/* Tarjetas de Métricas Principales */}
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
              ${isLoading ? "..." : (summary?.gross_income || 0).toFixed(2)}
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
              ${isLoading ? "..." : (summary?.net_profit || 0).toFixed(2)}
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
              ${isLoading ? "..." : (summary?.total_expenses || 0).toFixed(2)}
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
              {isLoading ? "..." : `${((summary?.occupancy_rate || 0) * 100).toFixed(1)}%`}
            </h3>
          </div>
        </motion.div>
      </motion.div>

      {/* Área Principal de Gráficas y Listas */}
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="show" 
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2"
      >
        {/* Gráfica de Rendimiento Anual */}
        <motion.div variants={itemVariants} className="lg:col-span-2 glass-panel p-6 h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Rendimiento (Últimos 6 Meses)</h3>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> Ingresos</div>
              <div className="flex items-center gap-1 ml-2"><div className="w-2 h-2 rounded-full bg-coral-accent"></div> Gastos</div>
            </div>
          </div>
          <div className="flex-1 w-full h-full min-h-0">
            {isLoading ? (
               <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">Cargando gráfica...</div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff7b72" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ff7b72" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Area type="monotone" dataKey="Ingresos" stroke="#10b981" fillOpacity={1} fill="url(#colorIngresos)" />
                  <Area type="monotone" dataKey="Gastos" stroke="#ff7b72" fillOpacity={1} fill="url(#colorGastos)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm border border-white/5 border-dashed rounded-xl bg-obsidian-light/20">
                No hay datos suficientes
              </div>
            )}
          </div>
        </motion.div>

        {/* Transacciones Recientes */}
        <motion.div variants={itemVariants} className="glass-panel p-6 h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Actividad Reciente</h3>
            <button className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
              Ver todo
            </button>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
            
            {isLoading ? (
               <div className="text-slate-500 text-sm text-center mt-4">Cargando actividad...</div>
            ) : recentActivity.length === 0 ? (
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
                  {item.type === "reservation" ? "+" : "-"}${item.amount.toFixed(2)}
                </p>
              </div>
            ))}
            
          </div>
        </motion.div>
      </motion.div>

      {/* Modal del Reporte IA */}
      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="Análisis de IA Financiero">
        <div className="p-2 space-y-6">
          {reportState === "loading" && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
              <p className="text-slate-300 font-medium">El agente de IA está analizando tus finanzas...</p>
              <p className="text-slate-500 text-sm text-center max-w-xs">Buscando discrepancias y calculando métricas avanzadas. Esto puede tardar unos segundos.</p>
            </div>
          )}

          {reportState === "error" && (
            <div className="p-4 rounded-xl bg-coral-accent/10 border border-coral-accent/20">
              <h4 className="text-coral-accent font-semibold mb-2">Error en el análisis</h4>
              <p className="text-sm text-slate-300">{reportError}</p>
            </div>
          )}

          {reportState === "completed" && reportResult && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <h4 className="text-emerald-400 font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Veredicto de IA
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {reportResult.summary || "Análisis completado satisfactoriamente."}
                </p>
              </div>
              
              {reportResult.alerts && reportResult.alerts.length > 0 && (
                <div>
                  <h4 className="text-slate-200 font-semibold mb-3">Alertas y Discrepancias</h4>
                  <div className="space-y-3">
                    {reportResult.alerts.map((alert: any, idx: number) => (
                      <div key={idx} className={`p-3 rounded-lg border text-sm ${
                        alert.severity === "high" 
                          ? "bg-coral-accent/10 border-coral-accent/30 text-coral-200" 
                          : "bg-amber-500/10 border-amber-500/30 text-amber-200"
                      }`}>
                        <span className="font-bold capitalize">{alert.severity}:</span> {alert.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {reportResult.recommendations && reportResult.recommendations.length > 0 && (
                <div>
                  <h4 className="text-slate-200 font-semibold mb-3">Recomendaciones</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-slate-300">
                    {reportResult.recommendations.map((rec: string, idx: number) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

    </DashboardLayout>
  );
}
