import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Zap, Crown, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function RankingPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).single().then(({ data }) => {
      if (data) setProfile(data);
    });
  }, [user]);

  // Achievements based on current user data
  const achievements = [
    { name: "Primeiro Passo", desc: "Criou sua conta no TRILHA", icon: "🎯", earned: true },
    { name: "7 dias Consistentes", desc: "7 dias seguidos completando hábitos", icon: "🔥", earned: false },
    { name: "30 dias de Disciplina", desc: "30 dias de streak", icon: "💪", earned: false },
    { name: "Meta Concluída", desc: "Concluiu sua primeira meta", icon: "🏆", earned: false },
    { name: "Investidor Iniciante", desc: "Registrou primeiro investimento", icon: "📈", earned: false },
    { name: "3 Meses no Azul", desc: "3 meses consecutivos com saldo positivo", icon: "💰", earned: false },
    { name: "Executor Implacável", desc: "Concluiu 100 tarefas", icon: "⚡", earned: false },
    { name: "Disciplina de Ferro", desc: "60 dias de streak ininterrupto", icon: "🛡️", earned: false },
  ];

  const levelTitle = (level: number) => {
    if (level >= 50) return "Lenda";
    if (level >= 30) return "Mestre";
    if (level >= 20) return "Especialista";
    if (level >= 10) return "Avançado";
    if (level >= 5) return "Intermediário";
    return "Iniciante";
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Trophy className="h-6 w-6 text-primary" /> Ranking & Conquistas</h1>
        <p className="text-sm text-muted-foreground mt-1">Acompanhe sua evolução e desbloqueie conquistas</p>
      </motion.div>

      {/* User card */}
      {profile && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-primary/30 bg-primary/5 p-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center"><Crown className="h-8 w-8 text-primary" /></div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground">{profile.full_name || "Usuário"}</h2>
              <div className="flex items-center gap-3 mt-1">
                <Badge className="bg-primary/20 text-primary">Nível {profile.level}</Badge>
                <Badge variant="outline">{levelTitle(profile.level)}</Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1"><Zap className="h-4 w-4 text-primary" />{profile.xp} XP</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Achievements */}
      <div>
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Medal className="h-5 w-5 text-primary" /> Conquistas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {achievements.map((ach, i) => (
            <motion.div key={ach.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className={`p-4 rounded-xl border transition-colors ${ach.earned ? "border-primary/30 bg-primary/5" : "border-border bg-card opacity-50"}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{ach.icon}</span>
                <div>
                  <p className={`font-medium ${ach.earned ? "text-foreground" : "text-muted-foreground"}`}>{ach.name}</p>
                  <p className="text-xs text-muted-foreground">{ach.desc}</p>
                </div>
                {ach.earned && <Badge className="ml-auto bg-primary/20 text-primary text-xs">✓</Badge>}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Como ganhar XP</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>⚡ Concluir tarefas: +10 XP por tarefa</p>
          <p>🔥 Completar hábitos: +5 XP por hábito</p>
          <p>🎯 Atingir metas: +50 XP por meta</p>
          <p>💰 Registrar transações: +2 XP</p>
          <p>📈 Realizar aportes: +10 XP</p>
          <p>⭐ Modo Foco Total: +25 XP bônus</p>
        </div>
      </div>
    </div>
  );
}
