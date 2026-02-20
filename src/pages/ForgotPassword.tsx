import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await resetPassword(email);
    setIsLoading(false);
    if (error) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } else {
      setSent(true);
    }
  };

  return (
    <div className="flex min-h-screen bg-background items-center justify-center p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-8">
        <div className="flex items-center gap-2">
          <Zap className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold gradient-text">TRILHA</span>
        </div>

        {sent ? (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <Mail className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold text-foreground">Email enviado!</h3>
              <p className="text-sm text-muted-foreground mt-1">Verifique sua caixa de entrada para redefinir a senha.</p>
            </div>
            <Link to="/login" className="flex items-center gap-1 text-sm text-primary hover:underline">
              <ArrowLeft className="h-4 w-4" /> Voltar ao login
            </Link>
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Recuperar senha</h2>
              <p className="text-muted-foreground mt-1">Enviaremos um link para redefinir sua senha</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-secondary border-border" />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Enviando..." : "Enviar link de recuperação"}
              </Button>
            </form>
            <Link to="/login" className="flex items-center gap-1 text-sm text-primary hover:underline">
              <ArrowLeft className="h-4 w-4" /> Voltar ao login
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
}
