import Link from "next/link";
import { 
  LayoutDashboard, 
  Wallet, 
  ReceiptText, 
  Building2, 
  BarChart3, 
  Settings
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Resumen", href: "/", icon: LayoutDashboard },
  { name: "Ingresos", href: "/income", icon: Wallet },
  { name: "Gastos", href: "/expenses", icon: ReceiptText },
  { name: "Propiedades", href: "/properties", icon: Building2 },
  { name: "Reportes", href: "/reports", icon: BarChart3 },
];

export function Sidebar() {
  return (
    <aside className="w-64 flex flex-col h-screen border-r border-white/5 bg-obsidian-light/30 backdrop-blur-md">
      {/* Logo Area */}
      <div className="h-20 flex items-center px-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
            <span className="text-obsidian font-bold text-xl leading-none">A</span>
          </div>
          <span className="text-xl font-bold tracking-wide text-white">
            Luxe<span className="text-emerald-400">Ledger</span>
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 space-y-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          // TODO: Mover el estado activo a un hook de Next.js (usePathname)
          const isActive = item.href === "/"; 
          
          return (
            <Link
              key={item.name}
              href={item.href}
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
