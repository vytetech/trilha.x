import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Wallet, Plus, ArrowUpCircle, ArrowDownCircle, Trash2, PieChart, ChevronLeft, ChevronRight,
  TrendingUp, TrendingDown, Target, CreditCard, DollarSign, Flame, CalendarDays, BarChart3, Activity,
  Clock, CheckCircle2, AlertCircle, Edit2, Eye, EyeOff
} from "lucide-react";
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
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart as RPieChart, Pie, Cell, AreaChart, Area, CartesianGrid,
  LineChart, Line, RadialBarChart, RadialBar, Legend
} from "recharts";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  category: string;
  description: string | null;
  transaction_date: string;
  payment_method: string | null;
  payment_status: string;
  due_date: string | null;
  credit_card_id: string | null;
  installment_count: number;
  installment_number: number;
}

interface Budget {
  id: string;
  category: string;
  monthly_limit: number;
  month: number;
  year: number;
}

interface CreditCardType {
  id: string;
  name: string;
  last_four: string | null;
  brand: string;
  credit_limit: number;
  closing_day: number;
  due_day: number;
  color: string;
  is_active: boolean;
}

const categories = ["Alimentação", "Transporte", "Moradia", "Lazer", "Saúde", "Educação", "Assinaturas", "Pagamento de Fatura", "Salário", "Freelance", "Investimentos", "Outros"];
const COLORS = [
  "hsl(153 100% 50%)", "hsl(200 80% 50%)", "hsl(280 70% 55%)", "hsl(40 90% 55%)",
  "hsl(0 72% 51%)", "hsl(180 60% 45%)", "hsl(320 70% 50%)", "hsl(120 50% 40%)",
  "hsl(60 80% 50%)", "hsl(210 60% 60%)", "hsl(340 80% 60%)", "hsl(30 80% 50%)"
];
const MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const CARD_COLORS = [
  "from-blue-600 to-blue-900",
  "from-purple-600 to-purple-900",
  "from-emerald-600 to-emerald-900",
  "from-rose-600 to-rose-900",
  "from-amber-600 to-amber-900",
  "from-cyan-600 to-cyan-900",
];

const tooltipStyle = {
  backgroundColor: "hsl(220 18% 7%)",
  border: "1px solid hsl(220 14% 14%)",
  borderRadius: 8,
  color: "hsl(160 10% 92%)",
};
const noCursor = { fill: "transparent" };

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

