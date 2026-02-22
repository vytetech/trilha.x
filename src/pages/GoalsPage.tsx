import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Target, Plus, Trash2, Trophy, Clock, TrendingUp, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Goal {
  id: string;
  name: string;
  description: string | null;
  category: string;
  goal_type: string;
  target_value: number;
  current_value: number;
  deadline: string | null;
  priority: string;
  status: string;
  xp_reward: number;
  is_main: boolean;
}

const catLabels: Record<string, string> = { financial: "Financeira", professional: "Profissional", health: "Saúde", personal: "Pessoal", studies: "Estudos" };
const statusColors: Record<string, string> = { active: "bg-primary/20 text-primary", delayed: "bg-orange-500/20 text-orange-400", completed: "bg-green-500/20 text-green-400" };

const emptyForm = { name: "", description: "", category: "personal", goal_type: "custom", target_value: "", deadline: "", priority: "medium", xp_reward: "50" };

export default function GoalsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState(emptyForm);

  const fetchGoals = async () => {
    if (!user) return;
    const { data } = await supabase.from("goals").select("*").eq("user_id", user.id).order("is_main", { ascending: false });
    if (data) setGoals(data);
  };

  useEffect(() => { fetchGoals(); }, [user]);

  const openCreate = () => {
    setEditingGoal(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setForm({
      name: goal.name,
      description: goal.description || "",
      category: goal.category,
      goal_type: goal.goal_type,
      target_value: String(goal.target_value),
      deadline: goal.deadline || "",
      priority: goal.priority,
      xp_reward: String(goal.xp_reward),
    });
    setDialogOpen(true);
  };

  const saveGoal = async () => {
    if (!user || !form.name.trim()) return;
    const payload = {
      name: form.name, description: form.description || null, category: form.category, goal_type: form.goal_type,
      target_value: Number(form.target_value) || 0, deadline: form.deadline || null, priority: form.priority, xp_reward: Number(form.xp_reward) || 50,
    };
    if (editingGoal) {
      await supabase.from("goals").update(payload).eq("id", editingGoal.id);
      toast({ title: "Meta atualizada! ✏️" });
    } else {
      await supabase.from("goals").insert({ ...payload, user_id: user.id });
      toast({ title: "Meta criada! 🎯" });
    }
    setForm(emptyForm);
    setEditingGoal(null);
    setDialogOpen(false);
    fetchGoals();
  };

  const addToGoalValue = async (id: string, addAmount: number, currentValue: number, target: number) => {
    const newValue = currentValue + addAmount;
    const status = newValue >= target ? "completed" : "active";
    await supabase.from("goals").update({ current_value: newValue, status }).eq("id", id);
    if (status === "completed") toast({ title: "Meta concluída! 🏆" });
    else toast({ title: `+${addAmount} adicionado à meta!` });
    fetchGoals();
  };

  const toggleMain = async (id: string) => {
    await supabase.from("goals").update({ is_main: false }).eq("user_id", user!.id);
    await supabase.from("goals").update({ is_main: true }).eq("id", id);
    fetchGoals();
  };

  const deleteGoal = async (id: string) => {
    await supabase.from("goals").delete().eq("id", id);
    fetchGoals();
  };

  const mainGoal = goals.find((g) => g.is_main);
  const filtered = filter === "all" ? goals : goals.filter((g) => g.category === filter);
  const completedGoals = goals.filter((g) => g.status === "completed").length;
  const rate = goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Target className="h-6 w-6 text-primary" /> Metas</h1>
          <p className="text-sm text-muted-foreground mt-1">Defina objetivos e acompanhe seu progresso</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingGoal(null); }}>
          <DialogTrigger asChild><Button className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" /> Nova Meta</Button></DialogTrigger>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader><DialogTitle>{editingGoal ? "Editar Meta" : "Criar Meta"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-secondary border-border" /></div>
              <div className="space-y-2"><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-secondary border-border" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Categoria</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(catLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Tipo</Label>
                  <Select value={form.goal_type} onValueChange={(v) => setForm({ ...form, goal_type: v })}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="financial">Financeira</SelectItem>
                      <SelectItem value="habit">Hábito</SelectItem>
                      <SelectItem value="task">Tarefas</SelectItem>
                      <SelectItem value="custom">Personalizada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2"><Label>Valor alvo</Label><Input type="number" value={form.target_value} onChange={(e) => setForm({ ...form, target_value: e.target.value })} className="bg-secondary border-border" /></div>
                <div className="space-y-2"><Label>Prazo</Label><Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="bg-secondary border-border" /></div>
                <div className="space-y-2"><Label>XP</Label><Input type="number" value={form.xp_reward} onChange={(e) => setForm({ ...form, xp_reward: e.target.value })} className="bg-secondary border-border" /></div>
              </div>
              <Button onClick={saveGoal} className="w-full">{editingGoal ? "Salvar Alterações" : "Criar Meta"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 text-center"><p className="text-2xl font-bold text-foreground">{goals.filter((g) => g.status === "active").length}</p><p className="text-xs text-muted-foreground">Ativas</p></div>
        <div className="rounded-xl border border-border bg-card p-4 text-center"><p className="text-2xl font-bold neon-text">{completedGoals}</p><p className="text-xs text-muted-foreground">Concluídas</p></div>
        <div className="rounded-xl border border-border bg-card p-4 text-center"><p className="text-2xl font-bold text-foreground">{rate}%</p><p className="text-xs text-muted-foreground">Taxa de conclusão</p></div>
        <div className="rounded-xl border border-border bg-card p-4 text-center"><p className="text-2xl font-bold text-foreground">{goals.filter((g) => g.status === "delayed").length}</p><p className="text-xs text-muted-foreground">Atrasadas</p></div>
      </div>

      {/* Main goal */}
      {mainGoal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-primary/30 bg-primary/5 p-6">
          <div className="flex items-center gap-2 mb-2"><Trophy className="h-5 w-5 text-primary" /><span className="text-sm font-semibold neon-text">META PRINCIPAL</span></div>
          <h2 className="text-xl font-bold text-foreground">{mainGoal.name}</h2>
          <Progress value={mainGoal.target_value > 0 ? (mainGoal.current_value / mainGoal.target_value) * 100 : 0} className="h-3 mt-3" />
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>{mainGoal.goal_type === "financial" ? `R$ ${Number(mainGoal.current_value).toLocaleString("pt-BR")}` : mainGoal.current_value} / {mainGoal.goal_type === "financial" ? `R$ ${Number(mainGoal.target_value).toLocaleString("pt-BR")}` : mainGoal.target_value}</span>
            {mainGoal.deadline && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(mainGoal.deadline).toLocaleDateString("pt-BR")}</span>}
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[["all", "Todas"], ...Object.entries(catLabels)].map(([k, v]) => (
          <Button key={k} variant={filter === k ? "default" : "outline"} size="sm" onClick={() => setFilter(k)}>{v}</Button>
        ))}
      </div>

      {/* Goals grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((goal) => {
          const pct = goal.target_value > 0 ? Math.round((goal.current_value / goal.target_value) * 100) : 0;
          return (
            <motion.div key={goal.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card p-5 group hover:border-primary/20 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground">{goal.name}</h3>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{catLabels[goal.category]}</Badge>
                    <Badge className={`text-xs ${statusColors[goal.status]}`}>{goal.status === "active" ? "Ativa" : goal.status === "completed" ? "Concluída" : "Atrasada"}</Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  {!goal.is_main && <button onClick={() => toggleMain(goal.id)} className="text-muted-foreground hover:text-primary" title="Definir como principal"><Trophy className="h-4 w-4" /></button>}
                  <button onClick={() => openEdit(goal)} className="text-muted-foreground hover:text-primary" title="Editar meta"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => deleteGoal(goal.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <Progress value={pct} className="h-2 mb-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{pct}%</span>
                <span>{goal.xp_reward} XP</span>
              </div>
              {goal.status !== "completed" && (
                <div className="mt-3 flex gap-2">
                  <Input type="number" placeholder="Adicionar valor" className="bg-secondary border-border h-8 text-sm" onKeyDown={(e) => { if (e.key === "Enter") { const val = Number((e.target as HTMLInputElement).value); if (val > 0) { addToGoalValue(goal.id, val, goal.current_value, goal.target_value); (e.target as HTMLInputElement).value = ""; } } }} />
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={(e) => { const input = (e.currentTarget.previousElementSibling as HTMLInputElement); const val = Number(input?.value); if (val > 0) { addToGoalValue(goal.id, val, goal.current_value, goal.target_value); input.value = ""; } }}>+ Adicionar</Button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {goals.length === 0 && (
        <div className="text-center py-12 text-muted-foreground"><Target className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>Nenhuma meta criada ainda.</p></div>
      )}
    </div>
  );
}
