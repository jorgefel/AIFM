"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
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
    <div className="relative w-full md:max-w-sm md:w-96 group" ref={searchRef}>
      {isSearching ? (
        <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-500 animate-spin" />
      ) : (
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted group-focus-within:text-violet-500 transition-colors" />
      )}
      
      <input 
        type="text" 
        placeholder="Buscar propiedades, ingresos o gastos..." 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => { if (query.trim().length >= 2) setShowResults(true); }}
        className="w-full bg-card border border-line-soft shadow-sm rounded-full py-2.5 pl-9 pr-4 text-sm text-ink focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 transition-all placeholder:text-ink-muted/70"
      />

      {showResults && (
        <div className="absolute top-full mt-2 w-full max-h-96 overflow-y-auto bg-card border border-line-soft rounded-xl shadow-xl z-50 p-2">
          {!hasResults && !isSearching && (
            <div className="p-4 text-sm text-ink-muted text-center">No se encontraron resultados</div>
          )}
          
          {results.properties.length > 0 && (
            <div className="mb-2">
              <h4 className="px-2 text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">Propiedades</h4>
              {results.properties.map((p: any) => (
                <Link
                  key={p.id}
                  href={`/properties/${p.id}`}
                  onClick={() => setShowResults(false)}
                  className="block p-2 hover:bg-surface rounded-lg cursor-pointer transition-colors"
                >
                  <p className="text-sm font-medium text-violet-600">{p.name}</p>
                  <p className="text-xs text-ink-muted">{p.subtitle}</p>
                </Link>
              ))}
            </div>
          )}

          {results.reservations.length > 0 && (
            <div className="mb-2">
              <h4 className="px-2 text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">Reservas</h4>
              {results.reservations.map((r: any) => (
                <Link
                  key={r.id}
                  href="/income"
                  onClick={() => setShowResults(false)}
                  className="block p-2 hover:bg-surface rounded-lg cursor-pointer transition-colors"
                >
                  <p className="text-sm font-medium text-blue-600">{r.name}</p>
                  <p className="text-xs text-ink-muted">{r.subtitle}</p>
                </Link>
              ))}
            </div>
          )}

          {results.expenses.length > 0 && (
            <div>
              <h4 className="px-2 text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">Gastos</h4>
              {results.expenses.map((e: any) => (
                <Link
                  key={e.id}
                  href="/expenses"
                  onClick={() => setShowResults(false)}
                  className="block p-2 hover:bg-surface rounded-lg cursor-pointer transition-colors"
                >
                  <p className="text-sm font-medium text-coral-accent">{e.name}</p>
                  <p className="text-xs text-ink-muted">{e.subtitle}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
