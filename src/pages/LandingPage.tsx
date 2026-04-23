import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckSquare,
  Target,
  Wallet,
  TrendingUp,
  Flame,
  Trophy,
  BarChart3,
  ArrowRight,
  Star,
  Sparkles,
  Shield,
  Smartphone,
  Users,
  Calendar,
  Layout,
  Rocket,
  Eye,
  Lock,
  Clock,
  Check,
  X,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import logoTrilha from "@/assets/logo-trilha.x.png";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const modules = [
  {
    icon: Layout,
    title: "Dashboard Inteligente",
    desc: "Visão 360° com radar de atributos, score de performance, saldo, streaks e metas — tudo em uma tela.",
    tag: "Core",
  },
  {
    icon: CheckSquare,
    title: "Tarefas & Kanban",
    desc: "Board Kanban com prioridades, subtarefas, XP por conclusão, visão semanal e mensal integrada.",
    tag: "Produtividade",
  },
  {
    icon: Flame,
    title: "Hábitos & Streaks",
    desc: "Crie hábitos com dias personalizados, acompanhe sequências e evolua seus atributos pessoais.",
    tag: "Consistência",
  },
  {
    icon: Target,
    title: "Metas Gamificadas",
    desc: "Defina metas com marcos, medalhas, projeções inteligentes e destaque para sua meta principal.",
    tag: "Foco",
  },
  {
    icon: Wallet,
    title: "Controle Financeiro",
    desc: "Receitas, despesas, cartões de crédito, orçamentos por categoria e gráficos detalhados.",
    tag: "Finanças",
  },
  {
    icon: TrendingUp,
    title: "Investimentos",
    desc: "Portfólio completo com alocação por tipo, simulador de aportes e histórico de transações.",
    tag: "Patrimônio",
  },
  {
    icon: Sparkles,
    title: "Sonhos",
    desc: "Visualize e planeje seus sonhos com metas financeiras, progresso visual e priorização.",
    tag: "Motivação",
  },
  {
    icon: BarChart3,
    title: "Relatórios",
    desc: "Radar de atributos, análise de produtividade, evolução financeira e exportação PDF.",
    tag: "Análise",
  },
  {
    icon: Trophy,
    title: "Ranking & Conquistas",
    desc: "Desbloqueie medalhas, suba no ranking e compare sua evolução com outros usuários.",
    tag: "Competição",
  },
];

const gamificationFeatures = [
  {
    icon: "⚡",
    title: "XP & Níveis",
    desc: "Cada tarefa, hábito e meta concluída te dá XP. Suba de nível e desbloqueie conquistas.",
  },
  {
    icon: "🔥",
    title: "Streaks",
    desc: "Mantenha sequências diárias nos hábitos. Quanto maior o streak, mais XP bônus você ganha.",
  },
  {
    icon: "🏆",
    title: "Conquistas",
    desc: "Medalhas de bronze, prata e ouro por marcos atingidos em cada módulo do sistema.",
  },
  {
    icon: "📊",
    title: "Radar de Atributos",
    desc: "Foco, Disciplina, Mental, Financeiro, Produtividade e Consistência — visualize sua evolução.",
  },
  {
    icon: "🎯",
    title: "Score de Performance",
    desc: "Um número que resume todo seu progresso diário, semanal e mensal em uma métrica clara.",
  },
  {
    icon: "👑",
    title: "Ranking Global",
    desc: "Compare seu nível e XP com outros usuários e dispute as primeiras posições.",
  },
];

const testimonials = [
  {
    name: "Lucas M.",
    role: "Desenvolvedor",
    text: "O TRILHA.X mudou minha rotina. O sistema de XP é viciante e me faz querer concluir tudo no prazo!",
    avatar: "LM",
  },
  {
    name: "Ana Silva",
    role: "Designer",
    text: "Interface impecável. VyteTech está de parabéns pelo capricho no visual e na experiência.",
    avatar: "AS",
  },
  {
    name: "Pedro Rocha",
    role: "Investidor",
    text: "Finalmente um controle de investimentos que fala a língua de quem quer crescer.",
    avatar: "PR",
  },
  {
    name: "Carla Dias",
    role: "Estudante",
    text: "Minha disciplina subiu 200% com os streaks. Ver a barra de progresso subir é o que eu precisava.",
    avatar: "CD",
  },
  {
    name: "Marcos V.",
    role: "Empreendedor",
    text: "Ferramenta indispensável para quem busca alta performance e gestão de tempo.",
    avatar: "MV",
  },
  {
    name: "Julia L.",
    role: "Freelancer",
    text: "Amo o radar de atributos! Consigo ver exatamente onde preciso focar.",
    avatar: "JL",
  },
];

