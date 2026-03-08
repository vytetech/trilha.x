import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Repeat, Plus, Flame, Trash2, Zap, Pencil, CheckCircle2, Trophy,
  Target, TrendingUp, Calendar, Award, Sparkles, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Habit {
  id: string;
  name: string;
  description: string | null;
  frequency: string;
  attribute: string | null;
  xp_reward: number;
  streak: number;
  best_streak: number;
  is_active: boolean;
  created_at: string;
}

const attrConfig: Record<string, { label: string; emoji: string; color: string; bg: string }> = {
  focus: { label: "Foco", emoji: "🎯", color: "text-blue-400", bg: "bg-blue-400/10" },
  discipline: { label: "Disciplina", emoji: "⛓️", color: "text-primary", bg: "bg-primary/10" },
  mental: { label: "Mental", emoji: "🧠", color: "text-purple-400", bg: "bg-purple-400/10" },
  financial: { label: "Financeiro", emoji: "💰", color: "text-yellow-400", bg: "bg-yellow-500/10" },
  productivity: { label: "Produtividade", emoji: "⚡", color: "text-orange-400", bg: "bg-orange-400/10" },
  consistency: { label: "Consistência", emoji: "🔗", color: "text-cyan-400", bg: "bg-cyan-400/10" },
  physical: { label: "Físico", emoji: "💪", color: "text-red-400", bg: "bg-red-400/10" },
  social: { label: "Social", emoji: "👥", color: "text-pink-400", bg: "bg-pink-400/10" },
};

const freqLabels: Record<string, string> = {
  daily: "Diário", weekdays: "Dias úteis", weekly: "Semanal", custom: "Personalizado",
};

