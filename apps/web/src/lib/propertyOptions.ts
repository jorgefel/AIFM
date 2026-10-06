export const MAX_PHOTOS = 20;
export const DESCRIPTION_MAX_LENGTH = 5000;

export const PROPERTY_TYPE_OPTIONS = [
  { value: "apartment", label: "Apartamento" },
  { value: "house", label: "Casa" },
  { value: "cabin", label: "Cabaña" },
  { value: "room", label: "Habitación" },
  { value: "hotel", label: "Hotel" },
  { value: "other", label: "Otro" },
];

export const CURRENCY_OPTIONS = [
  { value: "USD", label: "Dólares (USD)" },
  { value: "MXN", label: "Pesos Mexicanos (MXN)" },
  { value: "COP", label: "Pesos Colombianos (COP)" },
  { value: "EUR", label: "Euros (EUR)" },
];

export const AMENITY_OPTIONS = [
  { id: "wifi", label: "WiFi rápido" },
  { id: "kitchen", label: "Cocina equipada" },
  { id: "pool", label: "Piscina" },
  { id: "parking", label: "Estacionamiento" },
  { id: "ac", label: "Aire acondicionado" },
  { id: "heating", label: "Calefacción" },
  { id: "sea_view", label: "Vista al mar" },
  { id: "washer", label: "Lavadora" },
  { id: "tv", label: "Televisión" },
  { id: "gym", label: "Gimnasio" },
  { id: "terrace", label: "Terraza" },
  { id: "pets", label: "Acepta mascotas" },
];

export const CHANNEL_OPTIONS = [
  { id: "airbnb", label: "Airbnb" },
  { id: "booking", label: "Booking.com" },
  { id: "vrbo", label: "Vrbo" },
  { id: "direct", label: "Reserva directa" },
  { id: "other", label: "Otro canal" },
];

export function getPropertyTypeLabel(value: string | null | undefined): string {
  return PROPERTY_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? "Propiedad";
}

export function getAmenityLabel(id: string): string {
  return AMENITY_OPTIONS.find((a) => a.id === id)?.label ?? id;
}

export function getChannelLabel(id: string): string {
  return CHANNEL_OPTIONS.find((c) => c.id === id)?.label ?? id;
}

export function formatNightlyPrice(
  amount: number | string | null | undefined,
  currency: string,
): string | null {
  const value = Number(amount);
  if (amount === null || amount === undefined || amount === "" || !Number.isFinite(value)) {
    return null;
  }
  try {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value} ${currency}`;
  }
}
