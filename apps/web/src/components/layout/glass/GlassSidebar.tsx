"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Wallet,
  ReceiptText,
  Building2,
  BarChart3,
  Settings,
  Sparkles
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const NAV_ITEMS = [
  { name: "Inicio", href: "/", icon: LayoutDashboard },
  { name: "Ingresos", href: "/income", icon: Wallet },
  { name: "Gastos", href: "/expenses", icon: ReceiptText },
  { name: "Propiedades", href: "/properties", icon: Building2 },
  { name: "Reportes", href: "/reports", icon: BarChart3 },
];

interface GlassSidebarProps {
  onClose?: () => void;
  /** Force full width with labels, used inside the mobile drawer */
  expanded?: boolean;
}

export function GlassSidebar({ onClose, expanded = false }: GlassSidebarProps = {}) {
  const pathname = usePathname();
  const { user } = useAuth();

  // Tablet (md-lg) collapses to an icon rail; desktop (lg+) and the mobile
  // drawer (expanded=true) show the full labeled sidebar.
  const widthClasses = expanded ? "w-64" : "w-20 lg:w-64";
  const labelClasses = expanded ? "inline" : "hidden lg:inline";
  const logoLabelClasses = expanded ? "inline" : "hidden lg:inline";

  return (
    <aside
      className={`${widthClasses} flex flex-col h-full bg-sidebar rounded-3xl shadow-[0_20px_50px_-15px_rgba(20,18,31,0.5)] transition-[width] duration-200 overflow-hidden`}
    >
      {/* Logo Area */}
      <div className={`h-20 flex items-center shrink-0 ${expanded ? "px-6" : "px-4 lg:px-6 justify-center lg:justify-start"}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(124,92,252,0.4)]">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className={`text-xl font-bold tracking-wide text-white ${logoLabelClasses}`}>
            Nomora
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 py-4 space-y-1.5 overflow-y-auto scrollbar-hide ${expanded ? "px-4" : "px-2.5 lg:px-4"}`}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              title={item.name}
              className={`flex items-center gap-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                expanded ? "px-3.5" : "px-3 lg:px-3.5 justify-center lg:justify-start"
              } ${
                isActive
                  ? "bg-violet-600 text-white shadow-[0_4px_14px_rgba(124,92,252,0.35)]"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              <Icon className="w-[18px] h-[18px] shrink-0 transition-transform duration-300 group-hover:scale-110" />
              <span className={`text-sm font-medium whitespace-nowrap ${labelClasses}`}>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Area */}
      <div className={`border-t border-white/[0.06] shrink-0 ${expanded ? "p-4" : "p-2.5 lg:p-4"}`}>
        <Link
          href="/settings"
          onClick={onClose}
          title="Configuración"
          className={`flex items-center gap-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all duration-200 group mb-1 ${
            expanded ? "px-3.5" : "px-3 lg:px-3.5 justify-center lg:justify-start"
          }`}
        >
          <Settings className="w-[18px] h-[18px] shrink-0 transition-transform duration-300 group-hover:rotate-90" />
          <span className={`text-sm font-medium whitespace-nowrap ${labelClasses}`}>Ajustes</span>
        </Link>

        <div className={`flex items-center gap-2.5 pt-3 mt-1 border-t border-white/[0.06] ${expanded ? "" : "justify-center lg:justify-start"}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-slate-800 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {user?.full_name ? user.full_name.substring(0, 2).toUpperCase() : "AD"}
          </div>
          <div className={`min-w-0 ${labelClasses}`}>
            <p className="text-xs font-semibold text-white truncate">{user?.full_name || "Usuario"}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.role || "Admin"}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
