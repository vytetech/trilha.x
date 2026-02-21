import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Plus, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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

export default function DreamsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", target_amount: "", target_date: "", priority: "medium" });

  const fetchData = async () => {
    if (!user) return;
    const { data } = await supabase.from("dreams").select("*").eq("user_id", user.id).order("priority", { ascending: false });
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

  const updateAmount = async (id: string, amount: number) => {
    const dream = dreams.find((d) => d.id === id);
    const status = dream?.target_amount && amount >= Number(dream.target_amount) ? "completed" : "active";
    await supabase.from("dreams").update({ current_amount: amount, status }).eq("id", id);
    if (status === "completed") toast({ title: "Sonho realizado! 🎉🎉" });
    fetchData();
  };

  const deleteDream = async (id: string) => {
    await supabase.from("dreams").delete().eq("id", id);
    fetchData();
  };

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

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
            <div className="space-y-4">
              <div className="space-y-2"><Label>Título</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-secondary border-border" placeholder="Ex: Viagem para o Japão" /></div>
              <div className="space-y-2"><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-secondary border-border" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Valor alvo (R$)</Label><Input type="number" value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} className="bg-secondary border-border" /></div>
                <div className="space-y-2"><Label>Data alvo</Label><Input type="date" value={form.target_date} onChange={(e) => setForm({ ...form, target_date: e.target.value })} className="bg-secondary border-border" /></div>
              </div>
              <div className="space-y-2"><Label>Prioridade</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="low">Baixa</SelectItem><SelectItem value="medium">Média</SelectItem><SelectItem value="high">Alta</SelectItem></SelectContent>
                </Select>
              </div>
              <Button onClick={createDream} className="w-full">Adicionar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dreams.map((dream, i) => {
          const pct = dream.target_amount ? Math.round((Number(dream.current_amount) / Number(dream.target_amount)) * 100) : 0;
          return (
            <motion.div key={dream.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`rounded-xl border p-5 group transition-colors ${dream.status === "completed" ? "border-primary/30 bg-primary/5" : "border-border bg-card hover:border-primary/20"}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground">{dream.title}</h3>
                  {dream.description && <p className="text-xs text-muted-foreground mt-1">{dream.description}</p>}
                </div>
                <div className="flex gap-1">
                  <Badge variant="outline" className="text-xs">{dream.priority === "high" ? "🔥 Alta" : dream.priority === "medium" ? "Média" : "Baixa"}</Badge>
                  <button onClick={() => deleteDream(dream.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              {dream.target_amount && (
                <>
                  <Progress value={pct} className="h-2 mb-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{fmt(Number(dream.current_amount))} / {fmt(Number(dream.target_amount))}</span>
                    <span>{pct}%</span>
                  </div>
                </>
              )}
              {dream.target_date && <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(dream.target_date).toLocaleDateString("pt-BR")}</p>}
              {dream.status !== "completed" && dream.target_amount && (
                <div className="mt-3">
                  <Input type="number" placeholder="Atualizar valor" className="bg-secondary border-border h-8 text-sm" onKeyDown={(e) => { if (e.key === "Enter") updateAmount(dream.id, Number((e.target as HTMLInputElement).value)); }} />
                </div>
              )}
              {dream.status === "completed" && <p className="text-sm neon-text font-semibold mt-3 text-center">✨ Sonho Realizado!</p>}
            </motion.div>
          );
        })}
      </div>
      {dreams.length === 0 && <div className="text-center py-12 text-muted-foreground"><Sparkles className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>Nenhum sonho cadastrado. Comece a sonhar grande!</p></div>}
    </div>
  );
}
