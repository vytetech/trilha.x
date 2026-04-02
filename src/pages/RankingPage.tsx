import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, Medal, Zap, Crown, Shield, Star, Flame, Target, CheckCircle2,
  TrendingUp, Calendar, Sparkles, Award, DollarSign, PiggyBank,
  BookOpen, Rocket, Heart, Layers, Activity
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import GlobalLeaderboard from "@/components/ranking/GlobalLeaderboard";

interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  category: "produtividade" | "habitos" | "financeiro" | "metas" | "geral";
  check: (data: StatsData) => boolean;
  xp: number;
}

interface StatsData {
  tasksDone: number;
  totalHabitLogs: number;
  bestStreak: number;
  avgStreak: number;
  goalsCompleted: number;
  goalsActive: number;
  totalIncome: number;
  totalExpenses: number;
  investmentsCount: number;
  dreamsCompleted: number;
  totalDreamsSaved: number;
  level: number;
  xp: number;
  daysActive: number;
  habitsActive: number;
  totalTransactions: number;
}

const ACHIEVEMENTS: AchievementDef[] = [
  // Geral
  { id: "first_step", name: "Primeiro Passo", desc: "Criou sua conta no TRILHA", icon: "🎯", category: "geral", check: () => true, xp: 10 },
  { id: "level_5", name: "Evoluindo", desc: "Alcançou o nível 5", icon: "⬆️", category: "geral", check: (d) => d.level >= 5, xp: 50 },
  { id: "level_10", name: "Dedicado", desc: "Alcançou o nível 10", icon: "🌟", category: "geral", check: (d) => d.level >= 10, xp: 100 },
  { id: "level_25", name: "Veterano", desc: "Alcançou o nível 25", icon: "👑", category: "geral", check: (d) => d.level >= 25, xp: 250 },
  { id: "level_50", name: "Lendário", desc: "Alcançou o nível 50", icon: "🏛️", category: "geral", check: (d) => d.level >= 50, xp: 500 },

  // Produtividade
  { id: "tasks_10", name: "Executor", desc: "Concluiu 10 tarefas", icon: "✅", category: "produtividade", check: (d) => d.tasksDone >= 10, xp: 20 },
  { id: "tasks_50", name: "Máquina de Produção", desc: "Concluiu 50 tarefas", icon: "⚡", category: "produtividade", check: (d) => d.tasksDone >= 50, xp: 75 },
  { id: "tasks_100", name: "Executor Implacável", desc: "Concluiu 100 tarefas", icon: "💎", category: "produtividade", check: (d) => d.tasksDone >= 100, xp: 150 },
  { id: "tasks_500", name: "Lenda da Produtividade", desc: "Concluiu 500 tarefas", icon: "🔱", category: "produtividade", check: (d) => d.tasksDone >= 500, xp: 500 },

  // Hábitos
  { id: "habits_7", name: "Semana Forte", desc: "7 check-ins de hábitos", icon: "🔥", category: "habitos", check: (d) => d.totalHabitLogs >= 7, xp: 15 },
  { id: "habits_30", name: "Mês Disciplinado", desc: "30 check-ins de hábitos", icon: "💪", category: "habitos", check: (d) => d.totalHabitLogs >= 30, xp: 50 },
  { id: "habits_100", name: "Centurião", desc: "100 check-ins de hábitos", icon: "🛡️", category: "habitos", check: (d) => d.totalHabitLogs >= 100, xp: 100 },
  { id: "streak_7", name: "7 Dias Consistentes", desc: "Streak de 7 dias em algum hábito", icon: "🔗", category: "habitos", check: (d) => d.bestStreak >= 7, xp: 30 },
  { id: "streak_30", name: "Disciplina de Ferro", desc: "Streak de 30 dias", icon: "⛓️", category: "habitos", check: (d) => d.bestStreak >= 30, xp: 100 },
  { id: "streak_60", name: "Inabalável", desc: "Streak de 60 dias ininterrupto", icon: "🏔️", category: "habitos", check: (d) => d.bestStreak >= 60, xp: 200 },
  { id: "habits_5_active", name: "Multi-Hábitos", desc: "5 hábitos ativos simultaneamente", icon: "🎪", category: "habitos", check: (d) => d.habitsActive >= 5, xp: 30 },

  // Financeiro
  { id: "first_income", name: "Primeira Receita", desc: "Registrou sua primeira receita", icon: "💵", category: "financeiro", check: (d) => d.totalIncome > 0, xp: 10 },
  { id: "saver", name: "Poupador", desc: "Economizou mais de 20% da renda", icon: "🐷", category: "financeiro", check: (d) => d.totalIncome > 0 && ((d.totalIncome - d.totalExpenses) / d.totalIncome) >= 0.2, xp: 50 },
  { id: "investor", name: "Investidor Iniciante", desc: "Registrou primeiro investimento", icon: "📈", category: "financeiro", check: (d) => d.investmentsCount > 0, xp: 30 },
  { id: "investor_5", name: "Carteira Diversificada", desc: "5 investimentos na carteira", icon: "📊", category: "financeiro", check: (d) => d.investmentsCount >= 5, xp: 75 },
  { id: "transactions_50", name: "Controle Financeiro", desc: "50 transações registradas", icon: "📝", category: "financeiro", check: (d) => d.totalTransactions >= 50, xp: 40 },
  { id: "transactions_200", name: "Mestre das Finanças", desc: "200 transações registradas", icon: "🏦", category: "financeiro", check: (d) => d.totalTransactions >= 200, xp: 100 },

  // Metas
  { id: "goal_1", name: "Meta Concluída", desc: "Concluiu sua primeira meta", icon: "🏆", category: "metas", check: (d) => d.goalsCompleted >= 1, xp: 50 },
  { id: "goals_5", name: "Conquistador", desc: "Concluiu 5 metas", icon: "🎖️", category: "metas", check: (d) => d.goalsCompleted >= 5, xp: 100 },
  { id: "goals_10", name: "Imparável", desc: "Concluiu 10 metas", icon: "🚀", category: "metas", check: (d) => d.goalsCompleted >= 10, xp: 200 },
  { id: "dream_1", name: "Sonho Realizado", desc: "Realizou seu primeiro sonho", icon: "✨", category: "metas", check: (d) => d.dreamsCompleted >= 1, xp: 75 },
  { id: "dream_saver", name: "Guardião dos Sonhos", desc: "Guardou R$1.000+ para sonhos", icon: "💫", category: "metas", check: (d) => d.totalDreamsSaved >= 1000, xp: 50 },
  { id: "dream_saver_10k", name: "Grande Sonhador", desc: "Guardou R$10.000+ para sonhos", icon: "🌠", category: "metas", check: (d) => d.totalDreamsSaved >= 10000, xp: 150 },
];

