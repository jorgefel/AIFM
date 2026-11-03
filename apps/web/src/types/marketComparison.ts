export type MarketListing = {
  id: string;
  title: string | null;
  url: string | null;
  nightly_rate: number | null;
  currency: string | null;
  rating: number | null;
  public_review_count: number | null;
  max_guests: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  amenities: string[];
};

export type MarketComparison = {
  status: "EMPTY" | "PENDING" | "PROCESSING" | "READY" | "FAILED";
  fetched_at: string | null;
  expires_at: string | null;
  currency: string | null;
  listings: MarketListing[];
  aggregates: {
    listing_count: number;
    median_nightly_rate: number | null;
    median_rating: number | null;
    median_public_review_count: number | null;
  } | null;
  error: string | null;
  job_id: string | null;
};
