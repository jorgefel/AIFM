import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ArrowUpRight, ArrowDownRight, DollarSign, Users, Activity } from "lucide-react";

export default function Home() {
  return (
    <DashboardLayout>
      {/* Header de la vista */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Resumen Financiero
          </h1>
          <p className="text-slate-400 mt-1">
            Métricas clave y rendimiento de tus propiedades.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 text-sm font-medium text-slate-300 bg-obsidian-light/50 border border-white/5 rounded-lg hover:bg-obsidian-light transition-colors">
            Últimos 30 días
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-emerald-500/20 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            Generar Reporte
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Tarjeta 1: Ingresos Totales */}
        <div className="glass-panel-interactive p-6 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/20">
              <ArrowUpRight className="w-3 h-3" />
              <span>+12.5%</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400 mb-1">Ingresos Brutos</p>
            <h3 className="text-3xl font-bold text-white tracking-tight">$14,250.00</h3>
          </div>
        </div>

        {/* Tarjeta 2: Ganancia Neta */}
        <div className="glass-panel-interactive p-6 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl group-hover:bg-teal-500/20 transition-all"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-teal-500/10 rounded-lg border border-teal-500/20">
              <Activity className="w-5 h-5 text-teal-400" />
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/20">
              <ArrowUpRight className="w-3 h-3" />
              <span>+8.2%</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400 mb-1">Ganancia Neta</p>
            <h3 className="text-3xl font-bold text-gradient-emerald tracking-tight">$9,840.00</h3>
          </div>
        </div>

        {/* Tarjeta 3: Gastos Operativos */}
        <div className="glass-panel-interactive p-6 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-coral-accent/5 rounded-full blur-2xl group-hover:bg-coral-accent/10 transition-all"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-obsidian-light rounded-lg border border-white/5">
              <ArrowDownRight className="w-5 h-5 text-coral-accent" />
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-coral-accent/10 text-coral-accent text-xs font-semibold rounded-full border border-coral-accent/20">
              <ArrowUpRight className="w-3 h-3" />
              <span>+2.1%</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400 mb-1">Gastos (Fees, Limpieza)</p>
            <h3 className="text-3xl font-bold text-slate-200 tracking-tight">$4,410.00</h3>
          </div>
        </div>

        {/* Tarjeta 4: Ocupación */}
        <div className="glass-panel-interactive p-6 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-obsidian-light text-slate-400 text-xs font-semibold rounded-full border border-white/5">
              <span>Estable</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400 mb-1">Tasa de Ocupación</p>
            <h3 className="text-3xl font-bold text-white tracking-tight">82%</h3>
          </div>
        </div>
      </div>

      {/* Área Principal de Gráficas y Listas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
        {/* Gráfica de Rendimiento Anual */}
        <div className="lg:col-span-2 glass-panel p-6 h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Rendimiento Mensual</h3>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> Ingresos</div>
              <div className="flex items-center gap-1 ml-2"><div className="w-2 h-2 rounded-full bg-coral-accent"></div> Gastos</div>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center border border-white/5 border-dashed rounded-xl bg-obsidian-light/20">
            <p className="text-slate-500 text-sm">Área de renderizado de Recharts / Tremor (Pendiente)</p>
          </div>
        </div>

        {/* Transacciones Recientes */}
        <div className="glass-panel p-6 h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Actividad Reciente</h3>
            <button className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
              Ver todo
            </button>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
            
            {/* Item 1 */}
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer border border-transparent hover:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <ArrowDownRight className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">Reserva: Villa Tulum</p>
                  <p className="text-xs text-slate-500">Hoy, 10:23 AM (Airbnb)</p>
                </div>
              </div>
              <p className="text-sm font-bold text-emerald-400">+$850.00</p>
            </div>

            {/* Item 2 */}
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer border border-transparent hover:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-coral-accent/10 flex items-center justify-center text-coral-accent">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">Mantenimiento AC</p>
                  <p className="text-xs text-slate-500">Ayer, 14:00 PM</p>
                </div>
              </div>
              <p className="text-sm font-bold text-slate-300">-$120.00</p>
            </div>

            {/* Item 3 */}
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer border border-transparent hover:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <ArrowDownRight className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">Reserva: CDMX Loft</p>
                  <p className="text-xs text-slate-500">Hace 2 días (Booking)</p>
                </div>
              </div>
              <p className="text-sm font-bold text-emerald-400">+$450.00</p>
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
