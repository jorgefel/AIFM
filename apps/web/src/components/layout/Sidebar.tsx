import Link from "next/link";
import { 
  LayoutDashboard, 
  Wallet, 
  ReceiptText, 
  Building2, 
  BarChart3, 
  Settings,
  Calculator
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Resumen", href: "/", icon: LayoutDashboard },
  { name: "Ingresos", href: "/income", icon: Wallet },
  { name: "Gastos", href: "/expenses", icon: ReceiptText },
  { name: "Propiedades", href: "/properties", icon: Building2 },
  { name: "Reportes", href: "/reports", icon: BarChart3 },
  { name: "Calculadora ROI", href: "/roi", icon: Calculator },
];

import { usePathname } from "next/navigation";

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps = {}) {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex flex-col h-full border-r border-white/5 bg-obsidian-light/30 backdrop-blur-md">
      {/* Logo Area */}
      <div className="h-20 flex items-center px-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
            <span className="text-obsidian font-extrabold text-xs leading-none tracking-tighter">AI</span>
          </div>
          <span className="text-xl font-bold tracking-wide text-white">
            AI<span className="text-emerald-400">FM</span>
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
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? "bg-emerald-500/10 text-emerald-400" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-emerald-400" : ""}`} />
              <span className="font-medium">{item.name}</span>
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
