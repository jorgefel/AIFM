"use client";

import { useState } from "react";
import { DashboardLayout as AppLayout } from "@/components/layout/DashboardLayout";
import { Filter, Download, Sparkles, Building2, ChevronDown } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { motion } from "framer-motion";

// Hooks
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAIReport } from "@/hooks/useAIReport";

// Components
import { AIReportModal } from "@/components/dashboard/AIReportModal";
import { WidgetIncome } from "@/components/dashboard/widgets/WidgetIncome";
import { WidgetNetProfit } from "@/components/dashboard/widgets/WidgetNetProfit";
import { WidgetExpenses } from "@/components/dashboard/widgets/WidgetExpenses";
import { WidgetOccupancy } from "@/components/dashboard/widgets/WidgetOccupancy";
import { WidgetPerformanceChart } from "@/components/dashboard/widgets/WidgetPerformanceChart";
import { WidgetRecentActivity } from "@/components/dashboard/widgets/WidgetRecentActivity";

export default function Home() {
  const toast = useToast();
  const [isPropertyDropdownOpen, setIsPropertyDropdownOpen] = useState(false);
  
  const {
    properties,
    selectedPropertyId,
    setSelectedPropertyId,
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
    <AppLayout>
      <div>
        {/* Header de la vista */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
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
              <div className="relative">
                <button 
                  onClick={() => setIsPropertyDropdownOpen(!isPropertyDropdownOpen)}
                  disabled={isLoading}
                  className="flex items-center justify-between w-48 bg-obsidian-light/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center truncate">
                    <Filter className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0" />
                    <span className="truncate">
                      {properties.find(p => p.id === selectedPropertyId)?.name || "Seleccionar..."}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 ml-2 transition-transform duration-200 flex-shrink-0 ${isPropertyDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isPropertyDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsPropertyDropdownOpen(false)}
                    />
                    <div className="absolute top-full left-0 mt-2 w-48 bg-obsidian-light border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden py-1">
                      {properties.map(p => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSelectedPropertyId(p.id);
                            setIsPropertyDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                            selectedPropertyId === p.id 
                              ? "bg-emerald-500/10 text-emerald-400 font-medium" 
                              : "text-slate-300 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <span className="truncate block">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            
            <button 
              onClick={handleExportCSV}
              disabled={!selectedPropertyId || isLoading}
              className="flex items-center px-4 py-2 text-sm font-medium text-slate-300 bg-obsidian-light/40 border border-white/10 rounded-lg hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Exportar CSV</span>
            </button>

            <button 
              onClick={() => generateReport(selectedPropertyId)}
              disabled={!selectedPropertyId || isLoading}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-500/20 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.15)] disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 mr-2 text-emerald-400" />
              <span className="hidden md:inline">Reporte IA</span>
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

        {/* Contenedor Principal: Grid Fijo */}
        <div className="flex flex-col gap-6 mt-6">
          {/* Fila 1: 4 Tarjetas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <WidgetIncome />
            <WidgetNetProfit />
            <WidgetExpenses />
            <WidgetOccupancy />
          </div>
          
          {/* Fila 2: Gráfico y Actividad */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[400px]">
            <div className="lg:col-span-2 h-[400px] lg:h-full">
              <WidgetPerformanceChart />
            </div>
            <div className="lg:col-span-1 h-[400px] lg:h-full overflow-hidden">
              <WidgetRecentActivity />
            </div>
          </div>
        </div>
      </div>

      {/* Modal del Reporte IA */}
      <AIReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        reportState={reportState} 
        reportResult={reportResult} 
        reportError={reportError} 
      />
    </AppLayout>
  );
}
