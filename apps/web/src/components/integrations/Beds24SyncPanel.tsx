"use client";

import { FormEvent, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Link2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { fetcher } from "@/lib/fetcher";
import { useToast } from "@/contexts/ToastContext";
import type { Property } from "@/types/models";

type Link = { id: string; property_id: string; beds24_property_id: string };
type Connection = { id: string; channel_account_id: string; last_bookings_sync_at: string | null; property_links: Link[] };

export function Beds24SyncPanel({ isPro }: { isPro: boolean }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [accountId, setAccountId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const { data: connections = [], isLoading } = useQuery<Connection[]>({ queryKey: ["beds24-connections"], queryFn: () => fetcher("/integrations/beds24/connections"), enabled: isPro, retry: false });
  const { data: properties = [] } = useQuery<Property[]>({ queryKey: ["properties"], queryFn: () => fetcher("/properties/"), enabled: isPro });

  const createConnection = async (event: FormEvent) => {
    event.preventDefault();
    if (!accountId.trim()) return;
    setIsCreating(true);
    try {
      await api.post("/integrations/beds24/connections", { channel_account_id: accountId.trim() });
      setAccountId("");
      await queryClient.invalidateQueries({ queryKey: ["beds24-connections"] });
      toast.success("Conexión creada", "Ahora vincula una propiedad para realizar la primera importación.");
    } catch (error: any) {
      toast.error("No pudimos crear la conexión", error?.response?.data?.detail || "Revisa el identificador de cuenta.");
    } finally { setIsCreating(false); }
  };

  const sync = async (connectionId: string) => {
    setSyncing(connectionId);
    try {
      const result = await api.post(`/integrations/beds24/connections/${connectionId}/sync-bookings`);
      await queryClient.invalidateQueries({ queryKey: ["beds24-connections"] });
      await queryClient.invalidateQueries({ queryKey: ["reservations"] });
      toast.success("Sincronización terminada", `${result.data.records_processed} reservas revisadas; ${result.data.created} nuevas.`);
    } catch (error: any) {
      toast.error("La sincronización falló", error?.response?.data?.detail || "Intenta de nuevo en unos minutos.");
    } finally { setSyncing(null); }
  };

  if (!isPro) return null;
  return <section className="mt-8 rounded-2xl border border-white/10 bg-obsidian/80 p-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold text-white">Sincronización de reservas</h2><p className="mt-1 text-sm text-slate-400">La importación es de solo lectura: Nomora nunca modifica Beds24 ni tus OTAs.</p></div><span className="rounded-full bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-300">Beds24</span></div>
    {connections.length === 0 && !isLoading ? <form onSubmit={createConnection} className="mt-5 flex flex-col gap-3 sm:flex-row"><input value={accountId} onChange={(event) => setAccountId(event.target.value)} placeholder="Identificador de cuenta Beds24" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/60" /><Button type="submit" isLoading={isCreating}><Link2 className="mr-2 h-4 w-4" />Añadir conexión</Button></form> : <div className="mt-5 space-y-3">{connections.map((connection) => <ConnectionCard key={connection.id} connection={connection} properties={properties} syncing={syncing === connection.id} onSync={() => sync(connection.id)} onLinked={() => queryClient.invalidateQueries({ queryKey: ["beds24-connections"] })} />)}</div>}
  </section>;
}

function ConnectionCard({ connection, properties, syncing, onSync, onLinked }: { connection: Connection; properties: Property[]; syncing: boolean; onSync: () => void; onLinked: () => void }) {
  const toast = useToast();
  const [propertyId, setPropertyId] = useState("");
  const [remoteId, setRemoteId] = useState("");
  const [saving, setSaving] = useState(false);
  const link = async (event: FormEvent) => { event.preventDefault(); if (!propertyId || !remoteId.trim()) return; setSaving(true); try { await api.put(`/integrations/beds24/connections/${connection.id}/property-links`, { property_id: propertyId, beds24_property_id: remoteId.trim() }); setRemoteId(""); await onLinked(); toast.success("Propiedad vinculada", "Ya puedes importar sus reservas."); } catch (error: any) { toast.error("No pudimos vincular", error?.response?.data?.detail || "Revisa los identificadores."); } finally { setSaving(false); } };
  const lastSync = connection.last_bookings_sync_at ? new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(connection.last_bookings_sync_at)) : "Primera importación pendiente";
  return <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-medium text-white">Cuenta {connection.channel_account_id}</p><p className="mt-1 text-xs text-slate-400">Última sincronización: {lastSync}</p></div><Button onClick={onSync} disabled={connection.property_links.length === 0} isLoading={syncing}><RefreshCw className="mr-2 h-4 w-4" />Sincronizar ahora</Button></div><div className="mt-3 text-xs text-slate-400">{connection.property_links.length ? <span className="inline-flex items-center gap-1 text-emerald-300"><CheckCircle2 className="h-4 w-4" />{connection.property_links.length} propiedad(es) vinculada(s)</span> : "Vincula una propiedad antes de importar."}</div><form onSubmit={link} className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><select value={propertyId} onChange={(event) => setPropertyId(event.target.value)} className="rounded-lg border border-white/10 bg-obsidian px-3 py-2 text-sm text-white"><option value="">Propiedad Nomora</option>{properties.map((property) => <option value={property.id} key={property.id}>{property.name}</option>)}</select><input value={remoteId} onChange={(event) => setRemoteId(event.target.value)} placeholder="ID de propiedad Beds24" className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white" /><Button type="submit" variant="secondary" isLoading={saving}>Vincular</Button></form></div>;
}
