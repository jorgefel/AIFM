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

export default function ReportsPage() {
  const {
    properties,
    selectedPropertyId, setSelectedPropertyId,
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
            <h1 className="text-3xl font-bold text-ink tracking-tight">Reportes y Análisis</h1>
            <p className="text-ink-muted mt-1">Exporta tus datos o solicita un análisis inteligente.</p>
          </div>
          {properties.length > 0 && (
            <div className="flex items-center bg-card border border-line rounded-lg px-3 py-1 shadow-sm">
              <Filter className="w-4 h-4 text-ink-muted mr-2" />
              <select 
                className="bg-transparent text-ink text-sm focus:outline-none border-none py-1"
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
              >
                {properties.map(p => (
                  <option key={p.id} value={p.id} className="bg-card text-ink">{p.name}</option>
                ))}
              </select>
            </div>
          )}
        </motion.div>

        {!selectedPropertyId && !isLoading && (
          <motion.div variants={itemVariants} className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
            No tienes propiedades registradas.
          </motion.div>
        )}

        {selectedPropertyId && (
          <motion.div variants={itemVariants}>
            <ReportCards 
              handleExportCSV={exportCSV}
              isExporting={isExporting}
              handleGenerateReport={generateReport}
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
