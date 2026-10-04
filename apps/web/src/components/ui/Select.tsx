import React from "react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", label, error, options, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-ink/80 mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full bg-surface border border-line rounded-lg px-4 py-2.5 text-ink text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/15 focus:bg-card transition-all ${
            error ? "border-red-400 focus:border-red-400" : ""
          } ${className}`}
          {...props}
        >
          <option value="" disabled hidden>
            Selecciona una opción
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-card text-ink">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
