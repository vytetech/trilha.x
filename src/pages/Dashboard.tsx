import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Wallet, Target, CheckSquare, TrendingUp, Zap, Flame } from "lucide-react";
import StatCard from "@/components/StatCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const { user } = useAuth();
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

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    const now = new Date();
    const startMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    const fetchAll = async () => {
      const [profileRes, tasksDoneRes, tasksPendRes, habitsRes, logsRes, txRes, invRes, goalsRes, mainGoalRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("tasks").select("id", { count: "exact" }).eq("user_id", user.id).eq("status", "done"),
        supabase.from("tasks").select("id", { count: "exact" }).eq("user_id", user.id).neq("status", "done"),
        supabase.from("habits").select("id, streak", { count: "exact" }).eq("user_id", user.id).eq("is_active", true),
        supabase.from("habit_logs").select("id", { count: "exact" }).eq("user_id", user.id).eq("completed_at", today),
        supabase.from("transactions").select("type, amount").eq("user_id", user.id).gte("transaction_date", startMonth),
        supabase.from("investments").select("quantity, current_price").eq("user_id", user.id),
        supabase.from("goals").select("status").eq("user_id", user.id),
        supabase.from("goals").select("*").eq("user_id", user.id).eq("is_main", true).single(),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      setTasksDone(tasksDoneRes.count || 0);
      setTasksPending(tasksPendRes.count || 0);
      if (habitsRes.data) {
        setTotalHabits(habitsRes.data.length);
        const maxStreak = habitsRes.data.reduce((max, h) => Math.max(max, h.streak || 0), 0);
        setStreak(maxStreak);
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
    };
    fetchAll();
  }, [user]);

  const xp = profile?.xp || 0;
  const level = profile?.level || 1;
  const nextLevelXP = level * 100;
  const xpProgress = (xp / nextLevelXP) * 100;
  const balance = income - expenses;
  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const radarData = [
    { attr: "Foco", value: Math.min(tasksDone * 5, 100) },
    { attr: "Disciplina", value: Math.min(habitsToday * 20, 100) },
    { attr: "Mental", value: Math.min((goalsActive + goalsCompleted) * 10, 100) },
    { attr: "Financeiro", value: income > 0 ? Math.min(Math.round(((income - expenses) / income) * 100), 100) : 0 },
    { attr: "Produtividade", value: Math.min((tasksDone + habitsToday) * 5, 100) },
    { attr: "Consistência", value: Math.min(streak * 5, 100) },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground">
          <span className="neon-text">{name.split(" ")[0]}</span>, continue crescendo 🚀
        </h1>
        <p className="text-muted-foreground mt-1">Aqui está seu resumo de hoje</p>
      </motion.div>

      {/* XP Bar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Nível {level}</span>
            <span className="text-sm text-muted-foreground">• {xp} XP</span>
          </div>
          <span className="text-sm text-muted-foreground">Próximo nível: {nextLevelXP} XP</span>
        </div>
        <Progress value={xpProgress} className="h-2" />
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Saldo do mês" value={fmt(balance)} icon={Wallet} trend={balance >= 0 ? "Positivo" : "Negativo"} trendUp={balance >= 0} />
        <StatCard title="Metas ativas" value={String(goalsActive)} icon={Target} subtitle={`${goalsCompleted} concluídas`} />
        <StatCard title="Tarefas hoje" value={String(tasksDone)} icon={CheckSquare} subtitle={`${tasksPending} pendentes`} />
        <StatCard title="Streak" value={`${streak} dias`} icon={Flame} subtitle={`${habitsToday}/${totalHabits} hábitos hoje`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Radar */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold text-foreground mb-3">Radar de Atributos</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(220,14%,14%)" />
                <PolarAngleAxis dataKey="attr" tick={{ fill: "hsl(220,10%,50%)", fontSize: 11 }} />
                <Radar dataKey="value" stroke="hsl(153,100%,50%)" fill="hsl(153,100%,50%)" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Quick info */}
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Investimentos</h3>
            <div className="text-3xl font-bold font-mono text-foreground">{fmt(invested)}</div>
            <p className="text-sm text-muted-foreground mt-1">Patrimônio investido</p>
          </motion.div>

          {mainGoal ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> {mainGoal.name}</h3>
              <Progress value={mainGoal.target_value > 0 ? (mainGoal.current_value / mainGoal.target_value) * 100 : 0} className="h-2" />
              <span className="text-xs text-muted-foreground mt-1 block">{mainGoal.target_value > 0 ? Math.round((mainGoal.current_value / mainGoal.target_value) * 100) : 0}% concluído</span>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Próxima meta</h3>
              <p className="text-sm text-muted-foreground">Defina uma meta principal para acompanhar aqui.</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
