"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type CurrencyCode = "USD" | "COP" | "EUR";

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  formatCurrency: (amount: number, overrideCurrency?: CurrencyCode) => string;
  formatCurrencyCompact: (amount: number, overrideCurrency?: CurrencyCode) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("USD");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Load from local storage on mount
    const saved = localStorage.getItem("nomora_currency") as CurrencyCode;
    if (saved && ["USD", "COP", "EUR"].includes(saved)) {
      setCurrencyState(saved);
    }
    setIsMounted(true);
  }, []);

  const setCurrency = (code: CurrencyCode) => {
    setCurrencyState(code);
    localStorage.setItem("nomora_currency", code);
  };

  const formatCurrency = (amount: number, overrideCurrency?: CurrencyCode) => {
    if (!isMounted) {
      // Prevents hydration mismatch by defaulting to standard format before mount
      return `$${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    const currentCurrency = overrideCurrency || currency;

    try {
      if (currentCurrency === "COP") {
        const formatted = new Intl.NumberFormat("es-CO", {
          style: "currency",
          currency: "COP",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount);
        return formatted.replace("$", "COP $");
      }
      
      if (currentCurrency === "EUR") {
        return new Intl.NumberFormat("es-ES", {
          style: "currency",
          currency: "EUR",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(amount);
      }

      // Default USD
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      return `$${Number(amount).toLocaleString()}`;
    }
  };

  const formatCurrencyCompact = (amount: number, overrideCurrency?: CurrencyCode) => {
    if (!isMounted) return `$${amount}`;
    const currentCurrency = overrideCurrency || currency;
    try {
      const formatted = new Intl.NumberFormat(
        currentCurrency === "COP" ? "es-CO" : currentCurrency === "EUR" ? "es-ES" : "en-US", 
        {
          style: "currency",
          currency: currentCurrency,
          notation: "compact",
          compactDisplay: "short",
          maximumFractionDigits: 1
        }
      ).format(amount);
      return currentCurrency === "COP" ? formatted.replace("$", "COP $") : formatted;
    } catch {
      return `$${amount}`;
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency, formatCurrencyCompact }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