export default function HabitsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [attribute, setAttribute] = useState("productivity");
  const [frequency, setFrequency] = useState("daily");
  const [xp, setXp] = useState("5");
  const [xpPopup, setXpPopup] = useState<{ amount: number; id: string } | null>(null);
  const [weekLogs, setWeekLogs] = useState<Record<string, string[]>>({});

  const fetchData = async () => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];

    // Get week range for heatmap
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    const weekStartStr = weekStart.toISOString().split("T")[0];

    const [habitsRes, logsRes, weekLogsRes] = await Promise.all([
      supabase.from("habits").select("*").eq("user_id", user.id).order("created_at"),
      supabase.from("habit_logs").select("habit_id").eq("user_id", user.id).eq("completed_at", today),
      supabase.from("habit_logs").select("habit_id, completed_at").eq("user_id", user.id).gte("completed_at", weekStartStr).lte("completed_at", today),
    ]);
    if (habitsRes.data) setHabits(habitsRes.data);
    if (logsRes.data) setCompletedToday(new Set(logsRes.data.map((l) => l.habit_id)));
    if (weekLogsRes.data) {
      const map: Record<string, string[]> = {};
      weekLogsRes.data.forEach(l => {
        if (!map[l.habit_id]) map[l.habit_id] = [];
        map[l.habit_id].push(l.completed_at);
      });
      setWeekLogs(map);
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  const createHabit = async () => {
    if (!user || !name.trim()) return;
    await supabase.from("habits").insert({ user_id: user.id, name, description: description || null, attribute, frequency, xp_reward: Number(xp) || 5 });
    setName(""); setDescription(""); setAttribute("productivity"); setFrequency("daily"); setXp("5");
    setDialogOpen(false);
    fetchData();
    toast({ title: "Hábito criado! 🎯" });
  };

  const saveEdit = async () => {
    if (!editingHabit) return;
    await supabase.from("habits").update({
      name: editingHabit.name, description: editingHabit.description,
      attribute: editingHabit.attribute, frequency: editingHabit.frequency,
      xp_reward: editingHabit.xp_reward, is_active: editingHabit.is_active,
    }).eq("id", editingHabit.id);
    setEditDialog(false);
    setEditingHabit(null);
    fetchData();
    toast({ title: "Hábito atualizado! ✏️" });
  };

  const addXpToProfile = async (xpAmount: number) => {
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("xp, level").eq("user_id", user.id).single();
    if (profile) {
      let newXp = profile.xp + xpAmount;
      let newLevel = profile.level;
      while (newXp >= newLevel * 100) { newXp -= newLevel * 100; newLevel++; }
      await supabase.from("profiles").update({ xp: newXp, level: newLevel }).eq("user_id", user.id);
    }
  };

  const toggleHabit = async (habitId: string) => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    const habit = habits.find((h) => h.id === habitId);
    if (completedToday.has(habitId)) {
      await supabase.from("habit_logs").delete().eq("habit_id", habitId).eq("completed_at", today);
      if (habit) await supabase.from("habits").update({ streak: Math.max(0, habit.streak - 1) }).eq("id", habitId);
    } else {
      await supabase.from("habit_logs").insert({ user_id: user.id, habit_id: habitId, completed_at: today, xp_earned: habit?.xp_reward || 5 });
      if (habit) {
        const newStreak = habit.streak + 1;
        await supabase.from("habits").update({ streak: newStreak, best_streak: Math.max(newStreak, habit.best_streak) }).eq("id", habitId);
      }
      await addXpToProfile(habit?.xp_reward || 5);
      setXpPopup({ amount: habit?.xp_reward || 5, id: habitId });
      setTimeout(() => setXpPopup(null), 1500);
    }
    fetchData();
  };

  const deleteHabit = async (id: string) => {
    await supabase.from("habits").delete().eq("id", id);
    fetchData();
    toast({ title: "Hábito removido" });
  };

  const activeHabits = habits.filter(h => h.is_active);
  const inactiveHabits = habits.filter(h => !h.is_active);
  const completed = activeHabits.filter(h => completedToday.has(h.id)).length;
  const total = activeHabits.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;
  const totalStreak = habits.reduce((a, h) => a + h.streak, 0);
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.best_streak), 0);
  const totalXpToday = activeHabits.filter(h => completedToday.has(h.id)).reduce((a, h) => a + h.xp_reward, 0);

  // Week days for heatmap
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    return { date: d.toISOString().split("T")[0], label: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][d.getDay()], isToday: i === 6 };
  });

  const HabitFormFields = ({ values, onChange }: { values: any; onChange: (v: any) => void }) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nome do hábito</Label>
        <Input value={values.name} onChange={(e) => onChange({ ...values, name: e.target.value })} className="bg-secondary border-border" placeholder="Ex: Treinar, Meditar, Ler" />
      </div>
      <div className="space-y-2">
        <Label>Descrição <span className="text-muted-foreground">(opcional)</span></Label>
        <Input value={values.description || ""} onChange={(e) => onChange({ ...values, description: e.target.value })} className="bg-secondary border-border" placeholder="Detalhes sobre o hábito" />
      </div>
      <div className="space-y-2">
        <Label>Atributo vinculado</Label>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(attrConfig).map(([key, cfg]) => (
            <button key={key} type="button" onClick={() => onChange({ ...values, attribute: key })}
              className={`p-2 rounded-lg border text-center text-xs transition-all ${(values.attribute || "productivity") === key ? `border-current ${cfg.color} ${cfg.bg}` : "border-border bg-secondary/50 text-muted-foreground hover:border-border/80"}`}>
              <span className="text-lg block mb-0.5">{cfg.emoji}</span>
              {cfg.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Frequência</Label>
          <Select value={values.frequency} onValueChange={(v) => onChange({ ...values, frequency: v })}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(freqLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>XP por conclusão</Label>
          <Input type="number" value={values.xp_reward} onChange={(e) => onChange({ ...values, xp_reward: Number(e.target.value) })} className="bg-secondary border-border" />
        </div>
      </div>
    </div>
  );

  const HabitCard = ({ habit, index }: { habit: Habit; index: number }) => {
    const isDone = completedToday.has(habit.id);
    const attr = attrConfig[habit.attribute || "productivity"];
    const habitWeekLogs = weekLogs[habit.id] || [];

    return (
      <motion.div
        key={habit.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04 }}
        className={`rounded-xl border p-4 transition-all group relative overflow-hidden ${isDone ? "border-primary/30 bg-primary/5" : "border-border bg-card hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"}`}
      >
        {/* XP Popup */}
        <AnimatePresence>
          {xpPopup?.id === habit.id && (
            <motion.div
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: 1, y: -30, scale: 1 }}
              exit={{ opacity: 0, y: -60 }}
              className="absolute top-2 right-4 z-10 text-primary font-bold text-lg pointer-events-none"
            >
              +{xpPopup.amount} XP ⚡
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button onClick={() => toggleHabit(habit.id)}
            className={`mt-0.5 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${isDone ? "border-primary bg-primary" : "border-muted-foreground/30 hover:border-primary/50"}`}>
            {isDone && <CheckCircle2 className="h-4 w-4 text-primary-foreground" />}
          </button>

          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-center gap-2 mb-1">
              <p className={`font-semibold text-sm transition-all ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>{habit.name}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded-md ${attr.bg} ${attr.color}`}>{attr.emoji} {attr.label}</span>
            </div>

            {habit.description && <p className="text-xs text-muted-foreground mb-2">{habit.description}</p>}

            {/* Stats row */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Flame className={`h-3 w-3 ${habit.streak > 0 ? "text-orange-400" : ""}`} />
                <span className={habit.streak > 0 ? "text-orange-400 font-semibold" : ""}>{habit.streak}d streak</span>
              </span>
              {habit.best_streak > 0 && (
                <span className="flex items-center gap-1"><Trophy className="h-3 w-3 text-yellow-400" /> {habit.best_streak}d</span>
              )}
              <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> {habit.xp_reward} XP</span>
              <Badge variant="outline" className="text-xs h-5">{freqLabels[habit.frequency]}</Badge>
            </div>

            {/* Week heatmap */}
            <div className="flex gap-1 mt-3">
              {weekDays.map(day => {
                const done = habitWeekLogs.includes(day.date);
                return (
                  <div key={day.date} className="flex flex-col items-center gap-0.5">
                    <span className={`text-[10px] ${day.isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>{day.label}</span>
                    <div className={`h-5 w-5 rounded-sm transition-colors ${done ? "bg-primary" : day.isToday ? "bg-primary/20 border border-primary/30" : "bg-secondary"}`} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1 shrink-0">
            <button onClick={() => { setEditingHabit({ ...habit }); setEditDialog(true); }}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-all p-1.5 rounded-md hover:bg-primary/10">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => deleteHabit(habit.id)}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1.5 rounded-md hover:bg-destructive/10">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Repeat className="h-6 w-6 text-primary" /> Hábitos</h1>
          <p className="text-sm text-muted-foreground mt-1">Construa consistência e evolua seus atributos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Novo Hábito</Button></DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>Criar Hábito</DialogTitle></DialogHeader>
            <HabitFormFields values={{ name, description, attribute, frequency, xp_reward: Number(xp) }} onChange={(v) => { setName(v.name); setDescription(v.description || ""); setAttribute(v.attribute); setFrequency(v.frequency); setXp(String(v.xp_reward)); }} />
            <Button onClick={createHabit} className="w-full mt-2">Criar Hábito</Button>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Editar Hábito</DialogTitle></DialogHeader>
          {editingHabit && (
            <>
              <HabitFormFields values={editingHabit} onChange={setEditingHabit} />
              <div className="flex items-center gap-2 mt-2">
                <Checkbox checked={editingHabit.is_active} onCheckedChange={(v) => setEditingHabit({ ...editingHabit, is_active: !!v })} />
                <Label>Hábito ativo</Label>
              </div>
              <Button onClick={saveEdit} className="w-full mt-2">Salvar Alterações</Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Today's stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: <Target className="h-4 w-4 text-primary" />, label: "Progresso Hoje", value: `${completed}/${total}`, bg: "bg-primary/10" },
          { icon: <Zap className="h-4 w-4 text-yellow-400" />, label: "XP Ganho Hoje", value: `+${totalXpToday}`, bg: "bg-yellow-500/10" },
          { icon: <Flame className="h-4 w-4 text-orange-400" />, label: "Streaks Ativos", value: `${totalStreak}d`, bg: "bg-orange-400/10" },
          { icon: <Trophy className="h-4 w-4 text-primary" />, label: "Melhor Streak", value: `${bestStreak}d`, bg: "bg-primary/10" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.03 }}
            className="rounded-xl border border-border bg-card p-3 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${s.bg}`}>{s.icon}</div>
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="font-bold text-foreground text-sm font-mono">{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Progress bar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Progresso de Hoje</span>
          </div>
          <span className="text-sm font-mono text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-3" />
        <AnimatePresence>
          {progress === 100 && total > 0 && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-3 flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-semibold">Todos os hábitos concluídos! Dia perfeito! 🔥</span>
              <Sparkles className="h-4 w-4 text-primary" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Habits tabs */}
      <Tabs defaultValue="ativos">
        <TabsList className="bg-secondary border border-border">
          <TabsTrigger value="ativos">Ativos ({activeHabits.length})</TabsTrigger>
          {inactiveHabits.length > 0 && <TabsTrigger value="inativos">Inativos ({inactiveHabits.length})</TabsTrigger>}
        </TabsList>

        <TabsContent value="ativos" className="mt-4 space-y-3">
          {activeHabits.map((habit, i) => <HabitCard key={habit.id} habit={habit} index={i} />)}
          {activeHabits.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Repeat className="h-14 w-14 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium mb-1">Nenhum hábito cadastrado</p>
              <p className="text-sm opacity-70">Crie seu primeiro hábito para começar a evoluir!</p>
            </div>
          )}
        </TabsContent>

        {inactiveHabits.length > 0 && (
          <TabsContent value="inativos" className="mt-4 space-y-3">
            {inactiveHabits.map((habit, i) => <HabitCard key={habit.id} habit={habit} index={i} />)}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
