import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { fetcher } from "@/lib/fetcher";
import { PROPERTIES_QUERY_KEY } from "./useProperties";
import { useToast } from "@/contexts/ToastContext";
import { useCurrency } from "@/contexts/CurrencyContext";

import { Property, Expense } from "@/types/models";

export function useExpenses() {
  const queryClient = useQueryClient();
  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: PROPERTIES_QUERY_KEY,
    queryFn: () => fetcher("/properties/"),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
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

  // Auto-select first property
  useEffect(() => {
    if (properties.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [properties, selectedPropertyId]);

  // ── Expenses via React Query ──
  const expensesKey = ["expenses", selectedPropertyId];

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: expensesKey,
    queryFn: () => fetcher(`/expenses/?property_id=${selectedPropertyId}`),
    enabled: !!selectedPropertyId,
    staleTime: 0, // No cache for agent action dependencies
  });

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
      // Revalidate cache
      queryClient.invalidateQueries({ queryKey: expensesKey });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
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
      queryClient.invalidateQueries({ queryKey: expensesKey });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
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
    isLoading: isLoading && !!selectedPropertyId,
    isSubmitting,
    formData, setFormData,
    receiptFile, setReceiptFile,
    submitExpense,
    deleteExpense,
    resetForm,
    loadForm
  };
}
