"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const subscribeNoop = () => () => {};

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isMounted = useSyncExternalStore(subscribeNoop, () => true, () => false);

  const isDark = resolvedTheme === "dark";
  const label = isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={label}
      title={label}
      className="w-10 h-10 flex items-center justify-center rounded-full bg-card shadow-sm border border-line-soft text-ink-muted hover:text-violet-600 transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-violet-500"
    >
      {isMounted ? (
        isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />
      ) : (
        <span className="w-[18px] h-[18px]" />
      )}
    </button>
  );
}
