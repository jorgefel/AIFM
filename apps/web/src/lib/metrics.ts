import type { Property, Reservation } from "@/types/models";

/** Rango de días [from, to): from incluido, to excluido. Los días son enteros (días desde 1970, en UTC). */
export interface DayRange {
  from: number;
  to: number;
}

export type PeriodId = "month" | "quarter" | "year" | "next_month" | "next_quarter";

export const PERIOD_OPTIONS: { value: PeriodId; label: string }[] = [
  { value: "month", label: "Este mes" },
  { value: "next_month", label: "Próximo mes" },
  { value: "quarter", label: "Últimos 3 meses" },
  { value: "next_quarter", label: "Próximos 3 meses" },
  { value: "year", label: "Este año" },
];

const DAY_MS = 86400000;
const REVENUE_STATUSES = new Set(["confirmed", "completed"]);

export function dayIndex(year: number, month: number, day: number): number {
  return Math.floor(Date.UTC(year, month, day) / DAY_MS);
}

export function parseDay(value: string): number {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return dayIndex(year, month - 1, day);
}

export function dayToDate(index: number): Date {
  return new Date(index * DAY_MS);
}

export function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function grossOf(reservation: Reservation): number {
  const gross = toNumber(reservation.total_amount);
  return gross > 0 ? gross : toNumber(reservation.net_amount);
}

export function netOf(reservation: Reservation): number {
  const { net_amount: net } = reservation;
  const hasNet = net !== undefined && net !== null && net !== "";
  return hasNet ? toNumber(net) : grossOf(reservation) - toNumber(reservation.platform_fee);
}

export function nightsOf(reservation: Reservation): number {
  return Math.max(1, parseDay(reservation.check_out) - parseDay(reservation.check_in));
}

function overlapNights(reservation: Reservation, range: DayRange): number {
  const start = Math.max(parseDay(reservation.check_in), range.from);
  const end = Math.min(parseDay(reservation.check_out), range.to);
  return Math.max(0, end - start);
}

const round1 = (value: number) => Math.round(value * 10) / 10;

export interface ChannelStat {
  platform: string;
  revenue: number;
  share: number;
}

export interface PropertyStat {
  propertyId: string;
  revenue: number;
  bookedNights: number;
  occupancy: number;
  adr: number;
}

export interface Metrics {
  revenue: number;
  netRevenue: number;
  bookedNights: number;
  availableNights: number;
  occupancy: number;
  adr: number;
  revpar: number;
  reservationCount: number;
  channels: ChannelStat[];
  byProperty: PropertyStat[];
}

/**
 * Los ingresos se reparten por noche dentro del rango: una reserva que cruza dos
 * meses aporta a cada mes solo las noches que le corresponden. Solo cuentan para
 * ingresos y ocupación las reservas confirmadas o completadas; las canceladas se ignoran.
 */
