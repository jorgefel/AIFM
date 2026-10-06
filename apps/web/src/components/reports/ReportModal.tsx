import { Modal } from "@/components/ui/Modal";
import { Loader2, Sparkles, Zap } from "lucide-react";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportState: "idle" | "loading" | "completed" | "error";
  reportResult: any;
  reportError: string | null;
  reportType: "ai" | "deterministic";
}

export function ReportModal({ isOpen, onClose, reportState, reportResult, reportError, reportType }: ReportModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={reportType === "ai" ? "Análisis financiero con IA" : "Análisis financiero verificable"}>
      <div className="p-2 space-y-6">
        {reportState === "loading" && (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
            <p className="text-ink font-medium">El agente de IA está analizando tus finanzas...</p>
            <p className="text-ink-muted text-sm text-center max-w-xs">Buscando discrepancias y calculando métricas avanzadas. Esto puede tardar unos segundos.</p>
          </div>
        )}

        {reportState === "error" && (
          <div className="p-4 rounded-xl bg-coral-accent/10 border border-coral-accent/20">
            <h4 className="text-coral-accent font-semibold mb-2">Error en el análisis</h4>
            <p className="text-sm text-ink/80">{reportError}</p>
          </div>
        )}

        {reportState === "completed" && reportResult && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-violet-50 border border-violet-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h4 className="text-violet-600 font-semibold flex items-center gap-2">
                  {reportType === "ai" ? <Sparkles className="w-4 h-4" /> : <Zap className="w-4 h-4 text-teal-400" />} 
                  {reportType === "ai" ? "Veredicto de IA" : "Veredicto Financiero"}
                </h4>
                {reportResult.health_score !== undefined && (
                  <div className="flex items-center gap-2 bg-card px-3 py-1.5 rounded-lg border border-line-soft shadow-sm">
                    <span className="text-xs text-ink-muted font-medium">Salud Financiera:</span>
                    <span className={`text-sm font-bold ${
                      reportResult.health_score >= 70 ? "text-teal-600" :
                      reportResult.health_score >= 40 ? "text-amber-600" : "text-coral-accent"
                    }`}>
                      {reportResult.health_score}/100
                    </span>
                  </div>
                )}
              </div>
              <p className="text-sm text-ink/80 leading-relaxed">
                {reportResult.summary || "Análisis completado satisfactoriamente."}
              </p>
            </div>
            
            {reportResult.alerts && reportResult.alerts.length > 0 && (
              <div>
                <h4 className="text-ink font-semibold mb-3">Alertas y Discrepancias</h4>
                <div className="space-y-3">
                  {reportResult.alerts.map((alert: any, idx: number) => (
                    <div key={idx} className={`p-3 rounded-lg border text-sm ${
                      alert.severity === "high" 
                        ? "bg-coral-accent/10 border-coral-accent/30 text-coral-accent" 
                        : "bg-amber-50 border-amber-200 text-amber-700"
                    }`}>
                      <span className="font-bold capitalize">{alert.severity}:</span> {alert.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reportResult.recommendations && reportResult.recommendations.length > 0 && (
              <div>
                <h4 className="text-ink font-semibold mb-3">Recomendaciones</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-ink/80">
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
  );
}
