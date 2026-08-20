import { useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Button } from "@/components/ui/Button";
import { Upload } from "lucide-react";

interface ExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingId: string | null;
  formData: any;
  setFormData: (data: any) => void;
  receiptFile: File | null;
  setReceiptFile: (file: File | null) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export function ExpenseForm({
  isOpen, onClose, editingId,
  formData, setFormData,
  receiptFile, setReceiptFile,
  onSubmit, isSubmitting
}: ExpenseFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editingId ? "Editar Gasto" : "Nuevo Gasto"}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Input 
          label="Descripción" 
          placeholder="Ej. Reparación de tubería" 
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
        
        <div className="grid grid-cols-2 gap-4">
          <CurrencyInput
            label="Monto" 
            value={formData.amount}
            onChange={(val) => setFormData({ ...formData, amount: val as any })}
            currency={formData.currency}
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
        
        <div className="grid grid-cols-2 gap-4">
          <Select 
            label="Categoría" 
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={[
              { value: "maintenance", label: "Mantenimiento" },
              { value: "cleaning", label: "Limpieza" },
              { value: "utilities", label: "Servicios (Agua, Luz)" },
              { value: "supplies", label: "Insumos" },
              { value: "taxes", label: "Impuestos" },
              { value: "other", label: "Otro" },
            ]}
            required
          />
          <Input 
            type="date"
            label="Fecha" 
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>

        <div className="pt-2">
          <label className="block text-sm font-medium text-ink/80 mb-1.5">Comprobante (Opcional)</label>
          <div className="flex items-center gap-4">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => fileInputRef.current?.click()}
              className="w-full justify-center"
            >
              <Upload className="w-4 h-4 mr-2" />
              {receiptFile ? receiptFile.name : "Subir Archivo"}
            </Button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/png, image/jpeg, application/pdf"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setReceiptFile(e.target.files[0]);
                }
              }}
            />
          </div>
          <p className="mt-1 text-xs text-ink-muted">Imágenes (PNG, JPG) o PDF. Máx 5MB.</p>
        </div>

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
