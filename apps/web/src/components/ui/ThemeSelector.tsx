"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type Theme } from "@/contexts/ThemeContext";

const OPTIONS: { value: Theme; label: string; description: string; icon: typeof Sun }[] = [
  { value: "light", label: "Claro", description: "Fondo claro", icon: Sun },
  { value: "dark", label: "Oscuro", description: "Fondo oscuro", icon: Moon },
  { value: "system", label: "Sistema", description: "Según tu dispositivo", icon: Monitor },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div role="radiogroup" aria-label="Tema de la aplicación" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {OPTIONS.map((option) => {
        const active = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(option.value)}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-violet-500 ${
              active
                ? "border-violet-400 bg-violet-50 text-violet-700"
                : "border-line bg-card text-ink hover:bg-surface"
            }`}
          >
            <option.icon className="h-5 w-5 shrink-0" />
            <span>
              <span className="block text-sm font-medium">{option.label}</span>
              <span className="block text-xs text-ink-muted">{option.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
