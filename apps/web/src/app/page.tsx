"use client";

import { useState, useEffect, useRef } from "react";
import { DashboardLayout as AppLayout } from "@/components/layout/DashboardLayout";
import { Filter, Download, Sparkles, Building2, Settings2, Check } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { motion } from "framer-motion";

// React Grid Layout
import { Responsive as ResponsiveGridLayout, Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

// Hooks
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAIReport } from "@/hooks/useAIReport";
import { useDashboardLayout } from "@/hooks/useDashboardLayout";

// Components
import { AIReportModal } from "@/components/dashboard/AIReportModal";
import { WIDGET_COMPONENTS, WIDGET_CATALOG } from "@/components/dashboard/WidgetRegistry";
import { EditModeSidebar } from "@/components/dashboard/EditModeSidebar";

export default function Home() {
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [currentLayout, setCurrentLayout] = useState<any[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [gridWidth, setGridWidth] = useState(1200);
  
  const {
    properties,
    selectedPropertyId,
    setSelectedPropertyId,
    isLoading: isDataLoading
  } = useDashboardData();

  const {
    layout: savedLayout,
    isLoading: isLayoutLoading,
    saveLayout
  } = useDashboardLayout();

  const {
    isReportModalOpen,
    setIsReportModalOpen,
    reportState,
    reportResult,
    reportError,
    generateReport
  } = useAIReport();

  // Initialize currentLayout from savedLayout when it loads
  useEffect(() => {
    if (savedLayout && savedLayout.length > 0 && !isEditing) {
      setCurrentLayout(savedLayout);
    }
  }, [savedLayout, isEditing]);

  // Track container width for ResponsiveGridLayout
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries.length > 0) {
        setGridWidth(entries[0].contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const onLayoutChange = (newLayout: any) => {
    if (isEditing) {
      setCurrentLayout(newLayout);
    }
  };

  const handleAddWidget = (widgetId: string) => {
    const catalogItem = WIDGET_CATALOG.find(w => w.id === widgetId);
    if (!catalogItem) return;

    // Find the next available Y position (rough calculation)
    const maxY = currentLayout.reduce((max, item: any) => Math.max(max, (item.y || 0) + (item.h || 0)), 0);

    const newItem: any = {
      i: widgetId,
      x: 0,
      y: maxY,
      w: catalogItem.defaultW,
      h: catalogItem.defaultH,
      minW: catalogItem.minW,
      minH: catalogItem.minH
    };

    setCurrentLayout([...currentLayout, newItem]);
  };

  const handleRemoveWidget = (widgetId: string) => {
    setCurrentLayout(currentLayout.filter((w: any) => w.i !== widgetId));
  };

  const handleSaveLayout = async () => {
    setIsEditing(false);
    await saveLayout(currentLayout);
  };

  // Export CSV Action
  const handleExportCSV = async () => {
    if (!selectedPropertyId) return;
    try {
      const response = await api.get(`/export/csv?property_id=${selectedPropertyId}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `export_${selectedPropertyId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Error de exportación", "No se pudieron exportar los datos.");
    }
  };

  const isLoading = isDataLoading || isLayoutLoading;

  return (
    <AppLayout>
      {/* Top Banner for Edit Mode */}
      {isEditing && (
        <div className="absolute top-0 left-0 right-0 h-14 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between px-8 z-50 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-emerald-400 font-semibold">Modo Edición: Diseño</span>
          </div>
          <p className="text-sm text-slate-300 hidden md:block">Arrastra para reposicionar, usa la esquina inferior para redimensionar.</p>
          <button 
            onClick={handleSaveLayout}
            className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Guardar Diseño
          </button>
        </div>
      )}

      <div className={isEditing ? "mt-8" : ""}>
        {/* Header de la vista */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Resumen Financiero
            </h1>
            <p className="text-slate-400 mt-1">
              Métricas clave y rendimiento de tus propiedades.
            </p>
          </div>
          <div className="flex gap-3 items-center">
            {properties.length > 0 && (
              <div className="flex items-center bg-obsidian-light/50 border border-white/10 rounded-lg px-3 py-1">
                <Filter className="w-4 h-4 text-slate-400 mr-2" />
                <select 
                  className="bg-transparent text-white text-sm focus:outline-none border-none py-1"
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                >
                  {properties.map(p => (
                    <option key={p.id} value={p.id} className="bg-obsidian">{p.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            <button 
              onClick={handleExportCSV}
              disabled={!selectedPropertyId || isLoading || isEditing}
              className="flex items-center px-4 py-2 text-sm font-medium text-slate-300 bg-obsidian-light/40 border border-white/10 rounded-lg hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Exportar CSV</span>
            </button>

            <button 
              onClick={() => generateReport(selectedPropertyId)}
              disabled={!selectedPropertyId || isLoading || isEditing}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-500/20 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.15)] disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 mr-2 text-emerald-400" />
              <span className="hidden md:inline">Reporte IA</span>
            </button>

            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                disabled={isLoading}
                className="flex items-center px-3 py-2 text-sm font-medium text-slate-300 bg-obsidian-light/40 border border-white/10 rounded-lg hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50 ml-2"
                title="Editar Diseño"
              >
                <Settings2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {!selectedPropertyId && !isLoading && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-12 rounded-2xl glass-panel border border-white/10 flex flex-col items-center justify-center text-center"
          >
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Bienvenido a AIFM</h3>
            <p className="text-slate-400 max-w-md">
              Aún no tienes propiedades registradas. Para comenzar a ver tu resumen financiero y estadísticas, primero añade tu primera propiedad.
            </p>
            <button onClick={() => window.location.href='/properties'} className="mt-6 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors shadow-lg shadow-emerald-500/20">
              Añadir Propiedad
            </button>
          </motion.div>
        )}

        {/* Contenedor Principal: Grid + Sidebar en modo edición */}
        <div className="flex gap-6 mt-2 relative">
          <div className="flex-1 min-w-0" ref={containerRef}>
            {isLoading ? (
              <div className="w-full h-[600px] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
              </div>
            ) : (() => {
                const Grid: any = ResponsiveGridLayout;
                return (
                  <Grid
                    width={gridWidth}
                    className={`layout ${isEditing ? 'is-editing' : ''}`}
                    layouts={{ lg: currentLayout, md: currentLayout, sm: currentLayout }}
                    breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                    cols={{ lg: 4, md: 4, sm: 2, xs: 1, xxs: 1 }}
                    rowHeight={150}
                    onLayoutChange={onLayoutChange}
                    isDraggable={isEditing}
                    isResizable={isEditing}
                    draggableHandle=".drag-handle"
                    margin={[24, 24]}
                    containerPadding={[0, 0]}
                    useCSSTransforms={true}
                  >
                    {currentLayout.map((item) => {
                      const WidgetComponent = WIDGET_COMPONENTS[item.i];
                      if (!WidgetComponent) return null;
                      return (
                        <div key={item.i}>
                          <WidgetComponent 
                            isEditing={isEditing} 
                            onRemove={isEditing ? () => handleRemoveWidget(item.i) : undefined} 
                          />
                        </div>
                      );
                    })}
                  </Grid>
                );
              })()}
          </div>

          {/* Sidebar en modo edición */}
          {isEditing && (
            <div className="hidden xl:block shrink-0 h-[calc(100vh-140px)] sticky top-6">
              <EditModeSidebar 
                currentLayout={currentLayout} 
                onAddWidget={handleAddWidget} 
              />
            </div>
          )}
        </div>
      </div>

      {/* Modal del Reporte IA */}
      <AIReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        reportState={reportState} 
        reportResult={reportResult} 
        reportError={reportError} 
      />

    </AppLayout>
  );
}

