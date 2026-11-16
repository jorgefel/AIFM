"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Calculator,
  MessageSquare,
  Sparkles,
  Send,
  X,
  Loader2,
  ChevronRight,
  Info,
  Settings,
  Bot,
} from "lucide-react";
import { api } from "@/lib/api";
import { useProperties } from "@/hooks/useProperties";
import {
  getCfg,
  saveCfg,
  OllamaConfig,
  chatAgent,
  ChatMessageParam,
} from "@/lib/ollama";
import { ConfigModal } from "./ConfigModal";

export interface QuestionItem {
  id: string;
  label: string;
  category: string;
}

export interface ChatbotMetric {
  label: string;
  value: number;
  format?: "currency" | "percent" | "number";
}

export interface ChatbotTable {
  columns: string[];
  rows: (string | number)[][];
}

export interface ChatbotResult {
  question_id?: string;
  label?: string;
  currency?: string;
  summary: string;
  metrics: ChatbotMetric[];
  table?: ChatbotTable;
  layer?: number;
  fallback_question_id?: string;
}

export interface ChatEntry {
  id: string;
  role: "user" | "assistant";
  text?: string;
  result?: ChatbotResult;
  layer?: number;
  isFallbackNotice?: boolean;
  isError?: boolean;
}

export interface ChatbotProps {
  propertyId?: string;
}

function formatMetricValue(
  value: number | null | undefined,
  format?: string,
  currency: string = "COP"
): string {
  if (value === null || value === undefined) return "N/A";
  if (format === "percent") {
    return `${value}%`;
  }
  if (format === "currency") {
    try {
      return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: currency || "COP",
        maximumFractionDigits: 2,
      }).format(value);
    } catch {
      return `${currency} ${value.toLocaleString("es-CO", { minimumFractionDigits: 2 })}`;
    }
  }
  return new Intl.NumberFormat("es-CO").format(value);
}

function formatTableCell(cell: string | number, currency?: string): string {
  if (typeof cell === "number") {
    return formatMetricValue(cell, "currency", currency);
  }
  return String(cell);
}

function formatResultAsPlainText(res: ChatbotResult): string {
  const parts: string[] = [];
  if (res.label) parts.push(res.label);
  if (res.summary) parts.push(res.summary);
  if (res.metrics && res.metrics.length > 0) {
    const mText = res.metrics
      .map((m) => `${m.label}: ${formatMetricValue(m.value, m.format, res.currency)}`)
      .join(", ");
    parts.push(mText);
  }
  return parts.join(". ");
}

