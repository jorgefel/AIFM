import { Bell, ChevronDown, Search } from "lucide-react";

export function Header() {
  return (
    <header className="h-20 flex items-center justify-between px-8 border-b border-white/5 bg-obsidian/50 backdrop-blur-md sticky top-0 z-10">
      {/* Izquierda: Buscador o Título Dinámico */}
      <div className="flex-1 flex items-center">
        <div className="relative w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar transacciones, propiedades..." 
            className="w-full bg-obsidian-light/50 border border-white/5 rounded-full py-2 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 focus:bg-obsidian-light/80 transition-all placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* Derecha: Acciones y Perfil */}
      <div className="flex items-center gap-6">
        
        {/* Selector de Propiedad Activa */}
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-obsidian-light/40 border border-white/5 hover:bg-obsidian-light/80 transition-colors">
          <span className="text-sm font-medium text-slate-300">Villa Tulum</span>
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </button>

        {/* Notificaciones */}
        <button className="relative p-2 text-slate-400 hover:text-emerald-400 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-coral-accent rounded-full border-2 border-obsidian"></span>
        </button>

        {/* Avatar Usuario */}
        <div className="flex items-center gap-3 pl-6 border-l border-white/5 cursor-pointer group">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-emerald-500/50 transition-all">
            <span className="text-sm font-bold text-white">JF</span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-slate-200">Jorge F.</p>
            <p className="text-xs text-slate-500">Administrador</p>
          </div>
        </div>
      </div>
    </header>
  );
}
