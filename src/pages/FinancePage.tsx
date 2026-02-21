import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Wallet, Plus, ArrowUpCircle, ArrowDownCircle, Trash2, TrendingUp, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RPieChart, Pie, Cell, LineChart, Line } from "recharts";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  category: string;
  description: string | null;
  transaction_date: string;
  payment_method: string | null;
}

interface Budget {
  id: string;
  category: string;
  monthly_limit: number;
  month: number;
  year: number;
}

const categories = ["Alimentação", "Transporte", "Moradia", "Lazer", "Saúde", "Educação", "Assinaturas", "Salário", "Freelance", "Investimentos", "Outros"];
const COLORS = ["hsl(153,100%,50%)", "hsl(200,80%,50%)", "hsl(280,70%,55%)", "hsl(40,90%,55%)", "hsl(0,72%,51%)", "hsl(180,60%,45%)", "hsl(320,70%,50%)", "hsl(120,50%,40%)"];

export default function FinancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [form, setForm] = useState({ type: "expense", amount: "", category: "Outros", description: "", date: new Date().toISOString().split("T")[0], payment_method: "" });
  const [budgetForm, setBudgetForm] = useState({ category: "Alimentação", limit: "" });

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const fetchData = async () => {
    if (!user) return;
    const startDate = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
    const endDate = `${currentYear}-${String(currentMonth + 1 > 12 ? 1 : currentMonth + 1).padStart(2, "0")}-01`;
    const [txRes, budgetRes] = await Promise.all([
      supabase.from("transactions").select("*").eq("user_id", user.id).gte("transaction_date", startDate).lt("transaction_date", endDate).order("transaction_date", { ascending: false }),
      supabase.from("budgets").select("*").eq("user_id", user.id).eq("month", currentMonth).eq("year", currentYear),
    ]);
    if (txRes.data) setTransactions(txRes.data);
    if (budgetRes.data) setBudgets(budgetRes.data);
  };

  useEffect(() => { fetchData(); }, [user]);

  const income = transactions.filter((t) => t.type === "income").reduce((a, t) => a + Number(t.amount), 0);
  const expenses = transactions.filter((t) => t.type === "expense").reduce((a, t) => a + Number(t.amount), 0);
  const balance = income - expenses;
  const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0;

  const createTransaction = async () => {
    if (!user || !form.amount) return;
    await supabase.from("transactions").insert({
      user_id: user.id, type: form.type, amount: Number(form.amount), category: form.category,
      description: form.description || null, transaction_date: form.date, payment_method: form.payment_method || null,
    });
    setForm({ type: "expense", amount: "", category: "Outros", description: "", date: new Date().toISOString().split("T")[0], payment_method: "" });
    setDialogOpen(false);
    fetchData();
    toast({ title: "Transação registrada! 💰" });
  };

  const createBudget = async () => {
    if (!user || !budgetForm.limit) return;
    await supabase.from("budgets").upsert({
      user_id: user.id, category: budgetForm.category, monthly_limit: Number(budgetForm.limit), month: currentMonth, year: currentYear,
    }, { onConflict: "user_id,category,month,year" });
    setBudgetForm({ category: "Alimentação", limit: "" });
    setBudgetDialogOpen(false);
    fetchData();
  };

  const deleteTransaction = async (id: string) => {
    await supabase.from("transactions").delete().eq("id", id);
    fetchData();
  };

  // Chart data
  const categoryData = Object.entries(
    transactions.filter((t) => t.type === "expense").reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + Number(t.amount); return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Wallet className="h-6 w-6 text-primary" /> Financeiro</h1>
          <p className="text-sm text-muted-foreground mt-1">Controle total da sua vida financeira</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Nova Transação</Button></DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>Nova Transação</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button variant={form.type === "income" ? "default" : "outline"} onClick={() => setForm({ ...form, type: "income" })} className="gap-2"><ArrowUpCircle className="h-4 w-4" /> Receita</Button>
                <Button variant={form.type === "expense" ? "default" : "outline"} onClick={() => setForm({ ...form, type: "expense" })} className="gap-2"><ArrowDownCircle className="h-4 w-4" /> Despesa</Button>
              </div>
              <div className="space-y-2"><Label>Valor (R$)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="bg-secondary border-border" placeholder="0,00" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Categoria</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Data</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="bg-secondary border-border" /></div>
              </div>
              <div className="space-y-2"><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-secondary border-border" /></div>
              <Button onClick={createTransaction} className="w-full">Registrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <Tabs defaultValue="resumo">
        <TabsList className="bg-secondary border border-border">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="transacoes">Transações</TabsTrigger>
          <TabsTrigger value="graficos">Gráficos</TabsTrigger>
          <TabsTrigger value="orcamentos">Orçamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground mb-1">Receita</p><p className="text-xl font-bold text-primary font-mono">{fmt(income)}</p></div>
            <div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground mb-1">Despesas</p><p className="text-xl font-bold text-destructive font-mono">{fmt(expenses)}</p></div>
            <div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground mb-1">Saldo</p><p className={`text-xl font-bold font-mono ${balance >= 0 ? "text-primary" : "text-destructive"}`}>{fmt(balance)}</p></div>
            <div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground mb-1">Taxa economia</p><p className="text-xl font-bold text-foreground font-mono">{savingsRate}%</p></div>
          </div>
          {categoryData.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><PieChart className="h-4 w-4 text-primary" /> Despesas por Categoria</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RPieChart><Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${fmt(value)}`}>
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie><Tooltip formatter={(v: number) => fmt(v)} /></RPieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="transacoes" className="mt-4">
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card group hover:border-primary/20 transition-colors">
                <div className="flex items-center gap-3">
                  {tx.type === "income" ? <ArrowUpCircle className="h-5 w-5 text-primary" /> : <ArrowDownCircle className="h-5 w-5 text-destructive" />}
                  <div>
                    <p className="text-sm font-medium text-foreground">{tx.description || tx.category}</p>
                    <div className="flex gap-2 mt-0.5"><Badge variant="outline" className="text-xs">{tx.category}</Badge><span className="text-xs text-muted-foreground">{new Date(tx.transaction_date).toLocaleDateString("pt-BR")}</span></div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-bold font-mono ${tx.type === "income" ? "text-primary" : "text-destructive"}`}>{tx.type === "income" ? "+" : "-"}{fmt(Number(tx.amount))}</span>
                  <button onClick={() => deleteTransaction(tx.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
            {transactions.length === 0 && <div className="text-center py-12 text-muted-foreground"><Wallet className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>Nenhuma transação este mês.</p></div>}
          </div>
        </TabsContent>

        <TabsContent value="graficos" className="mt-4 space-y-4">
          {categoryData.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold text-foreground mb-4">Despesas por Categoria</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}><XAxis dataKey="name" tick={{ fill: "hsl(220,10%,50%)", fontSize: 12 }} /><YAxis tick={{ fill: "hsl(220,10%,50%)", fontSize: 12 }} /><Tooltip formatter={(v: number) => fmt(v)} /><Bar dataKey="value" fill="hsl(153,100%,50%)" radius={[4, 4, 0, 0]} /></BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="orcamentos" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Dialog open={budgetDialogOpen} onOpenChange={setBudgetDialogOpen}>
              <DialogTrigger asChild><Button variant="outline" size="sm" className="gap-2"><Plus className="h-4 w-4" /> Novo Orçamento</Button></DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader><DialogTitle>Definir Orçamento</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2"><Label>Categoria</Label>
                    <Select value={budgetForm.category} onValueChange={(v) => setBudgetForm({ ...budgetForm, category: v })}>
                      <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Limite Mensal (R$)</Label><Input type="number" value={budgetForm.limit} onChange={(e) => setBudgetForm({ ...budgetForm, limit: e.target.value })} className="bg-secondary border-border" /></div>
                  <Button onClick={createBudget} className="w-full">Salvar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {budgets.map((b) => {
            const spent = transactions.filter((t) => t.type === "expense" && t.category === b.category).reduce((a, t) => a + Number(t.amount), 0);
            const pct = Math.round((spent / Number(b.monthly_limit)) * 100);
            const color = pct >= 100 ? "text-destructive" : pct >= 80 ? "text-yellow-400" : "text-primary";
            return (
              <div key={b.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex justify-between mb-2"><span className="font-medium text-foreground">{b.category}</span><span className={`font-mono text-sm ${color}`}>{fmt(spent)} / {fmt(Number(b.monthly_limit))}</span></div>
                <Progress value={Math.min(pct, 100)} className="h-2" />
                <p className={`text-xs mt-1 ${color}`}>{pct}% utilizado</p>
              </div>
            );
          })}
          {budgets.length === 0 && <div className="text-center py-8 text-muted-foreground"><p>Nenhum orçamento definido para este mês.</p></div>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
