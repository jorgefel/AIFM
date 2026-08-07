"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Filter, Download, Sparkles, Building2 } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { motion } from "framer-motion";
import { containerVariants, itemVariants } from "@/lib/animations";

// Hooks
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAIReport } from "@/hooks/useAIReport";

// Components
import { DashboardMetrics } from "@/components/dashboard/DashboardMetrics";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { ActivityList } from "@/components/dashboard/ActivityList";
import { AIReportModal } from "@/components/dashboard/AIReportModal";

export default function Home() {
  const toast = useToast();
  const {
    properties,
    selectedPropertyId,
    setSelectedPropertyId,
    summary,
    chartData,
    recentActivity,
    isLoading
  } = useDashboardData();

  const {
    isReportModalOpen,
    setIsReportModalOpen,
    reportState,
    reportResult,
    reportError,
    generateReport
  } = useAIReport();

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
      toast.error("Error de exportación", "No se pudieron exportar los datos.");
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
            onClick={() => generateReport(selectedPropertyId)}
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
          <h3 className="text-xl font-bold text-white mb-2">Bienvenido a AIFM</h3>
          <p className="text-slate-400 max-w-md">
            Aún no tienes propiedades registradas. Para comenzar a ver tu resumen financiero y estadísticas, primero añade tu primera propiedad.
          </p>
          <button onClick={() => window.location.href='/properties'} className="mt-6 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors shadow-lg shadow-emerald-500/20">
            Añadir Propiedad
          </button>
        </motion.div>
      )}

      {/* Tarjetas de Métricas Principales */}
      <DashboardMetrics 
        isLoading={isLoading} 
        summary={summary} 
        containerVariants={containerVariants} 
        itemVariants={itemVariants} 
      />

      {/* Área Principal de Gráficas y Listas */}
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="show" 
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2"
      >
        {/* Gráfica de Rendimiento Anual */}
        <DashboardCharts 
          isLoading={isLoading} 
          chartData={chartData} 
          itemVariants={itemVariants} 
        />

        {/* Transacciones Recientes */}
        <ActivityList 
          isLoading={isLoading} 
          recentActivity={recentActivity} 
          itemVariants={itemVariants} 
        />
      </motion.div>

      {/* Modal del Reporte IA */}
      <AIReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        reportState={reportState} 
        reportResult={reportResult} 
        reportError={reportError} 
      />

    </DashboardLayout>
  );
}
