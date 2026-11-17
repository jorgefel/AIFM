"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Wallet,
  Building2,
  BarChart3,
  Settings,
  CalendarCheck,
  Calendar,
  Users,
  Zap,
  Plug,
  Crown,
  GitCompareArrows,
  type LucideIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { NonInvasiveSideAd } from "@/components/dashboard/NonInvasiveAds";

interface NavItem {
  name: string;
  icon: LucideIcon;
  href?: string;
  soon?: boolean;
  matchPrefixes?: string[];
  children?: { name: string; href: string }[];
}

const NAV_ITEMS: NavItem[] = [
  { name: "Inicio", href: "/", icon: LayoutDashboard },
  { name: "Propiedades", href: "/properties", icon: Building2 },
  { name: "Comparación", href: "/comparison", icon: GitCompareArrows },
  { name: "Reservas", href: "/reservations", icon: CalendarCheck },
  { name: "Calendario", href: "/calendar", icon: Calendar },
  { name: "Huéspedes", href: "/guests", icon: Users },
  {
    name: "Finanzas",
    href: "/income",
    icon: Wallet,
    matchPrefixes: ["/income", "/expenses"],
    children: [
      { name: "Ingresos", href: "/income" },
      { name: "Gastos", href: "/expenses" },
    ],
  },
  {
    name: "Análisis",
    href: "/analytics",
    icon: BarChart3,
  },
  { name: "Automatizaciones", href: "/automations", icon: Zap },
  { name: "Integraciones", href: "/settings/integrations", icon: Plug },
  { name: "Planes", href: "/plans", icon: Crown },
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
      className={`${widthClasses} flex flex-col h-full bg-sidebar border border-line-soft backdrop-blur-xl rounded-[1.75rem] shadow-[0_24px_60px_-20px_rgba(27,18,56,0.55)] transition-[width] duration-200 overflow-hidden`}
    >
      {/* Logo Area */}
      <div className={`h-20 flex items-center shrink-0 ${expanded ? "px-6" : "px-4 lg:px-6 justify-center lg:justify-start"}`}>
        <div className="flex items-center gap-2.5">
          <div className="hero-orb w-9 h-9 rounded-full shrink-0 shadow-[0_4px_16px_rgba(168,85,247,0.55)]" aria-hidden="true" />
          <span className={`font-display text-xl font-extrabold tracking-tight text-white ${logoLabelClasses}`}>
            Nomora
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 py-4 space-y-1.5 overflow-y-auto scrollbar-hide ${expanded ? "px-4" : "px-2.5 lg:px-4"}`}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const rowClasses = `flex items-center gap-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
            expanded ? "px-3.5" : "px-3 lg:px-3.5 justify-center lg:justify-start"
          }`;

          if (!item.href) {
            return (
              <div
                key={item.name}
                aria-disabled="true"
                title={`${item.name} (próximamente)`}
                className={`${rowClasses} cursor-not-allowed text-sidebar-ink/50`}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />
                <span className={`text-sm font-medium whitespace-nowrap ${labelClasses}`}>{item.name}</span>
                <span className={`ml-auto rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-sidebar-ink ${labelClasses}`}>
                  Pronto
                </span>
              </div>
            );
          }

          const prefixes = item.matchPrefixes ?? [item.href];
          const isActive =
            item.href === "/" ? pathname === "/" : prefixes.some((prefix) => pathname.startsWith(prefix));

          return (
            <div key={item.name}>
              <Link
                href={item.href}
                onClick={onClose}
                title={item.name}
                aria-current={isActive && !item.children ? "page" : undefined}
                className={`${rowClasses} ${
                  isActive
                    ? "bg-gradient-to-r from-violet-500 to-violet-600 text-white shadow-[0_6px_18px_rgba(112,48,239,0.45)]"
                    : "text-sidebar-ink hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                <Icon className="w-[18px] h-[18px] shrink-0 transition-transform duration-300 group-hover:scale-110" />
                <span className={`text-sm font-medium whitespace-nowrap ${labelClasses}`}>{item.name}</span>
              </Link>

              {item.children && isActive && (
                <ul className={`mt-1 ml-5 space-y-0.5 border-l border-white/[0.08] pl-3 ${expanded ? "block" : "hidden lg:block"}`}>
                  {item.children.map((child) => {
                    const childActive = pathname.startsWith(child.href);
                    return (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          onClick={onClose}
                          aria-current={childActive ? "page" : undefined}
                          className={`block rounded-lg px-3 py-1.5 text-[13px] transition-colors ${
                            childActive ? "text-white font-medium" : "text-sidebar-ink/70 hover:text-white"
                          }`}
                        >
                          {child.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {/* Side Ad - Non invasive */}
      <div className={expanded ? "block" : "hidden lg:block"}>
        <NonInvasiveSideAd />
      </div>

      {/* Footer Area */}
      <div className={`border-t border-white/[0.06] shrink-0 ${expanded ? "p-4" : "p-2.5 lg:p-4"}`}>
        <Link
          href="/settings"
          onClick={onClose}
          title="Configuración"
          aria-current={pathname.startsWith("/settings") && !pathname.startsWith("/settings/integrations") ? "page" : undefined}
          className={`flex items-center gap-3 py-2.5 rounded-xl transition-all duration-200 group mb-1 ${
            expanded ? "px-3.5" : "px-3 lg:px-3.5 justify-center lg:justify-start"
          } ${
            pathname.startsWith("/settings") && !pathname.startsWith("/settings/integrations")
              ? "bg-gradient-to-r from-violet-500 to-violet-600 text-white"
              : "text-sidebar-ink hover:text-white hover:bg-white/[0.06]"
          }`}
        >
          <Settings className="w-[18px] h-[18px] shrink-0 transition-transform duration-300 group-hover:rotate-90" />
          <span className={`text-sm font-medium whitespace-nowrap ${labelClasses}`}>Ajustes</span>
        </Link>

        <div className={`flex items-center gap-2.5 pt-3 mt-1 border-t border-white/[0.06] ${expanded ? "" : "justify-center lg:justify-start"}`}>
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-slate-800 flex items-center justify-center text-xs font-bold text-white shrink-0${user?.tier === "pro" ? " ring-2 ring-pink-500 ring-offset-1 ring-offset-transparent shadow-[0_0_12px_rgba(236,72,153,0.5)]" : ""}`}>
            {user?.full_name ? user.full_name.substring(0, 2).toUpperCase() : "AD"}
          </div>
          <div className={`min-w-0 ${labelClasses}`}>
            <p className="text-xs font-semibold text-white truncate">{user?.full_name || "Usuario"}</p>
            <p className="text-[11px] text-sidebar-ink/70 truncate">{user?.role || "Admin"}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
