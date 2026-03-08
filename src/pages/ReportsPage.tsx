import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, Zap, Flame, Target, Wallet, TrendingUp, TrendingDown,
  CheckCircle2, Clock, Award, Activity, ArrowUpCircle, ArrowDownCircle,
  PieChart, Layers, DollarSign, Calendar, Users, Star, Shield,
  Download, FileSpreadsheet, FileText
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  LineChart, Line, CartesianGrid, Area, AreaChart,
  PieChart as RPieChart, Pie, Cell
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
const MONTH_NAMES_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const COLORS = ["hsl(153 100% 50%)", "hsl(200 80% 50%)", "hsl(280 70% 55%)", "hsl(40 90% 55%)", "hsl(0 72% 51%)", "hsl(180 60% 45%)", "hsl(320 70% 50%)", "hsl(120 50% 40%)"];

const tooltipStyle = {
  backgroundColor: "hsl(220 18% 7%)",
  border: "1px solid hsl(220 14% 14%)",
  borderRadius: 8,
  color: "hsl(160 10% 92%)",
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  subColor?: string;
  bgIcon?: string;
}

function StatCard({ icon, label, value, sub, subColor = "text-muted-foreground", bgIcon = "bg-primary/10" }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${bgIcon}`}>{icon}</div>
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold text-foreground font-mono">{value}</p>
      {sub && <p className={`text-xs mt-1 ${subColor}`}>{sub}</p>}
    </div>
  );
}

export default function ReportsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<any[]>([]);
  const [habitLogs, setHabitLogs] = useState<any[]>([]);
  const [habits, setHabits] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [dreams, setDreams] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      const [tasksRes, habitLogsRes, habitsRes, goalsRes, txRes, invRes, profileRes, dreamsRes] = await Promise.all([
        supabase.from("tasks").select("*").eq("user_id", user.id),
        supabase.from("habit_logs").select("*").eq("user_id", user.id),
        supabase.from("habits").select("*").eq("user_id", user.id),
        supabase.from("goals").select("*").eq("user_id", user.id),
        supabase.from("transactions").select("*").eq("user_id", user.id),
        supabase.from("investments").select("*").eq("user_id", user.id),
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("dreams").select("*").eq("user_id", user.id),
      ]);
      if (tasksRes.data) setTasks(tasksRes.data);
      if (habitLogsRes.data) setHabitLogs(habitLogsRes.data);
      if (habitsRes.data) setHabits(habitsRes.data);
      if (goalsRes.data) setGoals(goalsRes.data);
      if (txRes.data) setTransactions(txRes.data);
      if (invRes.data) setInvestments(invRes.data);
      if (profileRes.data) setProfile(profileRes.data);
      if (dreamsRes.data) setDreams(dreamsRes.data);
    };
    fetchAll();
  }, [user]);

  // === Computed metrics ===
  const tasksDone = tasks.filter(t => t.status === "done").length;
  const tasksTodo = tasks.filter(t => t.status === "todo").length;
  const tasksInProgress = tasks.filter(t => t.status === "in_progress").length;
  const taskCompletionRate = tasks.length > 0 ? Math.round((tasksDone / tasks.length) * 100) : 0;

  const totalHabitLogs = habitLogs.length;
  const activeHabits = habits.filter(h => h.is_active).length;
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.best_streak || 0), 0);
  const avgStreak = habits.length > 0 ? Math.round(habits.reduce((a, h) => a + (h.streak || 0), 0) / habits.length) : 0;

  const goalsActive = goals.filter(g => g.status === "active").length;
  const goalsCompleted = goals.filter(g => g.status === "completed").length;
  const goalsSuccessRate = goals.length > 0 ? Math.round((goalsCompleted / goals.length) * 100) : 0;

  const incomeTxs = transactions.filter(t => t.type === "income" && !t.credit_card_id);
  const expenseTxs = transactions.filter(t => t.type === "expense" && !t.credit_card_id);
  const totalIncome = incomeTxs.reduce((a, t) => a + Number(t.amount), 0);
  const totalExpenses = expenseTxs.reduce((a, t) => a + Number(t.amount), 0);
  const balance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0;
  const totalInvested = investments.reduce((a, i) => a + Number(i.quantity) * Number(i.current_price), 0);
  const totalDividends = investments.reduce((a, i) => a + Number(i.dividends_total || 0), 0);

  const dreamsActive = dreams.filter(d => d.status === "active").length;
  const dreamsCompleted = dreams.filter(d => d.status === "completed").length;
  const totalDreamsSaved = dreams.reduce((a, d) => a + Number(d.current_amount), 0);

  // === Monthly data for charts ===
  const currentYear = new Date().getFullYear();

  const monthlyFinance = useMemo(() => {
    return MONTH_NAMES_SHORT.map((m, i) => {
      const monthTxs = transactions.filter(t => {
        const d = new Date(t.transaction_date);
        return d.getFullYear() === currentYear && d.getMonth() === i && !t.credit_card_id;
      });
      const income = monthTxs.filter(t => t.type === "income").reduce((a, t) => a + Number(t.amount), 0);
      const expense = monthTxs.filter(t => t.type === "expense").reduce((a, t) => a + Number(t.amount), 0);
      return { name: m, receita: income, despesa: expense, saldo: income - expense };
    });
  }, [transactions, currentYear]);

  const monthlyTasks = useMemo(() => {
    return MONTH_NAMES_SHORT.map((m, i) => {
      const count = tasks.filter(t => {
        if (t.status !== "done") return false;
        const d = new Date(t.updated_at);
        return d.getFullYear() === currentYear && d.getMonth() === i;
      }).length;
      return { name: m, concluidas: count };
    });
  }, [tasks, currentYear]);

  const monthlyHabits = useMemo(() => {
    return MONTH_NAMES_SHORT.map((m, i) => {
      const count = habitLogs.filter(l => {
        const d = new Date(l.completed_at);
        return d.getFullYear() === currentYear && d.getMonth() === i;
      }).length;
      return { name: m, completados: count };
    });
  }, [habitLogs, currentYear]);

  const categorySpending = useMemo(() => {
    const cats: Record<string, number> = {};
    expenseTxs.forEach(t => { cats[t.category] = (cats[t.category] || 0) + Number(t.amount); });
    return Object.entries(cats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [expenseTxs]);

  const radarData = [
    { attr: "Foco", value: Math.min(tasksDone * 5, 100) },
    { attr: "Disciplina", value: Math.min(totalHabitLogs * 2, 100) },
    { attr: "Ambição", value: Math.min((goalsCompleted + goalsActive) * 10, 100) },
    { attr: "Financeiro", value: Math.min(Math.max(savingsRate, 0), 100) },
    { attr: "Produtividade", value: Math.min((tasksDone + totalHabitLogs) * 3, 100) },
    { attr: "Consistência", value: Math.min(avgStreak * 10, 100) },
  ];

  const xpForNextLevel = (profile?.level || 1) * 100;
  const xpProgress = profile ? Math.round((profile.xp % xpForNextLevel) / xpForNextLevel * 100) : 0;

  // === Export Functions ===
  const exportPDF = () => {
    const doc = new jsPDF();
    const now = new Date().toLocaleDateString("pt-BR");
    doc.setFontSize(18);
    doc.text("TRILHA - Relatório Completo", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Gerado em ${now}`, 14, 28);
    doc.setTextColor(0);

    // Visão Geral
    doc.setFontSize(14);
    doc.text("Visão Geral", 14, 40);
    autoTable(doc, {
      startY: 44,
      head: [["Métrica", "Valor"]],
      body: [
        ["Nível", String(profile?.level || 1)],
        ["XP Total", String(profile?.xp || 0)],
        ["Tarefas Concluídas", String(tasksDone)],
        ["Taxa de Conclusão", `${taskCompletionRate}%`],
        ["Hábitos Completados", String(totalHabitLogs)],
        ["Melhor Streak", `${bestStreak} dias`],
        ["Metas Concluídas", `${goalsCompleted} de ${goals.length}`],
        ["Taxa de Sucesso", `${goalsSuccessRate}%`],
      ],
      theme: "striped",
      headStyles: { fillColor: [0, 180, 100] },
    });

    // Financeiro
    const financialY = (doc as any).lastAutoTable.finalY + 12;
    doc.setFontSize(14);
    doc.text("Resumo Financeiro", 14, financialY);
    autoTable(doc, {
      startY: financialY + 4,
      head: [["Métrica", "Valor"]],
      body: [
        ["Receita Total", fmt(totalIncome)],
        ["Despesas Totais", fmt(totalExpenses)],
        ["Saldo", fmt(balance)],
        ["Taxa de Economia", `${savingsRate}%`],
        ["Patrimônio Investido", fmt(totalInvested)],
        ["Dividendos", fmt(totalDividends)],
      ],
      theme: "striped",
      headStyles: { fillColor: [0, 180, 100] },
    });

    // Financeiro mensal
    const monthlyY = (doc as any).lastAutoTable.finalY + 12;
    doc.setFontSize(14);
    doc.text("Fluxo Mensal", 14, monthlyY);
    autoTable(doc, {
      startY: monthlyY + 4,
      head: [["Mês", "Receita", "Despesa", "Saldo"]],
      body: monthlyFinance.map(m => [m.name, fmt(m.receita), fmt(m.despesa), fmt(m.saldo)]),
      theme: "striped",
      headStyles: { fillColor: [0, 180, 100] },
    });

    // Gastos por categoria
    if (categorySpending.length > 0) {
      const catY = (doc as any).lastAutoTable.finalY + 12;
      if (catY > 250) doc.addPage();
      const startY = catY > 250 ? 20 : catY;
      doc.setFontSize(14);
      doc.text("Gastos por Categoria", 14, startY);
      autoTable(doc, {
        startY: startY + 4,
        head: [["Categoria", "Valor"]],
        body: categorySpending.map(c => [c.name, fmt(c.value)]),
        theme: "striped",
        headStyles: { fillColor: [0, 180, 100] },
      });
    }

    // Metas
    if (goals.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text("Metas", 14, 20);
      autoTable(doc, {
        startY: 24,
        head: [["Meta", "Progresso", "Status"]],
        body: goals.map(g => [
          g.name,
          g.target_value ? `${Math.round((Number(g.current_value) / Number(g.target_value)) * 100)}%` : "—",
          g.status === "completed" ? "Concluída" : "Ativa",
        ]),
        theme: "striped",
        headStyles: { fillColor: [0, 180, 100] },
      });
    }

    // Sonhos
    if (dreams.length > 0) {
      const dreamsY = (doc as any).lastAutoTable.finalY + 12;
      doc.setFontSize(14);
      doc.text("Sonhos", 14, dreamsY);
      autoTable(doc, {
        startY: dreamsY + 4,
        head: [["Sonho", "Guardado", "Alvo", "Progresso"]],
        body: dreams.map(d => [
          d.title,
          fmt(Number(d.current_amount)),
          d.target_amount ? fmt(Number(d.target_amount)) : "—",
          d.target_amount ? `${Math.round((Number(d.current_amount) / Number(d.target_amount)) * 100)}%` : "—",
        ]),
        theme: "striped",
        headStyles: { fillColor: [0, 180, 100] },
      });
    }

    doc.save(`TRILHA_Relatorio_${now.replace(/\//g, "-")}.pdf`);
    toast({ title: "PDF exportado com sucesso! 📄" });
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Visão Geral
    const geralData = [
      ["Métrica", "Valor"],
      ["Nível", profile?.level || 1],
      ["XP Total", profile?.xp || 0],
      ["Tarefas Concluídas", tasksDone],
      ["Taxa de Conclusão", `${taskCompletionRate}%`],
      ["Hábitos Completados", totalHabitLogs],
      ["Melhor Streak", bestStreak],
      ["Metas Concluídas", goalsCompleted],
      ["Taxa de Sucesso", `${goalsSuccessRate}%`],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(geralData), "Visão Geral");

    // Financeiro
    const finData = [
      ["Métrica", "Valor"],
      ["Receita Total", totalIncome],
      ["Despesas Totais", totalExpenses],
      ["Saldo", balance],
      ["Taxa de Economia", `${savingsRate}%`],
      ["Patrimônio Investido", totalInvested],
      ["Dividendos", totalDividends],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(finData), "Financeiro");

    // Fluxo Mensal
    const monthlyData = [["Mês", "Receita", "Despesa", "Saldo"], ...monthlyFinance.map(m => [m.name, m.receita, m.despesa, m.saldo])];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(monthlyData), "Fluxo Mensal");

    // Gastos por Categoria
    if (categorySpending.length > 0) {
      const catData = [["Categoria", "Valor"], ...categorySpending.map(c => [c.name, c.value])];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(catData), "Categorias");
    }

    // Metas
    if (goals.length > 0) {
      const goalsData = [["Meta", "Valor Atual", "Valor Alvo", "Progresso", "Status"], ...goals.map(g => [
        g.name, Number(g.current_value), Number(g.target_value),
        g.target_value ? `${Math.round((Number(g.current_value) / Number(g.target_value)) * 100)}%` : "—",
        g.status === "completed" ? "Concluída" : "Ativa",
      ])];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(goalsData), "Metas");
    }

    // Sonhos
    if (dreams.length > 0) {
      const dreamsData = [["Sonho", "Guardado", "Alvo", "Progresso", "Status"], ...dreams.map(d => [
        d.title, Number(d.current_amount), d.target_amount ? Number(d.target_amount) : "—",
        d.target_amount ? `${Math.round((Number(d.current_amount) / Number(d.target_amount)) * 100)}%` : "—",
        d.status === "completed" ? "Realizado" : "Ativo",
      ])];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dreamsData), "Sonhos");
    }

    // Transações
    if (transactions.length > 0) {
      const txData = [["Data", "Tipo", "Categoria", "Descrição", "Valor", "Status"], ...transactions.filter(t => !t.credit_card_id).map(t => [
        new Date(t.transaction_date).toLocaleDateString("pt-BR"),
        t.type === "income" ? "Receita" : "Despesa",
        t.category, t.description || "", Number(t.amount),
        t.payment_status === "paid" ? "Pago" : "Pendente",
      ])];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(txData), "Transações");
    }

    const now = new Date().toLocaleDateString("pt-BR").replace(/\//g, "-");
    XLSX.writeFile(wb, `TRILHA_Relatorio_${now}.xlsx`);
    toast({ title: "Excel exportado com sucesso! 📊" });
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" /> Relatórios
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Análise completa da sua evolução em {currentYear}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" /> Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={exportPDF} className="gap-2 cursor-pointer">
              <FileText className="h-4 w-4 text-destructive" /> Exportar PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportExcel} className="gap-2 cursor-pointer">
              <FileSpreadsheet className="h-4 w-4 text-primary" /> Exportar Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>

      <Tabs defaultValue="geral">
        <TabsList className="bg-secondary border border-border">
          <TabsTrigger value="geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="produtividade">Produtividade</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="metas">Metas & Sonhos</TabsTrigger>
        </TabsList>

        {/* ========== VISÃO GERAL ========== */}
        <TabsContent value="geral" className="mt-4 space-y-6">
          {/* Level & XP */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nível atual</p>
                  <p className="text-3xl font-bold text-foreground">{profile?.level || 1}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">XP Total</p>
                <p className="text-2xl font-bold font-mono text-primary">{profile?.xp || 0}</p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progresso para nível {(profile?.level || 1) + 1}</span>
                <span>{xpProgress}%</span>
              </div>
              <Progress value={xpProgress} className="h-2" />
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<CheckCircle2 className="h-4 w-4 text-primary" />} label="Tarefas Concluídas" value={tasksDone} sub={`${taskCompletionRate}% de conclusão`} />
            <StatCard icon={<Flame className="h-4 w-4 text-primary" />} label="Hábitos Completados" value={totalHabitLogs} sub={`Melhor streak: ${bestStreak} dias`} />
            <StatCard icon={<Target className="h-4 w-4 text-primary" />} label="Metas Alcançadas" value={goalsCompleted} sub={`${goalsSuccessRate}% de sucesso`} />
            <StatCard icon={<DollarSign className="h-4 w-4 text-primary" />} label="Saldo Acumulado" value={fmt(balance)} sub={`${savingsRate}% taxa de economia`} subColor={balance >= 0 ? "text-primary" : "text-destructive"} />
          </div>

          {/* Radar */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Radar de Performance</h3>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                  <PolarGrid stroke="hsl(220 14% 14%)" />
                  <PolarAngleAxis dataKey="attr" tick={{ fill: "hsl(220 10% 55%)", fontSize: 12 }} />
                  <Radar dataKey="value" stroke="hsl(153 100% 50%)" fill="hsl(153 100% 50%)" fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        {/* ========== PRODUTIVIDADE ========== */}
        <TabsContent value="produtividade" className="mt-4 space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<CheckCircle2 className="h-4 w-4 text-primary" />} label="Concluídas" value={tasksDone} bgIcon="bg-primary/10" />
            <StatCard icon={<Clock className="h-4 w-4 text-yellow-400" />} label="Em Andamento" value={tasksInProgress} bgIcon="bg-yellow-500/10" />
            <StatCard icon={<Layers className="h-4 w-4 text-muted-foreground" />} label="Pendentes" value={tasksTodo} bgIcon="bg-muted" />
            <StatCard icon={<TrendingUp className="h-4 w-4 text-primary" />} label="Taxa de Conclusão" value={`${taskCompletionRate}%`} bgIcon="bg-primary/10" />
          </div>

          {/* Tasks chart */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Tarefas Concluídas por Mês</h3>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTasks}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 12%)" />
                  <XAxis dataKey="name" tick={{ fill: "hsl(220 10% 55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(220 10% 55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="concluidas" fill="hsl(153 100% 50%)" radius={[4, 4, 0, 0]} name="Concluídas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Habits section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Resumo de Hábitos</h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Hábitos Ativos", value: activeHabits },
                  { label: "Total de Check-ins", value: totalHabitLogs },
                  { label: "Streak Médio", value: `${avgStreak} dias` },
                  { label: "Melhor Streak", value: `${bestStreak} dias` },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="font-bold font-mono text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Check-ins por Mês</h3>
              </div>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyHabits}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 12%)" />
                    <XAxis dataKey="name" tick={{ fill: "hsl(220 10% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(220 10% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="completados" stroke="hsl(153 100% 50%)" fill="hsl(153 100% 50%)" fillOpacity={0.1} strokeWidth={2} name="Check-ins" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ========== FINANCEIRO ========== */}
        <TabsContent value="financeiro" className="mt-4 space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<ArrowUpCircle className="h-4 w-4 text-primary" />} label="Receita Total" value={fmt(totalIncome)} bgIcon="bg-primary/10" />
            <StatCard icon={<ArrowDownCircle className="h-4 w-4 text-destructive" />} label="Despesas Totais" value={fmt(totalExpenses)} bgIcon="bg-destructive/10" />
            <StatCard icon={<DollarSign className="h-4 w-4 text-accent-foreground" />} label="Saldo" value={fmt(balance)} subColor={balance >= 0 ? "text-primary" : "text-destructive"} />
            <StatCard icon={<TrendingUp className="h-4 w-4 text-primary" />} label="Patrimônio Investido" value={fmt(totalInvested)} sub={totalDividends > 0 ? `${fmt(totalDividends)} em dividendos` : undefined} bgIcon="bg-primary/10" />
          </div>

          {/* Finance chart */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Receita vs Despesa Mensal</h3>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyFinance} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 12%)" />
                  <XAxis dataKey="name" tick={{ fill: "hsl(220 10% 55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(220 10% 55%)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmt(v)} />
                  <Bar dataKey="receita" fill="hsl(153 100% 50%)" radius={[4, 4, 0, 0]} name="Receita" />
                  <Bar dataKey="despesa" fill="hsl(0 72% 51%)" radius={[4, 4, 0, 0]} name="Despesa" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Saldo evolution */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Evolução do Saldo</h3>
              </div>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyFinance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 12%)" />
                    <XAxis dataKey="name" tick={{ fill: "hsl(220 10% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(220 10% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmt(v)} />
                    <Area type="monotone" dataKey="saldo" stroke="hsl(153 100% 50%)" fill="hsl(153 100% 50%)" fillOpacity={0.1} strokeWidth={2} name="Saldo" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category spending */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Gastos por Categoria</h3>
              </div>
              {categorySpending.length > 0 ? (
                <div className="space-y-3">
                  {categorySpending.slice(0, 6).map((cat, i) => {
                    const maxVal = categorySpending[0]?.value || 1;
                    const pct = Math.round((cat.value / maxVal) * 100);
                    return (
                      <div key={cat.name} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{cat.name}</span>
                          <span className="font-mono text-foreground">{fmt(cat.value)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Sem dados de gastos</p>
              )}
            </div>
          </div>

          {/* Financial health indicators */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Indicadores de Saúde Financeira</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: "Taxa de Economia", value: savingsRate, suffix: "%", status: savingsRate >= 20 ? "good" : savingsRate >= 10 ? "warning" : "bad", desc: savingsRate >= 20 ? "Excelente" : savingsRate >= 10 ? "Razoável" : "Precisa melhorar" },
                { label: "Transações Registradas", value: transactions.filter(t => !t.credit_card_id).length, suffix: "", status: "neutral", desc: `${incomeTxs.length} receitas, ${expenseTxs.length} despesas` },
                { label: "Ativos na Carteira", value: investments.length, suffix: "", status: "neutral", desc: totalInvested > 0 ? `Patrimônio: ${fmt(totalInvested)}` : "Nenhum investimento" },
              ].map((ind, i) => (
                <div key={i} className="p-4 rounded-lg bg-secondary/50 space-y-2">
                  <p className="text-xs text-muted-foreground">{ind.label}</p>
                  <p className={`text-2xl font-bold font-mono ${ind.status === "good" ? "text-primary" : ind.status === "warning" ? "text-yellow-400" : ind.status === "bad" ? "text-destructive" : "text-foreground"}`}>
                    {ind.value}{ind.suffix}
                  </p>
                  <p className="text-xs text-muted-foreground">{ind.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ========== METAS & SONHOS ========== */}
        <TabsContent value="metas" className="mt-4 space-y-6">
          {/* Goals KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<Target className="h-4 w-4 text-primary" />} label="Metas Ativas" value={goalsActive} bgIcon="bg-primary/10" />
            <StatCard icon={<CheckCircle2 className="h-4 w-4 text-primary" />} label="Metas Concluídas" value={goalsCompleted} bgIcon="bg-primary/10" />
            <StatCard icon={<Award className="h-4 w-4 text-yellow-400" />} label="Taxa de Sucesso" value={`${goalsSuccessRate}%`} bgIcon="bg-yellow-500/10" />
            <StatCard icon={<Star className="h-4 w-4 text-primary" />} label="Sonhos Realizados" value={`${dreamsCompleted}/${dreams.length}`} bgIcon="bg-primary/10" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Goals breakdown */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Detalhamento de Metas</h3>
              </div>
              {goals.length > 0 ? (
                <div className="space-y-3">
                  {goals.slice(0, 8).map((goal) => {
                    const pct = goal.target_value ? Math.round((Number(goal.current_value) / Number(goal.target_value)) * 100) : 0;
                    const isCompleted = goal.status === "completed";
                    return (
                      <div key={goal.id} className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm text-foreground truncate">{goal.name}</span>
                            {isCompleted && <Badge className="bg-primary/20 text-primary border-none text-xs shrink-0">✓</Badge>}
                          </div>
                          <span className={`text-xs font-mono font-bold shrink-0 ${isCompleted ? "text-primary" : "text-muted-foreground"}`}>{pct}%</span>
                        </div>
                        <Progress value={Math.min(pct, 100)} className={`h-1.5 ${isCompleted ? "[&>div]:bg-primary" : ""}`} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma meta registrada</p>
              )}
            </div>

            {/* Dreams breakdown */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Progresso dos Sonhos</h3>
              </div>
              {dreams.length > 0 ? (
                <div className="space-y-3">
                  {dreams.slice(0, 8).map((dream) => {
                    const pct = dream.target_amount ? Math.round((Number(dream.current_amount) / Number(dream.target_amount)) * 100) : 0;
                    const isCompleted = dream.status === "completed";
                    return (
                      <div key={dream.id} className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm text-foreground truncate">{dream.title}</span>
                            {isCompleted && <Badge className="bg-primary/20 text-primary border-none text-xs shrink-0">✨</Badge>}
                          </div>
                          <span className={`text-xs font-mono font-bold shrink-0 ${isCompleted ? "text-primary" : "text-muted-foreground"}`}>
                            {dream.target_amount ? `${pct}%` : "—"}
                          </span>
                        </div>
                        {dream.target_amount && <Progress value={Math.min(pct, 100)} className={`h-1.5 ${isCompleted ? "[&>div]:bg-primary" : ""}`} />}
                        {dream.target_amount && (
                          <p className="text-xs text-muted-foreground font-mono">{fmt(Number(dream.current_amount))} / {fmt(Number(dream.target_amount))}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum sonho registrado</p>
              )}
            </div>
          </div>

          {/* Total saved for dreams */}
          {dreams.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10"><Wallet className="h-5 w-5 text-primary" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Guardado para Sonhos</p>
                    <p className="text-2xl font-bold font-mono text-foreground">{fmt(totalDreamsSaved)}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">{dreamsActive} ativos • {dreamsCompleted} realizados</Badge>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
