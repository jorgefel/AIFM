import { api } from "./api";

/**
 * Fetcher centralizado para SWR.
 * Usa la instancia de Axios (api) que ya maneja baseURL, cookies y refresh tokens.
 * SWR pasa la key (ruta relativa) como argumento.
 */
export const fetcher = (url: string) => api.get(url).then((res) => res.data);
