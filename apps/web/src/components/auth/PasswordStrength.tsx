"use client";

import { useMemo } from "react";
import { Check, X } from "lucide-react";
import { motion } from "framer-motion";

export function PasswordStrength({ password }: { password: string }) {
  const checks = useMemo(() => {
    return {
      length: password.length >= 6,
      upper: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };
  }, [password]);

  const score = Object.values(checks).filter(Boolean).length;
  const colors = ["bg-red-500", "bg-orange-500", "bg-amber-400", "bg-purple-400"];
  const labels = ["Débil", "Aceptable", "Buena", "Fuerte"];

  if (!password) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="mt-2 space-y-2"
    >
      {/* Bar */}
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: i < score ? "100%" : "0%" }}
              className={`h-full rounded-full ${i < score ? colors[score - 1] : ""}`}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            />
          </div>
        ))}
      </div>
      <p className={`text-xs font-medium ${score <= 1 ? "text-red-400" : score === 2 ? "text-amber-400" : "text-purple-400"}`}>
        {labels[score - 1] || "Muy débil"}
      </p>

      {/* Checks */}
      <div className="grid grid-cols-2 gap-1">
        {[
          { key: "length", label: "6+ caracteres" },
          { key: "upper", label: "Mayúscula" },
          { key: "number", label: "Número" },
          { key: "special", label: "Carácter especial" },
        ].map((item) => (
          <div key={item.key} className="flex items-center gap-1.5 text-xs">
            {checks[item.key as keyof typeof checks] ? (
              <Check className="w-3 h-3 text-purple-400" />
            ) : (
              <X className="w-3 h-3 text-slate-600" />
            )}
            <span className={checks[item.key as keyof typeof checks] ? "text-slate-300" : "text-slate-600"}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
