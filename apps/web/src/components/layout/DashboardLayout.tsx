import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-obsidian">
      <Sidebar />
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Decoración de fondo (Brillo Esmeralda suave) */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-900/10 blur-[100px] pointer-events-none" />
        
        <Header />
        
        <main className="flex-1 overflow-y-auto p-8 relative z-1">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
