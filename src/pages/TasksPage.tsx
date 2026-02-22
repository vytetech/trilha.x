import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckSquare, Plus, Flame, Clock, Zap, Trash2, Star, Pencil, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addWeeks, subWeeks, addMonths, subMonths, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  estimated_minutes: number | null;
  xp_reward: number;
  due_date: string | null;
}

interface Habit {
  id: string;
  name: string;
  xp_reward: number;
  streak: number;
  attribute: string | null;
}

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/20 text-primary",
  high: "bg-orange-500/20 text-orange-400",
  urgent: "bg-destructive/20 text-destructive",
};

const statusLabels: Record<string, string> = {
  todo: "A Fazer",
  in_progress: "Em Progresso",
  done: "Concluído",
};

export default function TasksPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completedHabits, setCompletedHabits] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [newTaskXP, setNewTaskXP] = useState("10");
  const [newTaskMinutes, setNewTaskMinutes] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date | undefined>();
  const [view, setView] = useState<"kanban" | "week" | "month">("kanban");
  const [weekRef, setWeekRef] = useState(new Date());
  const [monthRef, setMonthRef] = useState(new Date());

  const fetchData = async () => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    const [tasksRes, habitsRes, logsRes] = await Promise.all([
      supabase.from("tasks").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("habits").select("*").eq("user_id", user.id).eq("is_active", true),
      supabase.from("habit_logs").select("habit_id").eq("user_id", user.id).eq("completed_at", today),
    ]);
    if (tasksRes.data) setTasks(tasksRes.data);
    if (habitsRes.data) setHabits(habitsRes.data);
    if (logsRes.data) setCompletedHabits(new Set(logsRes.data.map((l) => l.habit_id)));
  };

  useEffect(() => { fetchData(); }, [user]);

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

  const createTask = async () => {
    if (!user || !newTaskTitle.trim()) return;
    await supabase.from("tasks").insert({
      user_id: user.id,
      title: newTaskTitle,
      priority: newTaskPriority,
      xp_reward: Number(newTaskXP) || 10,
      estimated_minutes: newTaskMinutes ? Number(newTaskMinutes) : null,
      due_date: newTaskDueDate ? format(newTaskDueDate, "yyyy-MM-dd") : null,
    });
    setNewTaskTitle(""); setNewTaskPriority("medium"); setNewTaskXP("10"); setNewTaskMinutes(""); setNewTaskDueDate(undefined);
    setDialogOpen(false);
    fetchData();
  };

  const updateTask = async () => {
    if (!editingTask) return;
    await supabase.from("tasks").update({
      title: editingTask.title,
      priority: editingTask.priority,
      xp_reward: editingTask.xp_reward,
      estimated_minutes: editingTask.estimated_minutes,
      due_date: editingTask.due_date,
    }).eq("id", editingTask.id);
    setEditDialog(false);
    setEditingTask(null);
    fetchData();
    toast({ title: "Tarefa atualizada! ✏️" });
  };

  const updateTaskStatus = async (id: string, status: string) => {
    const task = tasks.find(t => t.id === id);
    await supabase.from("tasks").update({ status }).eq("id", id);
    if (status === "done" && task) {
      await addXpToProfile(task.xp_reward);
      toast({ title: `Tarefa concluída! +${task.xp_reward} XP 🎉` });
    }
    fetchData();
  };

  const deleteTask = async (id: string) => {
    await supabase.from("tasks").delete().eq("id", id);
    fetchData();
  };

  const toggleHabit = async (habitId: string) => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    const habit = habits.find((h) => h.id === habitId);
    if (completedHabits.has(habitId)) {
      await supabase.from("habit_logs").delete().eq("habit_id", habitId).eq("completed_at", today);
      setCompletedHabits((prev) => { const n = new Set(prev); n.delete(habitId); return n; });
    } else {
      await supabase.from("habit_logs").insert({ user_id: user.id, habit_id: habitId, completed_at: today, xp_earned: habit?.xp_reward || 5 });
      setCompletedHabits((prev) => new Set(prev).add(habitId));
      await addXpToProfile(habit?.xp_reward || 5);
      toast({ title: `Hábito concluído! +${habit?.xp_reward || 5} XP ⚡` });
    }
  };

  const completedCount = completedHabits.size;
  const totalHabits = habits.length;
  const habitsProgress = totalHabits > 0 ? (completedCount / totalHabits) * 100 : 0;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const allDone = totalHabits > 0 && completedCount === totalHabits && doneTasks > 0;
  const columns = ["todo", "in_progress", "done"] as const;

  const weekStart = startOfWeek(weekRef, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekRef, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const monthStart = startOfMonth(monthRef);
  const monthEnd = endOfMonth(monthRef);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getTasksForDay = (day: Date) => tasks.filter(t => t.due_date && isSameDay(new Date(t.due_date + "T12:00:00"), day));

  const openEdit = (task: Task) => { setEditingTask({ ...task }); setEditDialog(true); };

  return (
    <div className="space-y-6 max-w-7xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-primary" /> Tarefas Diárias
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Organize sua execução diária</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as any)}>
            <TabsList className="bg-secondary">
              <TabsTrigger value="kanban">Kanban</TabsTrigger>
              <TabsTrigger value="week">Semana</TabsTrigger>
              <TabsTrigger value="month">Mês</TabsTrigger>
            </TabsList>
          </Tabs>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Nova Tarefa</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle>Criar Tarefa</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} className="bg-secondary border-border" placeholder="Nome da tarefa" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Prioridade</Label>
                    <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                      <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>XP</Label><Input type="number" value={newTaskXP} onChange={(e) => setNewTaskXP(e.target.value)} className="bg-secondary border-border" /></div>
                  <div className="space-y-2"><Label>Min.</Label><Input type="number" value={newTaskMinutes} onChange={(e) => setNewTaskMinutes(e.target.value)} className="bg-secondary border-border" placeholder="30" /></div>
                </div>
                <div className="space-y-2">
                  <Label>Data de entrega</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-secondary border-border", !newTaskDueDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newTaskDueDate ? format(newTaskDueDate, "dd/MM/yyyy") : "Selecionar data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={newTaskDueDate} onSelect={setNewTaskDueDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                    </PopoverContent>
                  </Popover>
                </div>
                <Button onClick={createTask} className="w-full">Criar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Edit Task Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Editar Tarefa</DialogTitle></DialogHeader>
          {editingTask && (
            <div className="space-y-4">
              <div className="space-y-2"><Label>Título</Label><Input value={editingTask.title} onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })} className="bg-secondary border-border" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select value={editingTask.priority} onValueChange={(v) => setEditingTask({ ...editingTask, priority: v })}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>XP</Label><Input type="number" value={editingTask.xp_reward} onChange={(e) => setEditingTask({ ...editingTask, xp_reward: Number(e.target.value) })} className="bg-secondary border-border" /></div>
                <div className="space-y-2"><Label>Min.</Label><Input type="number" value={editingTask.estimated_minutes || ""} onChange={(e) => setEditingTask({ ...editingTask, estimated_minutes: e.target.value ? Number(e.target.value) : null })} className="bg-secondary border-border" /></div>
              </div>
              <div className="space-y-2">
                <Label>Data de entrega</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-secondary border-border", !editingTask.due_date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editingTask.due_date ? format(new Date(editingTask.due_date + "T12:00:00"), "dd/MM/yyyy") : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={editingTask.due_date ? new Date(editingTask.due_date + "T12:00:00") : undefined} onSelect={(d) => setEditingTask({ ...editingTask, due_date: d ? format(d, "yyyy-MM-dd") : null })} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>
              <Button onClick={updateTask} className="w-full">Salvar</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Hábitos do dia */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2"><Flame className="h-5 w-5 text-primary" /> Hábitos de Hoje</h2>
          <span className="text-sm text-muted-foreground">{completedCount}/{totalHabits} concluídos</span>
        </div>
        <Progress value={habitsProgress} className="h-2 mb-4" />
        {habits.length === 0 ? (
          <p className="text-sm text-muted-foreground">Cadastre hábitos no módulo de Hábitos para vê-los aqui.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {habits.map((habit) => (
              <button key={habit.id} onClick={() => toggleHabit(habit.id)} className={`flex items-center gap-3 p-3 rounded-lg text-left transition-all ${completedHabits.has(habit.id) ? "bg-primary/10 border border-primary/30" : "bg-secondary/50 border border-border hover:border-primary/20"}`}>
                <Checkbox checked={completedHabits.has(habit.id)} className="pointer-events-none" />
                <span className={`text-sm ${completedHabits.has(habit.id) ? "line-through text-muted-foreground" : "text-foreground"}`}>{habit.name}</span>
                <Badge variant="outline" className="ml-auto text-xs">{habit.xp_reward} XP</Badge>
              </button>
            ))}
          </div>
        )}
        {allDone && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/30 text-center">
            <Star className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-sm font-semibold neon-text">🔥 FOCO TOTAL! Bônus de XP desbloqueado!</p>
          </motion.div>
        )}
      </motion.div>

      {/* Views */}
      {view === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((col) => (
            <motion.div key={col} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wider">{statusLabels[col]}</h3>
              <div className="space-y-2 min-h-[100px]">
                <AnimatePresence>
                  {tasks.filter((t) => t.status === col).map((task) => (
                    <motion.div key={task.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-3 rounded-lg bg-secondary/50 border border-border hover:border-primary/20 transition-colors group">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${task.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.title}</p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge className={`text-xs ${priorityColors[task.priority]}`}>{task.priority}</Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1"><Zap className="h-3 w-3" />{task.xp_reward} XP</span>
                            {task.estimated_minutes && <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{task.estimated_minutes}m</span>}
                            {task.due_date && <span className="text-xs text-muted-foreground flex items-center gap-1"><CalendarIcon className="h-3 w-3" />{format(new Date(task.due_date + "T12:00:00"), "dd/MM")}</span>}
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(task)} className="text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => deleteTask(task.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                      <div className="flex gap-1 mt-2">
                        {col !== "todo" && <button onClick={() => updateTaskStatus(task.id, col === "done" ? "in_progress" : "todo")} className="text-xs text-muted-foreground hover:text-foreground">← Voltar</button>}
                        {col !== "done" && <button onClick={() => updateTaskStatus(task.id, col === "todo" ? "in_progress" : "done")} className="text-xs text-primary hover:text-primary/80 ml-auto">Avançar →</button>}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {view === "week" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={() => setWeekRef(subWeeks(weekRef, 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <h3 className="font-semibold text-foreground">{format(weekStart, "dd MMM", { locale: ptBR })} — {format(weekEnd, "dd MMM yyyy", { locale: ptBR })}</h3>
            <Button variant="ghost" size="icon" onClick={() => setWeekRef(addWeeks(weekRef, 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const dayTasks = getTasksForDay(day);
              return (
                <div key={day.toISOString()} className={cn("rounded-lg border p-2 min-h-[120px]", isToday(day) ? "border-primary/50 bg-primary/5" : "border-border bg-secondary/30")}>
                  <p className={cn("text-xs font-semibold mb-1", isToday(day) ? "text-primary" : "text-muted-foreground")}>{format(day, "EEE dd", { locale: ptBR })}</p>
                  {dayTasks.map(t => (
                    <button key={t.id} onClick={() => openEdit(t)} className="w-full text-left text-xs p-1 rounded bg-primary/10 text-foreground mb-1 truncate hover:bg-primary/20 transition-colors">{t.title}</button>
                  ))}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {view === "month" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={() => setMonthRef(subMonths(monthRef, 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <h3 className="font-semibold text-foreground capitalize">{format(monthRef, "MMMM yyyy", { locale: ptBR })}</h3>
            <Button variant="ghost" size="icon" onClick={() => setMonthRef(addMonths(monthRef, 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map(d => <div key={d} className="text-xs text-center text-muted-foreground font-semibold p-1">{d}</div>)}
            {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => <div key={`e-${i}`} />)}
            {monthDays.map((day) => {
              const dayTasks = getTasksForDay(day);
              return (
                <div key={day.toISOString()} className={cn("rounded-md border p-1 min-h-[60px] text-xs", isToday(day) ? "border-primary/50 bg-primary/5" : "border-border/50")}>
                  <p className={cn("font-semibold", isToday(day) ? "text-primary" : "text-muted-foreground")}>{format(day, "d")}</p>
                  {dayTasks.slice(0, 2).map(t => (
                    <button key={t.id} onClick={() => openEdit(t)} className="w-full text-left truncate text-[10px] rounded px-1 bg-primary/10 text-foreground mt-0.5 hover:bg-primary/20">{t.title}</button>
                  ))}
                  {dayTasks.length > 2 && <span className="text-[10px] text-muted-foreground">+{dayTasks.length - 2}</span>}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Resumo do dia */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold text-foreground mb-3">📊 Resumo do Dia</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center"><p className="text-2xl font-bold text-foreground">{doneTasks}</p><p className="text-xs text-muted-foreground">Tarefas concluídas</p></div>
          <div className="text-center"><p className="text-2xl font-bold text-foreground">{completedCount}</p><p className="text-xs text-muted-foreground">Hábitos concluídos</p></div>
          <div className="text-center"><p className="text-2xl font-bold neon-text">{tasks.filter(t => t.status === "done").reduce((a, t) => a + t.xp_reward, 0) + habits.filter(h => completedHabits.has(h.id)).reduce((a, h) => a + h.xp_reward, 0)}</p><p className="text-xs text-muted-foreground">XP ganho</p></div>
          <div className="text-center"><p className="text-2xl font-bold text-foreground">{Math.round(habitsProgress)}%</p><p className="text-xs text-muted-foreground">Performance</p></div>
        </div>
      </motion.div>
    </div>
  );
}
