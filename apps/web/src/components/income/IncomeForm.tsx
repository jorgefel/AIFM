import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Button } from "@/components/ui/Button";

interface IncomeFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingId: string | null;
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export function IncomeForm({
  isOpen, onClose, editingId,
  formData, setFormData,
  onSubmit, isSubmitting
}: IncomeFormProps) {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editingId ? "Editar Reserva" : "Nueva Reserva"}
    >
      <form onSubmit={onSubmit} className="space-y-4">
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
            onChange={(e) => setFormData({ ...formData, check_in: e.target.value })}
            required
          />
          <Input 
            type="date"
            label="Check-out" 
            value={formData.check_out}
            onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <CurrencyInput
            label="Monto Bruto" 
            value={formData.total_amount}
            onChange={(val) => setFormData({ ...formData, total_amount: val as any })}
            currency={formData.currency}
            required
          />
          <CurrencyInput
            label="Comisión (Platform Fee)" 
            value={formData.platform_fee}
            onChange={(val) => setFormData({ ...formData, platform_fee: val as any })}
            currency={formData.currency}
          />
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
