import React from "react";
import { WIDGET_CATALOG } from "./WidgetRegistry";
import { Plus } from "lucide-react";

interface EditModeSidebarProps {
  currentLayout: any[];
  onAddWidget: (widgetId: string) => void;
}

export function EditModeSidebar({ currentLayout, onAddWidget }: EditModeSidebarProps) {
  // Group widgets by category
  const groupedWidgets = WIDGET_CATALOG.reduce((acc, widget) => {
    if (!acc[widget.category]) {
      acc[widget.category] = [];
    }
    acc[widget.category].push(widget);
    return acc;
  }, {} as Record<string, typeof WIDGET_CATALOG>);

  // Check if a widget is already in the layout
  const isWidgetActive = (id: string) => currentLayout.some((item) => item.i === id);

  return (
    <div className="w-80 h-full flex flex-col bg-obsidian-light/60 border border-white/10 rounded-2xl overflow-hidden glass-panel">
      <div className="p-5 border-b border-white/10">
        <h2 className="text-lg font-bold text-white">Widget Library</h2>
        <p className="text-xs text-slate-400 mt-1">Agrega métricas y gráficas a tu resumen.</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {Object.entries(groupedWidgets).map(([category, widgets]) => (
          <div key={category}>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">{category}</h3>
            <div className="space-y-2">
              {widgets.map((widget) => {
                const active = isWidgetActive(widget.id);
                return (
                  <div 
                    key={widget.id} 
                    className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                      active 
                        ? "bg-white/5 border-white/5 opacity-50" 
                        : "bg-obsidian border-white/10 hover:border-emerald-500/30"
                    }`}
                  >
                    <span className="text-sm font-medium text-slate-200">{widget.title}</span>
                    <button
                      onClick={() => !active && onAddWidget(widget.id)}
                      disabled={active}
                      className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                        active 
                          ? "bg-transparent text-slate-500 cursor-not-allowed" 
                          : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white"
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
