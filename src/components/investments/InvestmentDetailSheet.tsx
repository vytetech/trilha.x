import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line, CartesianGrid, Area, AreaChart } from "recharts";

interface Investment {
  id: string;
  name: string;
  asset_type: string;
  quantity: number;
  average_price: number;
  current_price: number;
  dividends_total: number;
}

interface InvestmentTransaction {
  id: string;
  investment_id: string;
  type: string;
  quantity: number;
  price: number;
  total: number;
  transaction_date: string;
  notes: string | null;
}

const typeLabels: Record<string, string> = { stock: "Ação", fii: "FII", etf: "ETF", fixed_income: "Renda Fixa", crypto: "Cripto", other: "Outro" };

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

const tooltipStyle = {
  backgroundColor: "hsl(220 18% 7%)",
  border: "1px solid hsl(220 14% 14%)",
  borderRadius: 8,
  color: "hsl(160 10% 92%)",
};

const customCursor = { fill: "hsl(153 100% 50% / 0.08)" };

interface Props {
  investment: Investment | null;
  transactions: InvestmentTransaction[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InvestmentDetailSheet({ investment, transactions, open, onOpenChange }: Props) {
  if (!investment) return null;

  const invested = Number(investment.quantity) * Number(investment.average_price);
  const current = Number(investment.quantity) * Number(investment.current_price);
  const pl = current - invested;
  const pct = invested > 0 ? ((pl / invested) * 100).toFixed(2) : "0";
  const isPositive = Number(pct) >= 0;

  const assetTxs = transactions
    .filter(tx => tx.investment_id === investment.id)
    .sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime());

  // Build cumulative position chart data
  const positionData: { date: string; quantity: number; invested: number }[] = [];
  let cumQty = 0;
  let cumInvested = 0;
  assetTxs.forEach(tx => {
    if (tx.type === "buy") {
      cumQty += Number(tx.quantity);
      cumInvested += Number(tx.total);
    } else if (tx.type === "sell") {
      cumQty -= Number(tx.quantity);
      cumInvested -= Number(tx.quantity) * Number(investment.average_price);
    }
    positionData.push({
      date: new Date(tx.transaction_date).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
      quantity: cumQty,
      invested: cumInvested,
    });
  });

  // Monthly contributions chart
  const monthlyMap: Record<string, number> = {};
  assetTxs.filter(tx => tx.type === "buy").forEach(tx => {
    const key = new Date(tx.transaction_date).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    monthlyMap[key] = (monthlyMap[key] || 0) + Number(tx.total);
  });
  const monthlyData = Object.entries(monthlyMap).map(([month, value]) => ({ month, value }));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-card border-border w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <div className="rounded-lg bg-primary/10 p-2">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            {investment.name}
            <Badge variant="outline" className="ml-1">{typeLabels[investment.asset_type]}</Badge>
          </SheetTitle>
        </SheetHeader>

        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-lg border border-border bg-secondary/50 p-3">
            <p className="text-xs text-muted-foreground">Preço Médio</p>
            <p className="text-lg font-bold font-mono text-foreground">{fmt(Number(investment.average_price))}</p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/50 p-3">
            <p className="text-xs text-muted-foreground">Preço Atual</p>
            <p className="text-lg font-bold font-mono text-foreground">{fmt(Number(investment.current_price))}</p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/50 p-3">
            <p className="text-xs text-muted-foreground">Quantidade</p>
            <p className="text-lg font-bold font-mono text-foreground">{Number(investment.quantity)}</p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/50 p-3">
            <p className="text-xs text-muted-foreground">Resultado</p>
            <p className={`text-lg font-bold font-mono ${isPositive ? "text-primary" : "text-destructive"}`}>
              {isPositive ? "+" : ""}{pct}%
            </p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/50 p-3">
            <p className="text-xs text-muted-foreground">Total Investido</p>
            <p className="text-base font-bold font-mono text-foreground">{fmt(invested)}</p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/50 p-3">
            <p className="text-xs text-muted-foreground">Valor Atual</p>
            <p className={`text-base font-bold font-mono ${isPositive ? "text-primary" : "text-destructive"}`}>{fmt(current)}</p>
          </div>
        </div>

        {/* Dividends */}
        {Number(investment.dividends_total) > 0 && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 mb-6">
            <p className="text-xs text-muted-foreground">Dividendos Recebidos</p>
            <p className="text-lg font-bold font-mono text-primary">{fmt(Number(investment.dividends_total))}</p>
          </div>
        )}

        {/* Position evolution chart */}
        {positionData.length > 1 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-foreground mb-3">Evolução da Posição</h4>
            <div className="h-[180px] rounded-lg border border-border bg-secondary/30 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={positionData}>
                  <defs>
                    <linearGradient id="posGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(153 100% 50%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(153 100% 50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 14%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(220 10% 50%)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(220 10% 50%)" }} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ stroke: "hsl(153 100% 50%)", strokeWidth: 1, strokeDasharray: "4 4" }}
                    formatter={(v: number, name: string) => [name === "invested" ? fmt(v) : v, name === "invested" ? "Investido" : "Quantidade"]}
                  />
                  <Area type="monotone" dataKey="invested" stroke="hsl(153 100% 50%)" fill="url(#posGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Monthly contributions chart */}
        {monthlyData.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-foreground mb-3">Aportes Mensais</h4>
            <div className="h-[160px] rounded-lg border border-border bg-secondary/30 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(220 10% 50%)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(220 10% 50%)" }} />
                  <Tooltip contentStyle={tooltipStyle} cursor={customCursor} formatter={(v: number) => [fmt(v), "Aporte"]} />
                  <Bar dataKey="value" fill="hsl(153 100% 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Transaction history */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">Histórico de Transações</h4>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {assetTxs.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Nenhuma transação registrada.</p>}
            {[...assetTxs].reverse().map(tx => (
              <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/30">
                <div className="flex items-center gap-2">
                  {tx.type === "buy" ? <ArrowDownCircle className="h-4 w-4 text-primary" /> : tx.type === "sell" ? <ArrowUpCircle className="h-4 w-4 text-destructive" /> : <TrendingUp className="h-4 w-4 text-accent" />}
                  <div>
                    <Badge variant="outline" className="text-[10px]">{tx.type === "buy" ? "Compra" : tx.type === "sell" ? "Venda" : "Dividendo"}</Badge>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{new Date(tx.transaction_date).toLocaleDateString("pt-BR")} · {Number(tx.quantity)} un × {fmt(Number(tx.price))}</p>
                  </div>
                </div>
                <span className="font-bold font-mono text-sm text-foreground">{fmt(Number(tx.total))}</span>
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
