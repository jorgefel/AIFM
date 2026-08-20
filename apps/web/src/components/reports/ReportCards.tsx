import { FileSpreadsheet, Zap, BrainCircuit, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ReportCardsProps {
  handleExportCSV: () => void;
  isExporting: boolean;
  handleGenerateReport: (type: "ai" | "deterministic") => void;
}

export function ReportCards({ handleExportCSV, isExporting, handleGenerateReport }: ReportCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Tarjeta de Exportación CSV */}
      <div className="card-surface-interactive p-8 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
          <FileSpreadsheet className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-ink mb-2">Exportar Datos a CSV</h3>
        <p className="text-ink-muted text-sm mb-6 max-w-sm">
          Descarga un reporte consolidado con todas las reservas, ingresos y gastos de esta propiedad en formato CSV.
        </p>
        <Button onClick={handleExportCSV} isLoading={isExporting} className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20">
          <Download className="w-4 h-4 mr-2" />
          Descargar CSV
        </Button>
      </div>

      {/* Tarjeta de Análisis Rápido (Determinístico) */}
      <div className="card-surface-interactive p-8 flex flex-col items-center text-center relative overflow-hidden group">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-400/10 blur-[80px] pointer-events-none group-hover:bg-teal-400/20 transition-all" />
        <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-6">
          <Zap className="w-8 h-8 text-teal-600" />
        </div>
        <h3 className="text-xl font-bold text-ink mb-2">Análisis Rápido</h3>
        <p className="text-ink-muted text-sm mb-6 max-w-sm">
          Obtén un análisis instantáneo basado en métricas y reglas financieras, junto con un Score de Salud Financiera.
        </p>
        <Button onClick={() => handleGenerateReport("deterministic")} className="w-full sm:w-auto bg-teal-500 hover:bg-teal-600 text-white shadow-lg shadow-teal-500/20">
          <Zap className="w-4 h-4 mr-2" />
          Generar Análisis
        </Button>
      </div>

      {/* Tarjeta de Agente IA */}
      <div className="card-surface-interactive p-8 flex flex-col items-center text-center relative overflow-hidden group">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-500/10 blur-[80px] pointer-events-none group-hover:bg-violet-500/20 transition-all" />
        <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mb-6">
          <BrainCircuit className="w-8 h-8 text-violet-600" />
        </div>
        <h3 className="text-xl font-bold text-ink mb-2">Agente IA (Avanzado)</h3>
        <p className="text-ink-muted text-sm mb-6 max-w-sm">
          Deja que nuestro agente financiero de IA revise tus métricas del mes de manera profunda y personalizada.
        </p>
        <Button onClick={() => handleGenerateReport("ai")} className="w-full sm:w-auto bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-400 hover:to-violet-500 text-white shadow-lg shadow-violet-500/20">
          <Sparkles className="w-4 h-4 mr-2" />
          Consultar IA
        </Button>
      </div>
    </div>
  );
}
