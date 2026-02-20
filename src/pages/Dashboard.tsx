import { motion } from "framer-motion";
import { Wallet, Target, CheckSquare, TrendingUp, Zap, Flame } from "lucide-react";
import StatCard from "@/components/StatCard";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {
  const { user } = useAuth();
  const name = user?.user_metadata?.full_name || "Usuário";

  return (
    <div className="space-y-8 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground">
          Olá, <span className="neon-text">{name.split(" ")[0]}</span> 👋
        </h1>
        <p className="text-muted-foreground mt-1">Aqui está seu resumo de hoje</p>
      </motion.div>

      {/* XP Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-border bg-card p-5"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Nível 1</span>
            <span className="text-sm text-muted-foreground">• 0 XP</span>
          </div>
          <span className="text-sm text-muted-foreground">Próximo nível: 100 XP</span>
        </div>
        <Progress value={0} className="h-2" />
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Saldo do mês" value="R$ 0,00" icon={Wallet} trend="+0%" trendUp />
        <StatCard title="Metas ativas" value="0" icon={Target} subtitle="0 concluídas" />
        <StatCard title="Tarefas hoje" value="0" icon={CheckSquare} subtitle="0 pendentes" />
        <StatCard title="Streak" value="0 dias" icon={Flame} subtitle="Continue firme!" />
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Investimentos
          </h3>
          <p className="text-sm text-muted-foreground">Acompanhe seus investimentos e patrimônio.</p>
          <div className="mt-4 text-3xl font-bold font-mono text-foreground">R$ 0,00</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" /> Próxima meta
          </h3>
          <p className="text-sm text-muted-foreground">Defina suas metas para começar a acompanhar.</p>
          <div className="mt-4">
            <Progress value={0} className="h-2" />
            <span className="text-xs text-muted-foreground mt-1 block">0% concluído</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
