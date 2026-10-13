"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ExternalLink,
  Layers,
  Plus,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { fetcher } from "@/lib/fetcher";
import { useToast } from "@/contexts/ToastContext";
import type { Property } from "@/types/models";

type Link = { id: string; property_id: string; beds24_property_id: string };
type Connection = {
  id: string;
  channel_account_id: string;
  last_bookings_sync_at: string | null;
  last_inventory_sync_at: string | null;
  property_links: Link[];
};
type SyncLog = {
  id: string;
  sync_type: string;
  status: string;
  records_processed: number;
  completed_at: string | null;
};

export function Beds24SyncPanel({ isPro }: { isPro: boolean }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);

  // Wizard state
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [setupData, setSetupData] = useState<{
    beds24_property_id: string;
    dashboard_url: string;
    property_id: string;
    connection_id: string;
  } | null>(null);

  const { data: connections = [], isLoading } = useQuery<Connection[]>({
    queryKey: ["beds24-connections"],
    queryFn: () => fetcher("/integrations/beds24/connections"),
    enabled: isPro,
    retry: false,
  });

  const { data: properties = [], isLoading: isLoadingProperties } = useQuery<Property[]>({
    queryKey: ["properties"],
    queryFn: () => fetcher("/properties/"),
    enabled: isPro,
  });

  const allLinkedPropertyIds = new Set(
    connections.flatMap((c) => c.property_links.map((l) => l.property_id))
  );

  const availableProperties = properties.filter((p) => !allLinkedPropertyIds.has(p.id));

  // Auto-select first available property when available
  useEffect(() => {
    if (!selectedPropertyId && availableProperties.length > 0) {
      setSelectedPropertyId(availableProperties[0].id);
    }
  }, [availableProperties, selectedPropertyId]);

  // Trigger setup (auto-create property in Beds24 master account)
  const handleStartSetup = async () => {
    if (!selectedPropertyId) return;
    setIsSettingUp(true);
    try {
      const res = await api.post("/integrations/beds24/setup-channel", {
        property_id: selectedPropertyId,
      });
      setSetupData(res.data);
      setWizardStep(3);
      await queryClient.invalidateQueries({ queryKey: ["beds24-connections"] });
      toast.success("Canal creado en Beds24", "Ahora conecta tu cuenta de Airbnb.");
    } catch (error: any) {
      toast.error(
        "No se pudo crear el canal",
        error?.response?.data?.detail || "Revisa la configuración del servidor."
      );
    } finally {
      setIsSettingUp(false);
    }
  };

  // Verify Airbnb connection
  const handleVerify = async () => {
    if (!selectedPropertyId) return;
    setIsVerifying(true);
    try {
      const res = await api.get(`/integrations/beds24/channel-status/${selectedPropertyId}`);
      if (res.data.airbnb_connected) {
        setWizardStep(4);
        toast.success("¡Canal conectado!", "Tu cuenta de Airbnb está sincronizada.");
      } else {
        toast.info(
          "Aún no detectamos la conexión",
          "Asegúrate de haber completado la autorización en Beds24 o haz clic en 'Ya autoricé'."
        );
      }
    } catch (error: any) {
      toast.error("Error al verificar", error?.response?.data?.detail || "Intenta de nuevo.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Confirm connection manually
  const handleConfirmManual = async () => {
    if (!selectedPropertyId) return;
    setIsVerifying(true);
    try {
      await api.post(`/integrations/beds24/confirm-channel/${selectedPropertyId}`);
      setWizardStep(4);
      toast.success("¡Conexión guardada!", "Iniciando sincronización inicial.");
      // Trigger booking sync automatically
      const conn = connections[0];
      if (conn) {
        sync(conn.id);
      }
    } catch (error: any) {
      toast.error("Error", error?.response?.data?.detail || "No pudimos confirmar la conexión.");
    } finally {
      setIsVerifying(false);
    }
  };

  const sync = async (connectionId: string) => {
    setSyncing(connectionId);
    try {
      const result = await api.post(`/integrations/beds24/connections/${connectionId}/sync-bookings`);
      await queryClient.invalidateQueries({ queryKey: ["beds24-connections"] });
      await queryClient.invalidateQueries({ queryKey: ["reservations"] });
      toast.success(
        "Sincronización terminada",
        `${result.data.records_processed} reservas revisadas; ${result.data.created} nuevas.`
      );
    } catch (error: any) {
      toast.error(
        "La sincronización falló",
        error?.response?.data?.detail || "Intenta de nuevo en unos minutos."
      );
    } finally {
      setSyncing(null);
    }
  };

  const syncInventory = async (connectionId: string) => {
    setSyncing(`inventory-${connectionId}`);
    try {
      const result = await api.post(`/integrations/beds24/connections/${connectionId}/sync-inventory`);
      await queryClient.invalidateQueries({ queryKey: ["beds24-connections"] });
      await queryClient.invalidateQueries({ queryKey: ["calendar-snapshot"] });
      toast.success(
        "Inventario actualizado",
        `${result.data.records_processed} días quedaron disponibles en el calendario local.`
      );
    } catch (error: any) {
      toast.error(
        "No pudimos actualizar el inventario",
        error?.response?.data?.detail || "Intenta de nuevo más tarde."
      );
    } finally {
      setSyncing(null);
    }
  };

  if (!isPro) return null;

  const hasConnections = connections.length > 0 && connections.some((c) => c.property_links.length > 0);

  return (
    <section className="mt-8 rounded-2xl border border-white/10 bg-obsidian/80 p-6 backdrop-blur-xl">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Layers className="h-5 w-5 text-teal-400" />
            Sincronización con Canales (Beds24)
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Nomora gestiona la infraestructura de canales automáticamente. Sin costos extra de Beds24 para ti.
          </p>
        </div>
        {hasConnections && !showWizard && (
          <Button
            size="sm"
            onClick={() => {
              setSelectedPropertyId(availableProperties[0]?.id || "");
              setWizardStep(1);
              setShowWizard(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Conectar otra propiedad
          </Button>
        )}
      </div>

      {/* WIZARD FLOW */}
      {(!hasConnections || showWizard) && !isLoading && (
        <div className="mt-6 rounded-xl border border-teal-500/20 bg-teal-500/5 p-6">
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs font-semibold tracking-wider text-teal-400 uppercase">
              Asistente de conexión · Paso {wizardStep} de 4
            </span>
            {hasConnections && (
              <button
                onClick={() => setShowWizard(false)}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>

          {/* Step 1: Select Property */}
          {wizardStep === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-medium text-white">1. Selecciona la propiedad de Nomora</h3>
                <p className="text-sm text-slate-300 mt-1">
                  Crearemos automáticamente el canal correspondiente en nuestra infraestructura de Beds24.
                </p>
              </div>

              {isLoadingProperties ? (
                <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-teal-400" />
                  Cargando propiedades...
                </div>
              ) : properties.length === 0 ? (
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm">
                  Aún no tienes propiedades registradas en Nomora. Primero crea una propiedad en tu panel.
                </div>
              ) : availableProperties.length === 0 ? (
                <div className="p-4 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-200 text-sm">
                  Todas tus propiedades ya están conectadas a Beds24.
                </div>
              ) : (
                <div className="max-w-md space-y-3">
                  <select
                    value={selectedPropertyId}
                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-obsidian px-3.5 py-2.5 text-sm text-white outline-none focus:border-teal-400/60"
                  >
                    <option value="" className="bg-slate-900 text-white">
                      -- Elige una propiedad --
                    </option>
                    {properties.map((p) => {
                      const isLinked = allLinkedPropertyIds.has(p.id);
                      return (
                        <option
                          key={p.id}
                          value={p.id}
                          disabled={isLinked}
                          className="bg-slate-900 text-white disabled:text-slate-500"
                        >
                          {p.name} {isLinked ? "(Ya vinculada)" : ""}
                        </option>
                      );
                    })}
                  </select>

                  <Button
                    onClick={handleStartSetup}
                    disabled={!selectedPropertyId}
                    isLoading={isSettingUp}
                    className="w-full sm:w-auto"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Crear canal en Beds24
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Auto-creation (in-between feedback) */}
          {wizardStep === 2 && (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 text-teal-400 animate-spin mx-auto mb-3" />
              <p className="text-white font-medium">Creando propiedad en Beds24...</p>
              <p className="text-xs text-slate-400 mt-1">Configurando identificadores únicos.</p>
            </div>
          )}

          {/* Step 3: Authorize OTA in Beds24 */}
          {wizardStep === 3 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-medium text-white flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  2. Conecta tu cuenta de Airbnb
                </h3>
                <p className="text-sm text-slate-300 mt-1">
                  Tu propiedad ya está registrada en Beds24 con el ID{" "}
                  <strong className="text-teal-300">{setupData?.beds24_property_id}</strong>. Ahora solo debes
                  autorizar el acceso a Airbnb una única vez.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3 text-sm text-slate-200">
                <p className="font-semibold text-white">Instrucciones:</p>
                <ol className="list-decimal list-inside space-y-2 text-slate-300 ml-1">
                  <li>Haz clic en el botón <strong>Abrir panel de Beds24</strong> abajo.</li>
                  <li>En la pestaña de Beds24, busca y haz clic en <strong>Airbnb</strong>.</li>
                  <li>Presiona <strong>Authorize Account</strong> e inicia sesión con tu usuario de Airbnb.</li>
                  <li>Una vez autorizada la cuenta, regresa a esta pestaña y haz clic en <strong>Ya autoricé en Beds24</strong>.</li>
                </ol>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href={setupData?.dashboard_url || "https://beds24.com/control3.php?pagetype=channelmgr"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-teal-400 transition-colors"
                >
                  Abrir panel de Beds24
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>

                <Button variant="secondary" onClick={handleVerify} isLoading={isVerifying}>
                  Comprobar conexión
                </Button>

                <Button onClick={handleConfirmManual} isLoading={isVerifying}>
                  Ya autoricé en Beds24
                  <CheckCircle2 className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {wizardStep === 4 && (
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-white">¡Canal configurado con éxito!</h3>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                Tu propiedad ya está conectada con Airbnb a través de Beds24. Las reservas e inventario se sincronizan
                automáticamente.
              </p>
              <div className="pt-2">
                <Button
                  onClick={() => {
                    setShowWizard(false);
                    queryClient.invalidateQueries({ queryKey: ["beds24-connections"] });
                  }}
                >
                  Ver mis canales conectados
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* LIST OF CONNECTED PROPERTIES */}
      {hasConnections && !showWizard && (
        <div className="mt-5 space-y-4">
          {connections.map((connection) => (
            <div key={connection.id} className="space-y-3">
              {connection.property_links.map((link) => {
                const prop = properties.find((p) => p.id === link.property_id);
                return (
                  <div
                    key={link.id}
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-5 transition-all hover:border-white/20"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-teal-400" />
                          <h4 className="font-semibold text-white text-base">
                            {prop?.name || "Propiedad vinculada"}
                          </h4>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />
                            Conectado
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                          ID Beds24: <span className="font-mono text-slate-300">{link.beds24_property_id}</span> · Cuenta maestra Nomora
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Última sinc. reservas:{" "}
                          <span className="text-slate-300">
                            {connection.last_bookings_sync_at
                              ? new Intl.DateTimeFormat("es-CO", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                }).format(new Date(connection.last_bookings_sync_at))
                              : "Pendiente"}
                          </span>{" "}
                          · Inventario:{" "}
                          <span className="text-slate-300">
                            {connection.last_inventory_sync_at
                              ? new Intl.DateTimeFormat("es-CO", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                }).format(new Date(connection.last_inventory_sync_at))
                              : "Pendiente"}
                          </span>
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => sync(connection.id)}
                          isLoading={syncing === connection.id}
                        >
                          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                          Sincronizar reservas
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => syncInventory(connection.id)}
                          isLoading={syncing === `inventory-${connection.id}`}
                        >
                          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                          Sincronizar calendario
                        </Button>
                        <a
                          href={`https://beds24.com/control3.php?pagetype=channelmgr&propId=${link.beds24_property_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          Beds24
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </div>
                    </div>

                    <SyncHistory connectionId={connection.id} />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

    </section>
  );
}

function SyncHistory({ connectionId }: { connectionId: string }) {
  const { data: logs = [] } = useQuery<SyncLog[]>({
    queryKey: ["beds24-sync-history", connectionId],
    queryFn: () => fetcher(`/integrations/beds24/connections/${connectionId}/sync-history`),
  });

  if (!logs.length) return null;

  return (
    <div className="mt-4 border-t border-white/5 pt-3 text-xs text-slate-400">
      <p className="font-medium text-slate-300 mb-1">Historial reciente:</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {logs.slice(0, 3).map((log) => (
          <span key={log.id} className="inline-flex items-center gap-1">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                log.status === "success" ? "bg-emerald-400" : "bg-coral-accent"
              }`}
            />
            {log.sync_type === "inventory" ? "Inventario" : "Reservas"}:{" "}
            {log.status === "success" ? `${log.records_processed} registros` : "error"}
            {log.completed_at
              ? ` (${new Date(log.completed_at).toLocaleTimeString("es-CO", {
                  hour: "2-digit",
                  minute: "2-digit",
                })})`
              : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
