"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Send, Bot, ShieldAlert, Sparkles, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { PROPERTIES_QUERY_KEY } from "@/hooks/useProperties";
import type { Property } from "@/types/models";


interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata_json?: any;
  created_at?: string;
}



export function AIChatCopilot() {
  const { user, isPro, isDemoMode } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [propertyId, setPropertyId] = useState<string>("all");
  const [period, setPeriod] = useState<string>("current_month");
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Load properties
  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: PROPERTIES_QUERY_KEY,
    queryFn: async () => {
      if (isDemoMode) {
        const { DEMO_PROPERTIES } = await import("@/lib/demoData");
        return DEMO_PROPERTIES;
      }
      const res = await api.get("/properties/");
      return res.data;
    },
  });

  const chatMutation = useMutation({
    mutationFn: async (msg: string) => {
      if (isDemoMode) {
        await new Promise((r) => setTimeout(r, 600));
        return {
          id: `msg-${Date.now()}`,
          role: "assistant",
          content: `He analizado las métricas de tu portafolio para este periodo. Tus ingresos se mantienen estables con una ocupación promedio cercana al 72%. Te recomiendo revisar las tarifas por noche en temporadas de alta demanda para maximizar el margen de beneficio.`,
          metadata_json: { source: "Simulador IA", period },
          session_id: "demo-session"
        };
      }

      const payload: any = { message: msg, period };
      if (propertyId !== "all") payload.property_id = propertyId;
      if (sessionId) payload.session_id = sessionId;
      
      const res = await api.post("/chat/", payload);
      return res.data;
    },
    onSuccess: (data) => {
      if (!sessionId && data.session_id) setSessionId(data.session_id);
      setMessages(prev => [...prev, data]);
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (error: any) => {
      setMessages(prev => [...prev, {
        id: "err", role: "assistant", 
        content: `Error: ${error.response?.data?.detail || "No pudimos conectar con el Asistente IA. Por favor intenta de nuevo."}` 
      }]);
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;
    
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };
    
    setMessages(prev => [...prev, newMsg]);
    setInput("");
    chatMutation.mutate(input);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Botón flotante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-emerald-400 text-obsidian shadow-lg shadow-emerald-500/20 transition-transform hover:scale-110 active:scale-95"
        >
          <Sparkles className="h-6 w-6" />
        </button>
      )}

      {/* Ventana de Chat */}
      {isOpen && (
        <div className="flex h-[600px] max-h-[80vh] w-[380px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-obsidian/95 shadow-2xl backdrop-blur-xl transition-all">
          {/* Cabecera */}
          <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Copiloto IA</h3>
                <p className="text-[10px] text-emerald-400">
                  {user?.ai_usage_count ?? 0} / {user?.ai_limit_monthly ?? 0} usos este mes
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Filtros de Contexto */}
          <div className="flex gap-2 border-b border-white/5 bg-black/20 p-2">
            <select 
              value={propertyId} 
              onChange={(e) => { setPropertyId(e.target.value); setSessionId(null); setMessages([]); }}
              className="w-1/2 rounded-lg border border-white/10 bg-obsidian-light/50 px-2 py-1.5 text-xs text-white outline-none focus:border-emerald-400/50"
            >
              <option value="all">Todo el portafolio</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select 
              value={period} 
              onChange={(e) => { setPeriod(e.target.value); setSessionId(null); setMessages([]); }}
              className="w-1/2 rounded-lg border border-white/10 bg-obsidian-light/50 px-2 py-1.5 text-xs text-white outline-none focus:border-emerald-400/50"
            >
              <option value="current_month">Este mes</option>
              <option value="last_month">Mes pasado</option>
            </select>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <Sparkles className="mb-3 h-8 w-8 text-emerald-400/50" />
                <p className="text-sm font-medium text-white">¿En qué te ayudo hoy?</p>
                <p className="mt-1 text-xs text-slate-400">Analizo tus ingresos, gastos y ocupación en tiempo real.</p>
                
                <div className="mt-6 flex w-full flex-col gap-2">
                  <button onClick={() => { setInput("Dime mis ingresos netos vs gastos y si hay alertas."); }} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/10 transition-colors">
                    "Dime mis ingresos netos vs gastos y si hay alertas."
                  </button>
                  <button onClick={() => { setInput("¿Qué recomendaciones me das para mejorar mi ocupación?"); }} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/10 transition-colors">
                    "¿Qué recomendaciones me das para mejorar mi ocupación?"
                  </button>
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${msg.role === "user" ? "bg-emerald-500 text-obsidian rounded-br-none" : "bg-white/10 text-slate-200 rounded-bl-none"}`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                  {msg.role === "assistant" && msg.metadata_json?.source && (
                    <span className="mt-1 flex items-center gap-1 text-[9px] text-slate-500">
                      <ShieldAlert className="h-2.5 w-2.5" /> 
                      Fuente: {msg.metadata_json.source} · {msg.metadata_json.period}
                    </span>
                  )}
                </div>
              ))
            )}
            
            {chatMutation.isPending && (
              <div className="flex items-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-none bg-white/5 px-4 py-3 text-sm text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                  Analizando...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="border-t border-white/10 bg-black/20 p-3">
            <div className="relative flex items-center">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pregúntale a tu copiloto..."
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-4 pr-12 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-400/50 focus:bg-white/10 transition-all"
                disabled={chatMutation.isPending}
              />
              <button
                type="submit"
                disabled={!input.trim() || chatMutation.isPending}
                className="absolute right-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-obsidian disabled:opacity-50 transition-colors hover:bg-emerald-400"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
