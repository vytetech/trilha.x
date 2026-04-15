import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PLAN_PRICES: Record<string, string> = {
  pro_monthly: "price_1TIUBJQtN7BZ4FpXU9k2e2oG",
  pro_yearly: "price_1TMGaXQtN7BZ4FpXivhO1rYU",

  ultimate_monthly: "price_1TIUBVQtN7BZ4FpXEbNmnYHc",
  ultimate_yearly: "price_1TMGbgQtN7BZ4FpXLAGPKcdT",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRole = Deno.env.get("APP_SERVICE_ROLE_KEY");

    if (!stripeKey || !supabaseUrl || !serviceRole) {
      throw new Error("Configurações do servidor incompletas (Secrets).");
    }

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

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey!, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Sessão inválida ou expirada" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // --- LOGICA DO STRIPE ---
    const body = await req.json().catch(() => ({}));
    const planKey = body.plan || "pro_monthly";
    const priceId = PLAN_PRICES[planKey];

    if (!priceId) {
      throw new Error(`Plano inválido enviado pelo front-end: ${planKey}`);
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    const customerId =
      customers.data.length > 0 ? customers.data[0].id : undefined;
    const origin = req.headers.get("origin") || "http://localhost:8080";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/settings?tab=plano&success=true`,
      cancel_url: `${origin}/settings?tab=plano`,
      metadata: {
        user_id: user.id,
        plan: planKey,
      },
    });

    console.log(`✅ Checkout [${planKey}] criado para: ${user.email}`);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("❌ Erro crítico:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
