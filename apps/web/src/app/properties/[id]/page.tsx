"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BedDouble, CalendarDays, MapPin, Users } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { fetcher } from "@/lib/fetcher";
import type { Property } from "@/types/models";

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: property, isLoading, isError } = useQuery<Property>({
    queryKey: ["property", params.id],
    queryFn: () => fetcher(`/properties/${params.id}`),
  });

  return <DashboardLayout>
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/properties" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" />Volver a propiedades</Link>
      {isLoading && <div className="glass-panel p-8 text-slate-400">Cargando propiedad…</div>}
      {isError && <div className="glass-panel p-8 text-slate-400">No encontramos esta propiedad o ya no tienes acceso a ella.</div>}
      {property && <>
        <header className="glass-panel overflow-hidden">
          {property.photo_urls?.[0] && <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(to bottom, transparent, rgba(5, 8, 16, .75)), url("${property.photo_urls[0]}")` }} />}
          <div className="p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-sm capitalize text-emerald-400">{property.property_type}</p><h1 className="mt-1 text-3xl font-bold text-white">{property.name}</h1><p className="mt-2 flex items-center gap-2 text-slate-400"><MapPin className="h-4 w-4" />{property.address}</p></div><div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-right"><p className="text-xs text-slate-400">Desde</p><p className="text-lg font-semibold text-emerald-300">{property.nightly_rate == null ? "Sin precio" : `${property.currency} ${Number(property.nightly_rate).toLocaleString()} / noche`}</p></div></div>
          </div>
        </header>
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat icon={<Users className="h-5 w-5" />} label="Capacidad" value={`${property.max_guests} huéspedes`} />
          <Stat icon={<BedDouble className="h-5 w-5" />} label="Habitaciones" value={`${property.bedrooms} habitaciones · ${property.bathrooms} baños`} />
          <Link href={`/calendar?property_id=${property.id}`}><Stat icon={<CalendarDays className="h-5 w-5" />} label="Calendario" value="Ver reservas" /></Link>
        </div>
        <section className="glass-panel p-6"><h2 className="font-semibold text-white">Descripción</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-400">{property.description || "No has agregado una descripción todavía."}</p></section>
        <section className="glass-panel p-6"><h2 className="font-semibold text-white">Amenidades</h2><div className="mt-4 flex flex-wrap gap-2">{property.amenities.length ? property.amenities.map((item) => <span key={item} className="rounded-full bg-white/5 px-3 py-1.5 text-sm capitalize text-slate-300">{item.replace(/_/g, " ")}</span>) : <p className="text-sm text-slate-500">No hay amenidades registradas.</p>}</div></section>
        <section className="glass-panel p-6"><h2 className="font-semibold text-white">Canales publicados</h2><div className="mt-4 flex flex-wrap gap-2">{property.published_platforms.map((item) => <span key={item} className="rounded-full border border-teal-400/20 bg-teal-500/10 px-3 py-1.5 text-sm capitalize text-teal-200">{item === "booking" ? "Booking.com" : item}</span>)}</div></section>
      </>}
    </div>
  </DashboardLayout>;
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="glass-panel flex items-center gap-3 p-4"><span className="rounded-lg bg-white/5 p-2 text-emerald-400">{icon}</span><div><p className="text-xs text-slate-500">{label}</p><p className="mt-0.5 text-sm font-medium text-white">{value}</p></div></div>;
}
