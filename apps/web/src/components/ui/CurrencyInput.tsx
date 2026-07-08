import React from "react";
import { NumericFormat } from "react-number-format";

interface CurrencyInputProps {
  label: string;
  value: number | string;
  onChange: (value: number | string) => void;
  currency: string;
  required?: boolean;
}

export function CurrencyInput({ label, value, onChange, currency, required }: CurrencyInputProps) {
  const isCOP = currency === "COP";
  const isEUR = currency === "EUR";
  
  // COP and EUR use '.' for thousands and ',' for decimals
  const thousandSeparator = (isCOP || isEUR) ? "." : ",";
  const decimalSeparator = (isCOP || isEUR) ? "," : ".";
  
  const prefix = currency === "EUR" ? "€ " : "$ ";

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-300">
        {label}
      </label>
      <NumericFormat
        value={value}
        onValueChange={(values) => {
          // values.floatValue is the unformatted numeric value
          onChange(values.floatValue === undefined ? "" : values.floatValue);
        }}
        thousandSeparator={thousandSeparator}
        decimalSeparator={decimalSeparator}
        prefix={prefix}
        decimalScale={2}
        allowNegative={false}
        className="w-full bg-obsidian-light/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all placeholder:text-slate-600"
        placeholder={`${prefix}0${decimalSeparator}00`}
        required={required}
      />
    </div>
  );
}
