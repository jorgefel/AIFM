import React from "react";
import { Move } from "lucide-react";

interface WidgetBaseProps {
  children: React.ReactNode;
  isEditing: boolean;
  className?: string;
  onRemove?: () => void;
}

export function WidgetBase({ children, isEditing, className = "", onRemove }: WidgetBaseProps) {
  return (
    <div 
      className={`relative h-full w-full rounded-2xl glass-panel overflow-hidden transition-colors duration-200 ${
        isEditing ? "border-2 border-dashed border-emerald-500/70 shadow-[0_0_15px_rgba(16,185,129,0.15)] bg-obsidian-light/60" : "border border-white/10"
      } ${className}`}
    >
      {isEditing && (
        <>
          {/* Drag Handle (Centro Arriba) */}
          <div 
            className="drag-handle absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-emerald-500 rounded flex items-center justify-center cursor-move z-20 shadow-lg shadow-emerald-500/30"
          >
            <Move className="w-3.5 h-3.5 text-white" />
          </div>

          {/* Botón Eliminar (Esquina Superior Derecha) */}
          {onRemove && (
            <button 
              onClick={onRemove}
              className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center cursor-pointer z-20 shadow-lg shadow-rose-500/30 text-white hover:bg-rose-600 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}

          {/* El Resize Handle (Esquina Inferior Derecha) 
              react-grid-layout inyecta su propio span con clase .react-resizable-handle,
              lo estilizaremos globalmente en globals.css o aquí.
          */}
        </>
      )}
      
      <div className="w-full h-full overflow-hidden p-6">
        {children}
      </div>
    </div>
  );
}
