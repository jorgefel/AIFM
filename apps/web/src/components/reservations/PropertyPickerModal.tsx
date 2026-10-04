"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import type { Property } from "@/types/models";

interface PropertyPickerModalProps {
  isOpen: boolean;
  properties: Property[];
  onClose: () => void;
  onConfirm: (propertyId: string) => void;
}

export function PropertyPickerModal({ isOpen, properties, onClose, onConfirm }: PropertyPickerModalProps) {
  const [propertyId, setPropertyId] = useState("");
  const selected = propertyId || properties[0]?.id || "";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva reserva">
      <div className="space-y-5">
        <Select
          label="Propiedad de la reserva"
          value={selected}
          onChange={(e) => setPropertyId(e.target.value)}
          options={properties.map((p) => ({ value: p.id, label: p.name }))}
        />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" disabled={!selected} onClick={() => onConfirm(selected)}>
            Continuar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
