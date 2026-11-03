export type MarketListing = {
  id: string;
  title: string | null;
  url: string | null;
  nightly_rate: number | null;
  currency: string | null;
  rating: number | null;
  public_review_count: number | null;
  bedrooms: number | null;
  beds: number | null;
  bathrooms: number | null;
  is_superhost: boolean;
  is_guest_favorite: boolean;
};

export type MarketComparison = {
  fetched_at: string;
  expires_at: string;
  checkin: string;
  checkout: string;
  resolved_level: "neighborhood" | "city";
  currency: string;
  listings: MarketListing[];
  aggregates: {
    listing_count: number;
    median_nightly_rate: number | null;
    average_nightly_rate: number | null;
    p25_nightly_rate: number | null;
    p75_nightly_rate: number | null;
  };
};
