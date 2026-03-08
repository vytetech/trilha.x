import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BRAPI_API_TOKEN = Deno.env.get("BRAPI_API_TOKEN");
    if (!BRAPI_API_TOKEN) {
      throw new Error("BRAPI_API_TOKEN is not configured");
    }

    const { tickers } = await req.json();
    
    if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
      return new Response(JSON.stringify({ error: 'No tickers provided' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tickerStr = tickers.join(',');
    console.log('Fetching tickers:', tickerStr);
    console.log('Token length:', BRAPI_API_TOKEN.length);
    const response = await fetch(`https://brapi.dev/api/quote/${tickerStr}?token=${BRAPI_API_TOKEN}`);
    const data = await response.json();
    console.log('brapi response status:', response.status, 'body:', JSON.stringify(data));

    if (!response.ok) {
      throw new Error(`brapi API error: ${response.status} - ${JSON.stringify(data)}`);
    }

    const prices: Record<string, { price: number; change: number; marketCap?: number; updatedAt: string }> = {};
    
    if (data.results) {
      for (const result of data.results) {
        prices[result.symbol] = {
          price: result.regularMarketPrice || 0,
          change: result.regularMarketChangePercent || 0,
          marketCap: result.marketCap,
          updatedAt: result.regularMarketTime || new Date().toISOString(),
        };
      }
    }

    return new Response(JSON.stringify({ prices }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching stock prices:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
