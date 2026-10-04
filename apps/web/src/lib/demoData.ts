/**
 * Datos de ejemplo usados únicamente en "Modo Demo" (sin backend real).
 * Permiten navegar la app y ver el diseño con información de muestra.
 */

export const DEMO_USER = {
  id: "demo-user-1",
  email: "demo@nomora.app",
  full_name: "Conor McGregor",
  role: "Admin",
};

export const DEMO_PROPERTIES = [
  {
    id: "demo-prop-1",
    name: "Villa Paradise",
    address: "Miami, FL",
    currency: "USD",
    price_per_night: 450,
    max_guests: 8,
    bedrooms: 4,
    beds: 6,
    bathrooms: 3.5,
    description:
      "Villa moderna con vista al mar, piscina privada y amplios espacios para grupos familiares.",
    amenities: ["wifi", "kitchen", "pool", "parking", "ac", "sea_view"],
    channels: ["airbnb", "booking"],
    photos: [],
  },
  {
    id: "demo-prop-2",
    name: "City Loft",
    address: "Nueva York, NY",
    currency: "USD",
    price_per_night: 180,
    max_guests: 3,
    bedrooms: 1,
    beds: 2,
    bathrooms: 1,
    description: "Loft luminoso en el centro, a pasos del metro y de los mejores restaurantes.",
    amenities: ["wifi", "kitchen", "ac", "tv", "washer"],
    channels: ["airbnb"],
    photos: [],
  },
  {
    id: "demo-prop-3",
    name: "Beach House",
    address: "Cancún, MX",
    currency: "USD",
    price_per_night: 320,
    max_guests: 6,
    bedrooms: 3,
    beds: 4,
    bathrooms: 2,
    description: "Casa frente a la playa con terraza, hamacas y acceso directo al mar.",
    amenities: ["wifi", "kitchen", "terrace", "sea_view", "ac", "pets"],
    channels: ["airbnb", "booking", "direct"],
    photos: [],
  },
  {
    id: "demo-prop-4",
    name: "Mountain Cabin",
    address: "Aspen, CO",
    currency: "USD",
    price_per_night: 275,
    max_guests: 5,
    bedrooms: 2,
    beds: 3,
    bathrooms: 2,
    description: "Cabaña de madera rodeada de bosque, con chimenea y vista a las montañas.",
    amenities: ["wifi", "kitchen", "heating", "parking", "tv"],
    channels: ["airbnb"],
    photos: [],
  },
];

const MONTH_NAMES = ["Mar", "Abr", "May", "Jun", "Jul", "Ago"];

export function demoDashboardData(propertyId: string) {
  return {
    summary: {
      gross_income: 24580,
      net_profit: 18420,
      occupancy_rate: 78,
      total_expenses: 6160,
    },
    chart_data: MONTH_NAMES.map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return {
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        gross_income: 14000 + i * 2100 + (i % 2 === 0 ? 800 : -400),
        total_expenses: 3200 + i * 480,
      };
    }),
  };
}

export function demoReservations(propertyId: string) {
  return [
    { id: "r1", property_id: propertyId, guest_name: "John Smith", check_in: "2026-08-15", check_out: "2026-08-20", net_amount: 2250, status: "confirmed" },
    { id: "r2", property_id: propertyId, guest_name: "Emma Johnson", check_in: "2026-08-16", check_out: "2026-08-18", net_amount: 680, status: "confirmed" },
    { id: "r3", property_id: propertyId, guest_name: "Michael Brown", check_in: "2026-08-18", check_out: "2026-08-25", net_amount: 3150, status: "pending" },
    { id: "r4", property_id: propertyId, guest_name: "Sophie Davis", check_in: "2026-08-20", check_out: "2026-08-23", net_amount: 890, status: "confirmed" },
    { id: "r5", property_id: propertyId, guest_name: "James Wilson", check_in: "2026-08-22", check_out: "2026-08-29", net_amount: 1890, status: "cancelled" },
  ];
}

export function demoExpenses(propertyId: string) {
  return [
    { id: "e1", property_id: propertyId, description: "Limpieza mensual", category: "maintenance", amount: 320, date: "2026-08-01", receipt_url: null },
    { id: "e2", property_id: propertyId, description: "Servicios (agua/luz)", category: "utilities", amount: 210, date: "2026-08-03", receipt_url: null },
    { id: "e3", property_id: propertyId, description: "Reparación piscina", category: "maintenance", amount: 540, date: "2026-08-08", receipt_url: null },
    { id: "e4", property_id: propertyId, description: "Comisión plataforma", category: "fees", amount: 480, date: "2026-08-10", receipt_url: null },
  ];
}
