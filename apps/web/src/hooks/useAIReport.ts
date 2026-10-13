import { useState } from "react";
import { api } from "@/lib/api";

export function useAIReport() {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportState, setReportState] = useState<"idle" | "loading" | "completed" | "error">("idle");
  const [reportResult, setReportResult] = useState<any>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  const generateReport = async (selectedPropertyId: string, year?: number, month?: number) => {
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
        year: year ?? date.getFullYear(),
        month: month ?? (date.getMonth() + 1)
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
        } catch {
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

  return {
    isReportModalOpen,
    setIsReportModalOpen,
    reportState,
    reportResult,
    reportError,
    generateReport
  };
}
