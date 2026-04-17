import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface LivePrice {
  price: number;
  change: number;
  previousClose: number;
  currency: string;
  updatedAt: string;
  logoUrl?: string;
}

interface Investment {
  id: string;
  name: string;
  asset_type: string;
}

export function useInvestmentPrices() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [livePrices, setLivePrices] = useState<Record<string, LivePrice>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPrices = useCallback(
    async (investments: Investment[], onUpdate?: () => void) => {
      const supported = investments.filter((i) =>
        ["stock", "fii", "etf", "crypto"].includes(i.asset_type),
      );

      if (supported.length === 0) {
        toast({ title: "Nenhum ativo de renda variável para atualizar." });
        return;
      }

      setLoading(true);

      try {
        const tickers = supported.map((i) => i.name.toUpperCase());

        const types: Record<string, string> = {};
        for (const inv of supported) {
          types[inv.name.toUpperCase()] = inv.asset_type;
        }

        const { data, error } = await supabase.functions.invoke(
          "fetch-stock-prices",
          { body: { tickers, types } },
        );

        if (error) throw error;

        if (data?.prices) {
          setLivePrices(data.prices);
          setLastUpdated(new Date());

          const updates = investments
            .filter((inv) => {
              const ticker = inv.name.toUpperCase();
              return data.prices[ticker] !== undefined;
            })
            .map((inv) =>
              supabase
                .from("investments")
                .update({
                  current_price: data.prices[inv.name.toUpperCase()].price,
                })
                .eq("id", inv.id),
            );

          await Promise.all(updates);

          const found = Object.keys(data.prices).length;
          const notFound = tickers.filter((t) => !data.prices[t]);

          toast({
            title: `Preços atualizados! 🔄`,
            description:
              notFound.length > 0
                ? `${found} atualizados. Não encontrados: ${notFound.join(", ")}`
                : `${found} ativo${found !== 1 ? "s" : ""} atualizado${found !== 1 ? "s" : ""}.`,
          });

          onUpdate?.();
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Erro desconhecido";
        toast({
          title: "Erro ao buscar preços",
          description: msg,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  // Retorna o preço ao vivo se disponível, senão null
  const getLivePrice = useCallback(
    (ticker: string): LivePrice | null => {
      return livePrices[ticker.toUpperCase()] ?? null;
    },
    [livePrices],
  );

  return { fetchPrices, getLivePrice, livePrices, loading, lastUpdated };
}
