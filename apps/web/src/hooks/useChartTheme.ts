import { useTheme } from "@/contexts/ThemeContext";

const LIGHT = { axis: "#9C9CAF", grid: "rgba(21,19,31,0.06)", dotStroke: "#FFFFFF" };
const DARK = { axis: "#8D8BA6", grid: "rgba(255,255,255,0.08)", dotStroke: "#171626" };

export function useChartTheme() {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === "dark" ? DARK : LIGHT;
}
