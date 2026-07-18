"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Download, Sparkles, Filter, Loader2, FileSpreadsheet, BrainCircuit, Zap } from "lucide-react";
import { api } from "@/lib/api";
import { motion, Variants } from "framer-motion";

export default function ReportsPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // AI Report State
  const [reportState, setReportState] = useState<"idle" | "loading" | "completed" | "error">("idle");
  const [reportResult, setReportResult] = useState<any>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportType, setReportType] = useState<"ai" | "deterministic">("ai");

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

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const { data } = await api.get("/properties/");
        setProperties(data);
        if (data.length > 0) {
          setSelectedPropertyId(data[0].id);
        }
      } catch (error) {
        console.error("Error fetching properties:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProperties();
  }, []);

  const handleExportCSV = async () => {
    if (!selectedPropertyId) return;
    setIsExporting(true);
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
    } finally {
      setIsExporting(false);
    }
  };

  const handleGenerateReport = async (type: "ai" | "deterministic") => {
    if (!selectedPropertyId) return;
    setReportType(type);
    setIsReportModalOpen(true);
    setReportState("loading");
    setReportResult(null);
    setReportError(null);

    try {
      const date = new Date();
      const payload = {
        property_id: selectedPropertyId,
        year: date.getFullYear(),
        month: date.getMonth() + 1
      };

      if (type === "deterministic") {
        // Análisis determinístico síncrono (instantáneo)
        const { data } = await api.post("/analysis/deterministic-insights", payload);
        
        // Retraso artificial para dar sensación de procesamiento premium
        setTimeout(() => {
          setReportResult(data);
          setReportState("completed");
        }, 1200);
        return;
      }

      // Flujo asíncrono para IA
      const { data: jobInit } = await api.post("/analysis/ai-insights", payload);
      const jobId = jobInit.job_id;

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
      setReportError(error.response?.data?.detail || "Error al solicitar el reporte.");
    }
  };

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Reportes y Análisis</h1>
            <p className="text-slate-400 mt-1">Exporta tus datos o solicita un análisis inteligente.</p>
          </div>
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
        </motion.div>

        {!selectedPropertyId && !isLoading && (
          <motion.div variants={itemVariants} className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm">
            No tienes propiedades registradas.
          </motion.div>
        )}

        {selectedPropertyId && (
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">

            
            {/* Tarjeta de Exportación CSV */}
            <div className="glass-panel p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 border border-blue-500/20">
                <FileSpreadsheet className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Exportar Datos a CSV</h3>
              <p className="text-slate-400 text-sm mb-6 max-w-sm">
                Descarga un reporte consolidado con todas las reservas, ingresos y gastos de esta propiedad en formato CSV.
              </p>
              <Button onClick={handleExportCSV} isLoading={isExporting} className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                <Download className="w-4 h-4 mr-2" />
                Descargar CSV
              </Button>
            </div>

            {/* Tarjeta de Análisis Rápido (Determinístico) */}
            <div className="glass-panel p-8 flex flex-col items-center text-center relative overflow-hidden group">
              <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/10 blur-[80px] pointer-events-none group-hover:bg-teal-500/20 transition-all" />
              <div className="w-16 h-16 bg-teal-500/10 rounded-full flex items-center justify-center mb-6 border border-teal-500/20">
                <Zap className="w-8 h-8 text-teal-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Análisis Rápido</h3>
              <p className="text-slate-400 text-sm mb-6 max-w-sm">
                Obtén un análisis instantáneo basado en métricas y reglas financieras, junto con un Score de Salud Financiera.
              </p>
              <Button onClick={() => handleGenerateReport("deterministic")} className="w-full sm:w-auto bg-teal-500 hover:bg-teal-600 text-white shadow-lg shadow-teal-500/20">
                <Zap className="w-4 h-4 mr-2" />
                Generar Análisis
              </Button>
            </div>

            {/* Tarjeta de Agente IA */}
            <div className="glass-panel p-8 flex flex-col items-center text-center relative overflow-hidden group">
              <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[80px] pointer-events-none group-hover:bg-emerald-500/20 transition-all" />
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20">
                <BrainCircuit className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Agente IA (Avanzado)</h3>
              <p className="text-slate-400 text-sm mb-6 max-w-sm">
                Deja que nuestro agente financiero de IA revise tus métricas del mes de manera profunda y personalizada.
              </p>
              <Button onClick={() => handleGenerateReport("ai")} className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20">
                <Sparkles className="w-4 h-4 mr-2" />
                Consultar IA
              </Button>
            </div>

          </motion.div>
        )}
      </motion.div>

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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <h4 className="text-emerald-400 font-semibold flex items-center gap-2">
                    {reportType === "ai" ? <Sparkles className="w-4 h-4" /> : <Zap className="w-4 h-4 text-teal-400" />} 
                    {reportType === "ai" ? "Veredicto de IA" : "Veredicto Financiero"}
                  </h4>
                  {reportResult.health_score !== undefined && (
                    <div className="flex items-center gap-2 bg-obsidian-light/50 px-3 py-1.5 rounded-lg border border-white/5">
                      <span className="text-xs text-slate-400 font-medium">Salud Financiera:</span>
                      <span className={`text-sm font-bold ${
                        reportResult.health_score >= 70 ? "text-emerald-400" :
                        reportResult.health_score >= 40 ? "text-amber-400" : "text-coral-accent"
                      }`}>
                        {reportResult.health_score}/100
                      </span>
                    </div>
                  )}
                </div>
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
