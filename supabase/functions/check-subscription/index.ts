import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRICE_TO_PLAN: Record<string, string> = {
  "price_1T8j6ZBI1DQVqElNYrTu6MPm": "pro",
  "price_1THkaBBI1DQVqElNoSpDTdOb": "ultimate",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      logStep("Auth error", { message: userError.message });
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      await supabaseClient.from("profiles").update({ plan: "free" }).eq("user_id", user.id);
      return new Response(JSON.stringify({ subscribed: false, plan: "free" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found customer", { customerId });

    const activeSubscriptions = await stripe.subscriptions.list({
      customer: customerId, status: "active", limit: 5,
    });
    const trialingSubscriptions = await stripe.subscriptions.list({
      customer: customerId, status: "trialing", limit: 5,
    });

    const allSubs = [...activeSubscriptions.data, ...trialingSubscriptions.data];

    if (allSubs.length === 0) {
      logStep("No active subscription");
      await supabaseClient.from("profiles").update({ plan: "free" }).eq("user_id", user.id);
      return new Response(JSON.stringify({ subscribed: false, plan: "free" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Determine best plan from active subscriptions
    let bestPlan = "pro";
    let subscriptionEnd: string | null = null;

    for (const sub of allSubs) {
      const priceId = sub.items.data[0]?.price?.id;
      const detectedPlan = priceId ? PRICE_TO_PLAN[priceId] : null;
      logStep("Sub found", { status: sub.status, priceId, detectedPlan });

      if (detectedPlan === "ultimate") {
        bestPlan = "ultimate";
      }

      try {
        const endTimestamp = sub.current_period_end || sub.trial_end;
        if (endTimestamp && typeof endTimestamp === "number") {
          subscriptionEnd = new Date(endTimestamp * 1000).toISOString();
        }
      } catch (e) {
        logStep("Date parsing error", { error: String(e) });
      }
    }

    logStep("Best plan determined", { bestPlan, subscriptionEnd });
    await supabaseClient.from("profiles").update({ plan: bestPlan }).eq("user_id", user.id);

    return new Response(JSON.stringify({
      subscribed: true,
      plan: bestPlan,
      subscription_end: subscriptionEnd,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
