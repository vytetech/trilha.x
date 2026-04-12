import { useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search } from "lucide-react";
import logoTrilha from "@/assets/logo-trilha.x.png";

const quickLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Hábitos", href: "/habits" },
  { label: "Metas", href: "/goals" },
  { label: "Financeiro", href: "/finances" },
  { label: "Investimentos", href: "/investments" },
  { label: "Configurações", href: "/settings" },
  { label: "Central de Ajuda", href: "/help" },
  { label: "Planos", href: "/#pricing" },
];

export default function NotFound() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 — Rota não encontrada:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Glow de fundo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Logo no topo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-8 left-8"
      >
        <Link
          to="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <img
            src={logoTrilha}
            alt="TRILHA.X"
            className="h-10 w-10 rounded-xl object-cover border-2 border-primary shadow-[0_0_12px_rgba(34,197,94,0.35)]"
          />
          <span className="text-lg font-black gradient-text tracking-tighter">
            TRILHA.X
          </span>
        </Link>
      </motion.div>

      <div className="max-w-2xl w-full text-center relative">
        {/* Número 404 grande */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative inline-block">
            <span className="text-[160px] md:text-[220px] font-black text-foreground/5 leading-none select-none">
              404
            </span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
                  <Search className="h-10 w-10 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Texto */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-3xl md:text-4xl font-black text-foreground mb-3">
            Página não encontrada
          </h1>
          <p className="text-muted-foreground mb-2">
            A rota{" "}
            <code className="bg-muted px-2 py-0.5 rounded text-sm font-mono text-primary">
              {location.pathname}
            </code>{" "}
            não existe.
          </p>
          <p className="text-sm text-muted-foreground mb-10">
            Ela pode ter sido movida, excluída ou você digitou o endereço
            errado.
          </p>
        </motion.div>

        {/* Botões principais */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 justify-center mb-12"
        >
          <Button
            size="lg"
            onClick={() => navigate("/")}
            className="gap-2 font-bold"
          >
            <Home className="h-4 w-4" /> Voltar ao início
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Página anterior
          </Button>
        </motion.div>

        {/* Links rápidos */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-4">
            Ou acesse diretamente
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:border-primary/40 hover:text-primary transition-all text-muted-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Footer mínimo */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-8 text-xs text-muted-foreground flex items-center gap-4"
      >
        <Link to="/terms" className="hover:text-primary transition-colors">
          Termos
        </Link>
        <Link to="/privacy" className="hover:text-primary transition-colors">
          Privacidade
        </Link>
        <Link to="/help" className="hover:text-primary transition-colors">
          Ajuda
        </Link>
      </motion.div>
    </div>
  );
}
