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

  const propertyMatch = url.match(/^\/properties\/([^/?]+)$/);
  if (propertyMatch) {
    return DEMO_PROPERTIES.find((p) => p.id === propertyMatch[1]) ?? null;
  }

  if (url.startsWith("/analysis/dashboard")) {
    const propertyId = new URLSearchParams(url.split("?")[1]).get("property_id") || "";
    return demoDashboardData(propertyId);
  }

  if (url.startsWith("/reservations")) {
    const propertyId = new URLSearchParams(url.split("?")[1]).get("property_id") || "";
    return demoReservations(propertyId);
  }

  if (url.startsWith("/expenses")) {
    const propertyId = new URLSearchParams(url.split("?")[1]).get("property_id") || "";
    return demoExpenses(propertyId);
  }

  if (url.startsWith("/predictions/forecast")) {
    const propertyId = new URLSearchParams(url.split("?")[1]).get("property_id") || "";
    return {
      property_id: propertyId,
      property_name: "Villa Paradise",
      currency: "USD",
      historical_months_count: 6,
      forecasts: [
        {
          month: "2026-11",
          projected_gross_income: 4200,
          gross_income_min: 3600,
          gross_income_max: 4800,
          projected_net_profit: 3100,
          net_profit_min: 2600,
          net_profit_max: 3600,
          confidence_level: 0.8,
          model_used: "holt_linear+holt_linear",
          is_forecast: true,
        },
        {
          month: "2026-12",
          projected_gross_income: 4500,
          gross_income_min: 3800,
          gross_income_max: 5200,
          projected_net_profit: 3350,
          net_profit_min: 2750,
          net_profit_max: 3950,
          confidence_level: 0.8,
          model_used: "holt_linear+holt_linear",
          is_forecast: true,
        },
        {
          month: "2027-01",
          projected_gross_income: 4800,
          gross_income_min: 3900,
          gross_income_max: 5700,
          projected_net_profit: 3500,
          net_profit_min: 2800,
          net_profit_max: 4200,
          confidence_level: 0.8,
          model_used: "holt_linear+holt_linear",
          is_forecast: true,
        },
      ],
      disclaimer: "Estimaciones preventivas basadas en series temporales históricas.",
    };
  }

  if (url.startsWith("/integrations/beds24/connections")) {
    return [
      {
        id: "demo-beds24-conn-1",
        user_id: "demo-user-id",
        channel_name: "beds24",
        channel_account_id: "master_nomora_demo",
        is_active: true,
        last_booking_sync_at: new Date().toISOString(),
        last_inventory_sync_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        property_links: [
          {
            id: "link-1",
            channel_connection_id: "demo-beds24-conn-1",
            property_id: "prop-1",
            beds24_property_id: "284719",
            created_at: new Date().toISOString()
          }
        ]
      }
    ];
  }

  if (url.includes("/sync-history")) {
    return [
      {
        id: "log-1",
        channel_connection_id: "demo-beds24-conn-1",
        sync_type: "bookings",
        status: "success",
        records_processed: 8,
        started_at: new Date(Date.now() - 3600000).toISOString(),
        completed_at: new Date().toISOString()
      }
    ];
  }

  // Ruta no simulada: devuelve vacío en vez de fallar
  return [];
}