export default function FinancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCardType[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [form, setForm] = useState({ type: "expense", amount: "", category: "Outros", description: "", date: new Date().toISOString().split("T")[0], payment_method: "", payment_status: "paid", due_date: "", credit_card_id: "", installments: "1" });
  const [budgetForm, setBudgetForm] = useState({ category: "Alimentação", limit: "" });
  const [cardForm, setCardForm] = useState({ name: "", last_four: "", brand: "Visa", credit_limit: "", closing_day: "1", due_day: "10" });

  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [viewYear, setViewYear] = useState(now.getFullYear());

  const isCurrentMonth = viewMonth === now.getMonth() + 1 && viewYear === now.getFullYear();

  const goToPrevMonth = () => {
    if (viewMonth === 1) { setViewMonth(12); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };

  const goToNextMonth = () => {
    if (isCurrentMonth) return;
    if (viewMonth === 12) { setViewMonth(1); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const fetchData = async () => {
    if (!user) return;
    const startDate = `${viewYear}-${String(viewMonth).padStart(2, "0")}-01`;
    const nextMonth = viewMonth + 1 > 12 ? 1 : viewMonth + 1;
    const nextYear = viewMonth + 1 > 12 ? viewYear + 1 : viewYear;
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
    const [txRes, budgetRes, allTxRes, cardsRes] = await Promise.all([
      supabase.from("transactions").select("*").eq("user_id", user.id).gte("transaction_date", startDate).lt("transaction_date", endDate).order("transaction_date", { ascending: false }),
      supabase.from("budgets").select("*").eq("user_id", user.id).eq("month", viewMonth).eq("year", viewYear),
      supabase.from("transactions").select("*").eq("user_id", user.id).order("transaction_date", { ascending: true }),
      supabase.from("credit_cards").select("*").eq("user_id", user.id).eq("is_active", true).order("created_at", { ascending: true }),
    ]);
    if (txRes.data) setTransactions(txRes.data);
    if (budgetRes.data) setBudgets(budgetRes.data);
    if (allTxRes.data) setAllTransactions(allTxRes.data);
    if (cardsRes.data) setCreditCards(cardsRes.data);
  };

  useEffect(() => { fetchData(); }, [user, viewMonth, viewYear]);

  // Filter out credit card transactions from regular views — they only show in Cartões tab
  const regularTransactions = transactions.filter(t => !t.credit_card_id);
  const allRegularTransactions = allTransactions.filter(t => !t.credit_card_id);

  const income = regularTransactions.filter((t) => t.type === "income").reduce((a, t) => a + Number(t.amount), 0);
  const expenses = regularTransactions.filter((t) => t.type === "expense").reduce((a, t) => a + Number(t.amount), 0);
  const balance = income - expenses;
  const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0;

  const txCount = regularTransactions.length;
  const expenseTxs = regularTransactions.filter(t => t.type === "expense");
  const incomeTxs = regularTransactions.filter(t => t.type === "income");

  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const daysPassed = isCurrentMonth ? now.getDate() : daysInMonth;
  const dailyAvgExpense = daysPassed > 0 ? expenses / daysPassed : 0;
  const projectedExpense = dailyAvgExpense * daysInMonth;

  const biggestExpense = expenseTxs.length > 0
    ? expenseTxs.reduce((max, t) => Number(t.amount) > Number(max.amount) ? t : max, expenseTxs[0])
    : null;
  const biggestIncome = incomeTxs.length > 0
    ? incomeTxs.reduce((max, t) => Number(t.amount) > Number(max.amount) ? t : max, incomeTxs[0])
    : null;

  const categoryData = useMemo(() =>
    Object.entries(
      expenseTxs.reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + Number(t.amount); return acc; }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    [regularTransactions]
  );

  const dailySpending = useMemo(() => {
    const map: Record<number, { income: number; expense: number }> = {};
    for (let d = 1; d <= daysInMonth; d++) map[d] = { income: 0, expense: 0 };
    regularTransactions.forEach(tx => {
      const day = new Date(tx.transaction_date).getDate();
      if (tx.type === "expense") map[day].expense += Number(tx.amount);
      else map[day].income += Number(tx.amount);
    });
    return Object.entries(map).map(([day, v]) => ({ day: `${day}`, ...v }));
  }, [regularTransactions, daysInMonth]);

  const monthlyEvolution = useMemo(() => {
    const months: { month: string; income: number; expense: number; balance: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      let m = viewMonth - i;
      let y = viewYear;
      if (m <= 0) { m += 12; y -= 1; }
      const key = `${y}-${String(m).padStart(2, "0")}`;
      const label = `${MONTH_NAMES[m - 1].slice(0, 3)}/${String(y).slice(2)}`;
      const monthTxs = allRegularTransactions.filter(tx => tx.transaction_date.startsWith(key));
      const inc = monthTxs.filter(t => t.type === "income").reduce((a, t) => a + Number(t.amount), 0);
      const exp = monthTxs.filter(t => t.type === "expense").reduce((a, t) => a + Number(t.amount), 0);
      months.push({ month: label, income: inc, expense: exp, balance: inc - exp });
    }
    return months;
  }, [allRegularTransactions, viewMonth, viewYear]);

  const accumulatedBalance = useMemo(() => {
    let cum = 0;
    return monthlyEvolution.map(m => {
      cum += m.balance;
      return { month: m.month, accumulated: cum };
    });
  }, [monthlyEvolution]);

  const incomeCategoryData = useMemo(() =>
    Object.entries(
      incomeTxs.reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + Number(t.amount); return acc; }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    [regularTransactions]
  );

  const topExpenses = useMemo(() =>
    [...expenseTxs].sort((a, b) => Number(b.amount) - Number(a.amount)).slice(0, 5),
    [regularTransactions]
  );

  const savingsGauge = [{ name: "Economia", value: Math.max(savingsRate, 0), fill: savingsRate >= 30 ? "hsl(153 100% 50%)" : savingsRate >= 15 ? "hsl(40 90% 55%)" : "hsl(0 72% 51%)" }];

  // Credit card invoice calculation based on closing day logic
  // Invoice for month M due on due_day of month M covers transactions from:
  //   closing_day+1 of month M-1  to  closing_day of month M
  const getCardInvoiceTxs = (card: CreditCardType) => {
    const closingDay = card.closing_day;
    // Invoice period: from previous month closing_day+1 to current month closing_day
    const prevMonth = viewMonth - 1 <= 0 ? 12 : viewMonth - 1;
    const prevYear = viewMonth - 1 <= 0 ? viewYear - 1 : viewYear;
    
    const startDate = new Date(prevYear, prevMonth - 1, closingDay + 1);
    const endDate = new Date(viewYear, viewMonth - 1, closingDay);
    endDate.setHours(23, 59, 59, 999);

    return allTransactions.filter(tx => {
      if (tx.credit_card_id !== card.id) return false;
      const txDate = new Date(tx.transaction_date);
      return txDate >= startDate && txDate <= endDate;
    });
  };

  const getCardInvoiceTotal = (card: CreditCardType) => {
    return getCardInvoiceTxs(card).reduce((a, t) => a + Number(t.amount), 0);
  };

  const createTransaction = async () => {
    if (!user || !form.amount) return;
    const totalInstallments = Math.max(1, Number(form.installments) || 1);
    const installmentAmount = Number(form.amount) / totalInstallments;
    const baseDate = new Date(form.date);

    const rows = Array.from({ length: totalInstallments }, (_, i) => {
      const txDate = new Date(baseDate);
      txDate.setMonth(txDate.getMonth() + i);
      return {
        user_id: user.id, type: form.type, amount: Math.round(installmentAmount * 100) / 100, category: form.category,
        description: totalInstallments > 1 ? `${form.description || form.category} (${i + 1}/${totalInstallments})` : (form.description || null),
        transaction_date: txDate.toISOString().split("T")[0], payment_method: form.payment_method || null,
        payment_status: i === 0 ? form.payment_status : "unpaid", due_date: form.due_date || null,
        credit_card_id: form.credit_card_id || null,
        installment_count: totalInstallments, installment_number: i + 1,
      };
    });

    await supabase.from("transactions").insert(rows);
    setForm({ type: "expense", amount: "", category: "Outros", description: "", date: new Date().toISOString().split("T")[0], payment_method: "", payment_status: "paid", due_date: "", credit_card_id: "", installments: "1" });
    setDialogOpen(false);
    fetchData();
    toast({ title: totalInstallments > 1 ? `Compra parcelada em ${totalInstallments}x registrada! 💳` : "Transação registrada! 💰" });
  };

  const createBudget = async () => {
    if (!user || !budgetForm.limit) return;
    await supabase.from("budgets").upsert({
      user_id: user.id, category: budgetForm.category, monthly_limit: Number(budgetForm.limit), month: viewMonth, year: viewYear,
    }, { onConflict: "user_id,category,month,year" });
    setBudgetForm({ category: "Alimentação", limit: "" });
    setBudgetDialogOpen(false);
    fetchData();
  };

  const createCreditCard = async () => {
    if (!user || !cardForm.name) return;
    await supabase.from("credit_cards").insert({
      user_id: user.id,
      name: cardForm.name,
      last_four: cardForm.last_four || null,
      brand: cardForm.brand,
      credit_limit: Number(cardForm.credit_limit) || 0,
      closing_day: Number(cardForm.closing_day) || 1,
      due_day: Number(cardForm.due_day) || 10,
      color: CARD_COLORS[creditCards.length % CARD_COLORS.length],
    });
    setCardForm({ name: "", last_four: "", brand: "Visa", credit_limit: "", closing_day: "1", due_day: "10" });
    setCardDialogOpen(false);
    fetchData();
    toast({ title: "Cartão cadastrado! 💳" });
  };

  const deleteCreditCard = async (id: string) => {
    await supabase.from("credit_cards").update({ is_active: false } as any).eq("id", id);
    fetchData();
    toast({ title: "Cartão removido" });
  };

  const deleteTransaction = async (id: string) => {
    await supabase.from("transactions").delete().eq("id", id);
    fetchData();
  };

  const totalBudgetLimit = budgets.reduce((a, b) => a + Number(b.monthly_limit), 0);
  const totalBudgetSpent = budgets.reduce((a, b) => {
    const spent = expenseTxs.filter(t => t.category === b.category).reduce((s, t) => s + Number(t.amount), 0);
    return a + spent;
  }, 0);
  const budgetHealthPct = totalBudgetLimit > 0 ? Math.round((totalBudgetSpent / totalBudgetLimit) * 100) : 0;

  return (
    <div className="space-y-6 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Wallet className="h-6 w-6 text-primary" /> Financeiro</h1>
          <p className="text-sm text-muted-foreground mt-1">Controle total da sua vida financeira</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Nova Transação</Button></DialogTrigger>
          <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
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
              
              {/* Credit card selector */}
              {creditCards.length > 0 && form.type === "expense" && (
                <div className="space-y-2">
                  <Label>Cartão de Crédito (opcional)</Label>
                  <Select value={form.credit_card_id} onValueChange={(v) => setForm({ ...form, credit_card_id: v === "none" ? "" : v })}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Nenhum" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {creditCards.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          <span className="flex items-center gap-2"><CreditCard className="h-3 w-3" />{c.name} {c.last_four ? `•••• ${c.last_four}` : ""}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Installments selector - only for credit card expenses */}
              {form.credit_card_id && form.credit_card_id !== "" && (
                <div className="space-y-2">
                  <Label>Parcelas</Label>
                  <Select value={form.installments} onValueChange={(v) => setForm({ ...form, installments: v })}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => i + 1).map(n => (
                        <SelectItem key={n} value={String(n)}>
                          {n}x {form.amount ? `de ${fmt(Number(form.amount) / n)}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Status Pagamento</Label>
                  <Select value={form.payment_status} onValueChange={(v) => setForm({ ...form, payment_status: v })}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="unpaid">Não Pago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Vencimento</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="bg-secondary border-border" /></div>
              </div>
              <Button onClick={createTransaction} className="w-full">Registrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Month Navigator */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="ghost" size="icon" onClick={goToPrevMonth}><ChevronLeft className="h-5 w-5" /></Button>
        <span className="text-lg font-semibold text-foreground min-w-[180px] text-center">
          {MONTH_NAMES[viewMonth - 1]} {viewYear}
        </span>
        <Button variant="ghost" size="icon" onClick={goToNextMonth} disabled={isCurrentMonth}><ChevronRight className="h-5 w-5" /></Button>
      </div>

      <Tabs defaultValue="resumo">
        <TabsList className="bg-secondary border border-border">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="transacoes">Transações</TabsTrigger>
          <TabsTrigger value="cartoes">Cartões</TabsTrigger>
          <TabsTrigger value="graficos">Gráficos</TabsTrigger>
          <TabsTrigger value="orcamentos">Orçamentos</TabsTrigger>
        </TabsList>

        {/* ========== RESUMO ========== */}
        <TabsContent value="resumo" className="space-y-6 mt-4">
          {/* Primary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2"><ArrowUpCircle className="h-4 w-4 text-primary" /><p className="text-xs text-muted-foreground">Receita</p></div>
              <p className="text-xl font-bold text-primary font-mono">{fmt(income)}</p>
              {biggestIncome && <p className="text-[10px] text-muted-foreground mt-1 truncate">Maior: {biggestIncome.description || biggestIncome.category}</p>}
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2"><ArrowDownCircle className="h-4 w-4 text-destructive" /><p className="text-xs text-muted-foreground">Despesas</p></div>
              <p className="text-xl font-bold text-destructive font-mono">{fmt(expenses)}</p>
              {biggestExpense && <p className="text-[10px] text-muted-foreground mt-1 truncate">Maior: {biggestExpense.description || biggestExpense.category}</p>}
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2"><DollarSign className="h-4 w-4 text-accent" /><p className="text-xs text-muted-foreground">Saldo</p></div>
              <p className={`text-xl font-bold font-mono ${balance >= 0 ? "text-primary" : "text-destructive"}`}>{fmt(balance)}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{balance >= 0 ? "Você está no verde! 🎉" : "Atenção com os gastos ⚠️"}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2"><Target className="h-4 w-4 text-primary" /><p className="text-xs text-muted-foreground">Taxa Economia</p></div>
              <p className={`text-xl font-bold font-mono ${savingsRate >= 30 ? "text-primary" : savingsRate >= 0 ? "text-foreground" : "text-destructive"}`}>{savingsRate}%</p>
              <p className="text-[10px] text-muted-foreground mt-1">{savingsRate >= 30 ? "Excelente! 🏆" : savingsRate >= 15 ? "Bom ritmo 💪" : "Pode melhorar 📈"}</p>
            </motion.div>
          </div>

          {/* Secondary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2"><CalendarDays className="h-4 w-4 text-muted-foreground" /><p className="text-xs text-muted-foreground">Média Diária</p></div>
              <p className="text-lg font-bold font-mono text-foreground">{fmt(dailyAvgExpense)}</p>
              <p className="text-[10px] text-muted-foreground mt-1">em despesas/dia</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2"><TrendingUp className="h-4 w-4 text-muted-foreground" /><p className="text-xs text-muted-foreground">Projeção Mensal</p></div>
              <p className={`text-lg font-bold font-mono ${projectedExpense > income ? "text-destructive" : "text-foreground"}`}>{fmt(projectedExpense)}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{projectedExpense > income ? "Acima da receita!" : "Dentro do limite"}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2"><Activity className="h-4 w-4 text-muted-foreground" /><p className="text-xs text-muted-foreground">Transações</p></div>
              <p className="text-lg font-bold font-mono text-foreground">{txCount}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{incomeTxs.length} receitas · {expenseTxs.length} despesas</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2"><Flame className="h-4 w-4 text-muted-foreground" /><p className="text-xs text-muted-foreground">Saúde Orçamento</p></div>
              <p className={`text-lg font-bold font-mono ${budgetHealthPct >= 100 ? "text-destructive" : budgetHealthPct >= 80 ? "text-yellow-400" : "text-primary"}`}>
                {totalBudgetLimit > 0 ? `${budgetHealthPct}%` : "—"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">{totalBudgetLimit > 0 ? `${fmt(totalBudgetSpent)} de ${fmt(totalBudgetLimit)}` : "Sem orçamentos"}</p>
            </div>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryData.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2 text-sm"><PieChart className="h-4 w-4 text-primary" /> Despesas por Categoria</h3>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RPieChart>
                      <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={2} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                        {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} cursor={noCursor} formatter={(v: number) => [fmt(v), "Valor"]} />
                    </RPieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {incomeCategoryData.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2 text-sm"><ArrowUpCircle className="h-4 w-4 text-primary" /> Fontes de Receita</h3>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RPieChart>
                      <Pie data={incomeCategoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={2} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                        {incomeCategoryData.map((_, i) => <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} cursor={noCursor} formatter={(v: number) => [fmt(v), "Valor"]} />
                    </RPieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Top expenses + Savings gauge */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2 text-sm"><TrendingDown className="h-4 w-4 text-destructive" /> Maiores Gastos</h3>
              <div className="space-y-3">
                {topExpenses.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma despesa registrada.</p>}
                {topExpenses.map((tx, i) => (
                  <div key={tx.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}.</span>
                      <div>
                        <p className="text-sm font-medium text-foreground truncate max-w-[180px]">{tx.description || tx.category}</p>
                        <p className="text-[10px] text-muted-foreground">{tx.category} · {new Date(tx.transaction_date).toLocaleDateString("pt-BR")}</p>
                      </div>
                    </div>
                    <span className="font-bold font-mono text-sm text-destructive">{fmt(Number(tx.amount))}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 flex flex-col items-center justify-center">
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2 text-sm"><Target className="h-4 w-4 text-primary" /> Índice de Economia</h3>
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart innerRadius="60%" outerRadius="90%" data={savingsGauge} startAngle={180} endAngle={0} barSize={14}>
                    <RadialBar background={{ fill: "hsl(220 14% 14%)" }} dataKey="value" cornerRadius={8} />
                    <Tooltip contentStyle={tooltipStyle} cursor={noCursor} formatter={(v: number) => [`${v}%`, "Economia"]} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <p className={`text-3xl font-bold font-mono -mt-8 ${savingsRate >= 30 ? "text-primary" : savingsRate >= 0 ? "text-foreground" : "text-destructive"}`}>{savingsRate}%</p>
              <p className="text-xs text-muted-foreground mt-1">Meta recomendada: 30%+</p>
            </div>
          </div>

          {/* Daily spending mini chart */}
          {regularTransactions.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2 text-sm"><BarChart3 className="h-4 w-4 text-primary" /> Movimentação Diária</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailySpending}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 14%)" />
                    <XAxis dataKey="day" tick={{ fontSize: 9, fill: "hsl(220 10% 50%)" }} interval={2} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(220 10% 50%)" }} />
                    <Tooltip contentStyle={tooltipStyle} cursor={noCursor} formatter={(v: number, name: string) => [fmt(v), name === "expense" ? "Despesa" : "Receita"]} />
                    <Bar dataKey="income" fill="hsl(153 100% 50%)" radius={[2, 2, 0, 0]} stackId="a" />
                    <Bar dataKey="expense" fill="hsl(0 72% 51%)" radius={[2, 2, 0, 0]} stackId="b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ========== TRANSAÇÕES ========== */}
        <TabsContent value="transacoes" className="mt-4">
          <div className="space-y-2">
            {regularTransactions.map((tx) => {
               const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
                paid: { label: "Pago", color: "bg-primary/15 text-primary border-primary/30", icon: <CheckCircle2 className="h-3 w-3" /> },
                unpaid: { label: "Não Pago", color: "bg-destructive/15 text-destructive border-destructive/30", icon: <AlertCircle className="h-3 w-3" /> },
              };
              const status = statusConfig[tx.payment_status] || statusConfig.paid;
              const isOverdue = tx.due_date && tx.payment_status !== "paid" && new Date(tx.due_date) < new Date();
              const linkedCard = tx.credit_card_id ? creditCards.find(c => c.id === tx.credit_card_id) : null;

              return (
                <div key={tx.id} className={`flex items-center justify-between p-3 rounded-lg border bg-card group hover:border-primary/20 transition-colors ${isOverdue ? "border-destructive/40" : "border-border"}`}>
                  <div className="flex items-center gap-3">
                    {tx.type === "income" ? <ArrowUpCircle className="h-5 w-5 text-primary" /> : <ArrowDownCircle className="h-5 w-5 text-destructive" />}
                    <div>
                      <p className="text-sm font-medium text-foreground">{tx.description || tx.category}</p>
                      <div className="flex flex-wrap gap-2 mt-0.5 items-center">
                        <Badge variant="outline" className="text-xs">{tx.category}</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(tx.transaction_date).toLocaleDateString("pt-BR")}</span>
                        <Badge className={`text-[10px] gap-1 border ${status.color}`}>
                          {status.icon}{status.label}
                        </Badge>
                        {linkedCard && (
                          <Badge variant="outline" className="text-[10px] gap-1">
                            <CreditCard className="h-2.5 w-2.5" />{linkedCard.name}
                          </Badge>
                        )}
                        {tx.installment_count > 1 && (
                          <Badge variant="outline" className="text-[10px] gap-1 border-accent/30 text-accent">
                            {tx.installment_number}/{tx.installment_count}x
                          </Badge>
                        )}
                        {tx.due_date && (
                          <span className={`text-[10px] flex items-center gap-1 ${isOverdue ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                            <CalendarDays className="h-3 w-3" />
                            Venc: {new Date(tx.due_date).toLocaleDateString("pt-BR")}
                            {isOverdue && " (Atrasado!)"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold font-mono text-sm ${tx.type === "income" ? "text-primary" : "text-destructive"}`}>{tx.type === "income" ? "+" : "-"}{fmt(Number(tx.amount))}</span>
                    {tx.payment_status !== "paid" && (
                      <button
                        onClick={async () => {
                          await supabase.from("transactions").update({ payment_status: "paid" } as any).eq("id", tx.id);
                          fetchData();
                          toast({ title: "Marcado como pago! ✅" });
                        }}
                        className="text-muted-foreground hover:text-primary transition-colors" title="Marcar como pago"
                      ><CheckCircle2 className="h-4 w-4" /></button>
                    )}
                    <button onClick={() => deleteTransaction(tx.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              );
            })}
            {regularTransactions.length === 0 && <div className="text-center py-12 text-muted-foreground"><Wallet className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>Nenhuma transação neste mês.</p></div>}
          </div>
        </TabsContent>

        {/* ========== CARTÕES DE CRÉDITO ========== */}
        <TabsContent value="cartoes" className="mt-4 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-foreground flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" /> Meus Cartões</h3>
            <Dialog open={cardDialogOpen} onOpenChange={setCardDialogOpen}>
              <DialogTrigger asChild><Button variant="outline" size="sm" className="gap-2"><Plus className="h-4 w-4" /> Novo Cartão</Button></DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader><DialogTitle>Cadastrar Cartão de Crédito</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2"><Label>Nome do Cartão</Label><Input value={cardForm.name} onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })} className="bg-secondary border-border" placeholder="Ex: Nubank, Inter, C6..." /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>Últimos 4 dígitos</Label><Input value={cardForm.last_four} onChange={(e) => setCardForm({ ...cardForm, last_four: e.target.value.replace(/\D/g, "").slice(0, 4) })} className="bg-secondary border-border" placeholder="1234" maxLength={4} /></div>
                    <div className="space-y-2"><Label>Bandeira</Label>
                      <Select value={cardForm.brand} onValueChange={(v) => setCardForm({ ...cardForm, brand: v })}>
                        <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Visa">Visa</SelectItem>
                          <SelectItem value="Mastercard">Mastercard</SelectItem>
                          <SelectItem value="Elo">Elo</SelectItem>
                          <SelectItem value="Amex">Amex</SelectItem>
                          <SelectItem value="Hipercard">Hipercard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2"><Label>Limite (R$)</Label><Input type="number" value={cardForm.credit_limit} onChange={(e) => setCardForm({ ...cardForm, credit_limit: e.target.value })} className="bg-secondary border-border" placeholder="5000" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>Dia Fechamento</Label><Input type="number" min={1} max={31} value={cardForm.closing_day} onChange={(e) => setCardForm({ ...cardForm, closing_day: e.target.value })} className="bg-secondary border-border" /></div>
                    <div className="space-y-2"><Label>Dia Vencimento</Label><Input type="number" min={1} max={31} value={cardForm.due_day} onChange={(e) => setCardForm({ ...cardForm, due_day: e.target.value })} className="bg-secondary border-border" /></div>
                  </div>
                  <Button onClick={createCreditCard} className="w-full">Cadastrar Cartão</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Card carousel */}
          {creditCards.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <CreditCard className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Nenhum cartão cadastrado</p>
              <p className="text-sm mt-1">Cadastre seus cartões para controlar suas faturas</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {creditCards.map((card, idx) => {
              const invoiceTotal = getCardInvoiceTotal(card);
              const usedPct = Number(card.credit_limit) > 0 ? Math.round((invoiceTotal / Number(card.credit_limit)) * 100) : 0;
              const gradientClass = CARD_COLORS[idx % CARD_COLORS.length];

              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`relative rounded-2xl p-5 bg-gradient-to-br ${gradientClass} text-white shadow-lg cursor-pointer overflow-hidden`}
                  onClick={() => setSelectedCardId(selectedCardId === card.id ? null : card.id)}
                >
                   {/* Card chip decoration */}
                   <div className="absolute top-4 right-16 w-10 h-7 rounded bg-white/20" />
                  <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-white/5" />

                  <div className="flex items-center justify-between mb-6">
                    <p className="font-bold text-lg">{card.name}</p>
                    <Badge className="bg-white/20 text-white border-white/30 text-[10px]">{card.brand}</Badge>
                  </div>

                  <p className="font-mono text-lg tracking-widest mb-4">
                    •••• •••• •••• {card.last_four || "****"}
                  </p>

                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-white/60 text-[10px]">Fatura Atual</p>
                      <p className="font-bold font-mono">{fmt(invoiceTotal)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/60 text-[10px]">Limite</p>
                      <p className="font-mono">{fmt(Number(card.credit_limit))}</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] text-white/60 mb-1">
                      <span>{usedPct}% utilizado</span>
                      <span>Fecha dia {card.closing_day} · Vence dia {card.due_day}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/20">
                      <div
                        className={`h-full rounded-full transition-all ${usedPct >= 90 ? "bg-red-400" : usedPct >= 70 ? "bg-yellow-400" : "bg-white/80"}`}
                        style={{ width: `${Math.min(usedPct, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteCreditCard(card.id); }}
                      className="text-white/40 hover:text-white/80 transition-colors"
                      title="Remover cartão"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Selected card invoice detail */}
          {selectedCardId && (() => {
            const card = creditCards.find(c => c.id === selectedCardId);
            if (!card) return null;
            const cardTxs = getCardInvoiceTxs(card);
            const invoiceTotal = cardTxs.reduce((a, t) => a + Number(t.amount), 0);
            const dueDate = new Date(viewYear, viewMonth - 1, card.due_day);

            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border bg-card p-5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-primary" />
                      Fatura {card.name} — {MONTH_NAMES[viewMonth - 1]}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Fecha dia {card.closing_day} · Vence dia {card.due_day} ({dueDate.toLocaleDateString("pt-BR")})
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold font-mono text-destructive text-lg">{fmt(invoiceTotal)}</span>
                    {invoiceTotal > 0 && (
                      <Button
                        size="sm"
                        className="gap-1.5"
                        onClick={async () => {
                          if (!user) return;
                          await supabase.from("transactions").insert({
                            user_id: user.id,
                            type: "expense",
                            amount: invoiceTotal,
                            category: "Pagamento de Fatura",
                            description: `Fatura ${card.name} — ${MONTH_NAMES[viewMonth - 1]}/${viewYear}`,
                            transaction_date: dueDate.toISOString().split("T")[0],
                            payment_method: "débito",
                            payment_status: "paid",
                            due_date: dueDate.toISOString().split("T")[0],
                          });
                          fetchData();
                          toast({ title: `Fatura do ${card.name} paga! ✅` });
                        }}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Pagar Fatura
                      </Button>
                    )}
                  </div>
                </div>

                {cardTxs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhuma compra neste período de fatura.</p>
                ) : (
                  <div className="space-y-2">
                    {cardTxs.map(tx => (
                      <div key={tx.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-secondary/30">
                        <div>
                          <p className="text-sm font-medium text-foreground">{tx.description || tx.category}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(tx.transaction_date).toLocaleDateString("pt-BR")}</p>
                        </div>
                        <span className="font-bold font-mono text-sm text-destructive">{fmt(Number(tx.amount))}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })()}
        </TabsContent>

        {/* ========== GRÁFICOS ========== */}
        <TabsContent value="graficos" className="mt-4 space-y-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground mb-4 text-sm">Receita vs Despesa (últimos 6 meses)</h3>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyEvolution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 14%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(220 10% 50%)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(220 10% 50%)" }} />
                  <Tooltip contentStyle={tooltipStyle} cursor={noCursor} formatter={(v: number, name: string) => [fmt(v), name === "income" ? "Receita" : name === "expense" ? "Despesa" : "Saldo"]} />
                  <Bar dataKey="income" fill="hsl(153 100% 50%)" radius={[4, 4, 0, 0]} name="income" />
                  <Bar dataKey="expense" fill="hsl(0 72% 51%)" radius={[4, 4, 0, 0]} name="expense" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground mb-4 text-sm">Evolução do Patrimônio Acumulado</h3>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={accumulatedBalance}>
                  <defs>
                    <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(153 100% 50%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(153 100% 50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 14%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(220 10% 50%)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(220 10% 50%)" }} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "hsl(153 100% 50%)", strokeWidth: 1, strokeDasharray: "4 4" }} formatter={(v: number) => [fmt(v), "Acumulado"]} />
                  <Area type="monotone" dataKey="accumulated" stroke="hsl(153 100% 50%)" fill="url(#accGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {categoryData.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold text-foreground mb-4 text-sm">Despesas por Categoria</h3>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 14%)" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(220 10% 50%)" }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "hsl(220 10% 50%)" }} width={100} />
                    <Tooltip contentStyle={tooltipStyle} cursor={noCursor} formatter={(v: number) => [fmt(v), "Valor"]} />
                    <Bar dataKey="value" fill="hsl(200 80% 50%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground mb-4 text-sm">Tendência de Saldo Mensal</h3>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyEvolution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 14%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(220 10% 50%)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(220 10% 50%)" }} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "hsl(153 100% 50%)", strokeWidth: 1, strokeDasharray: "4 4" }} formatter={(v: number) => [fmt(v), "Saldo"]} />
                  <Line type="monotone" dataKey="balance" stroke="hsl(153 100% 50%)" strokeWidth={2} dot={{ fill: "hsl(153 100% 50%)", r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        {/* ========== ORÇAMENTOS ========== */}
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
            const spent = expenseTxs.filter((t) => t.category === b.category).reduce((a, t) => a + Number(t.amount), 0);
            const pct = Math.round((spent / Number(b.monthly_limit)) * 100);
            const color = pct >= 100 ? "text-destructive" : pct >= 80 ? "text-yellow-400" : "text-primary";
            return (
              <div key={b.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-sm text-foreground">{b.category}</span>
                  <span className={`font-bold font-mono text-sm ${color}`}>{pct}%</span>
                </div>
                <Progress value={Math.min(pct, 100)} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">{fmt(spent)} de {fmt(Number(b.monthly_limit))}</p>
              </div>
            );
          })}
          {budgets.length === 0 && <div className="text-center py-12 text-muted-foreground"><Target className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>Nenhum orçamento definido.</p></div>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
