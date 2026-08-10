import { WidgetIncome } from "./widgets/WidgetIncome";
import { WidgetNetProfit } from "./widgets/WidgetNetProfit";
import { WidgetExpenses } from "./widgets/WidgetExpenses";
import { WidgetOccupancy } from "./widgets/WidgetOccupancy";
import { WidgetPerformanceChart } from "./widgets/WidgetPerformanceChart";
import { WidgetRecentActivity } from "./widgets/WidgetRecentActivity";

export const WIDGET_COMPONENTS: Record<string, React.FC<{ isEditing: boolean, onRemove?: () => void }>> = {
  income_summary: WidgetIncome,
  net_profit: WidgetNetProfit,
  expenses_summary: WidgetExpenses,
  occupancy_rate: WidgetOccupancy,
  performance_chart: WidgetPerformanceChart,
  recent_activity: WidgetRecentActivity,
};

export interface WidgetCatalogItem {
  id: string;
  category: "Key Metrics" | "Visuals" | "Lists";
  title: string;
  defaultW: number;
  defaultH: number;
  minW: number;
  minH: number;
}

export const WIDGET_CATALOG: WidgetCatalogItem[] = [
  {
    id: "income_summary",
    category: "Key Metrics",
    title: "Ingresos Brutos",
    defaultW: 1, defaultH: 1, minW: 1, minH: 1
  },
  {
    id: "net_profit",
    category: "Key Metrics",
    title: "Ganancia Neta",
    defaultW: 1, defaultH: 1, minW: 1, minH: 1
  },
  {
    id: "expenses_summary",
    category: "Key Metrics",
    title: "Gastos Totales",
    defaultW: 1, defaultH: 1, minW: 1, minH: 1
  },
  {
    id: "occupancy_rate",
    category: "Key Metrics",
    title: "Tasa de Ocupación",
    defaultW: 1, defaultH: 1, minW: 1, minH: 1
  },
  {
    id: "performance_chart",
    category: "Visuals",
    title: "Rendimiento (6 Meses)",
    defaultW: 2, defaultH: 2, minW: 2, minH: 2
  },
  {
    id: "recent_activity",
    category: "Lists",
    title: "Actividad Reciente",
    defaultW: 2, defaultH: 2, minW: 2, minH: 2
  }
];

export const DEFAULT_LAYOUT = [
  { i: "income_summary", x: 0, y: 0, w: 1, h: 1, minW: 1, minH: 1 },
  { i: "net_profit", x: 1, y: 0, w: 1, h: 1, minW: 1, minH: 1 },
  { i: "expenses_summary", x: 2, y: 0, w: 1, h: 1, minW: 1, minH: 1 },
  { i: "occupancy_rate", x: 3, y: 0, w: 1, h: 1, minW: 1, minH: 1 },
  { i: "performance_chart", x: 0, y: 1, w: 2, h: 2, minW: 2, minH: 2 },
  { i: "recent_activity", x: 2, y: 1, w: 2, h: 2, minW: 2, minH: 2 },
];
