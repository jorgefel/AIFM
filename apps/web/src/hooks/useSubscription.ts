import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/fetcher";
import { useAuth } from "@/contexts/AuthContext";
import type { BillingPeriod, PlanId } from "@/lib/plans";

export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled" | "none";

export interface Subscription {
  plan: PlanId;
  status: SubscriptionStatus;
  billing_period?: BillingPeriod | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean;
}

const FREE_SUBSCRIPTION: Subscription = { plan: "free", status: "active" };

interface Options {
  refreshInterval?: number;
}

export function useSubscription({ refreshInterval = 0 }: Options = {}) {
  const { isDemoMode } = useAuth();

  const { data, error, isLoading, refetch } = useQuery<Subscription>({
    queryKey: ["billing", "subscription"],
    queryFn: () => fetcher("/billing/subscription"),
    enabled: !isDemoMode,
    staleTime: 0,
    refetchInterval: refreshInterval > 0 ? refreshInterval : false,
  });

  const subscription = data ?? FREE_SUBSCRIPTION;
  const isPro =
    subscription.plan === "pro" &&
    (subscription.status === "active" || subscription.status === "trialing");

  return { subscription, isPro, error, isLoading, refresh: refetch };
}
