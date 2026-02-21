import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Plus, Trash2, DollarSign, BarChart3, Calculator } from "lucide-react";
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
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface Investment {
  id: string;
  name: string;
  asset_type: string;
  quantity: number;
  average_price: number;
  current_price: number;
  dividends_total: number;
}

const typeLabels: Record<string, string> = { stock: "Ação", fii: "FII", etf: "ETF", fixed_income: "Renda Fixa", crypto: "Cripto", other: "Outro" };
const COLORS = ["hsl(153,100%,50%)", "hsl(200,80%,50%)", "hsl(280,70%,55%)", "hsl(40,90%,55%)", "hsl(0,72%,51%)", "hsl(180,60%,45%)"];

export default function InvestmentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", asset_type: "stock", quantity: "", average_price: "", current_price: "" });
  const [simAporte, setSimAporte] = useState("1000");
  const [simTaxa, setSimTaxa] = useState("1");
  const [simAnos, setSimAnos] = useState("10");

  const fetchData = async () => {
    if (!user) return;
    const { data } = await supabase.from("investments").select("*").eq("user_id", user.id).order("created_at");
    if (data) setInvestments(data);
  };

  useEffect(() => { fetchData(); }, [user]);

  const totalInvested = investments.reduce((a, i) => a + Number(i.quantity) * Number(i.average_price), 0);
  const totalCurrent = investments.reduce((a, i) => a + Number(i.quantity) * Number(i.current_price), 0);
  const totalDividends = investments.reduce((a, i) => a + Number(i.dividends_total), 0);
  const totalPL = totalCurrent - totalInvested;
  const rentPct = totalInvested > 0 ? ((totalPL / totalInvested) * 100).toFixed(2) : "0";

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

  const deleteInvestment = async (id: string) => {
    await supabase.from("investments").delete().eq("id", id);
    fetchData();
  };

  const allocationData = Object.entries(
    investments.reduce((acc, i) => { const t = typeLabels[i.asset_type]; acc[t] = (acc[t] || 0) + Number(i.quantity) * Number(i.current_price); return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  // Simulator
  const simResult = (() => {
    const aporte = Number(simAporte);
    const taxa = Number(simTaxa) / 100;
    const meses = Number(simAnos) * 12;
    let total = 0;
    for (let i = 0; i < meses; i++) total = (total + aporte) * (1 + taxa);
    return total;
  })();

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><TrendingUp className="h-6 w-6 text-primary" /> Investimentos</h1>
          <p className="text-sm text-muted-foreground mt-1">Acompanhe seu portfólio e evolução patrimonial</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Novo Ativo</Button></DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>Adicionar Ativo</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Nome / Ticker</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-secondary border-border" /></div>
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
      </motion.div>

      <Tabs defaultValue="resumo">
        <TabsList className="bg-secondary border border-border">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="ativos">Ativos</TabsTrigger>
          <TabsTrigger value="alocacao">Alocação</TabsTrigger>
          <TabsTrigger value="simulador">Simulador</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground mb-1">Patrimônio</p><p className="text-xl font-bold neon-text font-mono">{fmt(totalCurrent)}</p></div>
            <div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground mb-1">Investido</p><p className="text-xl font-bold text-foreground font-mono">{fmt(totalInvested)}</p></div>
            <div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground mb-1">Lucro/Prejuízo</p><p className={`text-xl font-bold font-mono ${totalPL >= 0 ? "text-primary" : "text-destructive"}`}>{fmt(totalPL)}</p></div>
            <div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground mb-1">Rentabilidade</p><p className={`text-xl font-bold font-mono ${Number(rentPct) >= 0 ? "text-primary" : "text-destructive"}`}>{rentPct}%</p></div>
          </div>
        </TabsContent>

        <TabsContent value="ativos" className="mt-4">
          <div className="space-y-2">
            {investments.map((inv) => {
              const invested = Number(inv.quantity) * Number(inv.average_price);
              const current = Number(inv.quantity) * Number(inv.current_price);
              const pl = current - invested;
              const pct = invested > 0 ? ((pl / invested) * 100).toFixed(2) : "0";
              return (
                <div key={inv.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-card group hover:border-primary/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2"><TrendingUp className="h-4 w-4 text-primary" /></div>
                    <div>
                      <p className="font-medium text-foreground">{inv.name}</p>
                      <div className="flex gap-2 mt-0.5"><Badge variant="outline" className="text-xs">{typeLabels[inv.asset_type]}</Badge><span className="text-xs text-muted-foreground">{Number(inv.quantity)} un × {fmt(Number(inv.current_price))}</span></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold font-mono text-foreground">{fmt(current)}</p>
                      <p className={`text-xs font-mono ${Number(pct) >= 0 ? "text-primary" : "text-destructive"}`}>{Number(pct) >= 0 ? "+" : ""}{pct}%</p>
                    </div>
                    <button onClick={() => deleteInvestment(inv.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              );
            })}
            {investments.length === 0 && <div className="text-center py-12 text-muted-foreground"><TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>Nenhum ativo cadastrado.</p></div>}
          </div>
        </TabsContent>

        <TabsContent value="alocacao" className="mt-4">
          {allocationData.length > 0 ? (
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={allocationData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${fmt(value)}`}>
                    {allocationData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie><Tooltip formatter={(v: number) => fmt(v)} /></PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : <div className="text-center py-12 text-muted-foreground"><p>Adicione ativos para ver a alocação.</p></div>}
        </TabsContent>

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
    </div>
  );
}
