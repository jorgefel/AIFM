export const CHANNELS: Record<string, { label: string; color: string }> = {
  airbnb: { label: "Airbnb", color: "#F43F5E" },
  booking: { label: "Booking.com", color: "#3B82F6" },
  vrbo: { label: "Vrbo", color: "#14B8A6" },
  direct: { label: "Directo", color: "#7C5CFC" },
};

export function getChannel(id: string): { label: string; color: string } {
  return CHANNELS[id] ?? { label: id || "Otros", color: "#9CA3AF" };
}