export function computeMetrics(
  reservations: Reservation[],
  properties: Property[],
  range: DayRange,
): Metrics {
  const days = Math.max(0, range.to - range.from);
  const availableNights = properties.length * days;

  let revenue = 0;
  let netRevenue = 0;
  let bookedNights = 0;
  let reservationCount = 0;
  const channelRevenue = new Map<string, number>();
  const propertyTotals = new Map<string, { revenue: number; nights: number }>();
  properties.forEach((p) => propertyTotals.set(p.id, { revenue: 0, nights: 0 }));

  for (const reservation of reservations) {
    if (reservation.status === "cancelled") continue;
    const nights = overlapNights(reservation, range);
    if (nights === 0) continue;

    reservationCount += 1;
    if (!REVENUE_STATUSES.has(reservation.status)) continue;

    const share = nights / nightsOf(reservation);
    const gross = grossOf(reservation) * share;

    revenue += gross;
    netRevenue += netOf(reservation) * share;
    bookedNights += nights;

    const platform = reservation.platform || "other";
    channelRevenue.set(platform, (channelRevenue.get(platform) ?? 0) + gross);

    const entry = propertyTotals.get(reservation.property_id);
    if (entry) {
      entry.revenue += gross;
      entry.nights += nights;
    }
  }

  const channels = [...channelRevenue.entries()]
    .map(([platform, value]) => ({
      platform,
      revenue: value,
      share: revenue > 0 ? round1((value / revenue) * 100) : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const byProperty = properties.map((property) => {
    const entry = propertyTotals.get(property.id) ?? { revenue: 0, nights: 0 };
    return {
      propertyId: property.id,
      revenue: entry.revenue,
      bookedNights: entry.nights,
      occupancy: days > 0 ? Math.min(100, round1((entry.nights / days) * 100)) : 0,
      adr: entry.nights > 0 ? entry.revenue / entry.nights : 0,
    };
  });

  return {
    revenue,
    netRevenue,
    bookedNights,
    availableNights,
    occupancy: availableNights > 0 ? Math.min(100, round1((bookedNights / availableNights) * 100)) : 0,
    adr: bookedNights > 0 ? revenue / bookedNights : 0,
    revpar: availableNights > 0 ? revenue / availableNights : 0,
    reservationCount,
    channels,
    byProperty,
  };
}

export function getPeriodRanges(period: PeriodId, now = new Date()): { current: DayRange; previous: DayRange } {
  const y = now.getFullYear();
  const m = now.getMonth();

  if (period === "next_month") {
    return {
      current: { from: dayIndex(y, m + 1, 1), to: dayIndex(y, m + 2, 1) },
      previous: { from: dayIndex(y, m, 1), to: dayIndex(y, m + 1, 1) },
    };
  }
  if (period === "next_quarter") {
    return {
      current: { from: dayIndex(y, m + 1, 1), to: dayIndex(y, m + 4, 1) },
      previous: { from: dayIndex(y, m - 2, 1), to: dayIndex(y, m + 1, 1) },
    };
  }
  if (period === "quarter") {
    return {
      current: { from: dayIndex(y, m - 2, 1), to: dayIndex(y, m + 1, 1) },
      previous: { from: dayIndex(y, m - 5, 1), to: dayIndex(y, m - 2, 1) },
    };
  }
  if (period === "year") {
    return {
      current: { from: dayIndex(y, 0, 1), to: dayIndex(y + 1, 0, 1) },
      previous: { from: dayIndex(y - 1, 0, 1), to: dayIndex(y, 0, 1) },
    };
  }
  return {
    current: { from: dayIndex(y, m, 1), to: dayIndex(y, m + 1, 1) },
    previous: { from: dayIndex(y, m - 1, 1), to: dayIndex(y, m, 1) },
  };
}

export interface MonthPoint {
  key: string;
  label: string;
  revenue: number;
  occupancy: number;
}

const monthFormatter = new Intl.DateTimeFormat("es", { month: "short", timeZone: "UTC" });

export function monthlySeries(
  reservations: Reservation[],
  properties: Property[],
  months: number,
  now = new Date(),
  futureMonths = 1,
): MonthPoint[] {
  const y = now.getFullYear();
  const m = now.getMonth();
  const points: MonthPoint[] = [];

  for (let i = months - 1; i >= -futureMonths; i -= 1) {
    const from = dayIndex(y, m - i, 1);
    const to = dayIndex(y, m - i + 1, 1);
    const metrics = computeMetrics(reservations, properties, { from, to });
    points.push({
      key: String(from),
      label: monthFormatter.format(dayToDate(from)).replace(".", ""),
      revenue: metrics.revenue,
      occupancy: metrics.occupancy,
    });
  }
  return points;
}

/** Variación porcentual contra el periodo anterior; null cuando no hay base de comparación. */
export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return round1(((current - previous) / previous) * 100);
}

/** Variación en puntos porcentuales (para tasas como la ocupación). */
export function pointsChange(current: number, previous: number): number {
  return round1(current - previous);
}
