import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import { Eye, EyeOff, UserPlus, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "Erro", description: "As senhas não coincidem." });
      return;
    }
    if (!acceptTerms) {
      toast({ variant: "destructive", title: "Erro", description: "Aceite os termos para continuar." });
      return;
    }
    if (password.length < 6) {
      toast({ variant: "destructive", title: "Erro", description: "A senha deve ter pelo menos 6 caracteres." });
      return;
    }
    setIsLoading(true);
    const { error } = await signUp(email, password, fullName);
    setIsLoading(false);
    if (error) {
      toast({ variant: "destructive", title: "Erro ao criar conta", description: error.message });
    } else {
      toast({ title: "Conta criada!", description: "Verifique seu email para confirmar a conta." });
      navigate("/login");
    }
  };

  return (
    <div className="flex min-h-screen bg-background items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="flex items-center gap-2">
          <Zap className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold gradient-text">TRILHA</span>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground">Criar conta</h2>
          <p className="text-muted-foreground mt-1">Comece sua jornada de crescimento</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input id="name" placeholder="Seu nome" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="bg-secondary border-border" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-secondary border-border" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input id="password" type={showPassword ? "text" : "password"} placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-secondary border-border pr-10" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirmar senha</Label>
            <Input id="confirm" type="password" placeholder="Repita a senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="bg-secondary border-border" />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="terms" checked={acceptTerms} onCheckedChange={(v) => setAcceptTerms(v === true)} />
            <Label htmlFor="terms" className="text-sm text-muted-foreground">
              Aceito os <span className="text-primary cursor-pointer hover:underline">termos de uso</span>
            </Label>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Criando...
              </span>
            ) : (
              <span className="flex items-center gap-2"><UserPlus className="h-4 w-4" /> Criar conta</span>
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta? <Link to="/login" className="text-primary hover:underline font-medium">Entrar</Link>
        </p>
      </motion.div>
    </div>
  );
}
