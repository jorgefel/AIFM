"use client";

import { Property } from "@/types/models";
import { Building2, Home, Building } from "lucide-react";

interface GlassPropertiesProps {
  properties: Property[];
}

export function GlassProperties({ properties }: GlassPropertiesProps) {
  // Select an icon based on name/type
  const getIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('apto') || lower.includes('apartamento')) return Building2;
    if (lower.includes('casa')) return Home;
    return Building;
  };

  return (
    <div className="flex flex-col h-full p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.04] transition-colors relative overflow-hidden">
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h3 className="text-lg font-medium text-slate-300">Propiedades</h3>
        <div className="flex gap-2">
          <div className="px-3 py-1 text-xs font-medium bg-white/10 text-white rounded-full">
            Activas
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-hide relative z-10">
        {properties.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No hay propiedades registradas.</p>
        ) : (
          properties.map(p => {
            const Icon = getIcon(p.name);
            return (
              <div key={p.id} className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-colors shrink-0">
                  <Icon className="w-5 h-5 text-slate-300 group-hover:text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200 truncate group-hover:text-white transition-colors">
                    {p.name}
                  </p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {p.address || "Sin dirección"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {/* Mocked value since it's not in the model */}
                  <p className="text-sm font-medium text-white">$ --</p>
                  <p className="text-xs font-medium text-emerald-400 mt-0.5">-- %</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
