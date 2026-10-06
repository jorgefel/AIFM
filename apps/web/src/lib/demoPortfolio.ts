import type { Property, Reservation } from "@/types/models";
import { dayIndex } from "./metrics";

const GUESTS = [
  "John Smith", "Emma Johnson", "Michael Brown", "Sophie Davis", "James Wilson",
  "Olivia Martinez", "William Taylor", "Ava Anderson", "Daniel Garcia", "Mia Rodriguez",
];
const PLATFORMS = ["airbnb", "booking", "direct", "airbnb", "vrbo", "booking"];
const FEE_RATES: Record<string, number> = { airbnb: 0.03, booking: 0.15, vrbo: 0.08, direct: 0 };
const STAYS: [number, number][] = [[2, 4], [9, 3], [15, 5], [25, 2]];

function isoDay(index: number): string {
  return new Date(index * 86400000).toISOString().slice(0, 10);
}

export function buildDemoReservations(properties: Property[], now = new Date()): Reservation[] {
  const today = dayIndex(now.getFullYear(), now.getMonth(), now.getDate());
  const reservations: Reservation[] = [];

  properties.forEach((property, p) => {
    const rate = Number(property.nightly_rate) || 150 + p * 40;

    for (let month = -5; month <= 1; month += 1) {
      const monthStart = dayIndex(now.getFullYear(), now.getMonth() + month, 1);

      STAYS.forEach(([startDay, nights], i) => {
        const checkIn = monthStart + startDay + (i < 3 ? p : 0);
        const checkOut = checkIn + nights;
        const platform = PLATFORMS[(p + i + month + 10) % PLATFORMS.length];
        const gross = Math.round(rate * nights);
        const fee = Math.round(gross * (FEE_RATES[platform] ?? 0));

        let status = "completed";
        if (checkOut > today) status = i === 3 ? "pending" : "confirmed";
        if ((month + 5 + i + p) % 9 === 0) status = "cancelled";

        reservations.push({
          id: `demo-${p}-${month}-${i}`,
          property_id: property.id,
          guest_name: GUESTS[(p * 3 + i + month + 10) % GUESTS.length],
          check_in: isoDay(checkIn),
          check_out: isoDay(checkOut),
          total_amount: gross,
          platform_fee: fee,
          net_amount: gross - fee,
          currency: property.currency || "USD",
          platform,
          status,
        });
      });
    }
  });

  return reservations;
}
