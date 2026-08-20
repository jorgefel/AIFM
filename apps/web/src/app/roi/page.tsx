"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Calculator, RefreshCcw } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { containerVariants, itemVariants } from "@/lib/animations";
import { Button } from "@/components/ui/Button";

// Hooks
import { useROICalculator } from "@/hooks/useROICalculator";

// Components
import { ROIForm } from "@/components/roi/ROIForm";
import { ROIChart } from "@/components/roi/ROIChart";

export default function ROICalculator() {


  const { currency, formatCurrency } = useCurrency();

  const {
    initialInvestment, setInitialInvestment,
    pricePerNight, setPricePerNight,
    daysOccupied, setDaysOccupied,
    platformFee, setPlatformFee,
    operatingExpenses, setOperatingExpenses,
    fixedExpenses, setFixedExpenses,
    results,
    resetCalculator
  } = useROICalculator();

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink tracking-tight flex items-center gap-3">
            <Calculator className="w-8 h-8 text-violet-600" />
            Calculadora de ROI
          </h1>
          <p className="text-ink-muted mt-1">
            Simula escenarios y descubre en cuánto tiempo recuperarás tu inversión inicial.
          </p>
        </div>
        <Button 
          onClick={resetCalculator}
          variant="secondary"
        >
          <RefreshCcw className="w-4 h-4 mr-2" />
          Reiniciar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* PANEL IZQUIERDO: FORMULARIO */}
        <ROIForm 
          initialInvestment={initialInvestment} setInitialInvestment={setInitialInvestment}
          pricePerNight={pricePerNight} setPricePerNight={setPricePerNight}
          daysOccupied={daysOccupied} setDaysOccupied={setDaysOccupied}
          platformFee={platformFee} setPlatformFee={setPlatformFee}
          operatingExpenses={operatingExpenses} setOperatingExpenses={setOperatingExpenses}
          fixedExpenses={fixedExpenses} setFixedExpenses={setFixedExpenses}
          currency={currency}
          containerVariants={containerVariants}
          itemVariants={itemVariants}
        />

        {/* PANEL DERECHO: RESULTADOS Y GRÁFICO */}
        <ROIChart 
          results={results}
          initialInvestment={initialInvestment}
          formatCurrency={formatCurrency}
        />
        
      </div>
    </DashboardLayout>
  );
}
