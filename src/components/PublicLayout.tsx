import { useState } from "react";
import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mail, ArrowLeft } from "lucide-react";
import logoTrilha from "@/assets/logo-trilha.x.png";

/**
 * PublicLayout
 * Layout compartilhado por todas as páginas públicas:
 * /, /terms, /privacy, /roadmap, /help, /404
 *
 * Inclui:
 *  - Navbar igual à LandingPage (com logo + links de navegação)
 *  - Footer profissional com 4 colunas
 *
 * Nas páginas internas (não Landing), o nav mostra "Voltar" inteligente.
 */
export default function PublicLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");

  const isLanding = location.pathname === "/";
  const from = (location.state as any)?.from || "/";

  const scrollTo = (id: string) => {
    if (isLanding) {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/", { state: { scrollTo: id } });
    }
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div className="min-h-screen bg-background overflow-x-hidden flex flex-col">
      {/* ── NAVBAR ─────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 glass-strong border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={isLanding ? scrollToTop : () => navigate("/")}
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

          {/* Nav links — sempre visível */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: "Módulos", id: "modules" },
              { label: "Gamificação", id: "gamification" },
              { label: "Depoimentos", id: "testimonials" },
              { label: "Planos", id: "pricing" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* CTAs */}
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

      {/* ── CONTEÚDO DA PÁGINA ─────────────────────── */}
      <main className="flex-1">
        <Outlet />
      </main>

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
                    onClick={() => scrollTo("modules")}
                    className="hover:text-primary transition-colors"
                  >
                    Módulos
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollTo("gamification")}
                    className="hover:text-primary transition-colors"
                  >
                    Gamificação
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollTo("pricing")}
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

            {/* Col 3 — Legal & Suporte */}
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
