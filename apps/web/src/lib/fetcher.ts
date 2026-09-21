import { api } from "./api";
import { DEMO_PROPERTIES, demoDashboardData, demoReservations, demoExpenses } from "./demoData";

const DEMO_FLAG = "nomora_demo_mode";

function isDemoMode() {
  return typeof window !== "undefined" && localStorage.getItem(DEMO_FLAG) === "true";
}

/**
 * Fetcher centralizado para SWR.
 * Usa la instancia de Axios (api) que ya maneja baseURL, cookies y refresh tokens.
 * SWR pasa la key (ruta relativa) como argumento.
 *
 * En "Modo Demo" (sin backend), intercepta las rutas conocidas y devuelve
 * datos de ejemplo en vez de golpear la API real.
 */
export const fetcher = (url: string) => {
  if (isDemoMode()) {
    // Pequeño delay artificial para que se sienta como una carga real
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockResponse(url)), 250);
    });
  }
  return api.get(url).then((res) => res.data);
};

function mockResponse(url: string): any {
  if (url === "/properties/") {
    return DEMO_PROPERTIES;
  }

  if (url.startsWith("/analysis/dashboard")) {
    const propertyId = new URLSearchParams(url.split("?")[1]).get("property_id") || "";
    return demoDashboardData(propertyId);
  }

  if (url.startsWith("/reservations/")) {
    const propertyId = new URLSearchParams(url.split("?")[1]).get("property_id") || "";
    return demoReservations(propertyId);
  }

  if (url.startsWith("/expenses/")) {
    const propertyId = new URLSearchParams(url.split("?")[1]).get("property_id") || "";
    return demoExpenses(propertyId);
  }

  // Ruta no simulada: devuelve vacío en vez de fallar
  return [];
}
