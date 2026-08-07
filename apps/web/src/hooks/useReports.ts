import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export function useReports() {
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportState, setReportState] = useState<"idle" | "loading" | "completed" | "error">("idle");
  const [reportResult, setReportResult] = useState<any>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportType, setReportType] = useState<"ai" | "deterministic">("ai");

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const { data } = await api.get("/properties/");
        setProperties(data);
        if (data.length > 0) {
          setSelectedPropertyId(data[0].id);
        }
      } catch (error) {
        console.error("Error fetching properties:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProperties();
  }, []);

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
