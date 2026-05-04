import { useState } from "react";
import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mail, Menu, X } from "lucide-react";
import logoTrilha from "@/assets/logo-trilha.x.png";

export default function PublicLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const isLanding = location.pathname === "/";

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    if (isLanding) {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/", { state: { scrollTo: id } });
    }
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const navLinks = [
    { label: "Módulos", id: "modules" },
    { label: "Gamificação", id: "gamification" },
    { label: "Depoimentos", id: "testimonials" },
    { label: "Planos", id: "pricing" },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden flex flex-col">
      {/* ── NAVBAR ─────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 glass-strong border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={isLanding ? scrollToTop : () => navigate("/")}
            className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity"
          >
            <img
              src={logoTrilha}
              alt="TRILHA.X"
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl object-cover border-2 border-primary shadow-[0_0_12px_rgba(34,197,94,0.35)]"
            />
            <span className="text-xl sm:text-2xl font-black gradient-text tracking-tighter uppercase">
              TRILHA.X
            </span>
          </button>

          {/* Nav links — desktop */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/login")}
              className="hidden sm:block text-md font-bold text-muted-foreground border border-border rounded-lg px-5 py-3 hover:border-primary hover:text-primary transition-all duration-200"
            >
              Entrar
            </button>

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all"
              aria-label="Menu"
            >
              {menuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md px-4 py-3 flex flex-col gap-1">
            {navLinks.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors text-left px-4 py-3 rounded-lg"
              >
                {item.label}
              </button>
            ))}
            <div className="border-t border-border mt-2 pt-3">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/login");
                }}
                className="w-full text-sm font-bold text-primary border border-primary/30 rounded-lg px-4 py-3 hover:bg-primary/5 transition-all text-left"
              >
                Entrar
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ── CONTEÚDO DA PÁGINA ─────────────────────── */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ── FOOTER ─────────────────────────────────── */}
      <footer className="py-12 sm:py-20 px-4 sm:px-6 border-t border-border bg-card/30 relative overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-10 sm:mb-16">
            {/* Col 1 — Brand (full width on mobile) */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={logoTrilha}
                  alt="TRILHA.X"
                  className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl object-cover border-2 border-primary/60 shadow-lg shadow-primary/20"
                />
                <div>
                  <span className="text-lg sm:text-xl font-black gradient-text block">
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
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
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
              <h4 className="font-bold text-foreground mb-4 text-xs uppercase tracking-wider">
                Plataforma
              </h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
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
              <h4 className="font-bold text-foreground mb-4 text-xs uppercase tracking-wider">
                Legal & Suporte
              </h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
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

            {/* Col 4 — Newsletter (full width on mobile) */}
            <div className="col-span-2 md:col-span-1">
              <h4 className="font-bold text-foreground mb-4 text-xs uppercase tracking-wider">
                Fique por dentro
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
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
          <div className="pt-6 sm:pt-9 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-xs text-muted-foreground text-center sm:text-left">
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
            <a
              href="mailto:trilhax.app@gmail.com"
              className="hover:text-primary hover:underline transition-colors flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <Mail className="h-4 w-4" /> trilhax.app@gmail.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
