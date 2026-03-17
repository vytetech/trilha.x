import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckSquare, Plus, Flame, Clock, Zap, Trash2, Star, Pencil,
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Target,
  ArrowRight, ArrowLeft, Trophy, BarChart3, ListChecks, LayoutGrid
} from "lucide-react";
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
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PlanLimitBanner from "@/components/PlanLimitBanner";
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

const priorityConfig: Record<string, { label: string; color: string; dot: string }> = {
  low: { label: "Baixa", color: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  medium: { label: "Média", color: "bg-primary/15 text-primary", dot: "bg-primary" },
  high: { label: "Alta", color: "bg-orange-500/15 text-orange-400", dot: "bg-orange-400" },
  urgent: { label: "Urgente", color: "bg-destructive/15 text-destructive", dot: "bg-destructive" },
};

const statusConfig: Record<string, { label: string; icon: React.ReactNode }> = {
  todo: { label: "A Fazer", icon: <ListChecks className="h-4 w-4" /> },
  in_progress: { label: "Em Progresso", icon: <Target className="h-4 w-4" /> },
  done: { label: "Concluído", icon: <CheckSquare className="h-4 w-4" /> },
};

function DayDetailHabits({ selectedDay, selectedDayTasks, habits, todayCompletedHabits, userId, TaskCard }: {
  selectedDay: Date | null;
  selectedDayTasks: Task[];
  habits: Habit[];
  todayCompletedHabits: Set<string>;
  userId: string | undefined;
  TaskCard: React.FC<{ task: Task; showActions?: boolean }>;
}) {
  const [dayCompletedHabits, setDayCompletedHabits] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const isSelectedToday = selectedDay ? isToday(selectedDay) : false;

  useEffect(() => {
    if (!selectedDay || !userId) return;
    if (isToday(selectedDay)) {
      setDayCompletedHabits(todayCompletedHabits);
      return;
    }
    // Fetch habit logs for the selected day
    const dayStr = format(selectedDay, "yyyy-MM-dd");
    setLoading(true);
    supabase.from("habit_logs").select("habit_id").eq("user_id", userId).eq("completed_at", dayStr)
      .then(({ data }) => {
        setDayCompletedHabits(new Set(data?.map(l => l.habit_id) || []));
        setLoading(false);
      });
  }, [selectedDay, userId, todayCompletedHabits]);

  const completed = isSelectedToday ? todayCompletedHabits : dayCompletedHabits;

  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <CheckSquare className="h-3.5 w-3.5 text-primary" /> Tarefas ({selectedDayTasks.length})
        </h4>
        {selectedDayTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground bg-secondary/50 rounded-lg p-4 text-center">Nenhuma tarefa agendada</p>
        ) : (
          <div className="space-y-2">
            {selectedDayTasks.map((task) => <TaskCard key={task.id} task={task} showActions={true} />)}
          </div>
        )}
      </div>
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Flame className="h-3.5 w-3.5 text-primary" /> Hábitos ({habits.length})
        </h4>
        {habits.length === 0 ? (
          <p className="text-sm text-muted-foreground bg-secondary/50 rounded-lg p-4 text-center">Nenhum hábito cadastrado</p>
        ) : (
          <div className="space-y-1.5">
            {habits.map((habit) => (
              <div key={habit.id} className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-all",
                completed.has(habit.id) ? "bg-primary/5 border-primary/20" : "bg-secondary/30 border-border"
              )}>
                <Checkbox checked={completed.has(habit.id)} className="pointer-events-none" />
                <span className={cn("text-sm flex-1", completed.has(habit.id) ? "line-through text-muted-foreground" : "text-foreground")}>{habit.name}</span>
                <Badge variant="outline" className="text-[10px]">{habit.xp_reward} XP</Badge>
                {habit.streak > 0 && <span className="text-[10px] text-muted-foreground">🔥{habit.streak}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Task Form Component (outside main component to prevent remounting on every keystroke)
const TaskForm = ({ values, onChange, onSubmit, submitLabel }: {
  values: { title: string; description?: string; priority: string; xp_reward: number; estimated_minutes: number | null; due_date: string | Date | null | undefined };
  onChange: (v: any) => void;
  onSubmit: () => void;
  submitLabel: string;
}) => (
  <div className="space-y-5">
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Título da tarefa</Label>
      <Input value={values.title} onChange={(e) => onChange({ ...values, title: e.target.value })}
        className="bg-secondary border-border h-11" placeholder="O que precisa ser feito?" />
    </div>
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Descrição <span className="text-muted-foreground/50">(opcional)</span></Label>
      <textarea value={values.description || ""} onChange={(e) => onChange({ ...values, description: e.target.value })}
        className="flex min-h-[60px] w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        placeholder="Detalhes adicionais sobre a tarefa..." rows={2} />
    </div>
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Prioridade</Label>
      <div className="grid grid-cols-4 gap-2">
        {Object.entries(priorityConfig).map(([key, cfg]) => (
          <button key={key} type="button" onClick={() => onChange({ ...values, priority: key })}
            className={cn(
              "p-2.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5 justify-center",
              values.priority === key
                ? `${cfg.color} border-current shadow-sm`
                : "border-border bg-secondary/50 text-muted-foreground hover:border-border/80"
            )}>
            <span className={cn("h-2 w-2 rounded-full", cfg.dot)} />
            {cfg.label}
          </button>
        ))}
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">XP Recompensa</Label>
        <Input type="number" value={values.xp_reward} onChange={(e) => onChange({ ...values, xp_reward: Number(e.target.value) })} className="bg-secondary border-border" />
      </div>
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tempo (min)</Label>
        <Input type="number" value={values.estimated_minutes || ""} onChange={(e) => onChange({ ...values, estimated_minutes: e.target.value ? Number(e.target.value) : null })} className="bg-secondary border-border" placeholder="30" />
      </div>
    </div>
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Data de entrega</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-secondary border-border h-11", !values.due_date && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {values.due_date
              ? format(typeof values.due_date === "string" ? new Date(values.due_date + "T12:00:00") : values.due_date, "dd/MM/yyyy")
              : "Selecionar data"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single"
            selected={values.due_date ? (typeof values.due_date === "string" ? new Date(values.due_date + "T12:00:00") : values.due_date) : undefined}
            onSelect={(d) => onChange({ ...values, due_date: d ? format(d, "yyyy-MM-dd") : null })}
            initialFocus className="p-3 pointer-events-auto" />
        </PopoverContent>
      </Popover>
    </div>
    <Button onClick={onSubmit} className="w-full h-11 font-semibold gap-2">
      <CheckSquare className="h-4 w-4" /> {submitLabel}
    </Button>
  </div>
);

export default function TasksPage() {
  const { user } = useAuth();
  const { canCreate } = useSubscription();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completedHabits, setCompletedHabits] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [newTaskXP, setNewTaskXP] = useState("10");
  const [newTaskMinutes, setNewTaskMinutes] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date | undefined>();
  const [view, setView] = useState<"kanban" | "week" | "month">("kanban");
  const [weekRef, setWeekRef] = useState(new Date());
  const [monthRef, setMonthRef] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [dayDetailOpen, setDayDetailOpen] = useState(false);
  const [xpPopup, setXpPopup] = useState<{ amount: number; id: string } | null>(null);

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
      while (newXp >= newLevel * 100) { newXp -= newLevel * 100; newLevel++; }
      await supabase.from("profiles").update({ xp: newXp, level: newLevel }).eq("user_id", user.id);
    }
  };

  const createTask = async () => {
    if (!user || !newTaskTitle.trim()) return;
    if (!canCreate("tasks", tasks.length)) {
      toast({ variant: "destructive", title: "Limite do plano Free", description: "Faça upgrade para criar mais tarefas." });
      return;
    }
    await supabase.from("tasks").insert({
      user_id: user.id, title: newTaskTitle, priority: newTaskPriority,
      description: newTaskDescription.trim() || null,
      xp_reward: Number(newTaskXP) || 10,
      estimated_minutes: newTaskMinutes ? Number(newTaskMinutes) : null,
      due_date: newTaskDueDate ? format(newTaskDueDate, "yyyy-MM-dd") : null,
    });
    setNewTaskTitle(""); setNewTaskDescription(""); setNewTaskPriority("medium"); setNewTaskXP("10"); setNewTaskMinutes(""); setNewTaskDueDate(undefined);
    setDialogOpen(false);
    fetchData();
    toast({ title: "Tarefa criada! ✅" });
  };

  const updateTask = async () => {
    if (!editingTask) return;
    await supabase.from("tasks").update({
      title: editingTask.title, description: editingTask.description || null, priority: editingTask.priority,
      xp_reward: editingTask.xp_reward, estimated_minutes: editingTask.estimated_minutes,
      due_date: editingTask.due_date,
    }).eq("id", editingTask.id);
    setEditDialog(false); setEditingTask(null);
    fetchData();
    toast({ title: "Tarefa atualizada! ✏️" });
  };

  const updateTaskStatus = async (id: string, status: string) => {
    const task = tasks.find(t => t.id === id);
    await supabase.from("tasks").update({ status }).eq("id", id);
    if (status === "done" && task) {
      await addXpToProfile(task.xp_reward);
      setXpPopup({ amount: task.xp_reward, id });
      setTimeout(() => setXpPopup(null), 1800);
      toast({ title: `+${task.xp_reward} XP! Tarefa concluída 🎉` });
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
      toast({ title: `+${habit?.xp_reward || 5} XP! Hábito concluído ⚡` });
    }
  };

  const completedCount = completedHabits.size;
  const totalHabits = habits.length;
  const habitsProgress = totalHabits > 0 ? (completedCount / totalHabits) * 100 : 0;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const totalTasks = tasks.length;
  const taskProgress = totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0;
  const allDone = totalHabits > 0 && completedCount === totalHabits && doneTasks > 0;
  const columns = ["todo", "in_progress", "done"] as const;
  const totalXpToday = tasks.filter(t => t.status === "done").reduce((a, t) => a + t.xp_reward, 0) + habits.filter(h => completedHabits.has(h.id)).reduce((a, h) => a + h.xp_reward, 0);

  const weekStart = startOfWeek(weekRef, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekRef, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const monthStart2 = startOfMonth(monthRef);
  const monthEnd2 = endOfMonth(monthRef);
  const monthDays = eachDayOfInterval({ start: monthStart2, end: monthEnd2 });

  const getTasksForDay = (day: Date) => tasks.filter(t => t.due_date && isSameDay(new Date(t.due_date + "T12:00:00"), day));
  const openEdit = (task: Task) => { setEditingTask({ ...task }); setEditDialog(true); };
  const openDayDetail = (day: Date) => { setSelectedDay(day); setDayDetailOpen(true); };
  const selectedDayTasks = selectedDay ? getTasksForDay(selectedDay) : [];



  // Task Card Component
  const TaskCard = ({ task, showActions = true }: { task: Task; showActions?: boolean }) => {
    const priority = priorityConfig[task.priority] || priorityConfig.medium;
    const isDone = task.status === "done";

    return (
      <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
        className={cn(
          "p-3.5 rounded-xl border transition-all group relative overflow-hidden",
          isDone
            ? "border-primary/20 bg-primary/5"
            : "border-border bg-secondary/40 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
        )}>
        {/* XP Popup */}
        <AnimatePresence>
          {xpPopup?.id === task.id && (
            <motion.div initial={{ opacity: 0, y: 0, scale: 0.5 }} animate={{ opacity: 1, y: -25, scale: 1 }} exit={{ opacity: 0, y: -50 }}
              className="absolute top-1 right-3 z-10 text-primary font-bold text-sm pointer-events-none">
              +{xpPopup.amount} XP ⚡
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-start gap-3">
          {showActions && (
            <button onClick={() => updateTaskStatus(task.id, isDone ? "in_progress" : "done")}
              className={cn(
                "mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                isDone ? "border-primary bg-primary" : "border-muted-foreground/30 hover:border-primary/50"
              )}>
              {isDone && <CheckSquare className="h-3 w-3 text-primary-foreground" />}
            </button>
          )}
          <div className="flex-1 min-w-0">
            <p className={cn("text-sm font-medium leading-tight", isDone ? "line-through text-muted-foreground" : "text-foreground")}>{task.title}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1", priority.color)}>
                <span className={cn("h-1.5 w-1.5 rounded-full", priority.dot)} />
                {priority.label}
              </span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Zap className="h-3 w-3" />{task.xp_reward}</span>
              {task.estimated_minutes && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{task.estimated_minutes}m</span>}
              {task.due_date && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><CalendarIcon className="h-3 w-3" />{format(new Date(task.due_date + "T12:00:00"), "dd/MM")}</span>}
            </div>
          </div>
          {showActions && (
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button onClick={() => openEdit(task)} className="text-muted-foreground hover:text-primary p-1 rounded-md hover:bg-primary/10 transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
              <button onClick={() => deleteTask(task.id)} className="text-muted-foreground hover:text-destructive p-1 rounded-md hover:bg-destructive/10 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          )}
        </div>

        {/* Status actions */}
        {showActions && !isDone && (
          <div className="flex gap-2 mt-2.5 pt-2.5 border-t border-border/50">
            {task.status !== "todo" && (
              <button onClick={() => updateTaskStatus(task.id, task.status === "done" ? "in_progress" : "todo")}
                className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                <ArrowLeft className="h-3 w-3" /> Voltar
              </button>
            )}
            {task.status !== "done" && (
              <button onClick={() => updateTaskStatus(task.id, task.status === "todo" ? "in_progress" : "done")}
                className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-1 ml-auto transition-colors font-medium">
                Avançar <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <PlanLimitBanner resource="tasks" currentCount={tasks.length} resourceLabel="tarefas" />
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-primary" /> Tarefas Diárias
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Organize, execute e evolua</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-secondary rounded-lg border border-border p-0.5">
            {[
              { key: "kanban", icon: <LayoutGrid className="h-3.5 w-3.5" />, label: "Kanban" },
              { key: "week", icon: <CalendarIcon className="h-3.5 w-3.5" />, label: "Semana" },
              { key: "month", icon: <BarChart3 className="h-3.5 w-3.5" />, label: "Mês" },
            ].map(v => (
              <button key={v.key} onClick={() => setView(v.key as any)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all",
                  view === v.key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}>
                {v.icon} {v.label}
              </button>
            ))}
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 h-9 shadow-md shadow-primary/20"><Plus className="h-4 w-4" /> Nova Tarefa</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /> Criar Tarefa</DialogTitle></DialogHeader>
              <TaskForm
                values={{ title: newTaskTitle, description: newTaskDescription, priority: newTaskPriority, xp_reward: Number(newTaskXP), estimated_minutes: newTaskMinutes ? Number(newTaskMinutes) : null, due_date: newTaskDueDate }}
                onChange={(v) => { setNewTaskTitle(v.title); setNewTaskDescription(v.description || ""); setNewTaskPriority(v.priority); setNewTaskXP(String(v.xp_reward)); setNewTaskMinutes(v.estimated_minutes ? String(v.estimated_minutes) : ""); setNewTaskDueDate(v.due_date ? (typeof v.due_date === "string" ? new Date(v.due_date + "T12:00:00") : v.due_date) : undefined); }}
                onSubmit={createTask} submitLabel="Criar Tarefa"
              />
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Edit Task Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Pencil className="h-5 w-5 text-primary" /> Editar Tarefa</DialogTitle></DialogHeader>
          {editingTask && (
            <TaskForm
              values={{ title: editingTask.title, description: editingTask.description || "", priority: editingTask.priority, xp_reward: editingTask.xp_reward, estimated_minutes: editingTask.estimated_minutes, due_date: editingTask.due_date }}
              onChange={(v) => setEditingTask({ ...editingTask, ...v })}
              onSubmit={updateTask} submitLabel="Salvar Alterações"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Day Detail Dialog */}
      <Dialog open={dayDetailOpen} onOpenChange={setDayDetailOpen}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              {selectedDay ? format(selectedDay, "EEEE, dd 'de' MMMM", { locale: ptBR }) : ""}
            </DialogTitle>
          </DialogHeader>
          <DayDetailHabits
            selectedDay={selectedDay}
            selectedDayTasks={selectedDayTasks}
            habits={habits}
            todayCompletedHabits={completedHabits}
            userId={user?.id}
            TaskCard={TaskCard}
          />
        </DialogContent>
      </Dialog>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: <Target className="h-4 w-4 text-primary" />, label: "Tarefas Hoje", value: `${doneTasks}/${totalTasks}`, sub: `${Math.round(taskProgress)}%`, bg: "bg-primary/10" },
          { icon: <Flame className="h-4 w-4 text-orange-400" />, label: "Hábitos Hoje", value: `${completedCount}/${totalHabits}`, sub: `${Math.round(habitsProgress)}%`, bg: "bg-orange-400/10" },
          { icon: <Zap className="h-4 w-4 text-primary" />, label: "XP Ganho", value: `+${totalXpToday}`, sub: "hoje", bg: "bg-primary/10" },
          { icon: <Trophy className="h-4 w-4 text-yellow-400" />, label: "Performance", value: totalTasks > 0 ? `${Math.round((taskProgress + habitsProgress) / 2)}%` : "—", sub: "geral", bg: "bg-yellow-400/10" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * i }}
            className="rounded-xl border border-border bg-card p-4 flex items-center gap-3 hover:border-primary/20 transition-colors">
            <div className={cn("p-2.5 rounded-lg", s.bg)}>{s.icon}</div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <div className="flex items-baseline gap-1.5">
                <p className="font-bold text-foreground text-lg font-mono leading-tight">{s.value}</p>
                <span className="text-[10px] text-muted-foreground">{s.sub}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Habits Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm">
            <Flame className="h-4 w-4 text-primary" /> Hábitos de Hoje
          </h2>
          <span className="text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">{completedCount}/{totalHabits}</span>
        </div>
        <div className="px-5 pb-2">
          <Progress value={habitsProgress} className="h-1.5" />
        </div>
        <div className="px-5 pb-5">
          {habits.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Cadastre hábitos no módulo de Hábitos para vê-los aqui.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
              {habits.map((habit, i) => (
                <motion.button key={habit.id} onClick={() => toggleHabit(habit.id)}
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.02 * i }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg text-left transition-all border",
                    completedHabits.has(habit.id)
                      ? "bg-primary/10 border-primary/30"
                      : "bg-secondary/30 border-border hover:border-primary/20 hover:bg-secondary/50"
                  )}>
                  <div className={cn(
                    "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                    completedHabits.has(habit.id) ? "border-primary bg-primary" : "border-muted-foreground/30"
                  )}>
                    {completedHabits.has(habit.id) && <CheckSquare className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <span className={cn("text-sm flex-1 truncate", completedHabits.has(habit.id) ? "line-through text-muted-foreground" : "text-foreground")}>{habit.name}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{habit.xp_reward} XP</span>
                </motion.button>
              ))}
            </div>
          )}
        </div>
        <AnimatePresence>
          {allDone && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="px-5 pb-4">
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 text-center flex items-center justify-center gap-2">
                <Star className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">FOCO TOTAL! Bônus de XP desbloqueado! 🔥</span>
                <Star className="h-4 w-4 text-primary" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Kanban View */}
      {view === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((col, ci) => {
            const colTasks = tasks.filter(t => t.status === col);
            const cfg = statusConfig[col];
            return (
              <motion.div key={col} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.05 }}
                className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-primary">{cfg.icon}</span>
                    <h3 className="font-semibold text-foreground text-sm">{cfg.label}</h3>
                  </div>
                  <span className="text-[10px] font-mono bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">{colTasks.length}</span>
                </div>
                <div className="p-3 space-y-2 min-h-[120px] max-h-[480px] overflow-y-auto">
                  <AnimatePresence>
                    {colTasks.map((task) => <TaskCard key={task.id} task={task} />)}
                  </AnimatePresence>
                  {colTasks.length === 0 && (
                    <div className="flex items-center justify-center h-20 text-muted-foreground/40">
                      <p className="text-xs">Sem tarefas</p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Week View */}
      {view === "week" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekRef(subWeeks(weekRef, 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <h3 className="font-semibold text-foreground text-sm">{format(weekStart, "dd MMM", { locale: ptBR })} — {format(weekEnd, "dd MMM yyyy", { locale: ptBR })}</h3>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekRef(addWeeks(weekRef, 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <div className="grid grid-cols-7 gap-px bg-border/30 p-3">
            {weekDays.map((day) => {
              const dayTasks = getTasksForDay(day);
              const today = isToday(day);
              return (
                <div key={day.toISOString()} onClick={() => openDayDetail(day)}
                  className={cn(
                    "rounded-lg border p-2.5 min-h-[130px] cursor-pointer transition-all hover:shadow-md",
                    today ? "border-primary/40 bg-primary/5 hover:bg-primary/10" : "border-border/50 bg-secondary/20 hover:border-primary/20"
                  )}>
                  <p className={cn("text-xs font-semibold mb-2", today ? "text-primary" : "text-muted-foreground")}>
                    {format(day, "EEE", { locale: ptBR })} <span className="font-mono">{format(day, "dd")}</span>
                  </p>
                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map(t => (
                      <div key={t.id} className={cn(
                        "text-[10px] px-2 py-1 rounded-md truncate font-medium",
                        t.status === "done" ? "bg-primary/10 text-muted-foreground line-through" : "bg-primary/15 text-foreground"
                      )}>{t.title}</div>
                    ))}
                    {dayTasks.length > 3 && <span className="text-[10px] text-muted-foreground pl-1">+{dayTasks.length - 3} mais</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Month View */}
      {view === "month" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMonthRef(subMonths(monthRef, 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <h3 className="font-semibold text-foreground text-sm capitalize">{format(monthRef, "MMMM yyyy", { locale: ptBR })}</h3>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMonthRef(addMonths(monthRef, 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <div className="p-3">
            <div className="grid grid-cols-7 gap-1 mb-1">
              {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map(d => (
                <div key={d} className="text-[10px] text-center text-muted-foreground font-semibold uppercase tracking-wider py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: (monthStart2.getDay() + 6) % 7 }).map((_, i) => <div key={`e-${i}`} />)}
              {monthDays.map((day) => {
                const dayTasks = getTasksForDay(day);
                const today = isToday(day);
                return (
                  <div key={day.toISOString()} onClick={() => openDayDetail(day)}
                    className={cn(
                      "rounded-lg border p-1.5 min-h-[65px] text-xs cursor-pointer transition-all hover:shadow-sm",
                      today ? "border-primary/40 bg-primary/5" : "border-border/30 hover:border-primary/20"
                    )}>
                    <p className={cn("font-mono font-semibold text-[11px]", today ? "text-primary" : "text-muted-foreground")}>{format(day, "d")}</p>
                    {dayTasks.slice(0, 2).map(t => (
                      <div key={t.id} className="w-full text-left truncate text-[9px] rounded px-1 py-0.5 bg-primary/10 text-foreground mt-0.5 font-medium">{t.title}</div>
                    ))}
                    {dayTasks.length > 2 && <span className="text-[9px] text-muted-foreground">+{dayTasks.length - 2}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Day Summary */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border/50">
          <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Resumo do Dia
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border/30">
          {[
            { value: doneTasks, label: "Tarefas feitas", color: "text-foreground" },
            { value: completedCount, label: "Hábitos feitos", color: "text-foreground" },
            { value: totalXpToday, label: "XP ganho", color: "text-primary" },
            { value: `${Math.round((taskProgress + habitsProgress) / 2)}%`, label: "Performance", color: "text-foreground" },
          ].map((item, i) => (
            <div key={i} className="p-5 text-center">
              <p className={cn("text-2xl font-bold font-mono", item.color)}>{item.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
