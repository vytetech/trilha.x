import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Settings, User, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [currency, setCurrency] = useState("BRL");
  const [savingsGoal, setSavingsGoal] = useState("0");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setFullName(data.full_name || "");
          setCurrency(data.preferred_currency || "BRL");
          setSavingsGoal(String(data.monthly_savings_goal || 0));
        }
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        preferred_currency: currency,
        monthly_savings_goal: Number(savingsGoal),
      })
      .eq("user_id", user.id);
    setIsLoading(false);
    if (error) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } else {
      toast({ title: "Configurações salvas!" });
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl space-y-8">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <User className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Perfil</h2>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome completo</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-secondary border-border" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled className="bg-muted border-border opacity-60" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Moeda preferida</Label>
              <Input value={currency} onChange={(e) => setCurrency(e.target.value)} className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label>Meta mensal (R$)</Label>
              <Input type="number" value={savingsGoal} onChange={(e) => setSavingsGoal(e.target.value)} className="bg-secondary border-border" />
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={isLoading} className="gap-2">
          <Save className="h-4 w-4" />
          {isLoading ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </motion.div>
  );
}
