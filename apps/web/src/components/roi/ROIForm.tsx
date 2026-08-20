import { motion, Variants } from "framer-motion";
import { DollarSign, Calendar, Percent } from "lucide-react";
import { CurrencyInput } from "@/components/ui/CurrencyInput";

interface ROIFormProps {
  initialInvestment: number; setInitialInvestment: (val: number) => void;
  pricePerNight: number; setPricePerNight: (val: number) => void;
  daysOccupied: number; setDaysOccupied: (val: number) => void;
  platformFee: number; setPlatformFee: (val: number) => void;
  operatingExpenses: number; setOperatingExpenses: (val: number) => void;
  fixedExpenses: number; setFixedExpenses: (val: number) => void;
  currency: string;
  containerVariants: Variants;
  itemVariants: Variants;
}

export function ROIForm({
  initialInvestment, setInitialInvestment,
  pricePerNight, setPricePerNight,
  daysOccupied, setDaysOccupied,
  platformFee, setPlatformFee,
  operatingExpenses, setOperatingExpenses,
  fixedExpenses, setFixedExpenses,
  currency,
  containerVariants,
  itemVariants
}: ROIFormProps) {
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="lg:col-span-5 space-y-6"
    >
      {/* Inversión y Precio */}
      <motion.div variants={itemVariants} className="card-surface p-6 space-y-6">
        <h3 className="text-lg font-semibold text-ink flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-violet-600" />
          Inversión y Tarifas
        </h3>
        
        <div className="space-y-4">
          <CurrencyInput
            label="Inversión Inicial"
            value={initialInvestment}
            onChange={(val) => setInitialInvestment(Number(val) || 0)}
            currency={currency}
          />

          <CurrencyInput
            label="Precio por Noche"
            value={pricePerNight}
            onChange={(val) => setPricePerNight(Number(val) || 0)}
            currency={currency}
          />
        </div>
      </motion.div>

      {/* Ocupación y Gastos */}
      <motion.div variants={itemVariants} className="card-surface p-6 space-y-6">
        <h3 className="text-lg font-semibold text-ink flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-teal-600" />
          Ocupación y Gastos Mensuales
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="flex justify-between text-sm font-medium text-ink/80 mb-2">
              <span>Días Ocupados por Mes</span>
              <span className="text-teal-600 font-bold">{daysOccupied} días ({(daysOccupied/30*100).toFixed(0)}%)</span>
            </label>
            <input 
              type="range" 
              min="1" max="30" step="1"
              value={daysOccupied} 
              onChange={(e) => setDaysOccupied(Number(e.target.value))}
              className="w-full accent-teal-500"
            />
          </div>

          <CurrencyInput
            label="Gastos Operativos (Limpieza, insumos)"
            value={operatingExpenses}
            onChange={(val) => setOperatingExpenses(Number(val) || 0)}
            currency={currency}
          />

          <CurrencyInput
            label="Gastos Fijos (Luz, agua, internet)"
            value={fixedExpenses}
            onChange={(val) => setFixedExpenses(Number(val) || 0)}
            currency={currency}
          />
        </div>
      </motion.div>

      {/* Comisiones */}
      <motion.div variants={itemVariants} className="card-surface p-6 space-y-6">
        <h3 className="text-lg font-semibold text-ink flex items-center gap-2 mb-4">
          <Percent className="w-5 h-5 text-amber-600" />
          Comisiones
        </h3>
        
        <div>
          <label className="flex justify-between text-sm font-medium text-ink/80 mb-2">
            <span>Comisión de Plataforma</span>
            <span className="text-amber-600 font-bold">{platformFee}%</span>
          </label>
          <input 
            type="range" 
            min="0" max="35" step="1"
            value={platformFee} 
            onChange={(e) => setPlatformFee(Number(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
