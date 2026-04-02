import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export type PlanType = "free" | "pro" | "ultimate";

export const PLAN_LIMITS = {
  free: {
    tasks: 5,
    habits: 3,
    goals: 2,
    dreams: 3,
    investments: 5,
    transactions: 50,
  },
  pro: {
    tasks: 20,
    habits: 10,
    goals: 10,
    dreams: 10,
    investments: 20,
    transactions: 200,
  },
  ultimate: {
    tasks: Infinity,
    habits: Infinity,
    goals: Infinity,
    dreams: Infinity,
    investments: Infinity,
    transactions: Infinity,
  },
} as const;

export const PLAN_PRICES = {
  pro: {
    price_id: "price_1T8j6ZBI1DQVqElNYrTu6MPm",
    product_id: "prod_U6x0SW4WVoy9Os",
    monthly: 19.90,
  },
  ultimate: {
    price_id: "price_1THkaBBI1DQVqElNoSpDTdOb",
    product_id: "prod_UGH8JV4kAVzjN7",
    monthly: 39.90,
  },
} as const;

interface SubscriptionContextType {
  plan: PlanType;
  subscribed: boolean;
  subscriptionEnd: string | null;
  loading: boolean;
  checkSubscription: () => Promise<void>;
  canCreate: (resource: keyof typeof PLAN_LIMITS.free, currentCount: number) => boolean;
  getLimit: (resource: keyof typeof PLAN_LIMITS.free) => number;
  getRemainder: (resource: keyof typeof PLAN_LIMITS.free, currentCount: number) => number;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth();
  const [plan, setPlan] = useState<PlanType>("free");
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSubscription = useCallback(async () => {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");

      if (!error && data) {
        setPlan(data.plan || "free");
        setSubscribed(data.subscribed || false);
        setSubscriptionEnd(data.subscription_end || null);
      }
    } catch (err) {
      console.error("Error checking subscription:", err);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (user && session) {
      checkSubscription();
    } else {
      setLoading(false);
    }
  }, [user, session, checkSubscription]);

  useEffect(() => {
    if (!user || !session) return;
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, session, checkSubscription]);

  const canCreate = (resource: keyof typeof PLAN_LIMITS.free, currentCount: number): boolean => {
    const limit = PLAN_LIMITS[plan][resource];
    return currentCount < limit;
  };

  const getLimit = (resource: keyof typeof PLAN_LIMITS.free): number => {
    return PLAN_LIMITS[plan][resource];
  };

  const getRemainder = (resource: keyof typeof PLAN_LIMITS.free, currentCount: number): number => {
    const limit = PLAN_LIMITS[plan][resource];
    if (limit === Infinity) return Infinity;
    return Math.max(0, limit - currentCount);
  };

  return (
    <SubscriptionContext.Provider value={{ plan, subscribed, subscriptionEnd, loading, checkSubscription, canCreate, getLimit, getRemainder }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) throw new Error("useSubscription must be used within SubscriptionProvider");
  return context;
}
