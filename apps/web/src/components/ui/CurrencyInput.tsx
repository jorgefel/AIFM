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
  
  const prefix = currency === "EUR" ? "€ " : currency === "COP" ? "COP $ " : "$ ";

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-ink/80">
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
        className="w-full bg-surface border border-line rounded-lg px-4 py-2.5 text-ink focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/15 focus:bg-card transition-all placeholder:text-ink-muted/60"
        placeholder={`${prefix}0${decimalSeparator}00`}
        required={required}
      />
    </div>
  );
}
