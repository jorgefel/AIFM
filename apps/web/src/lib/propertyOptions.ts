export const MAX_PHOTOS = 10;
export const MAX_PHOTO_MB = 5;
export const MAX_PHOTO_BYTES = MAX_PHOTO_MB * 1024 * 1024;
export const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const DESCRIPTION_MAX_LENGTH = 2000;

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
];

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
