"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, CalendarCheck, GitCompareArrows, LayoutDashboard, Menu, type LucideIcon } from "lucide-react";

const ITEMS: { name: string; href: string; icon: LucideIcon }[] = [
  { name: "Inicio", href: "/", icon: LayoutDashboard },
  { name: "Propiedades", href: "/properties", icon: Building2 },
  { name: "Comparación", href: "/comparison", icon: GitCompareArrows },
  { name: "Reservas", href: "/reservations", icon: CalendarCheck },
];

interface MobileBottomNavProps {
  onMore: () => void;
}

export function MobileBottomNav({ onMore }: MobileBottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line-soft bg-card/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="grid grid-cols-5">
        {ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  active ? "text-violet-600" : "text-ink-muted"
                }`}
              >
                <item.icon className="h-5 w-5" aria-hidden="true" />
                {item.name}
              </Link>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={onMore}
            className="flex w-full flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-ink-muted"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
            Más
          </button>
        </li>
      </ul>
    </nav>
  );
}
