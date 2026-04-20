import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Mail,
  MessageCircle,
  Zap,
  CreditCard,
  Shield,
  Settings,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

const faqs = [
  {
    category: "Conta & Acesso",
    icon: Shield,
    items: [
      {
        q: "Como crio minha conta?",
        a: "Acesse o TRILHA.X e clique em 'Começar Grátis'. Preencha nome, e-mail e senha. Você receberá um e-mail de confirmação para ativar sua conta.",
      },
      {
        q: "Esqueci minha senha. O que fazer?",
        a: "Na tela de login, clique em 'Esqueci minha senha'. Informe seu e-mail e enviaremos um link para redefinição.",
      },
      {
        q: "Como excluo minha conta?",
        a: "Vá em Configurações → Conta → Excluir Conta. Todos os seus dados serão removidos permanentemente em até 30 dias.",
      },
    ],
  },
  {
    category: "Planos & Pagamentos",
    icon: CreditCard,
    items: [
      {
        q: "Quais são os planos disponíveis?",
        a: "Oferecemos 3 planos: Free (gratuito com limites), Pro (R$19,90/mês ou R$199,90/ano) e Ultimate (R$39,90/mês ou R$399,90/ano) com uso ilimitado.",
      },
      {
        q: "Como funciona o plano anual?",
        a: "No plano anual você paga à vista pelo ano completo e economiza o equivalente a 2 meses grátis comparado ao plano mensal.",
      },
      {
        q: "Posso cancelar a qualquer momento?",
        a: "Sim. Acesse Configurações → Plano → Gerenciar e cancele quando quiser. Seu acesso continua até o final do período pago.",
      },
      {
        q: "O que acontece com meus dados se eu cancelar?",
        a: "Seus dados são preservados. Apenas o acesso a recursos premium é limitado ao Plano Free.",
      },
    ],
  },
  {
    category: "Funcionalidades",
    icon: Zap,
    items: [
      {
        q: "Como funciona o sistema de XP?",
        a: "Cada ação concluída (tarefa, hábito, meta) concede XP. Ao acumular XP suficiente, você sobe de nível.",
      },
      {
        q: "O que são os Streaks de hábitos?",
        a: "Streak é a sequência de dias consecutivos em que você completou um hábito. Manter streaks longas concede bônus de XP.",
      },
      {
        q: "Como funcionam os investimentos com brapi?",
        a: "Nosso módulo consulta cotações em tempo real via brapi.dev. Os dados são informativos e não constituem recomendação de investimento.",
      },
      {
        q: "Posso exportar meus dados?",
        a: "Sim. Nos planos Pro e Ultimate você pode exportar relatórios em PDF e Excel na seção Relatórios.",
      },
    ],
  },
  {
    category: "Configurações",
    icon: Settings,
    items: [
      {
        q: "Como altero minha moeda preferida?",
        a: "Acesse Configurações → Financeiro e selecione sua moeda.",
      },
      {
        q: "Posso personalizar os dias dos hábitos?",
        a: "Sim. Ao criar ou editar um hábito, selecione 'Personalizado' na frequência e escolha os dias da semana desejados.",
      },
      {
        q: "Como funciona o Ranking Global?",
        a: "O ranking exibe usuários ordenados por XP total. Seu nome, nível e XP ficam visíveis para outros usuários autenticados.",
      },
    ],
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-card/80 transition-colors"
      >
        <span className="text-sm font-medium text-foreground pr-4">{q}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-primary shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3 bg-card/30">
          {a}
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = faqs
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.q.toLowerCase().includes(search.toLowerCase()) ||
          item.a.toLowerCase().includes(search.toLowerCase()),
      ),
    }))
    .filter((cat) => cat.items.length > 0);

  return (
    <div className="max-w-4xl mx-auto px-6 pt-28 pb-24">
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
          CENTRAL DE AJUDA
        </span>
        <h1 className="text-4xl font-black text-foreground mb-3">
          Como podemos <span className="neon-text">ajudar</span>?
        </h1>
        <p className="text-muted-foreground mb-8">
          Encontre respostas para as dúvidas mais comuns sobre o TRILHA.X.
        </p>

        <div className="relative mb-12">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar dúvidas..."
            className="pl-11 h-12 bg-card border-border text-sm"
          />
        </div>

        <div className="space-y-10">
          {(search ? filtered : faqs).map((cat) => {
            const Icon = cat.icon;
            return (
              <div key={cat.category}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="font-bold text-foreground">{cat.category}</h2>
                </div>
                <div className="space-y-2">
                  {cat.items.map((item) => (
                    <FaqItem key={item.q} q={item.q} a={item.a} />
                  ))}
                </div>
              </div>
            );
          })}
          {search && filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Nenhuma dúvida encontrada para "{search}"</p>
            </div>
          )}
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <Mail className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-bold text-foreground mb-2">E-mail</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Respondemos em até 24h úteis.
            </p>
            <a href="mailto:trilha.x@gmail.com">
              <Button variant="outline" size="sm" className="gap-2">
                <Mail className="h-3.5 w-3.5" /> trilha.x@gmail.com
              </Button>
            </a>
          </div>
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
            <MessageCircle className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-bold text-foreground mb-2">
              Suporte Prioritário
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Disponível para assinantes Pro e Ultimate.
            </p>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => navigate("/signup")}
            >
              <Zap className="h-3.5 w-3.5" /> Fazer upgrade
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
