"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, CheckCircle2, AlertCircle, Loader2, Cpu } from "lucide-react";
import {
  DEFAULT_URL,
  OllamaConfig,
  listModels,
} from "@/lib/ollama";

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cfg: OllamaConfig) => void;
  initialCfg?: OllamaConfig | null;
}

export function ConfigModal({
  isOpen,
  onClose,
  onSave,
  initialCfg,
}: ConfigModalProps) {
  const [url, setUrl] = useState(initialCfg?.url || DEFAULT_URL);
  const [apiKey, setApiKey] = useState(initialCfg?.apiKey || "");
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(initialCfg?.model || "");
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const urlInputRef = useRef<HTMLInputElement>(null);

  // Reiniciar estado o prellenar cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      const currentUrl = initialCfg?.url || DEFAULT_URL;
      const currentKey = initialCfg?.apiKey || "";
      const currentModel = initialCfg?.model || "";
      setUrl(currentUrl);
      setApiKey(currentKey);
      setSelectedModel(currentModel);
      setTestStatus(currentModel ? "success" : "idle");
      setErrorMessage(null);
      if (currentModel) {
        setModels([currentModel]);
      } else {
        setModels([]);
      }

      // Foco automático en el primer campo
      setTimeout(() => {
        urlInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, initialCfg]);

  // Cierre accesible con tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestStatus("idle");
    setErrorMessage(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    try {
      const available = await listModels(url, apiKey, controller.signal);
      clearTimeout(timeoutId);

      if (available.length === 0) {
        setTestStatus("error");
        setErrorMessage("No hay modelos instalados: ejecuta ollama pull gemma3:4b");
        setModels([]);
        return;
      }

      setModels(available);
      setTestStatus("success");
      // Si el modelo actual está en la lista lo mantiene, si no toma el primero
      if (!selectedModel || !available.includes(selectedModel)) {
        setSelectedModel(available[0]);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      setTestStatus("error");
      if (err.name === "AbortError") {
        setErrorMessage("Sin respuesta (tiempo de espera de 5s agotado). ¿Ollama está abierto?");
      } else if (err.message && err.message.includes("Failed to fetch")) {
        setErrorMessage(
          "Sin respuesta, ¿Ollama está abierto? (Si está abierto, revisa OLLAMA_ORIGINS)"
        );
      } else if (err.message && (err.message.includes("401") || err.message.includes("403"))) {
        setErrorMessage("Error de autenticación. Verifica tu API Key.");
      } else {
        setErrorMessage("Sin respuesta, ¿Ollama está abierto? Revisa OLLAMA_ORIGINS");
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModel || testStatus !== "success") return;
    onSave({
      url: url.trim(),
      model: selectedModel,
      apiKey: apiKey.trim() ? apiKey.trim() : undefined,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="config-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      {/* Dialog box */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/20 text-teal-400">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h3 id="config-modal-title" className="text-sm font-semibold text-white">
                Configurar Agente IA (Ollama Local)
              </h3>
              <p className="text-[11px] text-slate-400">
                Capa 2: Análisis abierto ejecutado en tu máquina
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSave} className="mt-4 space-y-4 text-xs">
          {/* Campo URL */}
          <div>
            <label className="block font-medium text-slate-300 mb-1">
              URL del servidor Ollama
            </label>
            <input
              ref={urlInputRef}
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setTestStatus("idle");
              }}
              placeholder="http://localhost:11434"
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none focus:border-teal-400 text-xs transition-colors"
              required
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Por defecto: <code className="text-teal-300">http://localhost:11434</code>
            </span>
          </div>

          {/* Campo API Key opcional */}
          <div>
            <label className="block font-medium text-slate-300 mb-1">
              API Key (Opcional)
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setTestStatus("idle");
              }}
              autoComplete="off"
              placeholder="Solo requerida si usas un proxy autenticado"
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none focus:border-teal-400 text-xs transition-colors"
            />
          </div>

          {/* Botón Probar Conexión */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || !url}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-teal-500/40 bg-teal-500/10 px-3 py-2 font-medium text-teal-300 hover:bg-teal-500/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isTesting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Probando conexión (máx 5s)…
                </>
              ) : (
                "Probar conexión"
              )}
            </button>
          </div>

          {/* Estado de conexión y Errores */}
          {testStatus === "success" && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-emerald-400 text-[11px]">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Conexión exitosa. Modelos listados correctamente.</span>
            </div>
          )}

          {testStatus === "error" && errorMessage && (
            <div className="flex items-start gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 p-2.5 text-rose-300 text-[11px]">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">No se pudo conectar</p>
                <p className="mt-0.5 text-slate-300">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Selección de Modelo */}
          <div>
            <label className="block font-medium text-slate-300 mb-1">
              Modelo a utilizar
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={models.length === 0}
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none focus:border-teal-400 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {models.length === 0 ? (
                <option value="">(Primero prueba la conexión para listar modelos)</option>
              ) : (
                models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!selectedModel || testStatus !== "success"}
              className="rounded-lg bg-teal-500 px-4 py-2 font-medium text-slate-950 hover:bg-teal-400 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Guardar y abrir chat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
