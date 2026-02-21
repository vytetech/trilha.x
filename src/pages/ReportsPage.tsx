import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, Zap, Flame, Target, Wallet, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, LineChart, Line } from "recharts";

export default function ReportsPage() {
  const { user } = useAuth();
  const [tasksDone, setTasksDone] = useState(0);
  const [habitsCompleted, setHabitsCompleted] = useState(0);
  const [goalsCompleted, setGoalsCompleted] = useState(0);
  const [goalsActive, setGoalsActive] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalInvested, setTotalInvested] = useState(0);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      const [tasksRes, habitsRes, goalsRes, txRes, invRes, profileRes] = await Promise.all([
        supabase.from("tasks").select("id", { count: "exact" }).eq("user_id", user.id).eq("status", "done"),
        supabase.from("habit_logs").select("id", { count: "exact" }).eq("user_id", user.id),
        supabase.from("goals").select("status").eq("user_id", user.id),
        supabase.from("transactions").select("type, amount").eq("user_id", user.id),
        supabase.from("investments").select("quantity, current_price").eq("user_id", user.id),
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      ]);
      setTasksDone(tasksRes.count || 0);
      setHabitsCompleted(habitsRes.count || 0);
      if (goalsRes.data) {
        setGoalsCompleted(goalsRes.data.filter((g) => g.status === "completed").length);
        setGoalsActive(goalsRes.data.filter((g) => g.status === "active").length);
      }
      if (txRes.data) {
        setTotalIncome(txRes.data.filter((t) => t.type === "income").reduce((a, t) => a + Number(t.amount), 0));
        setTotalExpenses(txRes.data.filter((t) => t.type === "expense").reduce((a, t) => a + Number(t.amount), 0));
      }
      if (invRes.data) setTotalInvested(invRes.data.reduce((a, i) => a + Number(i.quantity) * Number(i.current_price), 0));
      if (profileRes.data) setProfile(profileRes.data);
    };
    fetchAll();
  }, [user]);

  const radarData = [
    { attr: "Foco", value: Math.min(tasksDone * 5, 100) },
    { attr: "Disciplina", value: Math.min(habitsCompleted * 2, 100) },
    { attr: "Mental", value: Math.min((goalsCompleted + goalsActive) * 10, 100) },
    { attr: "Financeiro", value: totalIncome > 0 ? Math.min(Math.round(((totalIncome - totalExpenses) / totalIncome) * 100), 100) : 0 },
    { attr: "Produtividade", value: Math.min((tasksDone + habitsCompleted) * 3, 100) },
    { attr: "Consistência", value: Math.min(habitsCompleted, 100) },
  ];

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><BarChart3 className="h-6 w-6 text-primary" /> Relatórios</h1>
        <p className="text-sm text-muted-foreground mt-1">Análise completa da sua evolução</p>
      </motion.div>

      <Tabs defaultValue="geral">
        <TabsList className="bg-secondary border border-border">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="produtividade">Produtividade</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="metas">Metas</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-card p-4 text-center"><p className="text-2xl font-bold neon-text">{profile?.level || 1}</p><p className="text-xs text-muted-foreground">Nível</p></div>
            <div className="rounded-xl border border-border bg-card p-4 text-center"><p className="text-2xl font-bold text-foreground">{profile?.xp || 0}</p><p className="text-xs text-muted-foreground">XP Total</p></div>
            <div className="rounded-xl border border-border bg-card p-4 text-center"><p className="text-2xl font-bold text-foreground">{tasksDone}</p><p className="text-xs text-muted-foreground">Tarefas feitas</p></div>
            <div className="rounded-xl border border-border bg-card p-4 text-center"><p className="text-2xl font-bold text-foreground">{habitsCompleted}</p><p className="text-xs text-muted-foreground">Hábitos concluídos</p></div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground mb-4">Radar de Atributos</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(220,14%,14%)" />
                  <PolarAngleAxis dataKey="attr" tick={{ fill: "hsl(220,10%,50%)", fontSize: 12 }} />
                  <Radar dataKey="value" stroke="hsl(153,100%,50%)" fill="hsl(153,100%,50%)" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="produtividade" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-card p-4 text-center"><Flame className="h-6 w-6 text-primary mx-auto mb-2" /><p className="text-2xl font-bold text-foreground">{tasksDone}</p><p className="text-xs text-muted-foreground">Tarefas concluídas</p></div>
            <div className="rounded-xl border border-border bg-card p-4 text-center"><Zap className="h-6 w-6 text-primary mx-auto mb-2" /><p className="text-2xl font-bold text-foreground">{habitsCompleted}</p><p className="text-xs text-muted-foreground">Hábitos completados</p></div>
            <div className="rounded-xl border border-border bg-card p-4 text-center"><Target className="h-6 w-6 text-primary mx-auto mb-2" /><p className="text-2xl font-bold text-foreground">{goalsCompleted}</p><p className="text-xs text-muted-foreground">Metas alcançadas</p></div>
          </div>
        </TabsContent>

        <TabsContent value="financeiro" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground mb-1">Receita total</p><p className="text-lg font-bold text-primary font-mono">{fmt(totalIncome)}</p></div>
            <div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground mb-1">Despesas totais</p><p className="text-lg font-bold text-destructive font-mono">{fmt(totalExpenses)}</p></div>
            <div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground mb-1">Saldo</p><p className={`text-lg font-bold font-mono ${totalIncome - totalExpenses >= 0 ? "text-primary" : "text-destructive"}`}>{fmt(totalIncome - totalExpenses)}</p></div>
            <div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground mb-1">Patrimônio investido</p><p className="text-lg font-bold neon-text font-mono">{fmt(totalInvested)}</p></div>
          </div>
        </TabsContent>

        <TabsContent value="metas" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-card p-4 text-center"><p className="text-2xl font-bold text-foreground">{goalsActive}</p><p className="text-xs text-muted-foreground">Metas ativas</p></div>
            <div className="rounded-xl border border-border bg-card p-4 text-center"><p className="text-2xl font-bold neon-text">{goalsCompleted}</p><p className="text-xs text-muted-foreground">Metas concluídas</p></div>
            <div className="rounded-xl border border-border bg-card p-4 text-center"><p className="text-2xl font-bold text-foreground">{goalsActive + goalsCompleted > 0 ? Math.round((goalsCompleted / (goalsActive + goalsCompleted)) * 100) : 0}%</p><p className="text-xs text-muted-foreground">Taxa de sucesso</p></div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
