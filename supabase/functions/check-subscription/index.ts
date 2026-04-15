import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PRICE_TO_PLAN: Record<string, string> = {
  price_1TIUBJQtN7BZ4FpXU9k2e2oG: "pro_monthly",
  price_1TMGaXQtN7BZ4FpXivhO1rYU: "pro_yearly",

  price_1TIUBVQtN7BZ4FpXEbNmnYHc: "ultimate_monthly",
  price_1TMGbgQtN7BZ4FpXLAGPKcdT: "ultimate_yearly",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Versão estável recomendada para o SDK 18.x
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      await supabaseAdmin
        .from("profiles")
        .update({ plan: "free" })
        .eq("user_id", user.id);
      return new Response(JSON.stringify({ subscribed: false, plan: "free" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerId = customers.data[0].id;

    const [activeSubs, trialingSubs] = await Promise.all([
      stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 5,
      }),
      stripe.subscriptions.list({
        customer: customerId,
        status: "trialing",
        limit: 5,
      }),
    ]);

    const allSubs = [...activeSubs.data, ...trialingSubs.data];

    if (allSubs.length === 0) {
      await supabaseAdmin
        .from("profiles")
        .update({ plan: "free" })
        .eq("user_id", user.id);
      return new Response(JSON.stringify({ subscribed: false, plan: "free" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let bestPlan = "free";
    let subscriptionEnd: string | null = null;

    for (const sub of allSubs) {
      const priceId = sub.items.data[0]?.price?.id;
      const detectedPlan = priceId ? PRICE_TO_PLAN[priceId] : null;

      if (detectedPlan) {
        // Se já temos um Ultimate e detectamos outro Pro, ignoramos.
        // Se detectamos um Ultimate, ele substitui qualquer Pro anterior.
        if (detectedPlan.includes("ultimate")) {
          bestPlan = detectedPlan;
        } else if (bestPlan === "free" || !bestPlan.includes("ultimate")) {
          bestPlan = detectedPlan;
        }
      }

      const endTs = sub.current_period_end || sub.trial_end;
      if (endTs) subscriptionEnd = new Date(endTs * 1000).toISOString();
    }

    console.log(`Atualizando banco: User ${user.email} -> ${bestPlan}`);

    await supabaseAdmin
      .from("profiles")
      .update({
        plan: bestPlan,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    return new Response(
      JSON.stringify({
        subscribed: bestPlan !== "free",
        plan: bestPlan,
        subscription_end: subscriptionEnd,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("[CHECK-SUBSCRIPTION] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
