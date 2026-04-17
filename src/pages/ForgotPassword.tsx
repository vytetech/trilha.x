import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logoTrilha from "@/assets/logo-trilha.x.png";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await resetPassword(email);
    setIsLoading(false);
    if (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    } else {
      setSent(true);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-secondary to-background" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center px-12"
        >
          <div className="flex items-center justify-center gap-3 mb-8">
            <img
              src={logoTrilha}
              alt="TRILHA.X"
              className="h-20 w-20 rounded-xl object-cover border-2 border-primary shadow-[0_0_12px_rgba(34,197,94,0.35)]"
            />
            <span className="text-6xl font-black gradient-text tracking-tighter uppercase">
              TRILHA.X
            </span>
          </div>
          <p className="text-lg text-muted-foreground max-w-md">
            Organize sua vida, controle suas finanças e alcance seus objetivos
            com inteligência.
          </p>
          <p className="text-xs text-muted-foreground/60 mt-6 tracking-widest transition-all duration-500 hover:text-primary cursor-default select-none">
            VyteTech · TRILHA.X
          </p>
        </motion.div>
      </div>

      {/* Right - Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-6"
        >
          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-2">
            <img
              src={logoTrilha}
              alt="TRILHA.X"
              className="h-10 w-10 rounded-xl object-cover border-2 border-primary shadow-[0_0_12px_rgba(34,197,94,0.35)]"
            />
            <span className="text-2xl font-black gradient-text tracking-tighter uppercase">
              TRILHA.X
            </span>
          </div>

          {/* Back button */}
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao login
          </button>

          {sent ? (
            /* ── Estado: email enviado ── */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  Email enviado!
                </h2>
                <p className="text-muted-foreground mt-1">
                  Verifique sua caixa de entrada
                </p>
              </div>

              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Enviamos um link de redefinição para{" "}
                  <span className="text-foreground font-medium">{email}</span>.
                  Verifique também a pasta de spam.
                </p>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSent(false)}
              >
                Tentar outro email
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Lembrou a senha?{" "}
                <Link
                  to="/login"
                  className="text-primary hover:underline font-medium"
                >
                  Entrar
                </Link>
              </p>
            </motion.div>
          ) : (
            /* ── Estado: formulário ── */
            <>
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  Recuperar senha
                </h2>
                <p className="text-muted-foreground mt-1">
                  Enviaremos um link para redefinir sua senha
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-secondary border-border focus:border-primary"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Enviando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="h-4 w-4" /> Enviar link de recuperação
                    </span>
                  )}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                Lembrou a senha?{" "}
                <Link
                  to="/login"
                  className="text-primary hover:underline font-medium"
                >
                  Entrar
                </Link>
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
