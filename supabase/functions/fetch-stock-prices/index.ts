import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export interface PriceResult {
  price: number;
  change: number;
  previousClose: number;
  marketCap?: number;
  currency: string;
  updatedAt: string;
  logoUrl?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BRAPI_TOKEN = Deno.env.get("BRAPI_API_TOKEN");
    if (!BRAPI_TOKEN) throw new Error("BRAPI_API_TOKEN is not configured");

    const { tickers, types } = await req.json();

    if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
      return new Response(JSON.stringify({ error: "No tickers provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prices: Record<string, PriceResult> = {};

    const cryptoTickers: string[] = [];
    const equityTickers: string[] = [];

    for (const ticker of tickers) {
      const type = types?.[ticker.toUpperCase()] || "stock";
      if (type === "crypto") {
        cryptoTickers.push(ticker.toUpperCase());
      } else {
        equityTickers.push(ticker.toUpperCase());
      }
    }

    // ── Ações / FIIs / ETFs ──────────────────────────────────────────────────
    for (const ticker of equityTickers) {
      try {
        const url = `https://brapi.dev/api/quote/${ticker}?token=${BRAPI_TOKEN}&fundamental=false`;
        const res = await fetch(url);
        const data = await res.json();

        if (res.ok && data.results?.length > 0) {
          const r = data.results[0];
          prices[ticker] = {
            price: r.regularMarketPrice ?? 0,
            change: r.regularMarketChangePercent ?? 0,
            previousClose:
              r.regularMarketPreviousClose ?? r.regularMarketPrice ?? 0,
            marketCap: r.marketCap,
            currency: r.currency ?? "BRL",
            updatedAt: r.regularMarketTime ?? new Date().toISOString(),
            logoUrl: r.logourl,
          };
        } else {
          console.warn(
            `[equity] Failed ${ticker}:`,
            data.message ?? res.status,
          );
        }
      } catch (e) {
        console.warn(`[equity] Error ${ticker}:`, e.message);
      }
    }

    // ── Cripto ───────────────────────────────────────────────────────────────
    if (cryptoTickers.length > 0) {
      try {
        const coins = cryptoTickers.join(",");
        const url = `https://brapi.dev/api/v2/crypto?coin=${coins}&currency=BRL&token=${BRAPI_TOKEN}`;
        const res = await fetch(url);
        const data = await res.json();

        if (res.ok && data.coins?.length > 0) {
          for (const coin of data.coins) {
            const symbol = coin.coin?.toUpperCase();
            if (!symbol) continue;
            prices[symbol] = {
              price: coin.regularMarketPrice ?? 0,
              change: coin.regularMarketChangePercent ?? 0,
              previousClose:
                coin.regularMarketPreviousClose ?? coin.regularMarketPrice ?? 0,
              currency: "BRL",
              updatedAt: coin.regularMarketTime ?? new Date().toISOString(),
              logoUrl: coin.coinImageUrl,
            };
          }
        } else {
          console.warn("[crypto] Failed:", data.message ?? res.status);
        }
      } catch (e) {
        console.warn("[crypto] Error:", e.message);
      }
    }

    console.log(
      `✅ Preços buscados: ${Object.keys(prices).length}/${tickers.length} tickers`,
    );

    return new Response(JSON.stringify({ prices }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ fetch-stock-prices:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
