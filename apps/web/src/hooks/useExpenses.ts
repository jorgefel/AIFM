import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { useCurrency } from "@/contexts/CurrencyContext";

export interface Property {
  id: string;
  name: string;
}

export interface Expense {
  id: string;
  property_id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  currency: string;
  receipt_url: string | null;
}

export function useExpenses() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const { currency } = useCurrency();

  const [formData, setFormData] = useState({
    description: "",
    amount: "" as any,
    category: "maintenance",
    date: new Date().toISOString().split("T")[0],
    currency
  });

  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const fetchProperties = async () => {
    try {
      const { data } = await api.get("/properties/");
      setProperties(data);
      if (data.length > 0) {
        setSelectedPropertyId(data[0].id);
      } else {
        setIsLoading(false);
      }
    } catch {
      toast.error("Error", "No se pudieron cargar las propiedades.");
      setIsLoading(false);
    }
  };

  const fetchExpenses = useCallback(async (propertyId: string) => {
    if (!propertyId) return;
    setIsLoading(true);
    try {
      const { data } = await api.get(`/expenses/?property_id=${propertyId}`);
      setExpenses(data);
    } catch {
      toast.error("Error", "No se pudieron cargar los gastos.");
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (selectedPropertyId) {
      fetchExpenses(selectedPropertyId);
    }
  }, [selectedPropertyId, fetchExpenses]);

  const handleUploadReceipt = async (expenseId: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    await api.post(`/expenses/${expenseId}/receipt`, fd, {
      headers: { "Content-Type": "multipart/form-data" }
    });
  };

  const submitExpense = async (editingId: string | null) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        property_id: selectedPropertyId,
        amount: Number(formData.amount)
      };

      let expenseId = editingId;

      if (editingId) {
        await api.put(`/expenses/${editingId}`, payload);
      } else {
        const { data } = await api.post("/expenses/", payload);
        expenseId = data.id;
      }
      
      if (receiptFile && expenseId) {
        await handleUploadReceipt(expenseId, receiptFile);
      }

      toast.success(editingId ? "Gasto actualizado" : "Gasto registrado", "El gasto se guardó correctamente.");
      fetchExpenses(selectedPropertyId);
      return true;
    } catch {
      toast.error("Error", "No se pudo guardar el gasto.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      await api.delete(`/expenses/${id}`);
      toast.success("Gasto eliminado", "El gasto fue eliminado correctamente.");
      fetchExpenses(selectedPropertyId);
      return true;
    } catch {
      toast.error("Error", "No se pudo eliminar el gasto.");
      return false;
    }
  };

  const resetForm = () => {
    setFormData({
      description: "",
      amount: "" as any,
      category: "maintenance",
      date: new Date().toISOString().split("T")[0],
      currency
    });
    setReceiptFile(null);
  };

  const loadForm = (exp: Expense) => {
    setFormData({
      description: exp.description,
      amount: exp.amount,
      category: exp.category,
      date: exp.date,
      currency: exp.currency as any
    });
    setReceiptFile(null);
  };

  return {
    properties,
    selectedPropertyId, setSelectedPropertyId,
    expenses,
    isLoading,
    isSubmitting,
    formData, setFormData,
    receiptFile, setReceiptFile,
    submitExpense,
    deleteExpense,
    resetForm,
    loadForm
  };
}