const LEVEL_TITLES: { min: number; title: string; color: string }[] = [
  { min: 50, title: "Lenda", color: "text-yellow-400" },
  { min: 30, title: "Mestre", color: "text-purple-400" },
  { min: 20, title: "Especialista", color: "text-blue-400" },
  { min: 10, title: "Avançado", color: "text-primary" },
  { min: 5, title: "Intermediário", color: "text-primary" },
  { min: 0, title: "Iniciante", color: "text-muted-foreground" },
];

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode }> = {
  geral: { label: "Geral", icon: <Star className="h-4 w-4" /> },
  produtividade: { label: "Produtividade", icon: <Zap className="h-4 w-4" /> },
  habitos: { label: "Hábitos", icon: <Flame className="h-4 w-4" /> },
  financeiro: { label: "Financeiro", icon: <DollarSign className="h-4 w-4" /> },
  metas: { label: "Metas & Sonhos", icon: <Target className="h-4 w-4" /> },
};

export default function RankingPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<StatsData>({
    tasksDone: 0, totalHabitLogs: 0, bestStreak: 0, avgStreak: 0,
    goalsCompleted: 0, goalsActive: 0, totalIncome: 0, totalExpenses: 0,
    investmentsCount: 0, dreamsCompleted: 0, totalDreamsSaved: 0,
    level: 1, xp: 0, daysActive: 0, habitsActive: 0, totalTransactions: 0,
  });

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      const [profileRes, tasksRes, habitLogsRes, habitsRes, goalsRes, txRes, invRes, dreamsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("tasks").select("status").eq("user_id", user.id),
        supabase.from("habit_logs").select("id").eq("user_id", user.id),
        supabase.from("habits").select("streak, best_streak, is_active").eq("user_id", user.id),
        supabase.from("goals").select("status").eq("user_id", user.id),
        supabase.from("transactions").select("type, amount, credit_card_id").eq("user_id", user.id),
        supabase.from("investments").select("id").eq("user_id", user.id),
        supabase.from("dreams").select("status, current_amount, target_amount").eq("user_id", user.id),
      ]);

      if (profileRes.data) setProfile(profileRes.data);

      const tasksDone = tasksRes.data?.filter(t => t.status === "done").length || 0;
      const totalHabitLogs = habitLogsRes.data?.length || 0;
      const habitsData = habitsRes.data || [];
      const bestStreak = habitsData.reduce((max, h) => Math.max(max, h.best_streak || 0), 0);
      const avgStreak = habitsData.length > 0 ? Math.round(habitsData.reduce((a, h) => a + (h.streak || 0), 0) / habitsData.length) : 0;
      const habitsActive = habitsData.filter(h => h.is_active).length;
      const goalsData = goalsRes.data || [];
      const goalsCompleted = goalsData.filter(g => g.status === "completed").length;
      const goalsActive = goalsData.filter(g => g.status === "active").length;
      const txData = (txRes.data || []).filter(t => !t.credit_card_id);
      const totalIncome = txData.filter(t => t.type === "income").reduce((a, t) => a + Number(t.amount), 0);
      const totalExpenses = txData.filter(t => t.type === "expense").reduce((a, t) => a + Number(t.amount), 0);
      const dreamsData = dreamsRes.data || [];

      const daysActive = profileRes.data ? Math.ceil((Date.now() - new Date(profileRes.data.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0;

      setStats({
        tasksDone, totalHabitLogs, bestStreak, avgStreak, habitsActive,
        goalsCompleted, goalsActive, totalIncome, totalExpenses,
        investmentsCount: invRes.data?.length || 0,
        dreamsCompleted: dreamsData.filter(d => d.status === "completed").length,
        totalDreamsSaved: dreamsData.reduce((a, d) => a + Number(d.current_amount), 0),
        level: profileRes.data?.level || 1,
        xp: profileRes.data?.xp || 0,
        daysActive,
        totalTransactions: txData.length,
      });
    };
    fetchAll();
  }, [user]);

  const earnedAchievements = useMemo(() => ACHIEVEMENTS.filter(a => a.check(stats)), [stats]);
  const lockedAchievements = useMemo(() => ACHIEVEMENTS.filter(a => !a.check(stats)), [stats]);
  const totalAchXP = earnedAchievements.reduce((a, ach) => a + ach.xp, 0);

  const levelInfo = LEVEL_TITLES.find(l => (profile?.level || 1) >= l.min) || LEVEL_TITLES[LEVEL_TITLES.length - 1];
  const xpForNextLevel = (profile?.level || 1) * 100;
  const xpInLevel = (profile?.xp || 0) % xpForNextLevel;
  const xpProgress = Math.round((xpInLevel / xpForNextLevel) * 100);

  // Next milestone
  const nextAchievement = lockedAchievements[0];

  // Category stats
  const categoryStats = useMemo(() => {
    const cats = ["geral", "produtividade", "habitos", "financeiro", "metas"] as const;
    return cats.map(cat => {
      const total = ACHIEVEMENTS.filter(a => a.category === cat).length;
      const earned = earnedAchievements.filter(a => a.category === cat).length;
      return { category: cat, total, earned, pct: total > 0 ? Math.round((earned / total) * 100) : 0 };
    });
  }, [earnedAchievements]);

  const [rankingTab, setRankingTab] = useState("pessoal");

  return (
    <div className="space-y-6 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" /> Ranking
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Acompanhe sua evolução e compete com outros jogadores</p>
      </motion.div>

      <Tabs value={rankingTab} onValueChange={setRankingTab}>
        <TabsList className="bg-secondary border border-border mb-4">
          <TabsTrigger value="pessoal" className="flex items-center gap-1.5">
            <Star className="h-4 w-4" /> Pessoal
          </TabsTrigger>
          <TabsTrigger value="global" className="flex items-center gap-1.5">
            <Crown className="h-4 w-4" /> Ranking Global
          </TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="mt-0">
          <GlobalLeaderboard />
        </TabsContent>

        <TabsContent value="pessoal" className="mt-0 space-y-6">

      {/* Profile Hero Card */}
      {profile && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-xl border border-primary/20 bg-gradient-to-br from-card to-primary/5 p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Avatar & Level */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-primary/30">
                  <Crown className="h-10 w-10 text-primary" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-card border border-border rounded-full px-2 py-0.5">
                  <span className="text-xs font-bold text-primary">{profile.level}</span>
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{profile.full_name || "Usuário"}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-primary/20 text-primary border-none">{levelInfo.title}</Badge>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Zap className="h-3 w-3 text-primary" /> {profile.xp} XP
                  </span>
                </div>
              </div>
            </div>

            {/* XP Progress */}
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Nível {profile.level}</span>
                <span>Nível {profile.level + 1}</span>
              </div>
              <Progress value={xpProgress} className="h-3" />
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{xpInLevel} / {xpForNextLevel} XP</span>
                <span className="text-primary font-medium">{xpProgress}%</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-lg bg-card border border-border">
                <p className="text-lg font-bold text-primary">{earnedAchievements.length}</p>
                <p className="text-xs text-muted-foreground">Conquistas</p>
              </div>
              <div className="p-3 rounded-lg bg-card border border-border">
                <p className="text-lg font-bold text-foreground">{stats.daysActive}</p>
                <p className="text-xs text-muted-foreground">Dias Ativo</p>
              </div>
              <div className="p-3 rounded-lg bg-card border border-border">
                <p className="text-lg font-bold text-foreground font-mono">{totalAchXP}</p>
                <p className="text-xs text-muted-foreground">XP Conquistas</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { icon: <CheckCircle2 className="h-4 w-4 text-primary" />, label: "Tarefas", value: stats.tasksDone },
          { icon: <Flame className="h-4 w-4 text-primary" />, label: "Hábitos", value: stats.totalHabitLogs },
          { icon: <Target className="h-4 w-4 text-primary" />, label: "Metas", value: `${stats.goalsCompleted}/${stats.goalsActive + stats.goalsCompleted}` },
          { icon: <TrendingUp className="h-4 w-4 text-primary" />, label: "Melhor Streak", value: `${stats.bestStreak}d` },
          { icon: <Award className="h-4 w-4 text-primary" />, label: "Investimentos", value: stats.investmentsCount },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.03 }}
            className="rounded-xl border border-border bg-card p-3 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">{s.icon}</div>
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="font-bold text-foreground text-sm font-mono">{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Next achievement hint */}
      {nextAchievement && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 flex items-center gap-4">
          <div className="text-3xl opacity-50">{nextAchievement.icon}</div>
          <div className="flex-1">
            <p className="text-xs text-primary font-medium">Próxima Conquista</p>
            <p className="font-semibold text-foreground">{nextAchievement.name}</p>
            <p className="text-xs text-muted-foreground">{nextAchievement.desc}</p>
          </div>
          <Badge variant="outline" className="text-primary border-primary/30">+{nextAchievement.xp} XP</Badge>
        </motion.div>
      )}

      {/* Achievements */}
      <Tabs defaultValue="todas">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Medal className="h-5 w-5 text-primary" /> Conquistas
            <Badge variant="outline" className="text-xs">{earnedAchievements.length}/{ACHIEVEMENTS.length}</Badge>
          </h2>
        </div>
        <TabsList className="bg-secondary border border-border mb-4">
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="produtividade">Produtividade</TabsTrigger>
          <TabsTrigger value="habitos">Hábitos</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="metas">Metas</TabsTrigger>
        </TabsList>

        {["todas", "produtividade", "habitos", "financeiro", "metas"].map(tab => (
          <TabsContent key={tab} value={tab} className="mt-0 space-y-3">
            {(() => {
              const filtered = tab === "todas" ? ACHIEVEMENTS : ACHIEVEMENTS.filter(a => a.category === tab);
              const earned = filtered.filter(a => a.check(stats));
              const locked = filtered.filter(a => !a.check(stats));
              return (
                <>
                  {earned.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-primary font-medium flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Desbloqueadas ({earned.length})</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {earned.map((ach, i) => (
                          <motion.div key={ach.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                            className="p-4 rounded-xl border border-primary/20 bg-primary/5 hover:border-primary/40 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{ach.icon}</span>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground text-sm">{ach.name}</p>
                                <p className="text-xs text-muted-foreground">{ach.desc}</p>
                              </div>
                              <Badge className="bg-primary/20 text-primary border-none text-xs shrink-0">+{ach.xp} XP</Badge>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                  {locked.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-medium flex items-center gap-1"><Shield className="h-3 w-3" /> Bloqueadas ({locked.length})</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {locked.map((ach, i) => (
                          <motion.div key={ach.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                            className="p-4 rounded-xl border border-border bg-card/50 opacity-50 hover:opacity-70 transition-opacity">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl grayscale">{ach.icon}</span>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-muted-foreground text-sm">{ach.name}</p>
                                <p className="text-xs text-muted-foreground">{ach.desc}</p>
                              </div>
                              <Badge variant="outline" className="text-xs shrink-0 text-muted-foreground">+{ach.xp} XP</Badge>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                  {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">Nenhuma conquista nesta categoria</p>}
                </>
              );
            })()}
          </TabsContent>
        ))}
      </Tabs>

      {/* Category Progress */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" /> Progresso por Categoria
        </h3>
        <div className="space-y-4">
          {categoryStats.map((cat) => (
            <div key={cat.category} className="space-y-1.5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-primary">{CATEGORY_META[cat.category].icon}</span>
                  <span className="text-foreground font-medium">{CATEGORY_META[cat.category].label}</span>
                </div>
                <span className="text-xs font-mono text-muted-foreground">{cat.earned}/{cat.total}</span>
              </div>
              <Progress value={cat.pct} className="h-2" />
            </div>
          ))}
        </div>
      </div>

      {/* How to earn XP */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" /> Como Ganhar XP
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { icon: "⚡", text: "Concluir tarefas", xp: "+10 XP" },
            { icon: "🔥", text: "Completar hábitos", xp: "+5 XP" },
            { icon: "🎯", text: "Atingir metas", xp: "+50 XP" },
            { icon: "💰", text: "Registrar transações", xp: "+2 XP" },
            { icon: "📈", text: "Realizar aportes", xp: "+10 XP" },
            { icon: "🏆", text: "Desbloquear conquistas", xp: "Variável" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/50">
              <span className="text-sm text-muted-foreground">{item.icon} {item.text}</span>
              <Badge variant="outline" className="text-xs text-primary border-primary/20">{item.xp}</Badge>
            </div>
          ))}
        </div>
      </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
