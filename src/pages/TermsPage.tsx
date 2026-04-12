import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 pt-28 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-black text-foreground mb-2">
          Termos de Uso
        </h1>
        <p className="text-sm text-muted-foreground mb-10">
          Última atualização:{" "}
          {new Date().toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </p>

        <div className="space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">
              1. Aceitação dos Termos
            </h2>
            <p className="leading-relaxed">
              Ao acessar ou utilizar a plataforma{" "}
              <strong className="text-foreground">TRILHA.X</strong>,
              desenvolvida e operada pela{" "}
              <strong className="text-foreground">VyteTech</strong>, você
              concorda com estes Termos de Uso em sua totalidade. A utilização
              contínua da plataforma após alterações implica aceitação das novas
              condições.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">
              2. Descrição do Serviço
            </h2>
            <p className="leading-relaxed">
              O TRILHA.X é uma plataforma SaaS de evolução pessoal gamificada
              que oferece:
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-1.5">
              <li>Gerenciamento de tarefas e projetos em formato Kanban</li>
              <li>Acompanhamento de hábitos com sistema de streaks e XP</li>
              <li>Definição e acompanhamento de metas gamificadas</li>
              <li>
                Controle financeiro com receitas, despesas e cartões de crédito
              </li>
              <li>
                Gestão de portfólio de investimentos com integração à API brapi
              </li>
              <li>Planejamento de sonhos com metas financeiras</li>
              <li>Relatórios de desempenho e exportação em PDF/Excel</li>
              <li>Ranking global e sistema de conquistas</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">
              3. Cadastro e Conta
            </h2>
            <p className="leading-relaxed">
              Para utilizar o TRILHA.X, é necessário criar uma conta com
              informações verdadeiras. Você é responsável por manter a
              confidencialidade das suas credenciais e por todas as atividades
              realizadas em sua conta.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">
              4. Planos e Pagamentos
            </h2>
            <h3 className="font-semibold text-foreground mt-4 mb-2">
              4.1 Planos disponíveis
            </h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong className="text-foreground">Plano Free:</strong>{" "}
                gratuito, com limitações de uso
              </li>
              <li>
                <strong className="text-foreground">Plano Pro:</strong> R$
                19,90/mês ou R$ 199,90/ano
              </li>
              <li>
                <strong className="text-foreground">Plano Ultimate:</strong> R$
                39,90/mês ou R$ 399,90/ano
              </li>
            </ul>
            <h3 className="font-semibold text-foreground mt-4 mb-2">
              4.2 Cobrança
            </h3>
            <p className="leading-relaxed">
              Pagamentos processados com segurança pela{" "}
              <strong className="text-foreground">Stripe</strong>. Ao assinar,
              você autoriza cobrança recorrente no ciclo escolhido.
            </p>
            <h3 className="font-semibold text-foreground mt-4 mb-2">
              4.3 Cancelamento
            </h3>
            <p className="leading-relaxed">
              Cancele a qualquer momento em Configurações → Plano → Gerenciar. O
              acesso continua até o final do período pago.
            </p>
            <h3 className="font-semibold text-foreground mt-4 mb-2">
              4.4 Reembolsos
            </h3>
            <p className="leading-relaxed">
              Não oferecemos reembolsos proporcionais. Em casos de falha técnica
              comprovada, a VyteTech poderá conceder créditos a seu critério.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">
              5. Uso Aceitável
            </h2>
            <p className="leading-relaxed">
              Ao utilizar o TRILHA.X, você concorda em NÃO violar leis
              aplicáveis, acessar dados de outros usuários, realizar engenharia
              reversa, usar bots ou scripts automatizados, compartilhar sua
              conta, ou usar o serviço para fins ilegais.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">
              6. Integração com Terceiros
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong className="text-foreground">Supabase:</strong> banco de
                dados e autenticação
              </li>
              <li>
                <strong className="text-foreground">Stripe:</strong>{" "}
                processamento de pagamentos
              </li>
              <li>
                <strong className="text-foreground">brapi (brapi.dev):</strong>{" "}
                cotações de ativos em tempo real. Dados meramente informativos,
                não constituem recomendação de investimento.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">
              7. Isenção de Responsabilidade
            </h2>
            <p className="leading-relaxed">
              O TRILHA.X é fornecido "como está".{" "}
              <strong className="text-foreground">
                Os dados financeiros são exclusivamente informativos e não
                constituem aconselhamento de investimento.
              </strong>{" "}
              A VyteTech não se responsabiliza por decisões tomadas com base nas
              informações da plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">
              8. Lei Aplicável
            </h2>
            <p className="leading-relaxed">
              Estes Termos são regidos pelas leis da República Federativa do
              Brasil.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">
              9. Contato
            </h2>
            <ul className="list-none space-y-1.5">
              <li>
                <strong className="text-foreground">Empresa:</strong> VyteTech
              </li>
              <li>
                <strong className="text-foreground">Produto:</strong> TRILHA.X
              </li>
              <li>
                <strong className="text-foreground">E-mail:</strong>{" "}
                <a
                  href="mailto:trilha.x@gmail.com"
                  className="text-primary hover:underline"
                >
                  trilha.x@gmail.com
                </a>
              </li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Veja também nossa{" "}
            <Link to="/privacy" className="text-primary hover:underline">
              Política de Privacidade
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
