"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { Zap, CheckCircle, XCircle, Clock, AlertTriangle, ShieldCheck } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

interface AutomationAction {
  id: string;
  property_id: string | null;
  action_type: string;
  payload: any;
  status: string;
  error_message: string | null;
  executed_at: string | null;
  created_at: string;
}

export default function AutomationsPage() {
  const { isPro } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: automations = [], isLoading } = useQuery<AutomationAction[]>({
    queryKey: ["automations"],
    queryFn: async () => {
      const res = await api.get("/automations/");
      return res.data;
    },
    enabled: isPro,
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.put(`/automations/${id}/approve`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Acción ejecutada", "La automatización se ha completado.");
      queryClient.invalidateQueries({ queryKey: ["automations"] });
    },
    onError: () => toast.error("Error", "No se pudo ejecutar la acción.")
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/automations/${id}`);
    },
    onSuccess: () => {
      toast.success("Acción cancelada");
      queryClient.invalidateQueries({ queryKey: ["automations"] });
    },
    onError: () => toast.error("Error", "No se pudo cancelar la acción.")
  });

  if (!isPro) {
    return (
      <DashboardLayout>
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-center">
          <ShieldCheck className="h-12 w-12 text-emerald-400 mb-4" />
          <h2 className="text-xl font-bold text-white">Centro de Automatizaciones Pro</h2>
          <p className="mt-2 text-slate-400">Actualiza a Pro para habilitar las automatizaciones de precios y mensajes.</p>
        </div>
      </DashboardLayout>
    );
  }

  const pendingActions = automations.filter(a => a.status === "draft" || a.status === "pending_approval");
  const pastActions = automations.filter(a => a.status === "executed" || a.status === "failed" || a.status === "cancelled");

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Zap className="h-8 w-8 text-amber-400" />
            Centro de Automatizaciones
          </h1>
          <p className="mt-2 text-slate-400">
            Revisa y confirma las acciones sugeridas por el copiloto IA antes de que se ejecuten.
          </p>
        </div>

        {/* Pendientes de Aprobación */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-400" />
            Acciones Pendientes de Aprobación
          </h2>
          
          {isLoading ? (
            <div className="text-slate-500">Cargando acciones...</div>
          ) : pendingActions.length === 0 ? (
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-8 text-center">
              <p className="text-slate-400">No hay acciones pendientes en este momento.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pendingActions.map(action => (
                <div key={action.id} className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white capitalize">{action.action_type.replace(/_/g, " ")}</h3>
                      <div className="mt-1 text-sm text-slate-300">
                        {JSON.stringify(action.payload)}
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        Creado: {new Date(action.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <Button 
                      variant="secondary" 
                      onClick={() => cancelMutation.mutate(action.id)}
                      disabled={cancelMutation.isPending || approveMutation.isPending}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={() => approveMutation.mutate(action.id)}
                      disabled={cancelMutation.isPending || approveMutation.isPending}
                      className="bg-emerald-500 hover:bg-emerald-400 text-obsidian"
                    >
                      Aprobar y Ejecutar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Historial */}
        <section className="space-y-4 pt-8 border-t border-white/10">
          <h2 className="text-xl font-bold text-white">Historial de Acciones</h2>
          
          <div className="glass-panel overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/5 text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Acción</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {pastActions.map(action => (
                  <tr key={action.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-slate-200 capitalize">
                      {action.action_type.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        action.status === "executed" ? "bg-emerald-500/10 text-emerald-400" :
                        action.status === "failed" ? "bg-red-500/10 text-red-400" :
                        "bg-slate-500/10 text-slate-400"
                      }`}>
                        {action.status === "executed" && <CheckCircle className="h-3.5 w-3.5" />}
                        {action.status === "failed" && <XCircle className="h-3.5 w-3.5" />}
                        {action.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {action.executed_at ? new Date(action.executed_at).toLocaleString() : new Date(action.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {pastActions.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                      Aún no hay historial de automatizaciones.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
