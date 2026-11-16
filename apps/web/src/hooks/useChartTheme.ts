import { useTheme } from "@/contexts/ThemeContext";

const LIGHT = { axis: "#5B5380", grid: "rgba(67,48,117,0.08)", dotStroke: "#FFFFFF" };
const DARK = { axis: "#B9B4E0", grid: "rgba(167,139,250,0.14)", dotStroke: "#14122F" };

export function useChartTheme() {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === "dark" ? DARK : LIGHT;
}
