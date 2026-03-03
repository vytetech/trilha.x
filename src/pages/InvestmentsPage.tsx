import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Plus, Trash2, Calculator, RefreshCw, ArrowUpCircle, ArrowDownCircle, Wallet, BarChart3, DollarSign, Percent, PieChart as PieChartIcon, ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend, Area, AreaChart, RadialBarChart, RadialBar } from "recharts";
import InvestmentDetailSheet from "@/components/investments/InvestmentDetailSheet";

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
const COLORS = ["hsl(153,100%,50%)", "hsl(200,80%,50%)", "hsl(280,70%,55%)", "hsl(40,90%,55%)", "hsl(0,72%,51%)", "hsl(180,60%,45%)"];

const tooltipStyle = {
  backgroundColor: "hsl(220 18% 7%)",
  border: "1px solid hsl(220 14% 14%)",
  borderRadius: 8,
  color: "hsl(160 10% 92%)",
};

const customCursor = { fill: "hsl(153 100% 50% / 0.08)" };

type PeriodFilter = "month" | "year" | "all";

export default function InvestmentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [investTxs, setInvestTxs] = useState<InvestmentTransaction[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [txDialogOpen, setTxDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", asset_type: "stock", quantity: "", average_price: "", current_price: "" });
  const [txForm, setTxForm] = useState({ investment_id: "", type: "buy", quantity: "", price: "", date: new Date().toISOString().split("T")[0], notes: "" });
  const [simAporte, setSimAporte] = useState("1000");
  const [simTaxa, setSimTaxa] = useState("1");
  const [simAnos, setSimAnos] = useState("10");
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [period, setPeriod] = useState<PeriodFilter>("all");

  const fetchData = async () => {
    if (!user) return;
    const [invRes, txRes] = await Promise.all([
      supabase.from("investments").select("*").eq("user_id", user.id).order("created_at"),
      supabase.from("investment_transactions").select("*").eq("user_id", user.id).order("transaction_date", { ascending: false }),
    ]);
    if (invRes.data) setInvestments(invRes.data);
    if (txRes.data) setInvestTxs(txRes.data as InvestmentTransaction[]);
  };

  useEffect(() => { fetchData(); }, [user]);

  // Filter transactions by period
  const filteredTxs = useMemo(() => {
    const now = new Date();
    return investTxs.filter(tx => {
      if (period === "all") return true;
      const d = new Date(tx.transaction_date);
      if (period === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (period === "year") return d.getFullYear() === now.getFullYear();
      return true;
    });
  }, [investTxs, period]);

  const totalInvested = investments.reduce((a, i) => a + Number(i.quantity) * Number(i.average_price), 0);
  const totalCurrent = investments.reduce((a, i) => a + Number(i.quantity) * Number(i.current_price), 0);
  const totalDividends = investments.reduce((a, i) => a + Number(i.dividends_total), 0);
  const totalPL = totalCurrent - totalInvested;
  const rentPct = totalInvested > 0 ? ((totalPL / totalInvested) * 100).toFixed(2) : "0";
  const totalAssets = investments.length;

  // Period-specific totals
  const periodAportes = filteredTxs.filter(tx => tx.type === "buy").reduce((a, tx) => a + Number(tx.total), 0);
  const periodVendas = filteredTxs.filter(tx => tx.type === "sell").reduce((a, tx) => a + Number(tx.total), 0);
  const periodDividends = filteredTxs.filter(tx => tx.type === "dividend").reduce((a, tx) => a + Number(tx.total), 0);

  const createInvestment = async () => {
    if (!user || !form.name) return;
    await supabase.from("investments").insert({
      user_id: user.id, name: form.name, asset_type: form.asset_type,
      quantity: Number(form.quantity) || 0, average_price: Number(form.average_price) || 0, current_price: Number(form.current_price) || 0,
    });
    setForm({ name: "", asset_type: "stock", quantity: "", average_price: "", current_price: "" });
    setDialogOpen(false);
    fetchData();
    toast({ title: "Investimento adicionado! 📈" });
  };

  const createInvestTx = async () => {
    if (!user || !txForm.investment_id || !txForm.quantity || !txForm.price) return;
    const qty = Number(txForm.quantity);
    const price = Number(txForm.price);
    const total = qty * price;

    await supabase.from("investment_transactions").insert({
      user_id: user.id, investment_id: txForm.investment_id, type: txForm.type,
      quantity: qty, price, total, transaction_date: txForm.date, notes: txForm.notes || null,
    });

    const inv = investments.find(i => i.id === txForm.investment_id);
    if (inv) {
      if (txForm.type === "buy") {
        const newQty = Number(inv.quantity) + qty;
        const newAvg = (Number(inv.quantity) * Number(inv.average_price) + total) / newQty;
        await supabase.from("investments").update({ quantity: newQty, average_price: newAvg }).eq("id", inv.id);
      } else if (txForm.type === "sell") {
        const newQty = Math.max(0, Number(inv.quantity) - qty);
        await supabase.from("investments").update({ quantity: newQty }).eq("id", inv.id);
      } else if (txForm.type === "dividend") {
        await supabase.from("investments").update({ dividends_total: Number(inv.dividends_total) + total }).eq("id", inv.id);
      }
    }

    setTxForm({ investment_id: "", type: "buy", quantity: "", price: "", date: new Date().toISOString().split("T")[0], notes: "" });
    setTxDialogOpen(false);
    fetchData();
    toast({ title: "Transação registrada! 💰" });
  };

  const deleteInvestment = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from("investments").delete().eq("id", id);
    fetchData();
  };

  const fetchLivePrices = async () => {
    const stockTickers = investments
      .filter(i => ["stock", "fii", "etf"].includes(i.asset_type))
      .map(i => i.name.toUpperCase());
    if (stockTickers.length === 0) {
      toast({ title: "Nenhum ativo de renda variável para atualizar." });
      return;
    }
    setLoadingPrices(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-stock-prices", { body: { tickers: stockTickers } });
      if (error) throw error;
      if (data?.prices) {
        for (const inv of investments) {
          const ticker = inv.name.toUpperCase();
          if (data.prices[ticker]) {
            await supabase.from("investments").update({ current_price: data.prices[ticker].price }).eq("id", inv.id);
          }
        }
        fetchData();
        toast({ title: "Preços atualizados! 🔄" });
      }
    } catch (e: any) {
      toast({ title: "Erro ao buscar preços", description: e.message, variant: "destructive" });
    } finally {
      setLoadingPrices(false);
    }
  };

  const allocationData = Object.entries(
    investments.reduce((acc, i) => { const t = typeLabels[i.asset_type]; acc[t] = (acc[t] || 0) + Number(i.quantity) * Number(i.current_price); return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  // Per-asset allocation
  const assetAllocation = investments
    .map(i => ({ name: i.name, value: Number(i.quantity) * Number(i.current_price), type: typeLabels[i.asset_type] }))
    .filter(a => a.value > 0)
    .sort((a, b) => b.value - a.value);

  const allocationTotal = assetAllocation.reduce((a, b) => a + b.value, 0);

  // Monthly evolution data for resumo (filtered by period)
  const monthlyEvolution = useMemo(() => {
    const map: Record<string, { aportes: number; vendas: number; dividendos: number }> = {};
    filteredTxs.forEach(tx => {
      const key = new Date(tx.transaction_date).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      if (!map[key]) map[key] = { aportes: 0, vendas: 0, dividendos: 0 };
      if (tx.type === "buy") map[key].aportes += Number(tx.total);
      else if (tx.type === "sell") map[key].vendas += Number(tx.total);
      else if (tx.type === "dividend") map[key].dividendos += Number(tx.total);
    });
    return Object.entries(map).reverse().slice(0, 12).reverse().map(([month, v]) => ({ month, ...v }));
  }, [filteredTxs]);

  // Dividend evolution (investidor10 style - cumulative)
  const dividendEvolution = useMemo(() => {
    const divTxs = investTxs
      .filter(tx => tx.type === "dividend")
      .sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime());

    const monthMap: Record<string, { monthly: number; cumulative: number }> = {};
    let cumulative = 0;
    divTxs.forEach(tx => {
      const key = new Date(tx.transaction_date).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      if (!monthMap[key]) monthMap[key] = { monthly: 0, cumulative: 0 };
      monthMap[key].monthly += Number(tx.total);
      cumulative += Number(tx.total);
      monthMap[key].cumulative = cumulative;
    });
    return Object.entries(monthMap).map(([month, v]) => ({ month, ...v }));
  }, [investTxs]);

  // Dividend by asset
  const dividendByAsset = useMemo(() => {
    const map: Record<string, number> = {};
    investTxs.filter(tx => tx.type === "dividend").forEach(tx => {
      const name = getInvestmentName(tx.investment_id);
      map[name] = (map[name] || 0) + Number(tx.total);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [investTxs, investments]);

  // Top assets by value
  const topAssets = [...investments]
    .map(i => ({ name: i.name, value: Number(i.quantity) * Number(i.current_price), pl: invested(i) > 0 ? (Number(i.current_price) - Number(i.average_price)) / Number(i.average_price) * 100 : 0 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  function invested(i: Investment) { return Number(i.quantity) * Number(i.average_price); }

  const simResult = (() => {
    const aporte = Number(simAporte);
    const taxa = Number(simTaxa) / 100;
    const meses = Number(simAnos) * 12;
    let total = 0;
    for (let i = 0; i < meses; i++) total = (total + aporte) * (1 + taxa);
    return total;
  })();

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  const getInvestmentName = (id: string) => investments.find(i => i.id === id)?.name || "—";

  const periodLabel = period === "month" ? "Este Mês" : period === "year" ? "Este Ano" : "Todo Período";

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><TrendingUp className="h-6 w-6 text-primary" /> Investimentos</h1>
          <p className="text-sm text-muted-foreground mt-1">Acompanhe seu portfólio e evolução patrimonial</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchLivePrices} disabled={loadingPrices} title="Atualizar Preços">
            <RefreshCw className={`h-4 w-4 ${loadingPrices ? "animate-spin" : ""}`} />
          </Button>

          <Dialog open={txDialogOpen} onOpenChange={setTxDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" title="Registrar Transação">
                <DollarSign className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle>Registrar Transação</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <Button variant={txForm.type === "buy" ? "default" : "outline"} onClick={() => setTxForm({ ...txForm, type: "buy" })} size="sm">Compra</Button>
                  <Button variant={txForm.type === "sell" ? "default" : "outline"} onClick={() => setTxForm({ ...txForm, type: "sell" })} size="sm">Venda</Button>
                  <Button variant={txForm.type === "dividend" ? "default" : "outline"} onClick={() => setTxForm({ ...txForm, type: "dividend" })} size="sm">Dividendo</Button>
                </div>
                <div className="space-y-2"><Label>Ativo</Label>
                  <Select value={txForm.investment_id} onValueChange={(v) => setTxForm({ ...txForm, investment_id: v })}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{investments.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Quantidade</Label><Input type="number" value={txForm.quantity} onChange={(e) => setTxForm({ ...txForm, quantity: e.target.value })} className="bg-secondary border-border" /></div>
                  <div className="space-y-2"><Label>Preço (R$)</Label><Input type="number" value={txForm.price} onChange={(e) => setTxForm({ ...txForm, price: e.target.value })} className="bg-secondary border-border" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Data</Label><Input type="date" value={txForm.date} onChange={(e) => setTxForm({ ...txForm, date: e.target.value })} className="bg-secondary border-border" /></div>
                  <div className="space-y-2"><Label>Observação</Label><Input value={txForm.notes} onChange={(e) => setTxForm({ ...txForm, notes: e.target.value })} className="bg-secondary border-border" /></div>
                </div>
                {txForm.quantity && txForm.price && (
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm text-muted-foreground">Total: <span className="font-bold text-foreground">{fmt(Number(txForm.quantity) * Number(txForm.price))}</span></p>
                  </div>
                )}
                <Button onClick={createInvestTx} className="w-full">Registrar</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Novo Ativo</Button></DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle>Adicionar Ativo</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Nome / Ticker</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-secondary border-border" placeholder="Ex: PETR4, KNRI11" /></div>
                <div className="space-y-2"><Label>Tipo</Label>
                  <Select value={form.asset_type} onValueChange={(v) => setForm({ ...form, asset_type: v })}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2"><Label>Qtd</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="bg-secondary border-border" /></div>
                  <div className="space-y-2"><Label>PM (R$)</Label><Input type="number" value={form.average_price} onChange={(e) => setForm({ ...form, average_price: e.target.value })} className="bg-secondary border-border" /></div>
                  <div className="space-y-2"><Label>Atual (R$)</Label><Input type="number" value={form.current_price} onChange={(e) => setForm({ ...form, current_price: e.target.value })} className="bg-secondary border-border" /></div>
                </div>
                <Button onClick={createInvestment} className="w-full">Adicionar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      <Tabs defaultValue="resumo">
        <TabsList className="bg-secondary border border-border">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="ativos">Ativos</TabsTrigger>
          <TabsTrigger value="transacoes">Transações</TabsTrigger>
          <TabsTrigger value="dividendos">Dividendos</TabsTrigger>
          <TabsTrigger value="alocacao">Alocação</TabsTrigger>
          <TabsTrigger value="simulador">Simulador</TabsTrigger>
        </TabsList>

        {/* ===== RESUMO ===== */}
        <TabsContent value="resumo" className="mt-4 space-y-6">
          {/* Period filter */}
          <div className="flex items-center gap-2">
            <ListFilter className="h-4 w-4 text-muted-foreground" />
            <div className="flex gap-1 bg-secondary rounded-lg p-1 border border-border">
              {(["month", "year", "all"] as PeriodFilter[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {p === "month" ? "Mês" : p === "year" ? "Ano" : "Tudo"}
                </button>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">{periodLabel}</span>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">Patrimônio</p>
                <div className="rounded-lg bg-primary/10 p-1.5"><Wallet className="h-4 w-4 text-primary" /></div>
              </div>
              <p className="text-xl font-bold neon-text font-mono">{fmt(totalCurrent)}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{totalAssets} ativo{totalAssets !== 1 ? "s" : ""}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">Aportes ({periodLabel})</p>
                <div className="rounded-lg bg-secondary p-1.5"><ArrowDownCircle className="h-4 w-4 text-primary" /></div>
              </div>
              <p className="text-xl font-bold text-foreground font-mono">{fmt(periodAportes)}</p>
              {periodVendas > 0 && <p className="text-[11px] text-muted-foreground mt-1">Vendas: {fmt(periodVendas)}</p>}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">Lucro / Prejuízo</p>
                <div className={`rounded-lg p-1.5 ${totalPL >= 0 ? "bg-primary/10" : "bg-destructive/10"}`}>
                  {totalPL >= 0 ? <TrendingUp className="h-4 w-4 text-primary" /> : <ArrowDownCircle className="h-4 w-4 text-destructive" />}
                </div>
              </div>
              <p className={`text-xl font-bold font-mono ${totalPL >= 0 ? "text-primary" : "text-destructive"}`}>{fmt(totalPL)}</p>
              <p className={`text-[11px] font-mono mt-1 ${Number(rentPct) >= 0 ? "text-primary" : "text-destructive"}`}>{Number(rentPct) >= 0 ? "+" : ""}{rentPct}%</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">Dividendos ({periodLabel})</p>
                <div className="rounded-lg bg-accent/10 p-1.5"><DollarSign className="h-4 w-4 text-accent" /></div>
              </div>
              <p className="text-xl font-bold text-accent font-mono">{fmt(periodDividends)}</p>
              {period !== "all" && <p className="text-[11px] text-muted-foreground mt-1">Total: {fmt(totalDividends)}</p>}
            </motion.div>
          </div>

          {/* Charts row */}
          <div className="grid md:grid-cols-2 gap-4">
            {monthlyEvolution.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Aportes vs Vendas vs Dividendos</h3>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyEvolution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 14%)" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(220 10% 50%)" }} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(220 10% 50%)" }} />
                      <Tooltip contentStyle={tooltipStyle} cursor={customCursor} formatter={(v: number) => fmt(v)} />
                      <Bar dataKey="aportes" name="Aportes" fill="hsl(153 100% 50%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="vendas" name="Vendas" fill="hsl(0 72% 51%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="dividendos" name="Dividendos" fill="hsl(40 90% 55%)" radius={[4, 4, 0, 0]} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {allocationData.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Alocação por Tipo</h3>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={allocationData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {allocationData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Top assets table */}
          {topAssets.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Maiores Posições</h3>
              <div className="space-y-2">
                {topAssets.map((a, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}.</span>
                      <span className="font-medium text-foreground">{a.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-sm text-foreground">{fmt(a.value)}</span>
                      <span className={`text-xs font-mono ${a.pl >= 0 ? "text-primary" : "text-destructive"}`}>{a.pl >= 0 ? "+" : ""}{a.pl.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ===== ATIVOS ===== */}
        <TabsContent value="ativos" className="mt-4">
          <div className="space-y-2">
            {investments.map((inv) => {
              const inv_invested = Number(inv.quantity) * Number(inv.average_price);
              const current = Number(inv.quantity) * Number(inv.current_price);
              const pl = current - inv_invested;
              const pct = inv_invested > 0 ? ((pl / inv_invested) * 100).toFixed(2) : "0";
              return (
                <div
                  key={inv.id}
                  onClick={() => { setSelectedInvestment(inv); setDetailOpen(true); }}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-card group hover:border-primary/20 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2"><TrendingUp className="h-4 w-4 text-primary" /></div>
                    <div>
                      <p className="font-medium text-foreground">{inv.name}</p>
                      <div className="flex gap-2 mt-0.5 flex-wrap">
                        <Badge variant="outline" className="text-xs">{typeLabels[inv.asset_type]}</Badge>
                        <span className="text-xs text-muted-foreground">{Number(inv.quantity)} un</span>
                        <span className="text-xs text-muted-foreground">PM: {fmt(Number(inv.average_price))}</span>
                        <span className="text-xs text-muted-foreground">Atual: {fmt(Number(inv.current_price))}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold font-mono text-foreground">{fmt(current)}</p>
                      <p className={`text-xs font-mono ${Number(pct) >= 0 ? "text-primary" : "text-destructive"}`}>{Number(pct) >= 0 ? "+" : ""}{pct}%</p>
                    </div>
                    <button onClick={(e) => deleteInvestment(inv.id, e)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              );
            })}
            {investments.length === 0 && <div className="text-center py-12 text-muted-foreground"><TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>Nenhum ativo cadastrado.</p></div>}
          </div>
        </TabsContent>

        {/* ===== TRANSAÇÕES ===== */}
        <TabsContent value="transacoes" className="mt-4 space-y-2">
          {investTxs.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card group hover:border-primary/20 transition-colors">
              <div className="flex items-center gap-3">
                {tx.type === "buy" ? <ArrowDownCircle className="h-5 w-5 text-primary" /> : tx.type === "sell" ? <ArrowUpCircle className="h-5 w-5 text-destructive" /> : <TrendingUp className="h-5 w-5 text-accent" />}
                <div>
                  <p className="text-sm font-medium text-foreground">{getInvestmentName(tx.investment_id)}</p>
                  <div className="flex gap-2 mt-0.5 flex-wrap">
                    <Badge variant="outline" className="text-xs">{tx.type === "buy" ? "Compra" : tx.type === "sell" ? "Venda" : "Dividendo"}</Badge>
                    <span className="text-xs text-muted-foreground">{Number(tx.quantity)} un × {fmt(Number(tx.price))}</span>
                    <span className="text-xs text-muted-foreground">{new Date(tx.transaction_date).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
              </div>
              <span className={`font-bold font-mono ${tx.type === "sell" ? "text-primary" : tx.type === "dividend" ? "text-accent" : "text-foreground"}`}>{fmt(Number(tx.total))}</span>
            </div>
          ))}
          {investTxs.length === 0 && <div className="text-center py-12 text-muted-foreground"><TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>Nenhuma transação registrada.</p></div>}
        </TabsContent>

        {/* ===== DIVIDENDOS ===== */}
        <TabsContent value="dividendos" className="mt-4 space-y-6">
          {/* KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground mb-1">Total Recebido</p>
              <p className="text-2xl font-bold text-accent font-mono">{fmt(totalDividends)}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground mb-1">Dividend Yield</p>
              <p className="text-2xl font-bold text-foreground font-mono">{totalInvested > 0 ? ((totalDividends / totalInvested) * 100).toFixed(2) : "0"}%</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground mb-1">Média Mensal</p>
              <p className="text-2xl font-bold text-foreground font-mono">
                {fmt(dividendEvolution.length > 0 ? totalDividends / dividendEvolution.length : 0)}
              </p>
            </div>
          </div>

          {/* Cumulative dividend evolution */}
          {dividendEvolution.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Evolução dos Dividendos (Acumulado)</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dividendEvolution}>
                    <defs>
                      <linearGradient id="divGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(153 100% 50%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(153 100% 50%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 14%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(220 10% 50%)" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(220 10% 50%)" }} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "hsl(153 100% 50%)", strokeWidth: 1, strokeDasharray: "4 4" }} formatter={(v: number, name: string) => [fmt(v), name === "cumulative" ? "Acumulado" : "Mensal"]} />
                    <Area type="monotone" dataKey="cumulative" stroke="hsl(153 100% 50%)" fill="url(#divGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Monthly dividends bar */}
          {dividendEvolution.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Dividendos Mensais</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dividendEvolution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 14%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(220 10% 50%)" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(220 10% 50%)" }} />
                    <Tooltip contentStyle={tooltipStyle} cursor={customCursor} formatter={(v: number) => [fmt(v), "Mensal"]} />
                    <Bar dataKey="monthly" fill="hsl(153 80% 40%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Dividend by asset */}
          {dividendByAsset.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Dividendos por Ativo</h3>
              <div className="space-y-2">
                {dividendByAsset.map((a, i) => {
                  const pctOfTotal = totalDividends > 0 ? (a.value / totalDividends * 100) : 0;
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{a.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm text-foreground">{fmt(a.value)}</span>
                          <span className="text-xs text-muted-foreground w-12 text-right">{pctOfTotal.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pctOfTotal}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {dividendEvolution.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum dividendo registrado ainda.</p>
            </div>
          )}
        </TabsContent>

        {/* ===== ALOCAÇÃO ===== */}
        <TabsContent value="alocacao" className="mt-4 space-y-6">
          {allocationData.length > 0 ? (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                {/* By type pie */}
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Alocação por Tipo</h3>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={allocationData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {allocationData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmt(v)} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* By asset pie */}
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Alocação por Ativo</h3>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={assetAllocation} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {assetAllocation.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmt(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Asset breakdown horizontal bar */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Composição do Portfólio</h3>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={assetAllocation} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 14%)" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(220 10% 50%)" }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "hsl(220 10% 50%)" }} width={70} />
                      <Tooltip contentStyle={tooltipStyle} cursor={customCursor} formatter={(v: number) => fmt(v)} />
                      <Bar dataKey="value" name="Valor" fill="hsl(153 100% 50%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Allocation table */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Detalhamento</h3>
                <div className="space-y-2">
                  {assetAllocation.map((a, i) => {
                    const pctOfTotal = allocationTotal > 0 ? (a.value / allocationTotal * 100) : 0;
                    return (
                      <div key={i} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="text-sm font-medium text-foreground">{a.name}</span>
                            <Badge variant="outline" className="text-[10px]">{a.type}</Badge>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-mono text-sm text-foreground">{fmt(a.value)}</span>
                            <span className="text-xs font-mono text-muted-foreground w-14 text-right">{pctOfTotal.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pctOfTotal}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : <div className="text-center py-12 text-muted-foreground"><PieChartIcon className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>Adicione ativos para ver a alocação.</p></div>}
        </TabsContent>

        {/* ===== SIMULADOR ===== */}
        <TabsContent value="simulador" className="mt-4">
          <div className="rounded-xl border border-border bg-card p-6 max-w-lg">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Calculator className="h-5 w-5 text-primary" /> Simulador de Aportes</h3>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Aporte mensal (R$)</Label><Input type="number" value={simAporte} onChange={(e) => setSimAporte(e.target.value)} className="bg-secondary border-border" /></div>
              <div className="space-y-2"><Label>Taxa mensal (%)</Label><Input type="number" value={simTaxa} onChange={(e) => setSimTaxa(e.target.value)} className="bg-secondary border-border" step="0.1" /></div>
              <div className="space-y-2"><Label>Período (anos)</Label><Input type="number" value={simAnos} onChange={(e) => setSimAnos(e.target.value)} className="bg-secondary border-border" /></div>
              <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/30">
                <p className="text-sm text-muted-foreground">Resultado estimado em {simAnos} anos:</p>
                <p className="text-3xl font-bold neon-text font-mono mt-1">{fmt(simResult)}</p>
                <p className="text-xs text-muted-foreground mt-1">Total aportado: {fmt(Number(simAporte) * Number(simAnos) * 12)}</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <InvestmentDetailSheet
        investment={selectedInvestment}
        transactions={investTxs}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
