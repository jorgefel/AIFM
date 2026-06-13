// ─────────────────────────────────────────────────────────────
// @aifm/shared — Tipos de dominio compartidos
// Usados por apps/web (Next.js) y disponibles para validación
// ─────────────────────────────────────────────────────────────

// ── Moneda ──────────────────────────────────────────────────
export type Currency = "USD" | "MXN" | "EUR";

// ── Reporte Mensual ──────────────────────────────────────────
export interface MonthlyReport {
  year: number;
  month: number; // 1-12
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  currency: Currency;
  occupancyRate: number; // 0–100 (%)
  totalReservations: number;
}

// ── Reservación ──────────────────────────────────────────────
export interface Reservation {
  id: string;
  guestName: string;
  checkIn: string;   // ISO 8601: "2025-01-15"
  checkOut: string;  // ISO 8601: "2025-01-20"
  totalAmount: number;
  platformFee: number;
  netAmount: number;
  platform: ReservationPlatform;
  status: ReservationStatus;
  notes?: string;
  createdAt: string;
}

export type ReservationPlatform = "airbnb" | "booking" | "vrbo" | "direct";
export type ReservationStatus = "confirmed" | "pending" | "cancelled" | "completed";

// ── Gasto / Expense ──────────────────────────────────────────
export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: string;      // ISO 8601
  currency: Currency;
  receipt?: string;  // URL o path al comprobante
  createdAt: string;
}

export type ExpenseCategory =
  | "cleaning"
  | "maintenance"
  | "supplies"
  | "utilities"
  | "platform_fees"
  | "taxes"
  | "insurance"
  | "marketing"
  | "other";

// ── Propiedad ────────────────────────────────────────────────
export interface Property {
  id: string;
  name: string;
  address: string;
  currency: Currency;
  ownerId: string;
}

// ── Respuesta API genérica ────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
}
