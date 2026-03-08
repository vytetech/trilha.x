import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet, Target, CheckSquare, TrendingUp, Zap, Flame, Trophy,
  ArrowUpRight, ArrowDownRight, BarChart3, Sparkles, Calendar,
  ListChecks, Repeat, Star, ChevronRight
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const name = user?.user_metadata?.full_name || "Usuário";
  const [profile, setProfile] = useState<any>(null);
  const [tasksDone, setTasksDone] = useState(0);
  const [tasksPending, setTasksPending] = useState(0);
  const [habitsToday, setHabitsToday] = useState(0);
  const [totalHabits, setTotalHabits] = useState(0);
  const [streak, setStreak] = useState(0);
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [invested, setInvested] = useState(0);
  const [goalsActive, setGoalsActive] = useState(0);
  const [goalsCompleted, setGoalsCompleted] = useState(0);
  const [mainGoal, setMainGoal] = useState<any>(null);
  const [achievements, setAchievements] = useState(0);

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    const now = new Date();
    const startMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    const fetchAll = async () => {
      const [profileRes, tasksDoneRes, tasksPendRes, habitsRes, logsRes, txRes, invRes, goalsRes, mainGoalRes, achieveRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("tasks").select("id", { count: "exact" }).eq("user_id", user.id).eq("status", "done"),
        supabase.from("tasks").select("id", { count: "exact" }).eq("user_id", user.id).neq("status", "done"),
        supabase.from("habits").select("id, streak", { count: "exact" }).eq("user_id", user.id).eq("is_active", true),
        supabase.from("habit_logs").select("id", { count: "exact" }).eq("user_id", user.id).eq("completed_at", today),
        supabase.from("transactions").select("type, amount").eq("user_id", user.id).gte("transaction_date", startMonth),
        supabase.from("investments").select("quantity, current_price").eq("user_id", user.id),
        supabase.from("goals").select("status").eq("user_id", user.id),
        supabase.from("goals").select("*").eq("user_id", user.id).eq("is_main", true).single(),
        supabase.from("achievements").select("id", { count: "exact" }).eq("user_id", user.id),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      setTasksDone(tasksDoneRes.count || 0);
      setTasksPending(tasksPendRes.count || 0);
      if (habitsRes.data) {
        setTotalHabits(habitsRes.data.length);
        setStreak(habitsRes.data.reduce((max, h) => Math.max(max, h.streak || 0), 0));
      }
      setHabitsToday(logsRes.count || 0);
      if (txRes.data) {
        setIncome(txRes.data.filter((t) => t.type === "income").reduce((a, t) => a + Number(t.amount), 0));
        setExpenses(txRes.data.filter((t) => t.type === "expense").reduce((a, t) => a + Number(t.amount), 0));
      }
      if (invRes.data) setInvested(invRes.data.reduce((a, i) => a + Number(i.quantity) * Number(i.current_price), 0));
      if (goalsRes.data) {
        setGoalsActive(goalsRes.data.filter((g) => g.status === "active").length);
        setGoalsCompleted(goalsRes.data.filter((g) => g.status === "completed").length);
      }
      if (mainGoalRes.data) setMainGoal(mainGoalRes.data);
      setAchievements(achieveRes.count || 0);
    };
    fetchAll();
  }, [user]);

  const xp = profile?.xp || 0;
  const level = profile?.level || 1;
  const nextLevelXP = level * 100;
  const xpProgress = (xp / nextLevelXP) * 100;
  const balance = income - expenses;
  const savingsRate = income > 0 ? Math.round(((income - expenses) / income) * 100) : 0;
  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  const habitsProgress = totalHabits > 0 ? Math.round((habitsToday / totalHabits) * 100) : 0;

  const radarData = [
    { attr: "Foco", value: Math.min(tasksDone * 5, 100), fullMark: 100 },
    { attr: "Disciplina", value: Math.min(habitsToday * 20, 100), fullMark: 100 },
    { attr: "Mental", value: Math.min((goalsActive + goalsCompleted) * 10, 100), fullMark: 100 },
    { attr: "Financeiro", value: income > 0 ? Math.min(savingsRate, 100) : 0, fullMark: 100 },
    { attr: "Produtividade", value: Math.min((tasksDone + habitsToday) * 5, 100), fullMark: 100 },
    { attr: "Consistência", value: Math.min(streak * 5, 100), fullMark: 100 },
  ];

  const overallScore = Math.round(radarData.reduce((a, d) => a + d.value, 0) / radarData.length);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Hero Header */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{greeting()},</p>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mt-0.5">
              <span className="text-primary">{name.split(" ")[0]}</span>, continue crescendo 🚀
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Level badge */}
            <div className="flex items-center gap-3 bg-secondary/80 rounded-xl border border-border px-4 py-2.5">
              <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center border-2 border-primary/30">
                <span className="text-primary font-bold text-sm">{level}</span>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Nível</p>
                <div className="flex items-center gap-2">
                  <Progress value={xpProgress} className="h-1.5 w-20" />
                  <span className="text-[10px] font-mono text-muted-foreground">{xp}/{nextLevelXP}</span>
                </div>
              </div>
            </div>
            {/* Score */}
            <div className="hidden sm:flex items-center gap-2 bg-secondary/80 rounded-xl border border-border px-4 py-2.5">
              <Sparkles className="h-4 w-4 text-primary" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Score</p>
                <p className="font-bold text-foreground font-mono text-sm">{overallScore}%</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            icon: <Wallet className="h-4 w-4" />, label: "Saldo do Mês", value: fmt(balance),
            trend: balance >= 0 ? "Positivo" : "Negativo", trendUp: balance >= 0,
            iconColor: "text-primary", bg: "bg-primary/10",
            onClick: () => navigate("/finance"),
          },
          {
            icon: <TrendingUp className="h-4 w-4" />, label: "Investimentos", value: fmt(invested),
            trend: invested > 0 ? "Ativo" : "Sem posição", trendUp: invested > 0,
            iconColor: "text-primary", bg: "bg-primary/10",
            onClick: () => navigate("/investments"),
          },
          {
            icon: <CheckSquare className="h-4 w-4" />, label: "Tarefas Hoje", value: `${tasksDone}`,
            trend: `${tasksPending} pendentes`, trendUp: true,
            iconColor: "text-primary", bg: "bg-primary/10",
            onClick: () => navigate("/tasks"),
          },
          {
            icon: <Flame className="h-4 w-4" />, label: "Streak", value: `${streak}d`,
            trend: `${habitsToday}/${totalHabits} hábitos`, trendUp: streak > 0,
            iconColor: "text-orange-400", bg: "bg-orange-400/10",
            onClick: () => navigate("/habits"),
          },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.04 }}
            onClick={s.onClick}
            className="rounded-xl border border-border bg-card p-4 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer group">
            <div className="flex items-start justify-between mb-3">
              <div className={cn("p-2 rounded-lg", s.bg)}>
                <span className={s.iconColor}>{s.icon}</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors" />
            </div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className="text-xl font-bold text-foreground font-mono mt-0.5 leading-tight">{s.value}</p>
            <p className={cn("text-[10px] mt-1 flex items-center gap-1", s.trendUp ? "text-primary" : "text-destructive")}>
              {s.trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {s.trend}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Radar - takes 2 cols */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="lg:col-span-2 rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Radar de Atributos
            </h3>
            <Badge variant="outline" className="text-[10px] font-mono">{overallScore}% geral</Badge>
          </div>
          <div className="p-5 flex items-center gap-4">
            <div className="flex-1 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%">
                  <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.6} />
                  <PolarAngleAxis dataKey="attr" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 500 }} />
                  <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="hidden md:flex flex-col gap-2 w-36">
              {radarData.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{d.attr}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-12 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${d.value}%` }} />
                    </div>
                    <span className="font-mono text-foreground w-7 text-right">{d.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right column - stacked cards */}
        <div className="space-y-4">
          {/* Habits progress */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            onClick={() => navigate("/habits")}
            className="rounded-xl border border-border bg-card p-5 hover:border-primary/20 transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Repeat className="h-4 w-4 text-primary" /> Hábitos de Hoje
              </h3>
              <span className="text-xs font-mono text-muted-foreground">{habitsToday}/{totalHabits}</span>
            </div>
            <Progress value={habitsProgress} className="h-2 mb-2" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">{habitsProgress}% concluído</span>
              {habitsProgress === 100 && totalHabits > 0 && (
                <span className="text-[10px] text-primary font-semibold flex items-center gap-1">
                  <Star className="h-3 w-3" /> Dia perfeito!
                </span>
              )}
            </div>
          </motion.div>

          {/* Main Goal */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            onClick={() => navigate("/goals")}
            className="rounded-xl border border-border bg-card p-5 hover:border-primary/20 transition-all cursor-pointer">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-primary" /> {mainGoal ? mainGoal.name : "Meta Principal"}
            </h3>
            {mainGoal ? (
              <>
                <Progress value={mainGoal.target_value > 0 ? (mainGoal.current_value / mainGoal.target_value) * 100 : 0} className="h-2 mb-2" />
                <span className="text-[10px] text-muted-foreground">
                  {mainGoal.target_value > 0 ? Math.round((mainGoal.current_value / mainGoal.target_value) * 100) : 0}% concluído
                </span>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Defina uma meta principal em Metas</p>
            )}
          </motion.div>

          {/* Achievements */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
              <Trophy className="h-4 w-4 text-yellow-400" /> Conquistas
            </h3>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-foreground">{achievements}</span>
              <span className="text-[10px] text-muted-foreground">desbloqueadas</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Financial Summary */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border/50">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" /> Resumo Financeiro do Mês
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border/30">
          {[
            { label: "Receitas", value: fmt(income), color: "text-primary", icon: <ArrowUpRight className="h-3.5 w-3.5" /> },
            { label: "Despesas", value: fmt(expenses), color: "text-destructive", icon: <ArrowDownRight className="h-3.5 w-3.5" /> },
            { label: "Economia", value: `${savingsRate}%`, color: savingsRate >= 0 ? "text-primary" : "text-destructive", icon: <TrendingUp className="h-3.5 w-3.5" /> },
            { label: "Investido", value: fmt(invested), color: "text-foreground", icon: <BarChart3 className="h-3.5 w-3.5" /> },
          ].map((item, i) => (
            <div key={i} className="p-5 text-center">
              <div className={cn("flex items-center justify-center gap-1 mb-1", item.color)}>
                {item.icon}
              </div>
              <p className={cn("text-lg md:text-xl font-bold font-mono", item.color)}>{item.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
