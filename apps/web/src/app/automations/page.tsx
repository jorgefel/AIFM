"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle,
  Clock,
  DollarSign,
  Info,
  RefreshCw,
  ShieldCheck,
  TrendingDown,
  XCircle,
  Zap,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";

interface AutomationPayload {
  title?: string;
  description?: string;
  suggested_action?: string;
  guest_name?: string;
  check_in?: string;
  property_name?: string;
  occupancy_pct?: number;
  [key: string]: any;
}

interface AutomationAction {
  id: string;
  property_id: string | null;
  action_type: string;
  payload: AutomationPayload;
  status: string;
  error_message: string | null;
  executed_at: string | null;
  created_at: string;
}

export default function AutomationsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();

  // Load automations
  const { data: automations = [], isLoading, isRefetching } = useQuery<AutomationAction[]>({
    queryKey: ["automations"],
    queryFn: async () => {
      const res = await api.get<AutomationAction[]>("/automations/");
      return res.data;
    },
  });

  // Scan operational rules
  const scanMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<AutomationAction[]>("/automations/scan");
      return res.data;
    },
    onSuccess: (data) => {
      toast.success("Reglas evaluadas", `Se actualizaron las acciones sugeridas (${data.length} registradas).`);
      queryClient.setQueryData(["automations"], data);
    },
    onError: () => toast.error("Error", "No se pudo escanear las reglas operativas."),
  });

  // Approve action mutation
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.put<AutomationAction>(`/automations/${id}/approve`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Acción confirmada", "La automatización se ha marcado como ejecutada y registrada en auditoría.");
      queryClient.invalidateQueries({ queryKey: ["automations"] });
    },
    onError: () => toast.error("Error", "No se pudo procesar la acción."),
  });

  // Cancel action mutation
  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/automations/${id}`);
    },
    onSuccess: () => {
      toast.success("Acción descartada", "La sugerencia fue cancelada.");
      queryClient.invalidateQueries({ queryKey: ["automations"] });
    },
    onError: () => toast.error("Error", "No se pudo descartar la acción."),
  });

  const pendingActions = automations.filter(
    (a) => a.status === "draft" || a.status === "pending_approval"
  );
  const pastActions = automations.filter(
    (a) => a.status === "executed" || a.status === "failed" || a.status === "cancelled"
  );

  const getActionBadge = (type: string) => {
    switch (type) {
      case "checkin_reminder":
        return {
          icon: CalendarCheck,
          label: "Recordatorio de Llegada",
          bg: "bg-violet-100 text-violet-800",
        };
      case "low_occupancy_alert":
        return {
          icon: TrendingDown,
          label: "Baja Ocupación",
          bg: "bg-amber-100 text-amber-800",
        };
      case "recurring_expense_reminder":
        return {
          icon: DollarSign,
          label: "Gastos Pendientes",
          bg: "bg-blue-100 text-blue-800",
        };
      default:
        return {
          icon: Zap,
          label: type.replace(/_/g, " "),
          bg: "bg-surface text-ink",
        };
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink flex items-center gap-2.5">
              <Zap className="h-6 w-6 text-amber-500" />
              Centro de Automatizaciones
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              Reglas operativas deterministas: recordatorios de llegadas, alertas de ocupación y control de gastos recurrentes.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => scanMutation.mutate()}
            isLoading={scanMutation.isPending || isRefetching}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Escanear Reglas
          </Button>
        </div>

        {/* Security / Confirmation Notice */}
        <div className="flex items-start gap-3 rounded-2xl border border-violet-200 bg-violet-50/60 p-4 text-sm text-violet-900">
          <ShieldCheck className="h-5 w-5 text-violet-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Control y Confirmación Explícita</p>
            <p className="mt-0.5 text-xs text-violet-700 leading-relaxed">
              Nomora nunca realiza cobros, modifica disponibilidad ni contacta a huéspedes de forma silenciosa. Cada automatización se presenta para tu revisión y solo se ejecuta cuando la confirmas.
            </p>
          </div>
        </div>

        {/* Pending Actions */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Acciones Sugeridas Pendientes ({pendingActions.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : pendingActions.length === 0 ? (
            <div className="card-surface p-8 text-center rounded-2xl">
              <div className="mx-auto rounded-full bg-emerald-50 p-3 text-emerald-600 w-fit mb-3">
                <CheckCircle className="h-6 w-6" />
              </div>
              <p className="font-semibold text-ink">Todo al día</p>
              <p className="mt-1 text-xs text-ink-muted max-w-md mx-auto">
                No hay llegadas inmediatas sin atender, la ocupación está bajo control y los gastos del mes están al día.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pendingActions.map((action) => {
                const badge = getActionBadge(action.action_type);
                const Icon = badge.icon;
                const title = action.payload.title || badge.label;
                const desc = action.payload.description || "";
                const suggested = action.payload.suggested_action || "";

                return (
                  <div
                    key={action.id}
                    className="card-surface p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-line hover:border-violet-300 transition-all"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="rounded-xl bg-violet-100 p-2.5 text-violet-700 shrink-0 mt-0.5">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${badge.bg}`}>
                            {badge.label}
                          </span>
                          <span className="text-xs text-ink-muted">
                            {new Date(action.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="font-semibold text-ink text-sm sm:text-base">{title}</h3>
                        {desc && <p className="text-xs text-ink-muted leading-relaxed">{desc}</p>}
                        {suggested && (
                          <p className="mt-1 text-xs font-medium text-violet-700 bg-violet-50 rounded-lg px-2.5 py-1 w-fit">
                            💡 Acción sugerida: {suggested}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 sm:pt-0 shrink-0">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => cancelMutation.mutate(action.id)}
                        disabled={cancelMutation.isPending || approveMutation.isPending}
                      >
                        Descartar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => approveMutation.mutate(action.id)}
                        disabled={cancelMutation.isPending || approveMutation.isPending}
                      >
                        Confirmar y Completar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* History / Audit Log */}
        <section className="space-y-4 pt-6 border-t border-line-soft">
          <h2 className="text-lg font-bold text-ink">Historial de Auditoría de Automatizaciones</h2>

          <div className="card-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-line bg-surface/50 font-semibold text-ink-muted">
                  <tr>
                    <th className="px-4 py-3">Tipo de Regla</th>
                    <th className="px-4 py-3">Detalle</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Fecha de Ejecución</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {pastActions.map((action) => {
                    const badge = getActionBadge(action.action_type);
                    return (
                      <tr key={action.id} className="hover:bg-surface/50">
                        <td className="px-4 py-3 font-medium text-ink flex items-center gap-2">
                          <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-ink-muted max-w-xs truncate">
                          {action.payload.title || action.payload.description || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              action.status === "executed"
                                ? "bg-emerald-100 text-emerald-800"
                                : action.status === "cancelled"
                                ? "bg-surface text-ink-muted line-through"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {action.status === "executed" && <CheckCircle className="h-3 w-3" />}
                            {action.status === "cancelled" && <XCircle className="h-3 w-3" />}
                            {action.status === "executed"
                              ? "Ejecutada"
                              : action.status === "cancelled"
                              ? "Descartada"
                              : "Fallida"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-ink-muted font-mono">
                          {action.executed_at
                            ? new Date(action.executed_at).toLocaleString()
                            : new Date(action.created_at).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                  {pastActions.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-ink-muted">
                        No hay registros en el historial de automatizaciones.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
