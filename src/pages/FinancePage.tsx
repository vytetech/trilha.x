import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Wallet, Plus, ArrowUpCircle, ArrowDownCircle, Trash2, PieChart, ChevronLeft, ChevronRight,
  TrendingUp, TrendingDown, Target, CreditCard, DollarSign, Flame, CalendarDays, BarChart3, Activity,
  Clock, CheckCircle2, AlertCircle, Edit2, Eye, EyeOff, Receipt, ShieldCheck, Percent, ArrowRightLeft,
  Banknote, CircleDollarSign, Scale, Zap, FileWarning, Landmark, Layers
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
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PlanLimitBanner from "@/components/PlanLimitBanner";
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
  is_recurring: boolean;
}

interface Bill {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  category: string;
  is_recurring: boolean;
  recurring_end_date: string | null;
  is_paid: boolean;
  paid_at: string | null;
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
  const { canCreate } = useSubscription();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCardType[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [billDialogOpen, setBillDialogOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [form, setForm] = useState({ type: "expense", amount: "", category: "Outros", description: "", date: new Date().toISOString().split("T")[0], payment_method: "", payment_status: "paid", due_date: "", credit_card_id: "", installments: "1", is_recurring: false });
  const [budgetForm, setBudgetForm] = useState({ category: "Alimentação", limit: "" });
  const [cardForm, setCardForm] = useState({ name: "", last_four: "", brand: "Visa", credit_limit: "", closing_day: "1", due_day: "10" });
  const [billForm, setBillForm] = useState({ description: "", amount: "", due_date: "", category: "Outros", is_recurring: false, recurring_end_date: "" });

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
    const [txRes, budgetRes, allTxRes, cardsRes, billsRes] = await Promise.all([
      supabase.from("transactions").select("*").eq("user_id", user.id).gte("transaction_date", startDate).lt("transaction_date", endDate).order("transaction_date", { ascending: false }),
      supabase.from("budgets").select("*").eq("user_id", user.id).eq("month", viewMonth).eq("year", viewYear),
      supabase.from("transactions").select("*").eq("user_id", user.id).order("transaction_date", { ascending: true }),
      supabase.from("credit_cards").select("*").eq("user_id", user.id).eq("is_active", true).order("created_at", { ascending: true }),
      supabase.from("bills").select("*").eq("user_id", user.id).gte("due_date", startDate).lt("due_date", endDate).order("due_date", { ascending: true }),
    ]);
    if (txRes.data) setTransactions(txRes.data);
    if (budgetRes.data) setBudgets(budgetRes.data);
    if (allTxRes.data) setAllTransactions(allTxRes.data);
    if (cardsRes.data) setCreditCards(cardsRes.data);
    if (billsRes.data) setBills(billsRes.data as Bill[]);
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
      const day = new Date(tx.transaction_date + "T00:00:00").getDate();
      if (!map[day]) map[day] = { income: 0, expense: 0 };
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
  const getCardInvoiceTxs = (card: CreditCardType) => {
    const closingDay = card.closing_day;
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

  // === ADVANCED KPIS ===
  const prevMonthData = useMemo(() => {
    let pm = viewMonth - 1;
    let py = viewYear;
    if (pm <= 0) { pm = 12; py -= 1; }
    const key = `${py}-${String(pm).padStart(2, "0")}`;
    const txs = allRegularTransactions.filter(tx => tx.transaction_date.startsWith(key));
    const inc = txs.filter(t => t.type === "income").reduce((a, t) => a + Number(t.amount), 0);
    const exp = txs.filter(t => t.type === "expense").reduce((a, t) => a + Number(t.amount), 0);
    return { income: inc, expenses: exp, balance: inc - exp };
  }, [allRegularTransactions, viewMonth, viewYear]);

  const expenseVariation = prevMonthData.expenses > 0 ? Math.round(((expenses - prevMonthData.expenses) / prevMonthData.expenses) * 100) : 0;
  const incomeVariation = prevMonthData.income > 0 ? Math.round(((income - prevMonthData.income) / prevMonthData.income) * 100) : 0;

  const unpaidTxs = regularTransactions.filter(t => t.payment_status === "unpaid");
  const unpaidTotal = unpaidTxs.reduce((a, t) => a + Number(t.amount), 0);
  const overdueTxs = unpaidTxs.filter(t => t.due_date && new Date(t.due_date) < now);
  const overdueTotal = overdueTxs.reduce((a, t) => a + Number(t.amount), 0);

  const totalCardInvoices = creditCards.reduce((a, c) => a + getCardInvoiceTotal(c), 0);
  const totalCardLimit = creditCards.reduce((a, c) => a + Number(c.credit_limit), 0);
  const cardUsagePct = totalCardLimit > 0 ? Math.round((totalCardInvoices / totalCardLimit) * 100) : 0;

  const avgExpenseTicket = expenseTxs.length > 0 ? expenses / expenseTxs.length : 0;
  const avgIncomeTicket = incomeTxs.length > 0 ? income / incomeTxs.length : 0;

  const recurringExpenses = expenseTxs.filter(t => t.is_recurring);
  const recurringTotal = recurringExpenses.reduce((a, t) => a + Number(t.amount), 0);
  const variableTotal = expenses - recurringTotal;
  const fixedRatio = expenses > 0 ? Math.round((recurringTotal / expenses) * 100) : 0;

  const commitmentRate = income > 0 ? Math.round((expenses / income) * 100) : 0;
  const disposableIncome = income - recurringTotal;

  const paidTotal = regularTransactions.filter(t => t.type === "expense" && t.payment_status === "paid").reduce((a, t) => a + Number(t.amount), 0);
  const paidPct = expenses > 0 ? Math.round((paidTotal / expenses) * 100) : 100;

  const weeklySpending = useMemo(() => {
    const weeks: { week: string; amount: number }[] = [];
    for (let w = 0; w < 5; w++) {
      const startDay = w * 7 + 1;
      const endDay = Math.min((w + 1) * 7, daysInMonth);
      if (startDay > daysInMonth) break;
      const weekTxs = expenseTxs.filter(t => {
        const day = new Date(t.transaction_date).getDate();
        return day >= startDay && day <= endDay;
      });
      weeks.push({ week: `S${w + 1} (${startDay}-${endDay})`, amount: weekTxs.reduce((a, t) => a + Number(t.amount), 0) });
    }
    return weeks;
  }, [expenseTxs, daysInMonth]);

  const cashFlowData = useMemo(() => {
    let cumulative = 0;
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dayTxs = regularTransactions.filter(t => new Date(t.transaction_date).getDate() === day);
      const dayIncome = dayTxs.filter(t => t.type === "income").reduce((a, t) => a + Number(t.amount), 0);
      const dayExpense = dayTxs.filter(t => t.type === "expense").reduce((a, t) => a + Number(t.amount), 0);
      cumulative += dayIncome - dayExpense;
      return { day: String(day), cumulative, income: dayIncome, expense: dayExpense };
    });
  }, [regularTransactions, daysInMonth]);

  const createTransaction = async () => {
    if (!user || !form.amount) return;
    if (!canCreate("transactions", transactions.length)) {
      toast({ variant: "destructive", title: "Limite do plano Free", description: "Faça upgrade para adicionar mais transações." });
      return;
    }
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
        is_recurring: form.is_recurring,
      };
    });

    await supabase.from("transactions").insert(rows);
    setForm({ type: "expense", amount: "", category: "Outros", description: "", date: new Date().toISOString().split("T")[0], payment_method: "", payment_status: "paid", due_date: "", credit_card_id: "", installments: "1", is_recurring: false });
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

  const deleteBudget = async (id: string) => {
    await supabase.from("budgets").delete().eq("id", id);
    fetchData();
    toast({ title: "Orçamento removido" });
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

  const createBill = async () => {
    if (!user || !billForm.amount || !billForm.description || !billForm.due_date) return;
    await supabase.from("bills").insert({
      user_id: user.id,
      description: billForm.description,
      amount: Number(billForm.amount),
      due_date: billForm.due_date,
      category: billForm.category,
      is_recurring: billForm.is_recurring,
      recurring_end_date: billForm.is_recurring && billForm.recurring_end_date ? billForm.recurring_end_date : null,
    } as any);
    setBillForm({ description: "", amount: "", due_date: "", category: "Outros", is_recurring: false, recurring_end_date: "" });
    setBillDialogOpen(false);
    fetchData();
    toast({ title: "Conta adicionada! 📄" });
  };

  const payBill = async (bill: Bill) => {
    if (!user) return;
    // Create transaction
    await supabase.from("transactions").insert({
      user_id: user.id,
      type: "expense",
      amount: bill.amount,
      category: bill.category,
      description: bill.description,
      transaction_date: new Date().toISOString().split("T")[0],
      payment_status: "paid",
      due_date: bill.due_date,
      is_recurring: bill.is_recurring,
    });
    // Mark bill as paid
    await supabase.from("bills").update({ is_paid: true, paid_at: new Date().toISOString() } as any).eq("id", bill.id);
    fetchData();
    toast({ title: `${bill.description} paga! ✅` });
  };

  const deleteBill = async (id: string) => {
    await supabase.from("bills").delete().eq("id", id);
    fetchData();
    toast({ title: "Conta removida" });
  };

  const totalBudgetLimit = budgets.reduce((a, b) => a + Number(b.monthly_limit), 0);
  const totalBudgetSpent = budgets.reduce((a, b) => {
    const spent = expenseTxs.filter(t => t.category === b.category).reduce((s, t) => s + Number(t.amount), 0);
    return a + spent;
  }, 0);
  const budgetHealthPct = totalBudgetLimit > 0 ? Math.round((totalBudgetSpent / totalBudgetLimit) * 100) : 0;

  return (
    <div className="space-y-6 max-w-6xl">
      <PlanLimitBanner resource="transactions" currentCount={transactions.length} resourceLabel="transações" />
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

              {/* Fixed vs Variable toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/30">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{form.is_recurring ? "Gasto Fixo" : "Gasto Variável"}</p>
                    <p className="text-[10px] text-muted-foreground">{form.is_recurring ? "Repete todo mês (aluguel, assinatura...)" : "Gasto pontual ou esporádico"}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant={!form.is_recurring ? "default" : "outline"} className="text-xs h-7 px-2.5" onClick={() => setForm({ ...form, is_recurring: false })}>Variável</Button>
                  <Button size="sm" variant={form.is_recurring ? "default" : "outline"} className="text-xs h-7 px-2.5" onClick={() => setForm({ ...form, is_recurring: true })}>Fixo</Button>
                </div>
              </div>

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
        <TabsList className="bg-secondary border border-border flex-wrap">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="transacoes">Transações</TabsTrigger>
          <TabsTrigger value="faturas">Contas a Pagar</TabsTrigger>
          <TabsTrigger value="cartoes">Cartões</TabsTrigger>
          <TabsTrigger value="orcamentos">Orçamentos</TabsTrigger>
        </TabsList>

        {/* ========== RESUMO ========== */}
        <TabsContent value="resumo" className="space-y-6 mt-4">
          {/* Primary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <ArrowUpCircle className="h-4 w-4 text-primary" />, label: "Receita", value: fmt(income), color: "text-primary", sub: incomeVariation !== 0 ? `${incomeVariation > 0 ? "+" : ""}${incomeVariation}% vs mês anterior` : "Sem dados anteriores", subColor: incomeVariation >= 0 ? "text-primary" : "text-destructive" },
              { icon: <ArrowDownCircle className="h-4 w-4 text-destructive" />, label: "Despesas", value: fmt(expenses), color: "text-destructive", sub: expenseVariation !== 0 ? `${expenseVariation > 0 ? "+" : ""}${expenseVariation}% vs mês anterior` : "Sem dados anteriores", subColor: expenseVariation <= 0 ? "text-primary" : "text-destructive" },
              { icon: <DollarSign className="h-4 w-4 text-accent" />, label: "Saldo Livre", value: fmt(balance), color: balance >= 0 ? "text-primary" : "text-destructive", sub: balance >= 0 ? "No verde! 🎉" : "Atenção ⚠️" },
              { icon: <Target className="h-4 w-4 text-primary" />, label: "Taxa Economia", value: `${savingsRate}%`, color: savingsRate >= 30 ? "text-primary" : savingsRate >= 0 ? "text-foreground" : "text-destructive", sub: savingsRate >= 30 ? "Excelente! 🏆" : savingsRate >= 15 ? "Bom ritmo 💪" : "Meta: 30%+" },
            ].map((kpi, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-2">{kpi.icon}<p className="text-xs text-muted-foreground">{kpi.label}</p></div>
                <p className={`text-xl font-bold font-mono ${kpi.color}`}>{kpi.value}</p>
                <p className={`text-[10px] mt-1 ${kpi.subColor || "text-muted-foreground"}`}>{kpi.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Secondary KPIs Row */}
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
              <div className="flex items-center gap-2 mb-2"><Percent className="h-4 w-4 text-muted-foreground" /><p className="text-xs text-muted-foreground">Comprometimento</p></div>
              <p className={`text-lg font-bold font-mono ${commitmentRate >= 100 ? "text-destructive" : commitmentRate >= 80 ? "text-yellow-400" : "text-primary"}`}>{commitmentRate}%</p>
              <p className="text-[10px] text-muted-foreground mt-1">{commitmentRate < 70 ? "Saudável ✅" : commitmentRate < 90 ? "Atenção 🔶" : "Crítico 🔴"}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2"><Flame className="h-4 w-4 text-muted-foreground" /><p className="text-xs text-muted-foreground">Saúde Orçamento</p></div>
              <p className={`text-lg font-bold font-mono ${budgetHealthPct >= 100 ? "text-destructive" : budgetHealthPct >= 80 ? "text-yellow-400" : "text-primary"}`}>
                {totalBudgetLimit > 0 ? `${budgetHealthPct}%` : "—"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">{totalBudgetLimit > 0 ? `${fmt(totalBudgetSpent)} de ${fmt(totalBudgetLimit)}` : "Sem orçamentos"}</p>
            </div>
          </div>

          {/* Third KPI row: Cards, Unpaid, Ticket, Fixed ratio */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2"><CreditCard className="h-4 w-4 text-muted-foreground" /><p className="text-xs text-muted-foreground">Faturas Cartões</p></div>
              <p className="text-lg font-bold font-mono text-foreground">{fmt(totalCardInvoices)}</p>
              <div className="mt-1.5">
                <div className="w-full h-1.5 rounded-full bg-secondary">
                  <div className={`h-full rounded-full transition-all ${cardUsagePct >= 80 ? "bg-destructive" : cardUsagePct >= 50 ? "bg-yellow-400" : "bg-primary"}`} style={{ width: `${Math.min(cardUsagePct, 100)}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{cardUsagePct}% do limite total</p>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2"><FileWarning className="h-4 w-4 text-muted-foreground" /><p className="text-xs text-muted-foreground">Contas a Pagar</p></div>
              <p className={`text-lg font-bold font-mono ${unpaidTotal > 0 ? "text-destructive" : "text-primary"}`}>{fmt(unpaidTotal)}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {overdueTotal > 0 ? <span className="text-destructive font-semibold">{fmt(overdueTotal)} atrasado!</span> : unpaidTxs.length > 0 ? `${unpaidTxs.length} pendente(s)` : "Tudo em dia ✅"}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2"><Receipt className="h-4 w-4 text-muted-foreground" /><p className="text-xs text-muted-foreground">Ticket Médio</p></div>
              <p className="text-lg font-bold font-mono text-foreground">{fmt(avgExpenseTicket)}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{expenseTxs.length} despesas · {incomeTxs.length} receitas</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2"><Scale className="h-4 w-4 text-muted-foreground" /><p className="text-xs text-muted-foreground">Fixo vs Variável</p></div>
              <p className="text-lg font-bold font-mono text-foreground">{fixedRatio}% / {100 - fixedRatio}%</p>
              <p className="text-[10px] text-muted-foreground mt-1">{fmt(recurringTotal)} fixo · {fmt(variableTotal)} variável</p>
            </div>
          </div>

          {/* Fourth KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2"><Banknote className="h-4 w-4 text-muted-foreground" /><p className="text-xs text-muted-foreground">Renda Disponível</p></div>
              <p className={`text-lg font-bold font-mono ${disposableIncome >= 0 ? "text-primary" : "text-destructive"}`}>{fmt(disposableIncome)}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Receita − Gastos fixos</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2"><ShieldCheck className="h-4 w-4 text-muted-foreground" /><p className="text-xs text-muted-foreground">Status Pagamentos</p></div>
              <p className="text-lg font-bold font-mono text-primary">{paidPct}%</p>
              <div className="w-full h-1.5 rounded-full bg-secondary mt-1.5">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${paidPct}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">das despesas quitadas</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2"><Activity className="h-4 w-4 text-muted-foreground" /><p className="text-xs text-muted-foreground">Transações</p></div>
              <p className="text-lg font-bold font-mono text-foreground">{txCount}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{incomeTxs.length} receitas · {expenseTxs.length} despesas</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2"><Zap className="h-4 w-4 text-muted-foreground" /><p className="text-xs text-muted-foreground">Score Financeiro</p></div>
              {(() => {
                const score = Math.max(0, Math.min(100,
                  (savingsRate >= 30 ? 30 : savingsRate >= 0 ? savingsRate : 0) +
                  (commitmentRate <= 70 ? 25 : commitmentRate <= 90 ? 15 : 0) +
                  (paidPct >= 90 ? 25 : paidPct * 0.25) +
                  (cardUsagePct <= 30 ? 20 : cardUsagePct <= 60 ? 10 : 0)
                ));
                const scoreColor = score >= 70 ? "text-primary" : score >= 40 ? "text-yellow-400" : "text-destructive";
                const scoreLabel = score >= 70 ? "Ótimo 🏆" : score >= 40 ? "Regular 🔶" : "Crítico 🔴";
                return (
                  <>
                    <p className={`text-lg font-bold font-mono ${scoreColor}`}>{Math.round(score)}/100</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{scoreLabel}</p>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Cash Flow Chart */}
          {regularTransactions.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2 text-sm"><TrendingUp className="h-4 w-4 text-primary" /> Fluxo de Caixa Acumulado</h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashFlowData}>
                    <defs>
                      <linearGradient id="cashFlowGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(200 80% 50%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(200 80% 50%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 14%)" />
                    <XAxis dataKey="day" tick={{ fontSize: 9, fill: "hsl(220 10% 50%)" }} interval={2} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(220 10% 50%)" }} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [fmt(v), name === "cumulative" ? "Acumulado" : name === "income" ? "Receita" : "Despesa"]} />
                    <Area type="monotone" dataKey="cumulative" stroke="hsl(200 80% 50%)" fill="url(#cashFlowGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Charts row: Categories + Income Sources */}
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

          {/* Weekly Spending + Fixed vs Variable */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weeklySpending.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2 text-sm"><Layers className="h-4 w-4 text-primary" /> Gastos por Semana</h3>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklySpending}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 14%)" />
                      <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(220 10% 50%)" }} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(220 10% 50%)" }} />
                      <Tooltip contentStyle={tooltipStyle} cursor={noCursor} formatter={(v: number) => [fmt(v), "Gastos"]} />
                      <Bar dataKey="amount" fill="hsl(280 70% 55%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2 text-sm"><Scale className="h-4 w-4 text-primary" /> Composição de Gastos</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RPieChart>
                    <Pie
                      data={[
                        { name: "Fixo", value: recurringTotal || 1 },
                        { name: "Variável", value: variableTotal || 1 },
                      ]}
                      dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35} paddingAngle={4}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}
                    >
                      <Cell fill="hsl(200 80% 50%)" />
                      <Cell fill="hsl(40 90% 55%)" />
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} cursor={noCursor} formatter={(v: number) => [fmt(v), "Valor"]} />
                  </RPieChart>
                </ResponsiveContainer>
              </div>
            </div>
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

          {/* Monthly comparison card */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2 text-sm"><ArrowRightLeft className="h-4 w-4 text-primary" /> Comparação com Mês Anterior</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground mb-1">Receita</p>
                <p className="font-bold font-mono text-primary text-sm">{fmt(income)}</p>
                <p className="text-[10px] text-muted-foreground">Anterior: {fmt(prevMonthData.income)}</p>
                <Badge className={`mt-1 text-[10px] ${incomeVariation >= 0 ? "bg-primary/15 text-primary border-primary/30" : "bg-destructive/15 text-destructive border-destructive/30"}`}>
                  {incomeVariation >= 0 ? "↑" : "↓"} {Math.abs(incomeVariation)}%
                </Badge>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground mb-1">Despesas</p>
                <p className="font-bold font-mono text-destructive text-sm">{fmt(expenses)}</p>
                <p className="text-[10px] text-muted-foreground">Anterior: {fmt(prevMonthData.expenses)}</p>
                <Badge className={`mt-1 text-[10px] ${expenseVariation <= 0 ? "bg-primary/15 text-primary border-primary/30" : "bg-destructive/15 text-destructive border-destructive/30"}`}>
                  {expenseVariation >= 0 ? "↑" : "↓"} {Math.abs(expenseVariation)}%
                </Badge>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground mb-1">Saldo</p>
                <p className={`font-bold font-mono text-sm ${balance >= 0 ? "text-primary" : "text-destructive"}`}>{fmt(balance)}</p>
                <p className="text-[10px] text-muted-foreground">Anterior: {fmt(prevMonthData.balance)}</p>
                {(() => {
                  const balanceVar = prevMonthData.balance !== 0 ? Math.round(((balance - prevMonthData.balance) / Math.abs(prevMonthData.balance)) * 100) : 0;
                  return (
                    <Badge className={`mt-1 text-[10px] ${balanceVar >= 0 ? "bg-primary/15 text-primary border-primary/30" : "bg-destructive/15 text-destructive border-destructive/30"}`}>
                      {balanceVar >= 0 ? "↑" : "↓"} {Math.abs(balanceVar)}%
                    </Badge>
                  );
                })()}
              </div>
            </div>
          </div>
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
                        {tx.is_recurring && (
                          <Badge variant="outline" className="text-[10px] gap-1 border-blue-400/30 text-blue-400">
                            <Layers className="h-2.5 w-2.5" /> Fixo
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

        {/* ========== CONTAS A PAGAR ========== */}
        <TabsContent value="faturas" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-foreground flex items-center gap-2"><Receipt className="h-5 w-5 text-primary" /> Contas do Mês</h3>
            <Dialog open={billDialogOpen} onOpenChange={setBillDialogOpen}>
              <DialogTrigger asChild><Button variant="outline" size="sm" className="gap-2"><Plus className="h-4 w-4" /> Nova Conta</Button></DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader><DialogTitle>Nova Conta a Pagar</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2"><Label>Descrição</Label><Input value={billForm.description} onChange={(e) => setBillForm({ ...billForm, description: e.target.value })} className="bg-secondary border-border" placeholder="Ex: Aluguel, Internet, Luz..." /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>Valor (R$)</Label><Input type="number" value={billForm.amount} onChange={(e) => setBillForm({ ...billForm, amount: e.target.value })} className="bg-secondary border-border" placeholder="0,00" /></div>
                    <div className="space-y-2"><Label>Vencimento</Label><Input type="date" value={billForm.due_date} onChange={(e) => setBillForm({ ...billForm, due_date: e.target.value })} className="bg-secondary border-border" /></div>
                  </div>
                  <div className="space-y-2"><Label>Categoria</Label>
                    <Select value={billForm.category} onValueChange={(v) => setBillForm({ ...billForm, category: v })}>
                      <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/30">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{billForm.is_recurring ? "Recorrente" : "Única"}</p>
                        <p className="text-[10px] text-muted-foreground">{billForm.is_recurring ? "Repete todo mês" : "Conta pontual"}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant={!billForm.is_recurring ? "default" : "outline"} className="text-xs h-7 px-2.5" onClick={() => setBillForm({ ...billForm, is_recurring: false, recurring_end_date: "" })}>Única</Button>
                      <Button size="sm" variant={billForm.is_recurring ? "default" : "outline"} className="text-xs h-7 px-2.5" onClick={() => setBillForm({ ...billForm, is_recurring: true })}>Recorrente</Button>
                    </div>
                  </div>
                  {billForm.is_recurring && (
                    <div className="space-y-2">
                      <Label>Recorrente até (opcional)</Label>
                      <Input type="date" value={billForm.recurring_end_date} onChange={(e) => setBillForm({ ...billForm, recurring_end_date: e.target.value })} className="bg-secondary border-border" />
                      <p className="text-[10px] text-muted-foreground">Deixe vazio se for por tempo indeterminado</p>
                    </div>
                  )}
                  <Button onClick={createBill} className="w-full">Adicionar Conta</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Summary cards */}
          {(() => {
            const unpaidBills = bills.filter(b => !b.is_paid);
            const paidBills = bills.filter(b => b.is_paid);
            const totalUnpaid = unpaidBills.reduce((a, b) => a + Number(b.amount), 0);
            const totalPaidBills = paidBills.reduce((a, b) => a + Number(b.amount), 0);
            const overdueBills = unpaidBills.filter(b => new Date(b.due_date) < now);
            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-destructive/10"><Clock className="h-5 w-5 text-destructive" /></div>
                  <div><p className="text-xs text-muted-foreground">A Pagar</p><p className="font-bold text-foreground font-mono">{fmt(totalUnpaid)}</p><p className="text-[10px] text-muted-foreground">{unpaidBills.length} conta(s)</p></div>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10"><CheckCircle2 className="h-5 w-5 text-primary" /></div>
                  <div><p className="text-xs text-muted-foreground">Pagas</p><p className="font-bold text-foreground font-mono">{fmt(totalPaidBills)}</p><p className="text-[10px] text-muted-foreground">{paidBills.length} conta(s)</p></div>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${overdueBills.length > 0 ? "bg-destructive/10" : "bg-primary/10"}`}>
                    <AlertCircle className={`h-5 w-5 ${overdueBills.length > 0 ? "text-destructive" : "text-primary"}`} />
                  </div>
                  <div><p className="text-xs text-muted-foreground">Atrasadas</p><p className="font-bold text-foreground font-mono">{overdueBills.length}</p><p className="text-[10px] text-muted-foreground">{overdueBills.length > 0 ? "Atenção!" : "Tudo em dia ✅"}</p></div>
                </div>
              </div>
            );
          })()}

          {bills.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Receipt className="h-14 w-14 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium mb-1">Nenhuma conta cadastrada</p>
              <p className="text-sm opacity-70">Adicione suas contas do mês para controlar os pagamentos.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {bills.map((bill) => {
                const isOverdue = !bill.is_paid && new Date(bill.due_date) < now;
                const daysUntilDue = Math.ceil((new Date(bill.due_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={bill.id} className={`flex items-center justify-between p-4 rounded-lg border bg-card group hover:border-primary/20 transition-colors ${isOverdue ? "border-destructive/40" : bill.is_paid ? "border-primary/20 opacity-70" : "border-border"}`}>
                    <div className="flex items-center gap-3">
                      {bill.is_paid ? <CheckCircle2 className="h-5 w-5 text-primary" /> : isOverdue ? <AlertCircle className="h-5 w-5 text-destructive" /> : <Clock className="h-5 w-5 text-muted-foreground" />}
                      <div>
                        <p className={`text-sm font-medium ${bill.is_paid ? "line-through text-muted-foreground" : "text-foreground"}`}>{bill.description}</p>
                        <div className="flex flex-wrap gap-2 mt-0.5 items-center">
                          <Badge variant="outline" className="text-xs">{bill.category}</Badge>
                          <span className={`text-xs flex items-center gap-1 ${isOverdue ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                            <CalendarDays className="h-3 w-3" />
                            Venc: {new Date(bill.due_date).toLocaleDateString("pt-BR")}
                            {isOverdue && !bill.is_paid && " (Atrasado!)"}
                            {!bill.is_paid && !isOverdue && daysUntilDue <= 3 && daysUntilDue >= 0 && ` (${daysUntilDue}d)`}
                          </span>
                          {bill.is_recurring && (
                            <Badge variant="outline" className="text-[10px] gap-1 border-blue-400/30 text-blue-400">
                              <Layers className="h-2.5 w-2.5" /> Recorrente
                              {bill.recurring_end_date && ` até ${new Date(bill.recurring_end_date).toLocaleDateString("pt-BR")}`}
                            </Badge>
                          )}
                          {bill.is_paid && (
                            <Badge className="text-[10px] gap-1 bg-primary/15 text-primary border-primary/30">
                              <CheckCircle2 className="h-2.5 w-2.5" /> Paga
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono text-sm text-destructive">{fmt(Number(bill.amount))}</span>
                      {!bill.is_paid && (
                        <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => payBill(bill)}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Pagar
                        </Button>
                      )}
                      <button onClick={() => deleteBill(bill.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
                    <div className="text-center">
                      <p className="text-white/60 text-[10px]">Disponível</p>
                      <p className={`font-bold font-mono ${Number(card.credit_limit) - invoiceTotal <= 0 ? "text-red-300" : ""}`}>{fmt(Math.max(0, Number(card.credit_limit) - invoiceTotal))}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/60 text-[10px]">Limite Total</p>
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
          {budgets.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Target className="h-14 w-14 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium mb-1">Nenhum orçamento definido</p>
              <p className="text-sm opacity-70">Crie orçamentos por categoria para controlar seus gastos.</p>
            </div>
          ) : (
            <>
              {/* Budget summary header */}
              {(() => {
                const totalLimit = budgets.reduce((a, b) => a + Number(b.monthly_limit), 0);
                const totalSpent = budgets.reduce((a, b) => {
                  const spent = expenseTxs.filter((t) => t.category === b.category).reduce((s, t) => s + Number(t.amount), 0);
                  return a + spent;
                }, 0);
                const totalPct = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;
                const overBudgetCount = budgets.filter(b => {
                  const spent = expenseTxs.filter((t) => t.category === b.category).reduce((s, t) => s + Number(t.amount), 0);
                  return spent > Number(b.monthly_limit);
                }).length;
                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10"><Scale className="h-5 w-5 text-primary" /></div>
                      <div><p className="text-xs text-muted-foreground">Orçamento Total</p><p className="font-bold text-foreground font-mono">{fmt(totalLimit)}</p></div>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${totalPct >= 100 ? "bg-destructive/10" : totalPct >= 80 ? "bg-yellow-500/10" : "bg-primary/10"}`}>
                        <Activity className={`h-5 w-5 ${totalPct >= 100 ? "text-destructive" : totalPct >= 80 ? "text-yellow-400" : "text-primary"}`} />
                      </div>
                      <div><p className="text-xs text-muted-foreground">Utilizado</p><p className="font-bold text-foreground font-mono">{fmt(totalSpent)} <span className="text-xs text-muted-foreground">({totalPct}%)</span></p></div>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${overBudgetCount > 0 ? "bg-destructive/10" : "bg-primary/10"}`}>
                        <AlertCircle className={`h-5 w-5 ${overBudgetCount > 0 ? "text-destructive" : "text-primary"}`} />
                      </div>
                      <div><p className="text-xs text-muted-foreground">Estourados</p><p className="font-bold text-foreground font-mono">{overBudgetCount} <span className="text-xs text-muted-foreground">de {budgets.length}</span></p></div>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {budgets.map((b) => {
                  const spent = expenseTxs.filter((t) => t.category === b.category).reduce((a, t) => a + Number(t.amount), 0);
                  const limit = Number(b.monthly_limit);
                  const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
                  const remaining = limit - spent;
                  const status = pct >= 100 ? "destructive" : pct >= 80 ? "warning" : "ok";
                  const statusColor = status === "destructive" ? "text-destructive" : status === "warning" ? "text-yellow-400" : "text-primary";
                  const statusBg = status === "destructive" ? "bg-destructive/10" : status === "warning" ? "bg-yellow-500/10" : "bg-primary/10";
                  const statusIcon = status === "destructive" ? <AlertCircle className="h-4 w-4" /> : status === "warning" ? <FileWarning className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />;
                  const statusLabel = status === "destructive" ? "Estourado" : status === "warning" ? "Atenção" : "Dentro";

                  return (
                    <div key={b.id} className="rounded-xl border border-border bg-card p-5 space-y-3 hover:border-primary/30 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{b.category}</span>
                          <Badge variant="outline" className={`text-xs ${statusColor} ${statusBg} border-none`}>
                            <span className="flex items-center gap-1">{statusIcon} {statusLabel}</span>
                          </Badge>
                        </div>
                        <span className={`font-bold font-mono text-lg ${statusColor}`}>{pct}%</span>
                      </div>
                      <Progress value={Math.min(pct, 100)} className={`h-2.5 ${status === "destructive" ? "[&>div]:bg-destructive" : status === "warning" ? "[&>div]:bg-yellow-400" : ""}`} />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Gasto: <span className="font-mono text-foreground">{fmt(spent)}</span></span>
                        <span>Limite: <span className="font-mono text-foreground">{fmt(limit)}</span></span>
                      </div>
                      <div className={`text-xs font-medium ${remaining >= 0 ? "text-primary" : "text-destructive"}`}>
                        {remaining >= 0 ? `Ainda disponível: ${fmt(remaining)}` : `Excedido em: ${fmt(Math.abs(remaining))}`}
                      </div>
                      <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 p-0 h-auto" onClick={() => deleteBudget(b.id)}>
                        <Trash2 className="h-3 w-3 mr-1" /> Remover
                      </Button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
