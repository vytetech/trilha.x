import { useState } from "react";
import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mail, LogIn, Rocket, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import logoTrilha from "@/assets/logo-trilha.x.png";

export default function PublicLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const isLanding = location.pathname === "/";

  const scrollTo = (id: string, fromMobile = false) => {
    setMenuOpen(false);
    if (isLanding) {
      const delay = fromMobile ? 320 : 0;
      setTimeout(() => {
        const el = document.getElementById(id);
        if (!el) return;
        const navHeight = fromMobile ? 64 : 80;
        const top = el.getBoundingClientRect().top + window.scrollY - navHeight;
        window.scrollTo({ top, behavior: "smooth" });
      }, delay);
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
              className="h-12 w-12 sm:h-10 sm:w-10 rounded-xl object-cover border-2 border-primary shadow-[0_0_12px_rgba(34,197,94,0.35)]"
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
              className="hidden md:block text-md font-bold text-muted-foreground border border-border rounded-lg px-4 py-3 hover:border-primary hover:text-primary transition-all duration-200"
            >
              Entrar
            </button>

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
              className={`md:hidden relative flex items-center justify-center w-12 h-12 rounded-xl border transition-all duration-300 ${
                menuOpen
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
              }`}
            >
              <motion.div
                animate={menuOpen ? "open" : "closed"}
                className="flex flex-col items-center justify-center gap-1.5 w-5"
              >
                <motion.span
                  variants={{
                    closed: { rotate: 0, y: 0 },
                    open: { rotate: 45, y: 7 },
                  }}
                  transition={{ duration: 0.25 }}
                  className="block h-0.5 w-full bg-current rounded-full origin-center"
                />
                <motion.span
                  variants={{
                    closed: { opacity: 1, scaleX: 1 },
                    open: { opacity: 0, scaleX: 0 },
                  }}
                  transition={{ duration: 0.2 }}
                  className="block h-0.5 w-full bg-current rounded-full"
                />
                <motion.span
                  variants={{
                    closed: { rotate: 0, y: 0 },
                    open: { rotate: -45, y: -7 },
                  }}
                  transition={{ duration: 0.25 }}
                  className="block h-0.5 w-full bg-current rounded-full origin-center"
                />
              </motion.div>
            </button>
          </div>
        </div>

        {/* Mobile menu — animated slide down */}
        <motion.div
          initial={false}
          animate={
            menuOpen
              ? { height: "auto", opacity: 1 }
              : { height: 0, opacity: 0 }
          }
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="md:hidden overflow-hidden border-t border-border/60 bg-background/98 backdrop-blur-xl"
        >
          <div className="px-4 pt-3 pb-5 flex flex-col gap-1">
            {navLinks.map((item, i) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -12 }}
                animate={
                  menuOpen ? { opacity: 1, x: 0 } : { opacity: 0, x: -12 }
                }
                transition={{ delay: menuOpen ? i * 0.06 : 0, duration: 0.2 }}
                onClick={() => scrollTo(item.id, true)}
                className="flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all group"
              >
                <span>{item.label}</span>
                <ChevronRight className="h-4 w-4 opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </motion.button>
            ))}

            <div className="my-2 border-t border-border/50" />

            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={menuOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              transition={{ delay: menuOpen ? 0.28 : 0, duration: 0.2 }}
              onClick={() => {
                setMenuOpen(false);
                navigate("/login");
              }}
              className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-bold text-muted-foreground border border-border hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all"
            >
              <LogIn className="h-4 w-4" />
              Entrar na minha conta
            </motion.button>
          </div>
        </motion.div>
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
                  className="h-12 w-12 sm:h-12 sm:w-12 rounded-2xl object-cover border-2 border-primary/60 shadow-lg shadow-primary/20"
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
