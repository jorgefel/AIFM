import { Modal } from "@/components/ui/Modal";
import { Loader2, Sparkles } from "lucide-react";

interface AIReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportState: "idle" | "loading" | "completed" | "error";
  reportResult: any;
  reportError: string | null;
}

export function AIReportModal({ isOpen, onClose, reportState, reportResult, reportError }: AIReportModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Análisis de IA Financiero">
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
  );
}
