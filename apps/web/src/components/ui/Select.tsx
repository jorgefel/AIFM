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
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full bg-obsidian-light/30 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50 focus:bg-obsidian-light/50 transition-all ${
            error ? "border-red-500/50 focus:border-red-500/50" : ""
          } ${className}`}
          {...props}
        >
          <option value="" disabled hidden>
            Selecciona una opción
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-obsidian text-white">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
