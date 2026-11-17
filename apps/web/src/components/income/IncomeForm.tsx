"use client";

import { useEffect, useState, useRef } from "react";
import { Check, UserCheck, UserPlus, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Button } from "@/components/ui/Button";
import { PLATFORM_LABELS, calcPlatformFee, getCommissionRate } from "@/lib/commissions";
import { api } from "@/lib/api";
import type { Property, Guest } from "@/types/models";

function getNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const [y1, m1, d1] = checkIn.split("-").map(Number);
  const [y2, m2, d2] = checkOut.split("-").map(Number);
  if (!y1 || !y2) return 0;
  const start = new Date(y1, m1 - 1, d1);
  const end = new Date(y2, m2 - 1, d2);
  const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

interface IncomeFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingId: string | null;
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  properties?: Property[];
}

export function IncomeForm({
  isOpen,
  onClose,
  editingId,
  formData,
  setFormData,
  onSubmit,
  isSubmitting,
  properties = [],
}: IncomeFormProps) {
  const [feeOverride, setFeeOverride] = useState<boolean | null>(null);

  // Guest search and autocomplete
  const [guestSuggestions, setGuestSuggestions] = useState<Guest[]>([]);
  const [isSearchingGuests, setIsSearchingGuests] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Prompt step: "¿Quieres guardar al huésped?"
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [guestFirstName, setGuestFirstName] = useState("");
  const [guestLastName, setGuestLastName] = useState("");
  const [guestDoc, setGuestDoc] = useState("");
  const [isSavingGuest, setIsSavingGuest] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);

  const rate = getCommissionRate(formData.platform);
  const autoFee = calcPlatformFee(Number(formData.total_amount) || 0, formData.platform);
  const isManualFee = feeOverride ?? editingId !== null;
  const nights = getNights(formData.check_in, formData.check_out);

  useEffect(() => {
    if (!isOpen) {
      setFeeOverride(null);
      setShowGuestPrompt(false);
      setShowSuggestions(false);
      setGuestError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || isManualFee) return;
    if ((Number(formData.platform_fee) || 0) !== autoFee) {
      setFormData((prev: any) => ({ ...prev, platform_fee: autoFee }));
    }
  }, [isOpen, isManualFee, autoFee, setFormData]);

  const platformLabel = PLATFORM_LABELS[formData.platform] ?? formData.platform;

  const handlePropertyChange = (propertyId: string) => {
    const prop = properties.find((p) => p.id === propertyId);
    const propRate = prop ? Number(prop.nightly_rate ?? prop.price_per_night ?? 0) : 0;
    const n = getNights(formData.check_in, formData.check_out);
    setFormData((prev: any) => ({
      ...prev,
      property_id: propertyId,
      nightly_rate: propRate > 0 ? propRate : prev.nightly_rate,
      currency: prop?.currency || prev.currency,
      total_amount: n > 0 && propRate > 0 ? n * propRate : prev.total_amount,
    }));
  };

  const handleDateChange = (field: "check_in" | "check_out", value: string) => {
    const nextCheckIn = field === "check_in" ? value : formData.check_in;
    const nextCheckOut = field === "check_out" ? value : formData.check_out;
    const n = getNights(nextCheckIn, nextCheckOut);
    const currentRate = Number(formData.nightly_rate) || 0;
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
      total_amount: n > 0 && currentRate > 0 ? n * currentRate : prev.total_amount,
    }));
  };

  const handleNightlyRateChange = (val: any) => {
    const currentRate = Number(val) || 0;
    const n = getNights(formData.check_in, formData.check_out);
    setFormData((prev: any) => ({
      ...prev,
      nightly_rate: val,
      total_amount: n > 0 && currentRate > 0 ? n * currentRate : prev.total_amount,
    }));
  };

  // Autocomplete search
  const handleGuestNameChange = (name: string) => {
    setFormData((prev: any) => ({
      ...prev,
      guest_name: name,
      // If user edits name manually after selecting, clear guest_id
      guest_id: prev.guest_name === name ? prev.guest_id : null,
    }));

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (name.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(async () => {
        setIsSearchingGuests(true);
        try {
          const res = await api.get<Guest[]>(`/guests?q=${encodeURIComponent(name.trim())}`);
          setGuestSuggestions(res.data || []);
          setShowSuggestions(true);
        } catch {
          setGuestSuggestions([]);
        } finally {
          setIsSearchingGuests(false);
        }
      }, 250);
    } else {
      setGuestSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectGuest = (guest: Guest) => {
    setFormData((prev: any) => ({
      ...prev,
      guest_id: guest.id,
      guest_name: `${guest.first_name} ${guest.last_name}`,
    }));
    setShowSuggestions(false);
  };

  const unlinkGuest = () => {
    setFormData((prev: any) => ({
      ...prev,
      guest_id: null,
    }));
  };

  // Form submit intercept
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // If editing or guest is already linked, or already decided, submit directly
    if (editingId || formData.guest_id) {
      onSubmit(e);
      return;
    }

    // Split name into first and last name candidates
    const parts = (formData.guest_name || "").trim().split(/\s+/);
    setGuestFirstName(parts[0] || "");
    setGuestLastName(parts.slice(1).join(" ") || "");
    setGuestDoc("");
    setGuestError(null);
    setShowGuestPrompt(true);
  };

  const handleSaveWithoutGuest = (e: React.FormEvent) => {
    setShowGuestPrompt(false);
    onSubmit(e);
  };

  const handleSaveWithGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestFirstName.trim() || !guestLastName.trim()) {
      setGuestError("Por favor ingresa nombre y apellidos.");
      return;
    }

    try {
      setIsSavingGuest(true);
      setGuestError(null);
      const res = await api.post<Guest>("/guests", {
        first_name: guestFirstName.trim(),
        last_name: guestLastName.trim(),
        document_or_keyword: guestDoc.trim() || null,
      });

      if (res.data?.id) {
        setFormData((prev: any) => ({
          ...prev,
          guest_id: res.data.id,
          guest_name: `${res.data.first_name} ${res.data.last_name}`,
        }));
      }

      setShowGuestPrompt(false);
      onSubmit(e);
    } catch (err: any) {
      const msg = err.response?.data?.detail || "No fue posible guardar el huésped.";
      setGuestError(msg);
    } finally {
      setIsSavingGuest(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingId ? "Editar Reserva" : "Nueva Reserva"}>
      {showGuestPrompt ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4">
            <h4 className="text-base font-medium text-ink flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-violet-600" />
              ¿Quieres guardar al huésped en tu directorio?
            </h4>
            <p className="mt-1 text-xs text-ink-muted">
              Guardar al huésped te permite ver su historial de estadías, noches acumuladas y autocompletar sus datos en futuras reservas.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nombre"
              value={guestFirstName}
              onChange={(e) => setGuestFirstName(e.target.value)}
              placeholder="Ej. Juan"
              required
            />
            <Input
              label="Apellidos"
              value={guestLastName}
              onChange={(e) => setGuestLastName(e.target.value)}
              placeholder="Ej. Pérez"
              required
            />
          </div>

          <Input
            label="Identificación o palabra clave (opcional)"
            value={guestDoc}
            onChange={(e) => setGuestDoc(e.target.value)}
            placeholder="Ej. CC 123456 o 'Cliente frecuente'"
          />

          {guestError && (
            <p className="rounded-lg bg-red-50 p-2 text-xs text-red-600 border border-red-200">
              {guestError}
            </p>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-line-soft">
            <Button
              type="button"
              variant="secondary"
              onClick={handleSaveWithoutGuest}
              disabled={isSavingGuest}
            >
              No, solo guardar reserva
            </Button>
            <Button
              type="button"
              onClick={handleSaveWithGuest}
              isLoading={isSavingGuest}
            >
              Sí, guardar huésped y reserva
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {properties.length > 0 && (
            <Select
              label="Propiedad"
              value={formData.property_id || ""}
              onChange={(e) => handlePropertyChange(e.target.value)}
              options={properties.map((p) => ({
                value: p.id,
                label: `${p.name}${
                  p.nightly_rate ? ` (${p.currency || "USD"} ${Number(p.nightly_rate).toLocaleString()}/noche)` : ""
                }`,
              }))}
              required
            />
          )}

          {/* Guest Name with Autocomplete */}
          <div className="relative">
            <Input
              label="Huésped"
              placeholder="Nombre del huésped"
              value={formData.guest_name}
              onChange={(e) => handleGuestNameChange(e.target.value)}
              required
            />

            {formData.guest_id && (
              <div className="mt-1 flex items-center justify-between rounded-lg bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700 border border-emerald-200">
                <span className="flex items-center gap-1.5 font-medium">
                  <UserCheck className="h-3.5 w-3.5" />
                  Huésped vinculado al directorio
                </span>
                <button
                  type="button"
                  onClick={unlinkGuest}
                  className="rounded p-0.5 hover:bg-emerald-100 text-emerald-800"
                  title="Desvincular"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {showSuggestions && guestSuggestions.length > 0 && !formData.guest_id && (
              <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 rounded-xl border border-line bg-card p-1 shadow-lg">
                <p className="px-2 py-1 text-[11px] font-medium text-ink-muted">
                  Huéspedes sugeridos:
                </p>
                <ul className="max-h-48 overflow-y-auto space-y-0.5">
                  {guestSuggestions.map((g) => (
                    <li key={g.id}>
                      <button
                        type="button"
                        onClick={() => selectGuest(g)}
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs text-ink hover:bg-surface"
                      >
                        <span className="font-medium">
                          {g.first_name} {g.last_name}
                        </span>
                        {g.document_or_keyword && (
                          <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] text-violet-700 font-mono">
                            {g.document_or_keyword}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="date"
              label="Check-in"
              value={formData.check_in}
              onChange={(e) => handleDateChange("check_in", e.target.value)}
              required
            />
            <div>
              <Input
                type="date"
                label="Check-out"
                value={formData.check_out}
                onChange={(e) => handleDateChange("check_out", e.target.value)}
                required
              />
              {nights > 0 && (
                <p className="mt-1 text-xs font-medium text-violet-600">
                  {nights} {nights === 1 ? "noche" : "noches"}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <CurrencyInput
              label="Precio por Noche"
              value={formData.nightly_rate}
              onChange={handleNightlyRateChange}
              currency={formData.currency}
              required
            />
            <div>
              <CurrencyInput
                label="Monto Bruto"
                value={formData.total_amount}
                onChange={(val) => setFormData({ ...formData, total_amount: val as any })}
                currency={formData.currency}
                required
              />
              {nights > 0 && Number(formData.nightly_rate) > 0 && (
                <p className="mt-1 text-xs text-ink-muted">
                  {nights}n × {Number(formData.nightly_rate).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          <div>
            <CurrencyInput
              label="Comisión (Platform Fee)"
              value={formData.platform_fee}
              onChange={(val) => {
                setFormData({ ...formData, platform_fee: val as any });
                if ((Number(val) || 0) !== autoFee) setFeeOverride(true);
              }}
              currency={formData.currency}
            />
            <p className="mt-1.5 text-xs text-ink-muted">
              {isManualFee ? (
                <>
                  Valor manual.{" "}
                  <button
                    type="button"
                    onClick={() => setFeeOverride(false)}
                    className="font-medium text-violet-600 hover:text-violet-500"
                  >
                    Restablecer automática
                  </button>
                </>
              ) : rate > 0 ? (
                `Automática: ${rate}% de ${platformLabel}`
              ) : (
                "Sin comisión para esta plataforma"
              )}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Plataforma"
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              options={[
                { value: "airbnb", label: "Airbnb" },
                { value: "booking", label: "Booking.com" },
                { value: "vrbo", label: "Vrbo" },
                { value: "direct", label: "Directo" },
              ]}
              required
            />
            <Select
              label="Moneda"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value as any })}
              options={[
                { value: "USD", label: "Dólares (USD)" },
                { value: "MXN", label: "Pesos Mexicanos (MXN)" },
                { value: "COP", label: "Pesos Colombianos (COP)" },
                { value: "EUR", label: "Euros (EUR)" },
              ]}
              required
            />
          </div>

          <Select
            label="Estado"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: "confirmed", label: "Confirmada" },
              { value: "pending", label: "Pendiente" },
              { value: "completed", label: "Completada" },
              { value: "cancelled", label: "Cancelada" },
            ]}
            required
          />

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Guardar
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
