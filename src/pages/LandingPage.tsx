import { motion } from "framer-motion";
import { Zap, CheckSquare, Target, Wallet, TrendingUp, Flame, Trophy, BarChart3, Sparkles, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const features = [
  { icon: CheckSquare, title: "Tarefas Inteligentes", desc: "Kanban com prioridades, subtarefas e XP por conclusão." },
  { icon: Flame, title: "Hábitos & Streaks", desc: "Crie hábitos e mantenha sequências que evoluem seus atributos." },
  { icon: Target, title: "Metas Gamificadas", desc: "Defina metas com marcos, medalhas e projeções inteligentes." },
  { icon: Wallet, title: "Controle Financeiro", desc: "Receitas, despesas, orçamentos e gráficos detalhados." },
  { icon: TrendingUp, title: "Investimentos", desc: "Portfólio completo com simulador de aportes e alocação." },
  { icon: BarChart3, title: "Relatórios", desc: "Radar de atributos e análise completa da sua evolução." },
];

const plans = [
  {
    name: "Free", price: "R$ 0", period: "/mês", features: ["5 tarefas ativas", "3 hábitos", "2 metas", "Financeiro básico", "Dashboard"], cta: "Começar Grátis", highlight: false,
  },
  {
    name: "Pro", price: "R$ 19,90", period: "/mês", features: ["Tarefas ilimitadas", "Hábitos ilimitados", "Metas ilimitadas", "Investimentos", "Relatórios avançados", "Simuladores", "Ranking", "Suporte prioritário"], cta: "Assinar Pro", highlight: true,
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 glass-strong">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2"><Zap className="h-6 w-6 text-primary" /><span className="text-xl font-bold gradient-text">TRILHA</span></div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/login")}>Entrar</Button>
            <Button onClick={() => navigate("/signup")} className="gap-2">Começar <ArrowRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-6">🚀 Produtividade gamificada</Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
              Transforme sua vida em um <span className="neon-text">jogo de evolução</span>
            </h1>
            <p className="text-lg text-muted-foreground mt-6 max-w-2xl mx-auto">
              Organize tarefas, construa hábitos, controle finanças e conquiste metas — tudo em uma plataforma que te recompensa por cada passo.
            </p>
            <div className="flex gap-4 justify-center mt-8">
              <Button size="lg" onClick={() => navigate("/signup")} className="gap-2 text-lg px-8">Começar Grátis <ArrowRight className="h-5 w-5" /></Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>Ver recursos</Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-3 gap-8 mt-16 max-w-lg mx-auto">
            <div><p className="text-2xl font-bold neon-text">6+</p><p className="text-xs text-muted-foreground">Módulos</p></div>
            <div><p className="text-2xl font-bold neon-text">∞</p><p className="text-xs text-muted-foreground">Potencial</p></div>
            <div><p className="text-2xl font-bold neon-text">100%</p><p className="text-xs text-muted-foreground">Gamificado</p></div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">Tudo que você precisa para <span className="neon-text">evoluir</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="rounded-xl border border-border bg-card p-6 hover:border-primary/30 transition-colors">
                <div className="rounded-lg bg-primary/10 p-3 w-fit mb-4"><f.icon className="h-6 w-6 text-primary" /></div>
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gamification */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Cada ação te faz <span className="neon-text">mais forte</span></h2>
          <p className="text-muted-foreground mb-12">Ganhe XP, suba de nível, desbloqueie conquistas e evolua seus atributos pessoais.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[{ icon: "⚡", label: "XP & Níveis", desc: "Ganhe pontos por cada ação" }, { icon: "🔥", label: "Streaks", desc: "Mantenha a consistência" }, { icon: "🏆", label: "Conquistas", desc: "Desbloqueie medalhas" }, { icon: "📊", label: "Atributos", desc: "Evolua seu radar pessoal" }].map((item) => (
              <div key={item.label} className="rounded-xl border border-border bg-card p-5">
                <span className="text-3xl">{item.icon}</span>
                <h3 className="font-semibold text-foreground mt-3 mb-1">{item.label}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">Planos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {plans.map((plan) => (
              <div key={plan.name} className={`rounded-xl border p-6 ${plan.highlight ? "border-primary/50 bg-primary/5 neon-glow" : "border-border bg-card"}`}>
                {plan.highlight && <Badge className="bg-primary text-primary-foreground mb-3">Mais popular</Badge>}
                <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1"><span className="text-3xl font-bold text-foreground">{plan.price}</span><span className="text-muted-foreground">{plan.period}</span></div>
                <ul className="mt-6 space-y-2">
                  {plan.features.map((f) => <li key={f} className="text-sm text-muted-foreground flex items-center gap-2"><Star className="h-3 w-3 text-primary flex-shrink-0" />{f}</li>)}
                </ul>
                <Button className="w-full mt-6" variant={plan.highlight ? "default" : "outline"} onClick={() => navigate("/signup")}>{plan.cta}</Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Pronto para <span className="neon-text">evoluir</span>?</h2>
          <p className="text-muted-foreground mb-8">Comece gratuitamente e transforme cada dia em progresso real.</p>
          <Button size="lg" onClick={() => navigate("/signup")} className="gap-2 text-lg px-10">Criar conta grátis <ArrowRight className="h-5 w-5" /></Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /><span className="font-bold gradient-text">TRILHA</span></div>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} TRILHA. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
