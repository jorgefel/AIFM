"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Button } from "@/components/ui/Button";
import { PLATFORM_LABELS, calcPlatformFee, getCommissionRate } from "@/lib/commissions";
import type { Property } from "@/types/models";

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
  isOpen, onClose, editingId,
  formData, setFormData,
  onSubmit, isSubmitting,
  properties = []
}: IncomeFormProps) {
  const [feeOverride, setFeeOverride] = useState<boolean | null>(null);

  const rate = getCommissionRate(formData.platform);
  const autoFee = calcPlatformFee(Number(formData.total_amount) || 0, formData.platform);
  const isManualFee = feeOverride ?? editingId !== null;
  const nights = getNights(formData.check_in, formData.check_out);

  useEffect(() => {
    if (!isOpen) setFeeOverride(null);
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

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editingId ? "Editar Reserva" : "Nueva Reserva"}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {properties.length > 0 && (
          <Select 
            label="Propiedad" 
            value={formData.property_id || ""}
            onChange={(e) => handlePropertyChange(e.target.value)}
            options={properties.map((p) => ({
              value: p.id,
              label: `${p.name}${p.nightly_rate ? ` (${p.currency || "USD"} ${Number(p.nightly_rate).toLocaleString()}/noche)` : ""}`
            }))}
            required
          />
        )}

        <Input 
          label="Huésped" 
          placeholder="Nombre del huésped" 
          value={formData.guest_name}
          onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
          required
        />

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
    </Modal>
  );
}
