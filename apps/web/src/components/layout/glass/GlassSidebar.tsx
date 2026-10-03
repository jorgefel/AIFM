"use client";

import Link from "next/link";
import { 
  LayoutDashboard, 
  Wallet, 
  ReceiptText, 
  Building2, 
  BarChart3, 
  Settings,
  Crown,
  Hexagon,
  Zap
} from "lucide-react";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { name: "Resumen", href: "/", icon: LayoutDashboard },
  { name: "Ingresos", href: "/income", icon: Wallet },
  { name: "Gastos", href: "/expenses", icon: ReceiptText },
  { name: "Propiedades", href: "/properties", icon: Building2 },
  { name: "Reportes", href: "/reports", icon: BarChart3 },
  { name: "Automatizaciones", href: "/automations", icon: Zap },
  { name: "Planes", href: "/plans", icon: Crown },
];

interface GlassSidebarProps {
  onClose?: () => void;
}

export function GlassSidebar({ onClose }: GlassSidebarProps = {}) {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex flex-col h-full border-r border-white/5 bg-transparent">
      {/* Logo Area */}
      <div className="h-20 flex items-center px-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Hexagon className="w-8 h-8 text-white" />
          <span className="text-xl font-bold tracking-wide text-white">
            Nomora
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 space-y-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                isActive 
                  ? "text-white shadow-[0_4px_15px_rgba(139,92,246,0.3)]" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/80 to-pink-500/80 opacity-90" />
              )}
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white" />
              )}
              <Icon className={`w-5 h-5 relative z-10 transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-white" : ""}`} />
              <span className="font-medium relative z-10">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Area */}
      <div className="p-4 border-t border-white/5">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all duration-200 group"
        >
          <Settings className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" />
          <span className="font-medium">Configuración</span>
        </Link>
      </div>
    </aside>
  );
}
