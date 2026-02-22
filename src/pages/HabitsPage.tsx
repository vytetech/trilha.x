import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Repeat, Plus, Flame, Trash2, Zap, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
}

const attrLabels: Record<string, string> = {
  focus: "Foco", discipline: "Disciplina", mental: "Mental",
  financial: "Financeiro", productivity: "Produtividade", consistency: "Consistência",
};

const attrColors: Record<string, string> = {
  focus: "text-blue-400", discipline: "text-primary", mental: "text-purple-400",
  financial: "text-yellow-400", productivity: "text-orange-400", consistency: "text-cyan-400",
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

  const fetchData = async () => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    const [habitsRes, logsRes] = await Promise.all([
      supabase.from("habits").select("*").eq("user_id", user.id).order("created_at"),
      supabase.from("habit_logs").select("habit_id").eq("user_id", user.id).eq("completed_at", today),
    ]);
    if (habitsRes.data) setHabits(habitsRes.data);
    if (logsRes.data) setCompletedToday(new Set(logsRes.data.map((l) => l.habit_id)));
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
      name: editingHabit.name,
      description: editingHabit.description,
      attribute: editingHabit.attribute,
      frequency: editingHabit.frequency,
      xp_reward: editingHabit.xp_reward,
      is_active: editingHabit.is_active,
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
      while (newXp >= newLevel * 100) {
        newXp -= newLevel * 100;
        newLevel++;
      }
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
      toast({ title: `+${habit?.xp_reward || 5} XP ⚡` });
    }
    fetchData();
  };

  const deleteHabit = async (id: string) => {
    await supabase.from("habits").delete().eq("id", id);
    fetchData();
  };

  const completed = completedToday.size;
  const total = habits.filter((h) => h.is_active).length;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  const HabitFormFields = ({ values, onChange }: { values: { name: string; description: string | null; attribute: string | null; frequency: string; xp_reward: number; is_active?: boolean }; onChange: (v: any) => void }) => (
    <div className="space-y-4">
      <div className="space-y-2"><Label>Nome</Label><Input value={values.name} onChange={(e) => onChange({ ...values, name: e.target.value })} className="bg-secondary border-border" placeholder="Ex: Treinar, Ler 20 páginas" /></div>
      <div className="space-y-2"><Label>Descrição</Label><Input value={values.description || ""} onChange={(e) => onChange({ ...values, description: e.target.value })} className="bg-secondary border-border" placeholder="Opcional" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Atributo</Label>
          <Select value={values.attribute || "productivity"} onValueChange={(v) => onChange({ ...values, attribute: v })}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(attrLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Frequência</Label>
          <Select value={values.frequency} onValueChange={(v) => onChange({ ...values, frequency: v })}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(freqLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2"><Label>XP por conclusão</Label><Input type="number" value={values.xp_reward} onChange={(e) => onChange({ ...values, xp_reward: Number(e.target.value) })} className="bg-secondary border-border" /></div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
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
                <Label>Ativo</Label>
              </div>
              <Button onClick={saveEdit} className="w-full mt-2">Salvar</Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Progress */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2"><Flame className="h-5 w-5 text-primary" /><span className="font-semibold text-foreground">Progresso de Hoje</span></div>
          <span className="text-sm text-muted-foreground">{completed}/{total}</span>
        </div>
        <Progress value={progress} className="h-3" />
        {progress === 100 && total > 0 && <p className="text-sm neon-text mt-2 text-center font-semibold">🔥 Todos os hábitos concluídos! Disciplina +2%</p>}
      </motion.div>

      {/* Habits list */}
      <div className="space-y-3">
        {habits.map((habit, i) => (
          <motion.div key={habit.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className={`rounded-xl border p-4 transition-all group ${completedToday.has(habit.id) ? "border-primary/30 bg-primary/5" : "border-border bg-card hover:border-primary/20"}`}>
            <div className="flex items-center gap-4">
              <Checkbox checked={completedToday.has(habit.id)} onCheckedChange={() => toggleHabit(habit.id)} className="h-5 w-5" />
              <div className="flex-1">
                <p className={`font-medium ${completedToday.has(habit.id) ? "line-through text-muted-foreground" : "text-foreground"}`}>{habit.name}</p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <Badge variant="outline" className={`text-xs ${attrColors[habit.attribute || "productivity"]}`}>{attrLabels[habit.attribute || "productivity"]}</Badge>
                  <Badge variant="outline" className="text-xs">{freqLabels[habit.frequency] || habit.frequency}</Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Zap className="h-3 w-3" />{habit.xp_reward} XP</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Flame className="h-3 w-3" />{habit.streak} dias</span>
                  {habit.best_streak > 0 && <span className="text-xs text-muted-foreground">🏆 Melhor: {habit.best_streak}</span>}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditingHabit({ ...habit }); setEditDialog(true); }} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => deleteHabit(habit.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </motion.div>
        ))}
        {habits.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Repeat className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum hábito cadastrado ainda.</p>
            <p className="text-sm">Crie seu primeiro hábito para começar a evoluir!</p>
          </div>
        )}
      </div>
    </div>
  );
}
