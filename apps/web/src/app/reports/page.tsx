"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Filter } from "lucide-react";
import { motion } from "framer-motion";
import { containerVariants, itemVariants } from "@/lib/animations";

// Hooks
import { useReports } from "@/hooks/useReports";

// Components
import { ReportCards } from "@/components/reports/ReportCards";
import { ReportModal } from "@/components/reports/ReportModal";
import { MonthlyReportSummary } from "@/components/reports/MonthlyReportSummary";
import { useAuth } from "@/contexts/AuthContext";

export default function ReportsPage() {
  const { user } = useAuth();
  const {
    properties,
    selectedPropertyId, setSelectedPropertyId,
    period, setPeriod,
    isLoading,
    isExporting,
    exportCSV,
    generateReport,
    isReportModalOpen, setIsReportModalOpen,
    reportState, reportResult, reportError, reportType
  } = useReports();



  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Reportes y Análisis</h1>
            <p className="text-slate-400 mt-1">Exporta tus datos o solicita un análisis inteligente.</p>
          </div>
          {properties.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <input type="month" value={period} onChange={(event) => setPeriod(event.target.value)} aria-label="Período del reporte" className="rounded-lg border border-white/10 bg-obsidian-light/50 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/50" />
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
            </div>
          )}
        </motion.div>

        {!selectedPropertyId && !isLoading && (
          <motion.div variants={itemVariants} className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm">
            No tienes propiedades registradas.
          </motion.div>
        )}

        {selectedPropertyId && (
          <motion.div variants={itemVariants} className="space-y-6">
            <MonthlyReportSummary propertyId={selectedPropertyId} period={period} />
            <ReportCards 
              handleExportCSV={exportCSV}
              isExporting={isExporting}
              handleGenerateReport={generateReport}
              isPro={user?.tier === "pro"}
            />
          </motion.div>
        )}
      </motion.div>

      <ReportModal 
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        reportState={reportState}
        reportResult={reportResult}
        reportError={reportError}
        reportType={reportType}
      />
    </DashboardLayout>
  );
}
