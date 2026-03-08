import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Plus, Trash2, Clock, Edit2, PiggyBank, Target, TrendingUp, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Dream {
  id: string;
  title: string;
  description: string | null;
  target_amount: number | null;
  current_amount: number;
  target_date: string | null;
  priority: string;
  status: string;
}

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

export default function DreamsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addValueDreamId, setAddValueDreamId] = useState<string | null>(null);
  const [addValueAmount, setAddValueAmount] = useState("");
  const [form, setForm] = useState({ title: "", description: "", target_amount: "", target_date: "", priority: "medium" });
  const [editForm, setEditForm] = useState<{ id: string; title: string; description: string; target_amount: string; target_date: string; priority: string }>({ id: "", title: "", description: "", target_amount: "", target_date: "", priority: "medium" });

  const fetchData = async () => {
    if (!user) return;
    const { data } = await supabase.from("dreams").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setDreams(data);
  };

  useEffect(() => { fetchData(); }, [user]);

  const createDream = async () => {
    if (!user || !form.title.trim()) return;
    await supabase.from("dreams").insert({
      user_id: user.id, title: form.title, description: form.description || null,
      target_amount: form.target_amount ? Number(form.target_amount) : null, target_date: form.target_date || null, priority: form.priority,
    });
    setForm({ title: "", description: "", target_amount: "", target_date: "", priority: "medium" });
    setDialogOpen(false);
    fetchData();
    toast({ title: "Sonho adicionado! ✨" });
  };

  const editDream = async () => {
    if (!editForm.id || !editForm.title.trim()) return;
    await supabase.from("dreams").update({
      title: editForm.title,
      description: editForm.description || null,
      target_amount: editForm.target_amount ? Number(editForm.target_amount) : null,
      target_date: editForm.target_date || null,
      priority: editForm.priority,
    }).eq("id", editForm.id);
    setEditDialogOpen(false);
    fetchData();
    toast({ title: "Sonho atualizado!" });
  };

  const openEdit = (dream: Dream) => {
    setEditForm({
      id: dream.id,
      title: dream.title,
      description: dream.description || "",
      target_amount: dream.target_amount ? String(dream.target_amount) : "",
      target_date: dream.target_date || "",
      priority: dream.priority,
    });
    setEditDialogOpen(true);
  };

  const addValue = async (dreamId: string) => {
    const amount = Number(addValueAmount);
    if (!amount || amount <= 0) return;
    const dream = dreams.find(d => d.id === dreamId);
    if (!dream) return;
    const newAmount = Number(dream.current_amount) + amount;
    const status = dream.target_amount && newAmount >= Number(dream.target_amount) ? "completed" : "active";
    await supabase.from("dreams").update({ current_amount: newAmount, status }).eq("id", dreamId);
    if (status === "completed") toast({ title: "Sonho realizado! 🎉🎉" });
    else toast({ title: `+${fmt(amount)} adicionado!` });
    setAddValueDreamId(null);
    setAddValueAmount("");
    fetchData();
  };

  const deleteDream = async (id: string) => {
    await supabase.from("dreams").delete().eq("id", id);
    fetchData();
    toast({ title: "Sonho removido" });
  };

  // Stats
  const activeDreams = dreams.filter(d => d.status === "active");
  const completedDreams = dreams.filter(d => d.status === "completed");
  const totalTarget = dreams.reduce((a, d) => a + (Number(d.target_amount) || 0), 0);
  const totalSaved = dreams.reduce((a, d) => a + Number(d.current_amount), 0);
  const overallPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  const getDaysRemaining = (date: string | null) => {
    if (!date) return null;
    const diff = new Date(date).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getMonthlyNeeded = (dream: Dream) => {
    if (!dream.target_amount || !dream.target_date) return null;
    const remaining = Number(dream.target_amount) - Number(dream.current_amount);
    if (remaining <= 0) return null;
    const months = Math.max(1, Math.ceil((new Date(dream.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)));
    return remaining / months;
  };

  const formFields = (f: typeof form, setF: (v: typeof form) => void) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Título</Label>
        <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className="bg-secondary border-border" placeholder="Ex: Viagem para o Japão" />
      </div>
      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className="bg-secondary border-border resize-none" rows={2} placeholder="Descreva seu sonho..." />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Valor alvo (R$)</Label>
          <Input type="number" value={f.target_amount} onChange={(e) => setF({ ...f, target_amount: e.target.value })} className="bg-secondary border-border" placeholder="0,00" />
        </div>
        <div className="space-y-2">
          <Label>Data alvo</Label>
          <Input type="date" value={f.target_date} onChange={(e) => setF({ ...f, target_date: e.target.value })} className="bg-secondary border-border" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Prioridade</Label>
        <Select value={f.priority} onValueChange={(v) => setF({ ...f, priority: v })}>
          <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="low">🟢 Baixa</SelectItem>
            <SelectItem value="medium">🟡 Média</SelectItem>
            <SelectItem value="high">🔥 Alta</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Sparkles className="h-6 w-6 text-primary" /> Sonhos</h1>
          <p className="text-sm text-muted-foreground mt-1">Visualize e conquiste seus maiores objetivos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Novo Sonho</Button></DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>Adicionar Sonho</DialogTitle></DialogHeader>
            {formFields(form, setForm)}
            <Button onClick={createDream} className="w-full">Adicionar</Button>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Summary cards */}
      {dreams.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <Sparkles className="h-5 w-5 text-primary" />, label: "Ativos", value: String(activeDreams.length), bg: "bg-primary/10" },
            { icon: <CheckCircle2 className="h-5 w-5 text-primary" />, label: "Realizados", value: String(completedDreams.length), bg: "bg-primary/10" },
            { icon: <PiggyBank className="h-5 w-5 text-accent-foreground" />, label: "Total Guardado", value: fmt(totalSaved), bg: "bg-accent/10" },
            { icon: <Target className="h-5 w-5 text-muted-foreground" />, label: "Progresso Geral", value: `${overallPct}%`, bg: "bg-muted" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.bg}`}>{s.icon}</div>
              <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="font-bold text-foreground font-mono text-sm">{s.value}</p></div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Dream cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dreams.map((dream, i) => {
          const pct = dream.target_amount ? Math.round((Number(dream.current_amount) / Number(dream.target_amount)) * 100) : 0;
          const daysLeft = getDaysRemaining(dream.target_date);
          const monthlyNeeded = getMonthlyNeeded(dream);
          const isCompleted = dream.status === "completed";
          const priorityColor = dream.priority === "high" ? "text-destructive" : dream.priority === "medium" ? "text-yellow-400" : "text-primary";

          return (
            <motion.div key={dream.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`rounded-xl border p-5 group transition-all ${isCompleted ? "border-primary/30 bg-primary/5" : "border-border bg-card hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground truncate">{dream.title}</h3>
                    {isCompleted && <Badge className="bg-primary/20 text-primary border-none text-xs">✨ Realizado</Badge>}
                  </div>
                  {dream.description && <p className="text-xs text-muted-foreground line-clamp-2">{dream.description}</p>}
                </div>
                <div className="flex items-center gap-1 ml-2 shrink-0">
                  <Badge variant="outline" className={`text-xs ${priorityColor} border-current/20`}>
                    {dream.priority === "high" ? "🔥 Alta" : dream.priority === "medium" ? "🟡 Média" : "🟢 Baixa"}
                  </Badge>
                  {!isCompleted && (
                    <button onClick={() => openEdit(dream)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-all p-1 rounded-md hover:bg-primary/10">
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                  <button onClick={() => deleteDream(dream.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1 rounded-md hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Progress */}
              {dream.target_amount && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className={`font-bold font-mono ${pct >= 100 ? "text-primary" : "text-foreground"}`}>{pct}%</span>
                  </div>
                  <Progress value={Math.min(pct, 100)} className={`h-2.5 ${isCompleted ? "[&>div]:bg-primary" : ""}`} />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="font-mono">{fmt(Number(dream.current_amount))}</span>
                    <span className="font-mono">{fmt(Number(dream.target_amount))}</span>
                  </div>
                </div>
              )}

              {/* Meta info */}
              <div className="flex flex-wrap gap-3 mt-3">
                {dream.target_date && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(dream.target_date).toLocaleDateString("pt-BR")}</span>
                    {daysLeft !== null && !isCompleted && (
                      <Badge variant="outline" className={`text-xs ml-1 ${daysLeft < 30 ? "text-destructive border-destructive/20" : daysLeft < 90 ? "text-yellow-400 border-yellow-400/20" : "text-muted-foreground"}`}>
                        {daysLeft > 0 ? `${daysLeft}d restantes` : "Prazo expirado"}
                      </Badge>
                    )}
                  </div>
                )}
                {monthlyNeeded && !isCompleted && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    <span>{fmt(monthlyNeeded)}/mês necessário</span>
                  </div>
                )}
              </div>

              {/* Add value section */}
              {!isCompleted && dream.target_amount && (
                <div className="mt-4">
                  <AnimatePresence mode="wait">
                    {addValueDreamId === dream.id ? (
                      <motion.div key="input" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Valor a adicionar"
                          value={addValueAmount}
                          onChange={(e) => setAddValueAmount(e.target.value)}
                          className="bg-secondary border-border h-9 text-sm flex-1"
                          autoFocus
                          onKeyDown={(e) => { if (e.key === "Enter") addValue(dream.id); if (e.key === "Escape") { setAddValueDreamId(null); setAddValueAmount(""); } }}
                        />
                        <Button size="sm" className="h-9 px-3" onClick={() => addValue(dream.id)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-9 px-2 text-muted-foreground" onClick={() => { setAddValueDreamId(null); setAddValueAmount(""); }}>
                          <X className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div key="button" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Button variant="outline" size="sm" className="w-full gap-2 border-dashed border-primary/30 text-primary hover:bg-primary/10 hover:text-primary" onClick={() => setAddValueDreamId(dream.id)}>
                          <PiggyBank className="h-4 w-4" /> Adicionar Valor
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {dreams.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Sparkles className="h-14 w-14 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium mb-1">Nenhum sonho cadastrado</p>
          <p className="text-sm opacity-70">Comece a sonhar grande! Adicione seu primeiro sonho.</p>
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Editar Sonho</DialogTitle></DialogHeader>
          {formFields(editForm, (v) => setEditForm({ ...editForm, ...v }))}
          <Button onClick={editDream} className="w-full">Salvar Alterações</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
