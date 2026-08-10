"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { DashboardLayout as AppLayout } from "@/components/layout/DashboardLayout";
import { Filter, Download, Sparkles, Building2, Settings2, Check, ChevronDown, RotateCcw } from "lucide-react";
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
import { WIDGET_COMPONENTS, WIDGET_CATALOG, DEFAULT_LAYOUT } from "@/components/dashboard/WidgetRegistry";
import { EditModeSidebar } from "@/components/dashboard/EditModeSidebar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function Home() {
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [currentLayout, setCurrentLayout] = useState<any[]>([]);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [gridWidth, setGridWidth] = useState(0);
  const [isPropertyDropdownOpen, setIsPropertyDropdownOpen] = useState(false);
  
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

  // Initialize currentLayout from savedLayout ONLY on first load
  const [layoutInitialized, setLayoutInitialized] = useState(false);
  useEffect(() => {
    if (!layoutInitialized && savedLayout && savedLayout.length > 0) {
      setCurrentLayout(savedLayout);
      setLayoutInitialized(true);
    }
  }, [savedLayout, layoutInitialized]);

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

  // Memoize layouts to prevent react-grid-layout from re-initializing on every render
  const gridLayouts = useMemo(() => ({
    lg: currentLayout,
    md: currentLayout,
    sm: currentLayout,
  }), [currentLayout]);

  const onLayoutChange = useCallback((newLayout: any, _allLayouts?: any) => {
    if (isEditing) {
      setCurrentLayout(newLayout);
    }
  }, [isEditing]);

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
    // Save layout first — ensures SWR cache is updated before exiting edit mode
    await saveLayout(currentLayout);
    setIsEditing(false);
  };

  const handleResetLayout = async () => {
    setCurrentLayout(DEFAULT_LAYOUT);
    await saveLayout(DEFAULT_LAYOUT);
    setIsResetDialogOpen(false);
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
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsResetDialogOpen(true)}
              className="px-4 py-1.5 bg-obsidian border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Restablecer</span>
            </button>
            <button 
              onClick={handleSaveLayout}
              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Guardar Diseño
            </button>
          </div>
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
              <div className="relative">
                <button 
                  onClick={() => setIsPropertyDropdownOpen(!isPropertyDropdownOpen)}
                  disabled={isLoading || isEditing}
                  className="flex items-center justify-between w-48 bg-obsidian-light/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center truncate">
                    <Filter className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0" />
                    <span className="truncate">
                      {properties.find(p => p.id === selectedPropertyId)?.name || "Seleccionar..."}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 ml-2 transition-transform duration-200 flex-shrink-0 ${isPropertyDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isPropertyDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsPropertyDropdownOpen(false)}
                    />
                    <div className="absolute top-full left-0 mt-2 w-48 bg-obsidian-light border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden py-1">
                      {properties.map(p => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSelectedPropertyId(p.id);
                            setIsPropertyDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                            selectedPropertyId === p.id 
                              ? "bg-emerald-500/10 text-emerald-400 font-medium" 
                              : "text-slate-300 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <span className="truncate block">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
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
          <div className="flex-1 min-w-0 overflow-hidden" ref={containerRef}>
            {(isLoading || gridWidth === 0) ? (
              <div className="w-full h-[600px] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
              </div>
            ) : (() => {
                const Grid: any = ResponsiveGridLayout;
                return (
                  <Grid
                    width={gridWidth}
                    className={`layout ${isEditing ? 'is-editing' : ''}`}
                    layouts={gridLayouts}
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

      {/* Modal de Restablecer Diseño */}
      <ConfirmDialog
        isOpen={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        onConfirm={handleResetLayout}
        title="¿Restablecer el diseño?"
        message="Esto eliminará tu personalización actual y devolverá todos los widgets a su disposición original."
        confirmLabel="Restablecer"
      />
    </AppLayout>
  );
}