export function Chatbot({ propertyId }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<ChatEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");

  // Configuración de Ollama (Capa 2)
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [currentOllamaCfg, setCurrentOllamaCfg] = useState<OllamaConfig | null>(() => getCfg());
  const [isCallingAI, setIsCallingAI] = useState(false);
  const configResolverRef = useRef<{
    resolve: (cfg: OllamaConfig) => void;
    reject: (reason?: any) => void;
  } | null>(null);

  const { properties } = useProperties();
  const [activePropId, setActivePropId] = useState<string>(
    propertyId || properties[0]?.id || ""
  );

  useEffect(() => {
    if (propertyId) {
      setActivePropId(propertyId);
    } else if (!activePropId && properties.length > 0) {
      setActivePropId(properties[0].id);
    }
  }, [propertyId, properties, activePropId]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, isOpen]);

  // 1. Catálogo de preguntas
  const { data: questions = [], isLoading: isLoadingQuestions } = useQuery<
    QuestionItem[]
  >({
    queryKey: ["chatbot", "questions"],
    queryFn: async () => {
      const res = await api.get("/chatbot/questions");
      return res.data;
    },
    staleTime: Infinity,
  });

  const categories = useMemo(() => {
    const set = new Set<string>();
    questions.forEach((q) => set.add(q.category));
    return ["Todas", ...Array.from(set)];
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    if (selectedCategory === "Todas") return questions;
    return questions.filter((q) => q.category === selectedCategory);
  }, [questions, selectedCategory]);

  // 2. Mutación Capa 1 directa (/ask)
  const askMutation = useMutation({
    mutationFn: async ({
      question_id,
      prop_id,
    }: {
      question_id: string;
      prop_id: string;
    }) => {
      const res = await api.post("/chatbot/ask", {
        question_id,
        property_id: prop_id,
      });
      return res.data;
    },
  });

  // 3. Mutación Enrutador (/message)
  const messageMutation = useMutation({
    mutationFn: async ({
      text,
      prop_id,
    }: {
      text: string;
      prop_id: string;
    }) => {
      const res = await api.post("/chatbot/message", {
        text,
        property_id: prop_id,
      });
      return res.data;
    },
  });

  const isProcessing =
    askMutation.isPending || messageMutation.isPending || isCallingAI;

  // Apertura de modal con promesa
  const openConfigModal = (): Promise<OllamaConfig> => {
    return new Promise((resolve, reject) => {
      configResolverRef.current = { resolve, reject };
      setIsConfigModalOpen(true);
    });
  };

  const handleConfigSave = (cfg: OllamaConfig) => {
    saveCfg(cfg);
    setCurrentOllamaCfg(cfg);
    setIsConfigModalOpen(false);
    configResolverRef.current?.resolve(cfg);
    configResolverRef.current = null;
  };

  const handleConfigClose = () => {
    setIsConfigModalOpen(false);
    configResolverRef.current?.reject(new Error("Modal cerrado"));
    configResolverRef.current = null;
  };

  // Degradación elegante: mensaje amable + resultado de Capa 1 con fallback_question_id
  const executeFallback = async (fallbackQId: string, propId: string) => {
    setHistory((prev) => [
      ...prev,
      {
        id: `notice-${Date.now()}`,
        role: "assistant",
        text: "No pude generar un análisis detallado en este momento. Esto es lo que sí puedo mostrarte con tus datos:",
        isFallbackNotice: true,
      },
    ]);

    try {
      const fallbackData = await askMutation.mutateAsync({
        question_id: fallbackQId,
        prop_id: propId,
      });

      setHistory((prev) => [
        ...prev,
        {
          id: `fallback-${Date.now()}`,
          role: "assistant",
          result: { ...fallbackData, layer: 1 },
        },
      ]);
    } catch (fallbackErr: any) {
      if (process.env.NODE_ENV === "development") {
        console.debug("[Chatbot fallback error]:", fallbackErr);
      }
      setHistory((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          text: "No pudimos procesar tu consulta en este momento. Por favor intenta de nuevo.",
          isError: true,
        },
      ]);
    }
  };

  // Ejecutar chip de Capa 1
  const handleChipClick = async (q: QuestionItem) => {
    if (!activePropId || isProcessing) return;

    const userMsgId = `user-${Date.now()}`;
    setHistory((prev) => [
      ...prev,
      { id: userMsgId, role: "user", text: q.label },
    ]);

    try {
      const data = await askMutation.mutateAsync({
        question_id: q.id,
        prop_id: activePropId,
      });
      setHistory((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          role: "assistant",
          result: { ...data, layer: 1 },
        },
      ]);
    } catch (err: any) {
      if (process.env.NODE_ENV === "development") {
        console.debug("[Chatbot ask error]:", err);
      }
      setHistory((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          text: "No pudimos procesar tu consulta en este momento. Por favor intenta de nuevo.",
          isError: true,
        },
      ]);
    }
  };

  // Enviar mensaje de texto (Capa 1 o Capa 2)
  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const queryText = input.trim();
    if (!queryText || !activePropId || isProcessing) return;

    setInput("");
    const userMsgId = `user-${Date.now()}`;
    setHistory((prev) => [
      ...prev,
      { id: userMsgId, role: "user", text: queryText },
    ]);

    try {
      const data = await messageMutation.mutateAsync({
        text: queryText,
        prop_id: activePropId,
      });

      if (data.layer === 1) {
        setHistory((prev) => [
          ...prev,
          {
            id: `asst-${Date.now()}`,
            role: "assistant",
            result: data,
          },
        ]);
      } else {
        // Capa 2: requiere configuración de Ollama
        let cfg = getCfg();
        if (!cfg) {
          try {
            cfg = await openConfigModal();
          } catch (modalErr) {
            if (process.env.NODE_ENV === "development") {
              console.debug("[Chatbot config modal closed]:", modalErr);
            }
            await executeFallback(data.fallback_question_id || "resumen_mes", activePropId);
            return;
          }
        }

        // Historial en texto plano para que el LLM entienda respuestas previas
        const historyParams: ChatMessageParam[] = history
          .filter((entry) => !entry.isFallbackNotice && !entry.isError)
          .map((entry) => {
            if (entry.role === "user") {
              return { role: "user", text: entry.text || "" };
            }
            if (entry.result) {
              return {
                role: "assistant",
                text: formatResultAsPlainText(entry.result),
              };
            }
            return { role: "assistant", text: entry.text || "" };
          });

        setIsCallingAI(true);
        try {
          const aiResponse = await chatAgent(cfg, data.context, historyParams);
          setHistory((prev) => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              role: "assistant",
              text: aiResponse,
              layer: 2,
            },
          ]);
        } catch (aiErr: any) {
          if (process.env.NODE_ENV === "development") {
            console.debug("[Chatbot Layer 2 chatAgent error]:", aiErr);
          }
          await executeFallback(data.fallback_question_id || "resumen_mes", activePropId);
        } finally {
          setIsCallingAI(false);
        }
      }
    } catch (err: any) {
      if (process.env.NODE_ENV === "development") {
        console.debug("[Chatbot message error]:", err);
      }
      setHistory((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          text: "No pudimos procesar tu consulta en este momento. Por favor intenta de nuevo.",
          isError: true,
        },
      ]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Modal de Configuración de Ollama */}
      <ConfigModal
        isOpen={isConfigModalOpen}
        onClose={handleConfigClose}
        onSave={handleConfigSave}
        initialCfg={currentOllamaCfg}
      />

      {/* Botón flotante para abrir el chatbot */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-obsidian shadow-lg shadow-emerald-500/20 transition-transform hover:scale-110 active:scale-95"
          aria-label="Abrir asistente financiero"
        >
          <Sparkles className="h-6 w-6 text-slate-950" />
        </button>
      )}

      {/* Ventana flotante de Chatbot */}
      {isOpen && (
        <div className="flex h-[620px] max-h-[85vh] w-[420px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur-xl transition-all">
          {/* Cabecera */}
          <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                <Calculator className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Nomora Chatbot
                </h3>
                <p className="text-[10px] text-emerald-400">
                  Capa 1: Motor determinista + Capa 2: IA
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Botón Cambiar modelo de Ollama */}
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(true)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-teal-300 transition-colors"
                title="Cambiar modelo de IA (Ollama)"
                aria-label="Cambiar modelo"
              >
                <Settings className="h-4 w-4" />
              </button>

              {/* Selector de propiedad si hay más de una */}
              {properties.length > 1 && (
                <select
                  value={activePropId}
                  onChange={(e) => {
                    setActivePropId(e.target.value);
                    setHistory([]);
                  }}
                  className="rounded-lg border border-white/10 bg-slate-900 px-2 py-1 text-[11px] text-white outline-none focus:border-emerald-400"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Cerrar asistente"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Selector de Categorías (Chips) */}
          <div className="border-b border-white/10 bg-black/20 p-2">
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide text-[11px]">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-2.5 py-1 font-medium transition-colors shrink-0 ${
                    selectedCategory === cat
                      ? "bg-emerald-500 text-slate-950"
                      : "bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Chips de preguntas rápidas */}
            <div className="flex gap-1.5 overflow-x-auto pt-1.5 pb-0.5 scrollbar-hide">
              {isLoadingQuestions ? (
                <span className="text-[11px] text-slate-500 flex items-center gap-1 py-0.5">
                  <Loader2 className="h-3 w-3 animate-spin" /> Cargando catálogo...
                </span>
              ) : (
                filteredQuestions.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => handleChipClick(q)}
                    disabled={isProcessing}
                    className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-left text-[11px] text-slate-200 transition-colors hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-300 disabled:opacity-50 shrink-0"
                  >
                    <span>{q.label}</span>
                    <ChevronRight className="h-3 w-3 opacity-50" />
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Historial de Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {history.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center px-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 mb-3">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-white">
                  Asistente financiero Nomora
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Haz clic en las opciones rápidas superiores para cálculo
                  directo, o escribe tus preguntas y dudas analíticas.
                </p>
              </div>
            ) : (
              history.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  {msg.role === "user" ? (
                    <div className="max-w-[85%] rounded-2xl rounded-br-none bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950">
                      {msg.text}
                    </div>
                  ) : msg.isFallbackNotice ? (
                    <div className="max-w-[90%] rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200 flex items-start gap-2">
                      <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                      <span>{msg.text}</span>
                    </div>
                  ) : msg.isError ? (
                    <div className="max-w-[85%] rounded-2xl rounded-bl-none border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs text-red-300">
                      {msg.text}
                    </div>
                  ) : msg.layer === 2 ? (
                    /* Respuesta de Capa 2: Agente IA */
                    <div className="max-w-[92%] rounded-2xl rounded-bl-none border border-teal-500/20 bg-slate-900/90 p-3.5 text-xs text-slate-200 shadow-lg">
                      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/10">
                        <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 text-[10px] font-medium text-teal-300">
                          <Bot className="h-3 w-3" />
                          Agente IA
                        </span>
                        {currentOllamaCfg && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {currentOllamaCfg.model}
                          </span>
                        )}
                      </div>
                      <div className="whitespace-pre-wrap leading-relaxed text-slate-200">
                        {msg.text}
                      </div>
                    </div>
                  ) : msg.result ? (
                    /* Respuesta de Capa 1: Cálculo directo */
                    <div className="max-w-[92%] rounded-2xl rounded-bl-none border border-white/10 bg-slate-900/90 p-3.5 text-xs text-slate-200 shadow-lg">
                      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/10">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                          <Calculator className="h-3 w-3" />
                          Cálculo directo
                        </span>
                        {msg.result.label && (
                          <span className="text-[10px] text-slate-400">
                            {msg.result.label}
                          </span>
                        )}
                      </div>

                      <p className="text-slate-200 font-medium leading-relaxed mb-3">
                        {msg.result.summary}
                      </p>

                      {msg.result.metrics && msg.result.metrics.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {msg.result.metrics.map((m, mIdx) => (
                            <div
                              key={mIdx}
                              className="rounded-xl border border-white/5 bg-white/5 p-2.5 flex flex-col"
                            >
                              <span className="text-[10px] text-slate-400 font-medium truncate">
                                {m.label}
                              </span>
                              <span className="text-sm font-semibold text-white mt-0.5">
                                {formatMetricValue(
                                  m.value,
                                  m.format,
                                  msg.result?.currency
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {msg.result.table &&
                        msg.result.table.rows &&
                        msg.result.table.rows.length > 0 && (
                          <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/30">
                            <table className="w-full text-left text-[11px]">
                              <thead className="border-b border-white/10 bg-white/5 text-[9px] uppercase tracking-wider text-slate-400">
                                <tr>
                                  {msg.result.table.columns.map((col, cIdx) => (
                                    <th
                                      key={cIdx}
                                      className="px-2.5 py-1.5 font-medium"
                                    >
                                      {col}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                {msg.result.table.rows.map((row, rIdx) => (
                                  <tr
                                    key={rIdx}
                                    className="hover:bg-white/5 transition-colors"
                                  >
                                    {row.map((cell, cIdx) => (
                                      <td
                                        key={cIdx}
                                        className="px-2.5 py-1.5 text-slate-300"
                                      >
                                        {formatTableCell(
                                          cell,
                                          msg.result?.currency
                                        )}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                    </div>
                  ) : null}
                </div>
              ))
            )}

            {/* Estado de carga / procesamiento */}
            {isProcessing && (
              <div className="flex items-start">
                <div
                  className={`flex items-center gap-2 rounded-2xl rounded-bl-none border px-4 py-2.5 text-xs ${
                    isCallingAI
                      ? "border-teal-500/20 bg-teal-500/10 text-teal-300"
                      : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                  }`}
                >
                  <Loader2
                    className={`h-3.5 w-3.5 animate-spin ${
                      isCallingAI ? "text-teal-400" : "text-emerald-400"
                    }`}
                  />
                  {isCallingAI
                    ? "Consultando con Agente IA local…"
                    : "Procesando cálculo directo…"}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Formulario de Input */}
          <form
            onSubmit={handleSend}
            className="border-t border-white/10 bg-black/30 p-3"
          >
            <div className="relative flex items-center">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pregunta sobre ingresos, gastos u ocupación..."
                disabled={isProcessing}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-3.5 pr-11 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-400/50 focus:bg-white/10 transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isProcessing}
                className="absolute right-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-slate-950 transition-colors hover:bg-emerald-400 disabled:opacity-30 disabled:pointer-events-none"
                aria-label="Enviar pregunta"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
