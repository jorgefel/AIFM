export interface Property {
  id: string;
  name: string;
  address: string;
  currency: string;
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
}
