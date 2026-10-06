import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { fetcher } from "@/lib/fetcher";
import { PROPERTIES_QUERY_KEY } from "./useProperties";

export function useReports() {
  const { data: properties = [], isLoading } = useQuery<any[]>({
    queryKey: PROPERTIES_QUERY_KEY,
    queryFn: () => fetcher("/properties/"),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7));
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
      const [year, month] = period.split("-").map(Number);
      const lastDay = new Date(year, month, 0).getDate();
      const response = await api.get(`/export/csv?property_id=${selectedPropertyId}&start=${period}-01&end=${period}-${String(lastDay).padStart(2, "0")}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `nomora_${period}_${selectedPropertyId}.csv`);
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
      const [year, month] = period.split("-").map(Number);
      const payload = {
        property_id: selectedPropertyId,
        year,
        month,
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
        } catch {
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
    period, setPeriod,
    isLoading,
    isExporting,
    exportCSV,
    generateReport,
    isReportModalOpen, setIsReportModalOpen,
    reportState, reportResult, reportError, reportType
  };
}
