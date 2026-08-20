"use client";

import { Property } from "@/types/models";
import { Building2, Home, Building, ArrowUpRight } from "lucide-react";

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

  const badgeColors = [
    { bg: "bg-violet-100", text: "text-violet-600" },
    { bg: "bg-blue-100", text: "text-blue-600" },
    { bg: "bg-teal-100", text: "text-teal-600" },
    { bg: "bg-amber-100", text: "text-amber-600" },
  ];

  return (
    <div className="card-surface-interactive flex flex-col h-full p-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-5 relative z-10">
        <h3 className="text-sm font-medium text-ink-muted">Propiedades</h3>
        <button className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-surface hover:bg-violet-50 text-ink-muted hover:text-violet-600 rounded-full transition-colors">
          Ver todas
          <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-hide relative z-10">
        {properties.length === 0 ? (
          <p className="text-sm text-ink-muted text-center py-4">No hay propiedades registradas.</p>
        ) : (
          properties.map((p, i) => {
            const Icon = getIcon(p.name);
            const badge = badgeColors[i % badgeColors.length];
            return (
              <div key={p.id} className="flex items-center gap-3 group">
                <div className={`w-10 h-10 rounded-xl ${badge.bg} ${badge.text} flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">
                    {p.name}
                  </p>
                  <p className="text-xs text-ink-muted truncate mt-0.5">
                    {p.address || "Sin dirección"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-ink">$ --</p>
                  <p className="text-xs font-medium text-teal-600 mt-0.5">-- %</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
