import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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
    tasks: Infinity,
    habits: Infinity,
    goals: Infinity,
    dreams: Infinity,
    investments: Infinity,
    transactions: Infinity,
  },
} as const;

interface SubscriptionContextType {
  plan: "free" | "pro";
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
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSubscription = useCallback(async () => {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }

    try {
      // Supabase client auto-refreshes tokens, no need for manual refreshSession()
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

  // Periodic refresh every 60s
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
