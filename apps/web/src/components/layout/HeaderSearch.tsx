"use client";

import { useRef, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { useHeaderSearch } from "@/hooks/useHeaderSearch";

export function HeaderSearch() {
  const {
    query,
    setQuery,
    results,
    isSearching,
    showResults,
    setShowResults,
    hasResults
  } = useHeaderSearch();

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setShowResults]);

  return (
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
  );
}
