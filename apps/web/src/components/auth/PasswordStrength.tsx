"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Check, X, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Alturas relativas (0-1) de cada barra: crean una forma orgánica tipo
// "monitor de pulso" en vez de barras parejas y aburridas.
const BAR_PATTERN = [0.35, 0.55, 0.4, 0.85, 0.5, 0.65, 1, 0.45, 0.6, 0.75, 0.4, 0.55];

const LEVEL_COLORS = [
  { bar: "#F87171", text: "text-red-400", glow: "rgba(248,113,113,0.35)" },      // muy débil
  { bar: "#FB923C", text: "text-orange-400", glow: "rgba(251,146,60,0.35)" },    // débil
  { bar: "#FBBF24", text: "text-amber-400", glow: "rgba(251,191,36,0.35)" },     // aceptable
  { bar: "#A3E635", text: "text-lime-400", glow: "rgba(163,230,53,0.35)" },      // buena
  { bar: "#34D399", text: "text-emerald-400", glow: "rgba(52,211,153,0.4)" },    // fuerte
];

const LABELS = ["Muy débil", "Débil", "Aceptable", "Buena", "Fuerte"];

export function PasswordStrength({ password }: { password: string }) {
  const checks = useMemo(() => {
    return {
      length: password.length >= 6,
      upper: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };
  }, [password]);

  // score de 0 (vacío) a 4 (todos los criterios). Con longitud extra sumamos
  // un poco más de "energía" al gráfico para que siga reaccionando aunque
  // ya cumpla los 4 criterios básicos.
  const baseScore = Object.values(checks).filter(Boolean).length;
  const lengthBonus = Math.min(Math.max(password.length - 6, 0) / 6, 1); // 0-1
  const strength = Math.min((baseScore + lengthBonus * 0.6) / 4, 1); // 0-1 normalizado

  const level = LEVEL_COLORS[baseScore] ?? LEVEL_COLORS[0];
  const percentage = Math.round(strength * 100);

  // Rastrea la dirección del cambio para mostrar la flecha de tendencia
  const prevScoreRef = useRef(baseScore);
  const [trend, setTrend] = useState<"up" | "down" | "same">("same");
  useEffect(() => {
    if (baseScore > prevScoreRef.current) setTrend("up");
    else if (baseScore < prevScoreRef.current) setTrend("down");
    else setTrend("same");
    prevScoreRef.current = baseScore;
  }, [baseScore]);

  if (!password) return null;

  // Amplitud mínima para que el gráfico nunca se vea totalmente plano,
  // incluso con una contraseña muy débil.
  const amplitude = 0.18 + strength * 0.82;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="mt-2.5 space-y-2.5"
    >
      {/* Gráfico animado tipo "monitor de pulso" */}
      <div className="relative rounded-lg bg-white/5 border border-white/5 px-3 py-2.5 overflow-hidden">
        <div
          className="absolute inset-0 transition-colors duration-500"
          style={{ boxShadow: `inset 0 0 24px ${level.glow}` }}
        />
        <div className="relative flex items-end justify-between gap-[3px] h-9">
          {BAR_PATTERN.map((base, i) => {
            const peak = base * amplitude;
            const valley = peak * 0.45;
            return (
              <motion.div
                key={i}
                className="flex-1 rounded-full origin-bottom"
                style={{ backgroundColor: level.bar }}
                animate={{
                  height: [`${valley * 100}%`, `${peak * 100}%`, `${valley * 100}%`],
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 0.7 + (i % 4) * 0.18,
                  repeat: Infinity,
                  repeatType: "mirror",
                  ease: "easeInOut",
                  delay: i * 0.05,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Etiqueta + porcentaje animados */}
      <div className="flex items-center justify-between">
        <AnimatePresence mode="wait">
          <motion.p
            key={baseScore}
            initial={{ opacity: 0, y: -6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.9 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={`text-xs font-semibold ${level.text}`}
          >
            {LABELS[baseScore] ?? LABELS[0]}
          </motion.p>
        </AnimatePresence>

        <div className="flex items-center gap-1">
          {trend === "up" && <TrendingUp className="w-3 h-3 text-emerald-400" />}
          {trend === "down" && <TrendingDown className="w-3 h-3 text-red-400" />}
          {trend === "same" && <Minus className="w-3 h-3 text-slate-600" />}
          <motion.span
            key={percentage}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`text-xs font-bold tabular-nums ${level.text}`}
          >
            {percentage}%
          </motion.span>
        </div>
      </div>

      {/* Checklist de criterios */}
      <div className="grid grid-cols-2 gap-1">
        {[
          { key: "length", label: "6+ caracteres" },
          { key: "upper", label: "Mayúscula" },
          { key: "number", label: "Número" },
          { key: "special", label: "Carácter especial" },
        ].map((item) => (
          <div key={item.key} className="flex items-center gap-1.5 text-xs">
            {checks[item.key as keyof typeof checks] ? (
              <Check className="w-3 h-3 text-emerald-400" />
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
