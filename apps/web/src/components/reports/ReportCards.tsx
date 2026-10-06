import { FileSpreadsheet, Zap, BrainCircuit, Download, Sparkles, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface ReportCardsProps {
  handleExportCSV: () => void;
  isExporting: boolean;
  handleGenerateReport: (type: "ai" | "deterministic") => void;
  isPro: boolean;
}

export function ReportCards({ handleExportCSV, isExporting, handleGenerateReport, isPro }: ReportCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        {isPro ? (
          <Button onClick={() => handleGenerateReport("ai")} className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-4 h-4 mr-2" />
            Consultar IA
          </Button>
        ) : (
          <Link href="/plans" className="inline-flex w-full sm:w-auto items-center justify-center rounded-full bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-300 transition-colors hover:bg-emerald-500/25">
            <LockKeyhole className="mr-2 h-4 w-4" />
            Disponible con Pro
          </Link>
        )}
      </div>
    </div>
  );
}
