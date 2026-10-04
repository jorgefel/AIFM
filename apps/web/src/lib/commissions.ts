export const PLATFORM_COMMISSION_RATES: Record<string, number> = {
  airbnb: 3,
  booking: 15,
  vrbo: 8,
  direct: 0,
};

export const PLATFORM_LABELS: Record<string, string> = {
  airbnb: "Airbnb",
  booking: "Booking.com",
  vrbo: "Vrbo",
  direct: "Directo",
};

export function getCommissionRate(platform: string): number {
  return PLATFORM_COMMISSION_RATES[platform] ?? 0;
}

export function calcPlatformFee(total: number, platform: string): number {
  return Math.round(total * getCommissionRate(platform)) / 100;
}