interface PlanFeature {
  text: string;
  included: boolean;
}
interface Plan {
  name: string;
  badge?: string;
  desc: string;
  monthlyPrice: number;
  annualPrice: number;
  features: PlanFeature[];
  cta: string;
  highlight: boolean;
}

const plans: Plan[] = [
  {
    name: "Free",
    desc: "Para começar sua jornada",
    monthlyPrice: 0,
    annualPrice: 0,
    cta: "Começar Grátis",
    highlight: false,
    features: [
      { text: "5 tarefas ativas", included: true },
      { text: "3 hábitos", included: true },
      { text: "2 metas", included: true },
      { text: "50 transações/mês", included: true },
      { text: "5 investimentos", included: true },
      { text: "Dashboard completo", included: true },
      { text: "Conquistas básicas", included: true },
      { text: "Relatórios avançados", included: false },
      { text: "Exportação PDF/Excel", included: false },
      { text: "Ranking global", included: false },
      { text: "Suporte prioritário", included: false },
    ],
  },
  {
    name: "Pro",
    badge: "Mais popular",
    desc: "Para quem leva a sério",
    monthlyPrice: 19.9,
    annualPrice: 199.9,
    cta: "Assinar Pro",
    highlight: true,
    features: [
      { text: "20 tarefas ativas", included: true },
      { text: "10 hábitos", included: true },
      { text: "10 metas", included: true },
      { text: "200 transações/mês", included: true },
      { text: "20 investimentos", included: true },
      { text: "Dashboard completo", included: true },
      { text: "Todas as conquistas", included: true },
      { text: "Relatórios avançados", included: true },
      { text: "Exportação PDF/Excel", included: true },
      { text: "Ranking global", included: true },
      { text: "Suporte prioritário", included: false },
    ],
  },
  {
    name: "Ultimate",
    badge: "Sem limites",
    desc: "Para os que não aceitam limites",
    monthlyPrice: 39.9,
    annualPrice: 399.9,
    cta: "Assinar Ultimate",
    highlight: false,
    features: [
      { text: "Tarefas ilimitadas", included: true },
      { text: "Hábitos ilimitados", included: true },
      { text: "Metas ilimitadas", included: true },
      { text: "Transações ilimitadas", included: true },
      { text: "Investimentos ilimitados", included: true },
      { text: "Dashboard completo", included: true },
      { text: "Todas as conquistas", included: true },
      { text: "Relatórios avançados", included: true },
      { text: "Exportação PDF/Excel", included: true },
      { text: "Ranking global", included: true },
      { text: "Suporte prioritário", included: true },
    ],
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(false);
  const [email, setEmail] = useState("");

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const getPrice = (p: Plan) =>
    p.monthlyPrice === 0
      ? "R$ 0"
      : `R$ ${(isAnnual ? p.annualPrice : p.monthlyPrice).toFixed(2).replace(".", ",")}`;

  const getPeriod = (p: Plan) =>
    p.monthlyPrice === 0 ? "/mês" : isAnnual ? "/ano" : "/mês";

  const getSaving = (p: Plan) =>
    p.monthlyPrice === 0
      ? null
      : `Economize R$ ${(p.monthlyPrice * 12 - p.annualPrice).toFixed(0)}`;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ── NAVBAR ─────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 glass-strong border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <button
            onClick={scrollToTop}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <img
              src={logoTrilha}
              alt="TRILHA.X"
              className="h-10 w-10 rounded-xl object-cover border-2 border-primary shadow-[0_0_12px_rgba(34,197,94,0.35)]"
            />
            <span className="text-2xl font-black gradient-text tracking-tighter uppercase">
              TRILHA.X
            </span>
          </button>

          <div className="hidden md:flex items-center gap-8">
            {[
              { label: "Módulos", id: "modules" },
              { label: "Gamificação", id: "gamification" },
              { label: "Depoimentos", id: "testimonials" },
              { label: "Planos", id: "pricing" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() =>
                  document
                    .getElementById(item.id)
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center">
            <button
              onClick={() => navigate("/login")}
              className="text-md font-bold text-muted-foreground border border-border rounded-lg px-5 py-3 hover:border-primary hover:text-primary transition-all duration-200"
            >
              Entrar
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────── */}
      <section className="pt-36 pb-28 px-6 relative">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-primary/8 rounded-full blur-[140px] pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center relative">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
          >
            <span className="inline-flex items-center gap-2 text-sm font-medium text-primary border border-primary/20 bg-primary/5 rounded-full px-4 py-1.5 mb-6">
              <Rocket className="h-3.5 w-3.5 animate-bounce-slow" /> Plataforma
              completa de evolução pessoal
            </span>
          </motion.div>
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="text-5xl sm:text-6xl md:text-8xl font-black text-foreground leading-[1] tracking-tighter mb-8"
          >
            Sua vida como um <br />
            <span className="neon-text">jogo de evolução real</span>
          </motion.h1>
          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="text-lg md:text-xl text-muted-foreground mt-6 max-w-2xl mx-auto leading-relaxed"
          >
            Organize tarefas, construa hábitos, controle finanças e conquiste
            metas no <strong className="text-foreground">TRILHA.X</strong>. A
            experiência definitiva em gamificação de produtividade.
          </motion.p>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
            className="flex flex-col sm:flex-row gap-4 justify-center mt-10"
          >
            <Button
              size="lg"
              onClick={() => navigate("/signup")}
              className="text-lg px-10 h-14 font-bold"
            >
              Começar Grátis <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <button
              onClick={() =>
                document
                  .getElementById("modules")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="text-lg px-10 h-14 font-bold text-muted-foreground border border-border rounded-lg hover:border-primary hover:text-primary transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Eye className="h-5 w-5" /> Ver Módulos
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={4}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 max-w-2xl mx-auto"
          >
            {[
              { value: "9", label: "Módulos completos" },
              { value: "6", label: "Atributos de evolução" },
              { value: "∞", label: "Potencial de XP" },
              { value: "100%", label: "Gamificado" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl md:text-4xl font-black neon-text font-mono">
                  {s.value}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── TRUST BADGES ───────────────────────────── */}
      <section className="py-8 px-6 border-y border-border bg-card/50">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-10">
          {[
            { icon: Shield, text: "Dados criptografados" },
            { icon: Smartphone, text: "100% responsivo" },
            { icon: Clock, text: "Atualizações semanais" },
            { icon: Lock, text: "Autenticação segura" },
          ].map((item) => (
            <div
              key={item.text}
              className="flex items-center gap-2 text-muted-foreground"
            >
              <item.icon className="h-5 w-5 text-primary/70" />
              <span className="text-sm font-medium">{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── MODULES ────────────────────────────────── */}
      <section id="modules" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-medium text-primary mb-4 block">
              FUNCIONALIDADES
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Tudo para sua <span className="neon-text">evolução</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              9 módulos integrados que transformam cada ação em progresso real.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((m, i) => (
              <motion.div
                key={m.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="group rounded-2xl border border-border bg-card p-6 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="rounded-xl bg-primary/10 p-3 text-primary group-hover:scale-110 group-hover:bg-primary/20 transition-all">
                    <m.icon className="h-6 w-6" />
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] uppercase tracking-widest"
                  >
                    {m.tag}
                  </Badge>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {m.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {m.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GAMIFICATION ───────────────────────────── */}
      <section
        id="gamification"
        className="py-28 px-6 border-t border-border bg-primary/[0.01]"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-medium text-primary mb-4 block">
              GAMIFICAÇÃO
            </span>
            <h2 className="text-4xl md:text-5xl font-bold">
              Cada ação te faz <span className="neon-text">mais forte</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gamificationFeatures.map((item, i) => (
              <motion.div
                key={item.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="rounded-2xl border border-border bg-card/50 p-8 hover:bg-card hover:border-primary/30 transition-all"
              >
                <span className="text-4xl block mb-4">{item.icon}</span>
                <h3 className="font-bold text-xl mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────── */}
      <section className="py-28 px-6 relative overflow-hidden bg-card/20 border-y border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-medium text-primary mb-4 block">
              COMO FUNCIONA
            </span>
            <h2 className="text-4xl md:text-5xl font-bold">
              3 passos para <span className="neon-text">começar</span>
            </h2>
            <p className="text-muted-foreground mt-4">
              Siga o fluxo para atingir o próximo nível.
            </p>
          </div>
          <div className="relative">
            <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent z-0" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative z-10">
              {[
                {
                  step: "01",
                  icon: Users,
                  title: "Crie sua conta",
                  desc: "Acesso imediato e simplificado ao ecossistema TRILHA.X.",
                },
                {
                  step: "02",
                  icon: Calendar,
                  title: "Defina seus Pilares",
                  desc: "Personalize seus hábitos, metas financeiras e tarefas diárias.",
                },
                {
                  step: "03",
                  icon: Rocket,
                  title: "Evolua e Conquiste",
                  desc: "Receba XP em tempo real e visualize sua evolução nos gráficos.",
                },
              ].map((s, i) => (
                <div
                  key={s.step}
                  className="flex flex-col items-center text-center"
                >
                  <div className="relative mb-8">
                    <div className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-primary text-primary-foreground font-black flex items-center justify-center text-lg shadow-lg z-20">
                      {s.step}
                    </div>
                    <div className="w-24 h-24 rounded-2xl bg-background border-2 border-primary/50 flex items-center justify-center shadow-xl hover:border-primary transition-all duration-500">
                      <s.icon className="h-10 w-10 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{s.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-[280px]">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────── */}
      <section
        id="testimonials"
        className="py-28 px-6 bg-primary/[0.01] border-b border-border overflow-hidden"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-medium text-primary mb-4 block">
              DEPOIMENTOS
            </span>
            <h2 className="text-4xl md:text-5xl font-bold">
              Quem usa <span className="neon-text">evolui</span>
            </h2>
            <p className="text-muted-foreground mt-4">
              Acompanhe quem já está no próximo nível
            </p>
          </div>
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="break-inside-avoid bg-card/60 backdrop-blur-sm border border-border p-8 rounded-3xl hover:border-primary/40 transition-all cursor-default group"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    {t.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">
                      {t.name}
                    </h4>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                      {t.role}
                    </p>
                  </div>
                  <div className="ml-auto flex gap-0.5">
                    {[...Array(5)].map((_, j) => (
                      <Star
                        key={j}
                        className="h-3 w-3 fill-primary text-primary"
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed italic font-medium">
                  "{t.text}"
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ────────────────────────────────── */}
      <section id="pricing" className="py-28 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto text-center">
          <span className="text-sm font-medium text-primary mb-4 block">
            PLANOS
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Escolha seu <span className="neon-text">caminho</span>
          </h2>
          <p className="text-muted-foreground mb-10">
            Comece grátis. Evolua quando quiser.
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4 mb-16">
            <span
              className={`text-sm font-medium transition-colors ${!isAnnual ? "text-foreground font-bold" : "text-muted-foreground"}`}
            >
              Mensal
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${isAnnual ? "bg-primary" : "bg-muted"}`}
            >
              <div
                className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${isAnnual ? "left-8" : "left-1"}`}
              />
            </button>
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-medium transition-colors ${isAnnual ? "text-foreground font-bold" : "text-muted-foreground"}`}
              >
                Anual
              </span>
              <Badge className="bg-primary text-primary-foreground text-[10px]">
                2 meses grátis
              </Badge>
            </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className={`rounded-3xl border p-8 flex flex-col text-left transition-all relative ${
                  plan.highlight
                    ? "border-primary bg-primary/[0.03] scale-105 shadow-2xl shadow-primary/10"
                    : "border-border bg-card"
                }`}
              >
                {/* Badge do plano */}
                {plan.badge && (
                  <Badge
                    className={`absolute -top-3 left-6 text-[10px] px-3 py-1 ${
                      plan.highlight
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground border border-border"
                    }`}
                  >
                    {plan.badge}
                  </Badge>
                )}

                <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {plan.desc}
                </p>

                {/* Preço */}
                <div className="mb-2">
                  <span className="text-5xl font-black">{getPrice(plan)}</span>
                  <span className="text-muted-foreground text-sm ml-1">
                    {getPeriod(plan)}
                  </span>
                </div>

                {/* Economia anual */}
                {isAnnual && plan.monthlyPrice !== 0 ? (
                  <div className="mb-6">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
                      🎉 {getSaving(plan)} comparado ao mensal
                    </span>
                  </div>
                ) : (
                  <div className="mb-6 h-7" />
                )}

                <ul className="space-y-3.5 flex-1 mb-8">
                  {plan.features.map((f) => (
                    <li
                      key={f.text}
                      className={`text-sm flex items-center gap-3 ${f.included ? "text-foreground" : "text-muted-foreground/40 line-through"}`}
                    >
                      {f.included ? (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      ) : (
                        <X className="h-4 w-4 shrink-0" />
                      )}
                      {f.text}
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.highlight ? "default" : "outline"}
                  size="lg"
                  className="w-full font-bold py-6"
                  onClick={() => navigate("/signup")}
                >
                  {plan.cta}
                </Button>

                {plan.monthlyPrice === 0 && (
                  <p className="text-center text-xs text-muted-foreground mt-3">
                    Sem cartão de crédito
                  </p>
                )}
              </motion.div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground mt-10 flex items-center justify-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-primary/60" />
            Cancele quando quiser · Sem taxas ocultas · Pagamento seguro via
            Stripe
          </p>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────── */}
      <section className="py-28 px-6 border-t border-border relative overflow-hidden bg-card/10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent pointer-events-none" />
        <div className="max-w-2xl mx-auto text-center relative">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-8">
            <img
              src={logoTrilha}
              alt="TRILHA.X"
              className="h-20 w-20 rounded-2xl object-cover border-2 border-primary/60 shadow-lg shadow-primary/20"
            />
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4">
            Pronto para <span className="neon-text">evoluir</span>?
          </h2>
          <p className="text-muted-foreground mb-10 max-w-md mx-auto text-lg">
            Junte-se ao TRILHA.X e transforme cada dia em progresso real. Comece
            gratuitamente.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/signup")}
            className="text-lg px-12 h-14 font-bold shadow-xl shadow-primary/20"
          >
            Criar conta grátis <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            Sem cartão de crédito · Cancele quando quiser
          </p>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────── */}
      <footer className="py-20 px-6 border-t border-border bg-card/30 relative overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            {/* Col 1 — Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-5">
                <img
                  src={logoTrilha}
                  alt="TRILHA.X"
                  className="h-12 w-12 rounded-2xl object-cover border-2 border-primary/60 shadow-lg shadow-primary/20"
                />
                <div>
                  <span className="text-xl font-black gradient-text block">
                    TRILHA.X
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                    </span>
                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">
                      Sistemas Online
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Elevando o potencial humano através da gamificação e tecnologia
                de ponta.
              </p>
              <p className="text-xs text-muted-foreground">
                Um produto da{" "}
                <a
                  href="https://www.vytetech.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-bold hover:underline"
                >
                  VyteTech
                </a>
              </p>
            </div>

            {/* Col 2 — Plataforma */}
            <div>
              <h4 className="font-bold text-foreground mb-5 text-sm uppercase tracking-wider">
                Plataforma
              </h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <button
                    onClick={() =>
                      document
                        .getElementById("modules")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="hover:text-primary transition-colors"
                  >
                    Módulos
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      document
                        .getElementById("gamification")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="hover:text-primary transition-colors"
                  >
                    Gamificação
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      document
                        .getElementById("pricing")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="hover:text-primary transition-colors"
                  >
                    Planos & Preços
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      window.scrollTo(0, 0);
                      navigate("/roadmap");
                    }}
                    className="hover:text-primary transition-colors"
                  >
                    Roadmap
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3 — Suporte & Legal */}
            <div>
              <h4 className="font-bold text-foreground mb-5 text-sm uppercase tracking-wider">
                Legal & Suporte
              </h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <button
                    onClick={() => {
                      window.scrollTo(0, 0);
                      navigate("/help");
                    }}
                    className="hover:text-primary transition-colors"
                  >
                    Central de Ajuda
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      window.scrollTo(0, 0);
                      navigate("/terms");
                    }}
                    className="hover:text-primary transition-colors"
                  >
                    Termos de Uso
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      window.scrollTo(0, 0);
                      navigate("/privacy");
                    }}
                    className="hover:text-primary transition-colors"
                  >
                    Política de Privacidade
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 4 — Newsletter */}
            <div>
              <h4 className="font-bold text-foreground mb-5 text-sm uppercase tracking-wider">
                Fique por dentro
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Receba novidades e atualizações do ecossistema VyteTech.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu e-mail"
                  className="bg-background border border-border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-primary/50 transition-colors"
                />
                <Button size="sm" className="px-3 shrink-0">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground/60 mt-2">
                Sem spam. Cancele quando quiser.
              </p>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-9 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()}{" "}
              <span className="text-foreground font-bold">TRILHA.X</span> · Um
              produto da{" "}
              <a
                href="https://www.vytetech.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-bold hover:underline"
              >
                VyteTech
              </a>
              . Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-5 text-xs text-muted-foreground">
              <a
                href="mailto:trilhax.app@gmail.com"
                className="hover:text-primary hover:underline transition-colors flex items-center gap-1.5"
              >
                <Mail className="h-4 w-4" /> trilhax.app@gmail.com
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
