"use client";

import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

interface PropertyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isSubmitting: boolean;
  isEditing: boolean;
  formData: { name: string; address: string; currency: string };
  setFormData: (data: any) => void;
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
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isEditing ? "Editar Propiedad" : "Nueva Propiedad"}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Input 
          label="Nombre de la Propiedad" 
          placeholder="Ej. Villa Tulum" 
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <Input 
          label="Dirección" 
          placeholder="Dirección completa" 
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          required
        />
        <Select 
          label="Moneda Principal" 
          value={formData.currency}
          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
          options={[
            { value: "USD", label: "Dólares (USD)" },
            { value: "MXN", label: "Pesos Mexicanos (MXN)" },
            { value: "COP", label: "Pesos Colombianos (COP)" },
            { value: "EUR", label: "Euros (EUR)" },
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
