"use client";

import { motion } from "framer-motion";
import PixelBlast from "../PixelBlast";

/**
 * Ilustración estilizada de una villa con piscina de noche, generada en SVG.
 * No depende de una imagen externa, así que siempre carga sin conexión a
 * internet ni riesgo de enlaces rotos.
 */
export function AuthShowcasePanel() {
  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-[#0B0A14] via-[#151329] to-[#1B1440]">
      {/* Fondo animado de partículas */}
      <div className="absolute inset-0 opacity-70">
        <PixelBlast
          variant="circle"
          pixelSize={4}
          color="#7C5CFC"
          patternScale={3}
          patternDensity={0.9}
          pixelSizeJitter={0.05}
          enableRipples
          rippleSpeed={0.3}
          rippleThickness={0.12}
          rippleIntensityScale={1}
          liquid={false}
          speed={0.3}
          edgeFade={0.4}
          transparent
        />
      </div>

      {/* Manchas de luz violeta/cian */}
      <motion.div
        animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.08, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] right-[-10%] w-[55%] h-[55%] rounded-full bg-violet-500/30 blur-[100px] pointer-events-none"
      />
      <motion.div
        animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.1, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[5%] left-[-5%] w-[45%] h-[45%] rounded-full bg-cyan-400/20 blur-[100px] pointer-events-none"
      />

      {/* Ilustración SVG: villa + piscina de noche */}
      <svg
        viewBox="0 0 600 700"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-0 w-full h-full"
      >
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1B1440" stopOpacity="0" />
            <stop offset="100%" stopColor="#0B0A14" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#7C5CFC" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id="villa" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2A2547" />
            <stop offset="100%" stopColor="#181530" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="600" height="700" fill="url(#sky)" />

        {/* Estrellas */}
        {Array.from({ length: 26 }).map((_, i) => (
          <circle
            key={i}
            cx={(i * 137) % 600}
            cy={(i * 53) % 260}
            r={i % 5 === 0 ? 1.6 : 0.9}
            fill="#fff"
            opacity={0.15 + (i % 4) * 0.12}
          />
        ))}

        {/* Silueta de la villa */}
        <g>
          <rect x="90" y="360" width="420" height="150" rx="10" fill="url(#villa)" />
          <rect x="120" y="300" width="220" height="70" rx="8" fill="url(#villa)" />
          {/* Ventanas iluminadas */}
          {[150, 195, 240, 285].map((x, i) => (
            <rect key={i} x={x} y="390" width="26" height="34" rx="3" fill="#FCD34D" opacity={i === 2 ? 0.9 : 0.55} />
          ))}
          {[145, 195, 245, 295].map((x, i) => (
            <rect key={`u-${i}`} x={x} y="318" width="22" height="28" rx="3" fill="#67E8F9" opacity={0.5} />
          ))}
        </g>

        {/* Piscina */}
        <ellipse cx="300" cy="560" rx="230" ry="70" fill="url(#water)" />
        <ellipse cx="300" cy="560" rx="230" ry="70" fill="none" stroke="#67E8F9" strokeOpacity="0.4" strokeWidth="2" />

        {/* Reflejos en el agua */}
        {[0, 1, 2, 3].map((i) => (
          <motion.line
            key={i}
            x1={190 + i * 60}
            y1={520 + i * 4}
            x2={190 + i * 60}
            y2={600 - i * 4}
            stroke="#A78BFA"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.35"
            animate={{ opacity: [0.2, 0.45, 0.2] }}
            transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
          />
        ))}

        {/* Palmeras */}
        <g opacity="0.9">
          <path d="M60 620 Q 55 520 40 470" stroke="#181530" strokeWidth="8" fill="none" strokeLinecap="round" />
          <path d="M40 470 Q -10 450 -30 480" stroke="#181530" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M40 470 Q 90 445 110 470" stroke="#181530" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M40 470 Q 20 420 -10 410" stroke="#181530" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M40 470 Q 60 415 95 415" stroke="#181530" strokeWidth="6" fill="none" strokeLinecap="round" />
        </g>
        <g opacity="0.9">
          <path d="M545 640 Q 552 540 565 490" stroke="#181530" strokeWidth="8" fill="none" strokeLinecap="round" />
          <path d="M565 490 Q 615 468 635 498" stroke="#181530" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M565 490 Q 515 465 495 490" stroke="#181530" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M565 490 Q 585 438 615 428" stroke="#181530" strokeWidth="6" fill="none" strokeLinecap="round" />
        </g>
      </svg>

      {/* Tarjeta flotante decorativa */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.5, ease: "easeOut" }}
        className="absolute bottom-8 right-8 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-5 py-4 shadow-2xl hidden lg:block"
      >
        <p className="text-[11px] text-violet-200 uppercase tracking-wider font-medium">Villa Paradise</p>
        <p className="text-2xl font-bold text-white mt-0.5">$450<span className="text-sm font-normal text-violet-200">/noche</span></p>
        <div className="flex items-center gap-1.5 mt-2">
          <div className="flex -space-x-1.5">
            {["A", "B", "C"].map((l) => (
              <div key={l} className="w-5 h-5 rounded-full bg-violet-400/60 border border-white/20 flex items-center justify-center text-[9px] text-white font-bold">
                {l}
              </div>
            ))}
          </div>
          <span className="text-[11px] text-violet-200">4.9 · 32 reservas</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
        className="absolute top-8 left-8 bg-white/10 backdrop-blur-md border border-white/15 rounded-full px-4 py-2 shadow-xl hidden lg:flex items-center gap-2"
      >
        <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
        <span className="text-xs text-white font-medium">+12.5% este mes</span>
      </motion.div>
    </div>
  );
}
