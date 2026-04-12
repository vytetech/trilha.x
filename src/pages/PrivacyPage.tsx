import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 pt-28 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-black text-foreground mb-2">
          Política de Privacidade
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
              1. Introdução
            </h2>
            <p className="leading-relaxed">
              A <strong className="text-foreground">VyteTech</strong>,
              responsável pelo produto{" "}
              <strong className="text-foreground">TRILHA.X</strong>, está
              comprometida com a proteção da privacidade dos seus usuários, em
              conformidade com a{" "}
              <strong className="text-foreground">
                Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)
              </strong>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">
              2. Dados que Coletamos
            </h2>
            <h3 className="font-semibold text-foreground mt-4 mb-2">
              2.1 Fornecidos por você
            </h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong className="text-foreground">Cadastro:</strong> nome
                completo e e-mail
              </li>
              <li>
                <strong className="text-foreground">Perfil:</strong>{" "}
                preferências de moeda e metas financeiras
              </li>
              <li>
                <strong className="text-foreground">Financeiros:</strong>{" "}
                transações, receitas, despesas e cartões (apenas metadados)
              </li>
              <li>
                <strong className="text-foreground">Investimentos:</strong>{" "}
                ativos, quantidades, preços e histórico
              </li>
              <li>
                <strong className="text-foreground">Produtividade:</strong>{" "}
                tarefas, hábitos, metas, sonhos e conquistas
              </li>
            </ul>
            <h3 className="font-semibold text-foreground mt-4 mb-2">
              2.2 Coletados automaticamente
            </h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Dados de uso e funcionalidades acessadas</li>
              <li>Endereço IP, tipo de navegador e dispositivo</li>
              <li>Tokens de sessão e logs de acesso</li>
            </ul>
            <h3 className="font-semibold text-foreground mt-4 mb-2">
              2.3 De terceiros
            </h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong className="text-foreground">Stripe:</strong> dados de
                cobrança e histórico de pagamentos
              </li>
              <li>
                <strong className="text-foreground">brapi:</strong> cotações
                consultadas em tempo real (não armazenamos permanentemente)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">
              3. Como Usamos seus Dados
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Criar e gerenciar sua conta</li>
              <li>Fornecer as funcionalidades do TRILHA.X</li>
              <li>Processar pagamentos e assinaturas</li>
              <li>Calcular XP, níveis, streaks e rankings</li>
              <li>Gerar relatórios personalizados</li>
              <li>Melhorar a plataforma com dados agregados e anonimizados</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">
              4. Compartilhamento de Dados
            </h2>
            <p className="leading-relaxed mb-3">
              A VyteTech <strong className="text-foreground">não vende</strong>{" "}
              seus dados.
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong className="text-foreground">Supabase:</strong> banco de
                dados, autenticação e infraestrutura
              </li>
              <li>
                <strong className="text-foreground">Stripe:</strong> pagamentos
                seguros (PCI-DSS). Não armazenamos dados completos de cartão.
              </li>
              <li>
                <strong className="text-foreground">brapi:</strong> apenas
                tickers de ativos são enviados. Nenhum dado pessoal é
                compartilhado.
              </li>
            </ul>
            <p className="leading-relaxed mt-3">
              O Ranking exibe publicamente nome, nível e XP. Nenhum dado
              financeiro é exibido.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">
              5. Segurança
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Autenticação com tokens JWT (ES256)</li>
              <li>
                Row Level Security (RLS) — cada usuário acessa só seus dados
              </li>
              <li>Senhas com hash criptográfico</li>
              <li>Comunicação via HTTPS em toda a plataforma</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">
              6. Retenção de Dados
            </h2>
            <p className="leading-relaxed">
              Dados são mantidos enquanto sua conta estiver ativa. Após
              encerramento, excluídos em até{" "}
              <strong className="text-foreground">30 dias</strong>, salvo
              obrigação legal.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">
              7. Seus Direitos (LGPD)
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong className="text-foreground">Acesso:</strong> confirmar e
                acessar seus dados
              </li>
              <li>
                <strong className="text-foreground">Correção:</strong> corrigir
                dados incorretos
              </li>
              <li>
                <strong className="text-foreground">Exclusão:</strong> solicitar
                remoção de dados desnecessários
              </li>
              <li>
                <strong className="text-foreground">Portabilidade:</strong>{" "}
                exportar seus dados
              </li>
            </ul>
            <p className="leading-relaxed mt-3">
              Para exercer esses direitos:{" "}
              <a
                href="mailto:trilha.x@gmail.com"
                className="text-primary hover:underline"
              >
                trilha.x@gmail.com
              </a>
              . Respondemos em até 15 dias úteis.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">
              8. Contato
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
            Veja também nossos{" "}
            <Link to="/terms" className="text-primary hover:underline">
              Termos de Uso
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
