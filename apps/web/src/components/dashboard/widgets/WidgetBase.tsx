import React from "react";

interface WidgetBaseProps {
  children: React.ReactNode;
  className?: string;
}

export function WidgetBase({ children, className = "" }: WidgetBaseProps) {
  return (
    <div 
      className={`relative h-full w-full rounded-2xl glass-panel overflow-hidden transition-colors duration-200 border border-white/10 ${className}`}
    >
      <div className="w-full h-full overflow-hidden p-6">
        {children}
      </div>
    </div>
  );
}
