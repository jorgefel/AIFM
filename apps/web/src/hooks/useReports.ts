import { useState, useEffect } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { fetcher } from "@/lib/fetcher";
import { PROPERTIES_SWR_KEY } from "./useProperties";

export function useReports() {
  const { data: properties = [], isLoading } = useSWR<any[]>(
    PROPERTIES_SWR_KEY,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 10000 }
  );

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportState, setReportState] = useState<"idle" | "loading" | "completed" | "error">("idle");
  const [reportResult, setReportResult] = useState<any>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportType, setReportType] = useState<"ai" | "deterministic">("ai");

  // Auto-select first property
  useEffect(() => {
    if (properties.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [properties, selectedPropertyId]);

  const exportCSV = async () => {
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

  const generateReport = async (type: "ai" | "deterministic") => {
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
        const { data } = await api.post("/analysis/deterministic-insights", payload);
        setTimeout(() => {
          setReportResult(data);
          setReportState("completed");
        }, 1200);
        return;
      }

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

  return {
    properties,
    selectedPropertyId, setSelectedPropertyId,
    isLoading,
    isExporting,
    exportCSV,
    generateReport,
    isReportModalOpen, setIsReportModalOpen,
    reportState, reportResult, reportError, reportType
  };
}
