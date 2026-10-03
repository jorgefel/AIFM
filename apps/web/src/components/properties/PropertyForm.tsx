"use client";

import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import type { PropertyFormData } from "@/hooks/useProperties";

interface PropertyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isSubmitting: boolean;
  isEditing: boolean;
  formData: PropertyFormData;
  setFormData: React.Dispatch<React.SetStateAction<PropertyFormData>>;
}

export function PropertyForm({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  isEditing,
  formData,
  setFormData
}: PropertyFormProps) {
  const toggle = (key: "amenities" | "published_platforms", value: string) => {
    setFormData((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }));
  };

  const updatePhotoUrls = (value: string) => {
    setFormData({
      ...formData,
      photo_urls: value.split("\n").map((url) => url.trim()).filter(Boolean),
    });
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isEditing ? "Editar Propiedad" : "Nueva Propiedad"}
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <section className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Información básica</p>
          <Input label="Nombre de la propiedad" placeholder="Ej. Villa Tulum" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          <Input label="Ubicación o dirección" placeholder="Dirección completa" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Tipo" value={formData.property_type} onChange={(e) => setFormData({ ...formData, property_type: e.target.value })} options={[
              { value: "apartment", label: "Apartamento" }, { value: "house", label: "Casa" }, { value: "cabin", label: "Cabaña" }, { value: "room", label: "Habitación" }, { value: "hotel", label: "Hotel" }, { value: "other", label: "Otro" },
            ]} required />
            <Select label="Moneda principal" value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} options={[
              { value: "USD", label: "Dólares (USD)" }, { value: "MXN", label: "Pesos Mexicanos (MXN)" }, { value: "COP", label: "Pesos Colombianos (COP)" }, { value: "EUR", label: "Euros (EUR)" },
            ]} required />
          </div>
        </section>

        <section className="space-y-4 border-t border-white/10 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Capacidad y precio</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Input label="Huéspedes" type="number" min="1" value={formData.max_guests} onChange={(e) => setFormData({ ...formData, max_guests: Number(e.target.value) })} required />
            <Input label="Habitaciones" type="number" min="0" value={formData.bedrooms} onChange={(e) => setFormData({ ...formData, bedrooms: Number(e.target.value) })} required />
            <Input label="Baños" type="number" min="0" value={formData.bathrooms} onChange={(e) => setFormData({ ...formData, bathrooms: Number(e.target.value) })} required />
            <Input label="Valor por noche" type="number" min="0" step="0.01" placeholder="Opcional" value={formData.nightly_rate} onChange={(e) => setFormData({ ...formData, nightly_rate: e.target.value })} />
          </div>
          <label className="block text-sm font-medium text-slate-300">Descripción <span className="font-normal text-slate-500">(opcional)</span>
            <textarea rows={3} maxLength={5000} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="mt-1.5 w-full rounded-lg border border-white/10 bg-obsidian-light/30 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-emerald-500/50" placeholder="Cuenta qué hace especial a este alojamiento." />
          </label>
        </section>

        <ChoiceGroup label="Plataformas publicadas" required values={["airbnb", "booking", "vrbo", "direct", "other"]} selected={formData.published_platforms} onToggle={(value) => toggle("published_platforms", value)} />
        <ChoiceGroup label="Amenidades" values={["wifi", "parking", "pool", "kitchen", "air_conditioning", "workspace", "washer", "pet_friendly"]} selected={formData.amenities} onToggle={(value) => toggle("amenities", value)} />

        <section className="border-t border-white/10 pt-5">
          <label className="block text-sm font-medium text-slate-300">Fotos <span className="font-normal text-slate-500">(URLs, una por línea)</span>
            <textarea rows={3} value={formData.photo_urls.join("\n")} onChange={(e) => updatePhotoUrls(e.target.value)} className="mt-1.5 w-full rounded-lg border border-white/10 bg-obsidian-light/30 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-emerald-500/50" placeholder="https://..." />
          </label>
          <p className="mt-1.5 text-xs text-slate-500">La carga directa de archivos se incorporará con el almacenamiento de medios.</p>
        </section>
        <div className="pt-4 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ChoiceGroup({ label, values, selected, onToggle, required = false }: { label: string; values: string[]; selected: string[]; onToggle: (value: string) => void; required?: boolean }) {
  return <section className="space-y-2 border-t border-white/10 pt-5">
    <p className="text-sm font-medium text-slate-300">{label}{required && <span className="ml-1 text-coral-accent">*</span>}</p>
    <div className="flex flex-wrap gap-2">{values.map((value) => {
      const active = selected.includes(value);
      const text = value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
      return <button key={value} type="button" onClick={() => onToggle(value)} className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${active ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-300" : "border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/30"}`}>{text}</button>;
    })}</div>
    {required && !selected.length && <p className="text-xs text-coral-accent">Selecciona al menos una plataforma.</p>}
  </section>;
}
