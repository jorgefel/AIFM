/**
 * apps/web/src/lib/ollama.ts
 * Cliente para Ollama local (ejecutado únicamente en el navegador).
 * La configuración vive en sessionStorage (clave 'ollama_cfg') para no filtrar datos al servidor.
 */

export interface OllamaConfig {
  url: string;
  model: string;
  apiKey?: string;
}

export interface ChatMessageParam {
  role: "user" | "assistant";
  text: string;
}

export const DEFAULT_URL = "http://localhost:11434";
const STORAGE_KEY = "ollama_cfg";

/**
 * Lee la configuración guardada de sessionStorage con try/catch.
 */
export function getCfg(): OllamaConfig | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.url === "string" &&
      typeof parsed.model === "string"
    ) {
      return parsed as OllamaConfig;
    }
    return null;
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.debug("[ollama getCfg error]:", err);
    }
    return null;
  }
}

/**
 * Guarda la configuración en sessionStorage con try/catch.
 */
export function saveCfg(cfg: OllamaConfig): void {
  try {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.debug("[ollama saveCfg error]:", err);
    }
  }
}

/**
 * Borra la configuración de sessionStorage.
 */
export function clearCfg(): void {
  try {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.debug("[ollama clearCfg error]:", err);
    }
  }
}

/**
 * Lista los modelos disponibles en el endpoint de Ollama.
 * GET {url}/api/tags
 */
export async function listModels(
  url: string = DEFAULT_URL,
  apiKey?: string,
  signal?: AbortSignal
): Promise<string[]> {
  const cleanUrl = url.replace(/\/+$/, "");
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (apiKey?.trim()) {
    headers["Authorization"] = `Bearer ${apiKey.trim()}`;
  }

  const res = await fetch(`${cleanUrl}/api/tags`, {
    method: "GET",
    headers,
    signal,
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  const models = Array.isArray(data?.models)
    ? data.models.map((m: any) => m.name || m.model).filter(Boolean)
    : [];
  return models;
}

const SYSTEM_PROMPT_PREFIX = `Eres el asistente de administración de propiedades de arriendo de Nomora.
Responde SIEMPRE en español, claro y conciso.
Usa ÚNICAMENTE los datos del contexto; las cifras ya fueron calculadas por el sistema, no las recalcules ni las inventes.
Si el contexto no tiene lo necesario para responder, dilo y sugiere qué dato falta.
Cuando pidan análisis o consejos: da primero el hallazgo y luego máximo 3 recomendaciones accionables.
Si el contexto incluye consejos anteriores, puedes referirte a ellos y a cómo cambiaron las cifras desde entonces.
No puedes modificar datos ni ejecutar acciones; cualquier cambio requiere confirmación del usuario.

CONTEXTO:
`;

/**
 * Ejecuta chat contra Ollama (POST /api/chat con stream: false).
 * Prepara opciones: temperature: 0.3, num_ctx: 8192 y últimos 6 mensajes.
 */
export async function chatAgent(
  cfg: OllamaConfig,
  context: any,
  history: ChatMessageParam[],
  signal?: AbortSignal
): Promise<string> {
  const cleanUrl = cfg.url.replace(/\/+$/, "");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (cfg.apiKey?.trim()) {
    headers["Authorization"] = `Bearer ${cfg.apiKey.trim()}`;
  }

  const systemContent = `${SYSTEM_PROMPT_PREFIX}${JSON.stringify(context, null, 2)}`;

  // Tomar los últimos 6 mensajes del historial
  const recentHistory = history.slice(-6).map((msg) => ({
    role: msg.role,
    content: msg.text,
  }));

  const messages = [
    { role: "system", content: systemContent },
    ...recentHistory,
  ];

  const body = {
    model: cfg.model,
    messages,
    stream: false,
    options: {
      temperature: 0.3,
      num_ctx: 8192,
    },
  };

  const res = await fetch(`${cleanUrl}/api/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  const content = data?.message?.content;
  if (!content) {
    throw new Error("Respuesta vacía de Ollama");
  }

  return content;
}
