import { motion } from "framer-motion";
import { CheckCircle2, Clock, Zap, Sparkles, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const roadmap = [
  {
    quarter: "Q1 2026",
    status: "done",
    label: "Concluído",
    items: [
      "Lançamento da plataforma TRILHA.X",
      "Módulo de Tarefas & Kanban",
      "Módulo de Hábitos com streaks",
      "Sistema de XP e níveis",
      "Autenticação e perfis de usuário",
      "Dashboard com radar de atributos",
    ],
  },
  {
    quarter: "Q2 2026",
    status: "done",
    label: "Concluído",
    items: [
      "Módulo Financeiro completo",
      "Cartões de crédito e parcelamentos",
      "Módulo de Investimentos com brapi",
      "Módulo de Sonhos",
      "Planos Pro e Ultimate",
      "Integração com Stripe",
    ],
  },
  {
    quarter: "Q3 2026",
    status: "current",
    label: "Em andamento",
    items: [
      "App mobile (iOS & Android)",
      "Notificações push de hábitos",
      "Relatórios avançados com IA",
      "Exportação PDF/Excel aprimorada",
      "Integração com Google Calendar",
      "Modo offline",
    ],
  },
  {
    quarter: "Q4 2026",
    status: "planned",
    label: "Planejado",
    items: [
      "Módulo de Aprendizado",
      "TRILHA.X para equipes (Business)",
      "API pública para desenvolvedores",
      "Integrações com Notion e Obsidian",
      "Widget para desktop",
      "Gamificação social avançada",
    ],
  },
];

const statusConfig = {
  done: {
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/30",
    icon: CheckCircle2,
  },
  current: {
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    border: "border-yellow-400/30",
    icon: Zap,
  },
  planned: {
    color: "text-muted-foreground",
    bg: "bg-muted/50",
    border: "border-border",
    icon: Clock,
  },
};

export default function RoadmapPage() {
  const navigate = useNavigate();
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-16 sm:pb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline underline-offset-4 transition-all duration-200 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao início
        </button>

        <span className="text-sm font-medium text-primary mb-4 block">
          ROADMAP
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-foreground mb-3">
          O futuro do <span className="neon-text">TRILHA.X</span>
        </h1>
        <p className="text-muted-foreground mb-16 max-w-xl">
          Veja o que já foi construído e o que está por vir. Trabalhamos
          continuamente para elevar sua experiência.
        </p>

        <div className="space-y-4 sm:space-y-6">
          {roadmap.map((phase, i) => {
            const cfg = statusConfig[phase.status as keyof typeof statusConfig];
            const Icon = cfg.icon;
            return (
              <motion.div
                key={phase.quarter}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-2xl border ${cfg.border} bg-card p-6`}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className={`p-2 rounded-lg ${cfg.bg}`}>
                    <Icon className={`h-5 w-5 ${cfg.color}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">
                      {phase.quarter}
                    </h3>
                    <Badge
                      variant="outline"
                      className={`text-[10px] mt-0.5 ${cfg.color} border-current`}
                    >
                      {phase.label}
                    </Badge>
                  </div>
                </div>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {phase.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <CheckCircle2
                        className={`h-3.5 w-3.5 shrink-0 ${phase.status === "planned" ? "opacity-30" : cfg.color}`}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-12 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="font-bold text-foreground mb-2">Tem uma sugestão?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Adoramos ouvir nossa comunidade. Envie sua ideia e ela pode entrar
            no próximo roadmap.
          </p>
          <a href="mailto:trilha.x@gmail.com">
            <Button variant="outline" size="sm" className="gap-2">
              Enviar sugestão
            </Button>
          </a>
        </div>
      </motion.div>
    </div>
  );
}
