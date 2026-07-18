"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, ChevronDown, Search, Loader2, Menu, AlertTriangle, TrendingDown, Percent } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { AnimatePresence, motion } from "framer-motion";

interface HeaderProps {
  onMenuClick?: () => void;
}

interface Notification {
  id: string;
  type: "warning" | "info" | "alert";
  title: string;
  message: string;
  icon: React.ReactNode;
}

export function Header({ onMenuClick }: HeaderProps = {}) {
  const { user, logout } = useAuth();
  const { formatCurrency } = useCurrency();
  
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>({ properties: [], reservations: [], expenses: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch financial notifications based on summary data
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data: properties } = await api.get("/properties/");
        if (properties.length === 0) return;

        const date = new Date();
        const notifs: Notification[] = [];

        for (const prop of properties.slice(0, 3)) {
          try {
            const { data: summary } = await api.get(
              `/analysis/summary?property_id=${prop.id}&year=${date.getFullYear()}&month=${date.getMonth() + 1}`
            );

            if (summary.occupancy_rate < 0.3) {
              notifs.push({
                id: `occ-${prop.id}`,
                type: "warning",
                title: `Baja ocupación: ${prop.name}`,
                message: `Solo ${(summary.occupancy_rate * 100).toFixed(0)}% de ocupación este mes.`,
                icon: <Percent className="w-4 h-4 text-amber-400" />,
              });
            }

            if (summary.net_profit < 0) {
              notifs.push({
                id: `loss-${prop.id}`,
                type: "alert",
                title: `Pérdida neta: ${prop.name}`,
                message: `Pérdida de ${formatCurrency(Math.abs(summary.net_profit))} este mes.`,
                icon: <TrendingDown className="w-4 h-4 text-red-400" />,
              });
            }
          } catch {
            // silently skip property
          }
        }

        setNotifications(notifs);
      } catch {
        // No properties or auth error
      }
    };

    fetchNotifications();
  }, []);

  // Search debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsSearching(true);
        try {
          const { data } = await api.get(`/search/?q=${encodeURIComponent(query)}`);
          setResults(data);
          setShowResults(true);
        } catch {
          // search error
        } finally {
          setIsSearching(false);
        }
      } else {
        setResults({ properties: [], reservations: [], expenses: [] });
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const hasResults = results.properties.length > 0 || results.reservations.length > 0 || results.expenses.length > 0;

  return (
    <header className="h-20 flex items-center justify-between px-4 md:px-8 border-b border-white/5 bg-obsidian/50 backdrop-blur-md sticky top-0 z-10">
      {/* Izquierda: Menú Móvil y Buscador */}
      <div className="flex-1 flex items-center gap-4">
        {/* Botón de Menú (Solo en móvil) */}
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Buscador (Oculto en móvil por defecto) */}
        <div className="relative w-full max-w-sm md:w-96 group hidden md:block" ref={searchRef}>
          {isSearching ? (
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400 animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
          )}
          
          <input 
            type="text" 
            placeholder="Buscar reservas, huéspedes o gastos..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (query.trim().length >= 2) setShowResults(true); }}
            className="w-full bg-obsidian-light/50 border border-white/5 rounded-full py-2 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 focus:bg-obsidian-light/80 transition-all placeholder:text-slate-600"
          />

          {/* Dropdown de Resultados */}
          {showResults && (
            <div className="absolute top-full mt-2 w-full max-h-96 overflow-y-auto bg-obsidian border border-white/10 rounded-xl shadow-2xl z-50 p-2">
              {!hasResults && !isSearching && (
                <div className="p-4 text-sm text-slate-500 text-center">No se encontraron resultados</div>
              )}
              
              {results.properties.length > 0 && (
                <div className="mb-2">
                  <h4 className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Propiedades</h4>
                  {results.properties.map((p: any) => (
                    <div key={p.id} className="p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                      <p className="text-sm font-medium text-emerald-400">{p.name}</p>
                      <p className="text-xs text-slate-400">{p.subtitle}</p>
                    </div>
                  ))}
                </div>
              )}

              {results.reservations.length > 0 && (
                <div className="mb-2">
                  <h4 className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Reservas</h4>
                  {results.reservations.map((r: any) => (
                    <div key={r.id} className="p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                      <p className="text-sm font-medium text-blue-400">{r.name}</p>
                      <p className="text-xs text-slate-400">{r.subtitle}</p>
                    </div>
                  ))}
                </div>
              )}

              {results.expenses.length > 0 && (
                <div>
                  <h4 className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Gastos</h4>
                  {results.expenses.map((e: any) => (
                    <div key={e.id} className="p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                      <p className="text-sm font-medium text-coral-accent">{e.name}</p>
                      <p className="text-xs text-slate-400">{e.subtitle}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Derecha: Acciones y Perfil */}
      <div className="flex items-center gap-6">
        {/* Notificaciones */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-coral-accent rounded-full border-2 border-obsidian" />
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="absolute right-0 top-full mt-2 w-80 bg-obsidian border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
              >
                <div className="p-3 border-b border-white/5">
                  <h4 className="text-sm font-semibold text-white">Notificaciones</h4>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-slate-500">
                      Sin alertas por ahora. ¡Todo bien! 🎉
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div key={notif.id} className="p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 shrink-0">{notif.icon}</div>
                          <div>
                            <p className="text-sm font-medium text-slate-200">{notif.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{notif.message}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar Usuario */}
        <div className="flex items-center gap-3 pl-6 border-l border-white/5 cursor-pointer group">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-emerald-500/50 transition-all">
            <span className="text-sm font-bold text-white">
              {user?.full_name ? user.full_name.substring(0,2).toUpperCase() : "AD"}
            </span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-slate-200">{user?.full_name || "Usuario"}</p>
            <button onClick={() => logout()} className="text-xs text-coral-accent hover:underline">
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
