const PALETTE = ["#7C5CFC", "#0D9488", "#E11D48", "#2563EB", "#D97706", "#DB2777", "#059669", "#4F46E5"];

export function getPropertyColor(index: number): string {
  return PALETTE[index % PALETTE.length];
}
