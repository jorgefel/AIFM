export interface PropertyPhoto {
  url: string;
  caption?: string;
  is_cover?: boolean;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  country?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  currency: string;
  property_type: string;
  max_guests: number;
  bedrooms: number;
  beds?: number | null;
  bathrooms: number;
  description?: string | null;
  nightly_rate?: number | string | null;
  price_per_night?: number | string | null;
  amenities: string[];
  channels?: string[];
  published_platforms: string[];
  photo_urls: string[];
  photos?: PropertyPhoto[];
  created_at: string;
  is_active?: boolean;
}

export interface Expense {
  id: string;
  property_id: string;
  amount: number | string;
  description: string;
  category: string;
  date: string;
  currency: string;
  receipt_url?: string | null;
  is_deleted?: boolean;
}

export interface Reservation {
  id: string;
  property_id: string;
  guest_id?: string | null;
  guest_name: string;
  check_in: string;
  check_out: string;
  total_amount: number | string;
  platform_fee: number | string;
  net_amount: number | string;
  currency: string;
  platform: string;
  status: string;
  notes?: string;
  beds24_booking_id?: string | null;
  sync_source?: string | null;
  synced_at?: string | null;
}

export interface Guest {
  id: string;
  owner_id: string;
  first_name: string;
  last_name: string;
  document_or_keyword?: string | null;
  total_nights: number;
  properties_count: number;
  created_at: string;
  updated_at: string;
}

export interface GuestStay {
  reservation_id: string;
  property_id: string;
  property_name: string;
  check_in: string;
  check_out: string;
  nights: number;
  status: string;
  total_amount: number;
}

export interface GuestDetail extends Guest {
  properties_stayed: string[];
  stays: GuestStay[];
}

export interface CalendarDay {
  property_id: string;
  date: string;
  available_units: number | null;
  price: number | null;
  availability: "available" | "unavailable" | "unknown";
  source: "manual" | "synced";
  channel: string | null;
  synced_at: string | null;
  is_stale: boolean;
}

export interface CalendarSnapshot { days: CalendarDay[]; generated_at: string; }

export interface RecommendationEvidence {
  label: string;
  value: string | number;
}

export interface PredictiveRecommendation {
  id: string;
  title: string;
  action: string;
  reason: string;
  evidence: RecommendationEvidence[];
  severity: "info" | "warning" | "critical";
  evidence_source: "own_history" | "market" | "both";
  as_of: string;
}

export interface MonthForecast {
  month: string;
  projected_gross_income: number;
  gross_income_min: number;
  gross_income_max: number;
  projected_net_profit: number;
  net_profit_min: number;
  net_profit_max: number;
  confidence_level: string | number;
  confidence_score?: number;
  model_used: string;
  is_forecast: boolean;
}

export interface PropertyForecastResponse {
  kind?: string;
  period?: string;
  property_id: string;
  property_name: string;
  currency: string;
  historical_months_count: number;
  confidence_level?: "limited" | "medium" | "high";
  model?: "moving_average" | "holt" | "holt_winters";
  backtest_mape?: number | null;
  as_of?: string;
  forecasts: MonthForecast[];
  recommendations?: PredictiveRecommendation[];
  disclaimer: string;
}

