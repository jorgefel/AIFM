export interface Property {
  id: string;
  name: string;
  address: string;
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
