import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import {
  Settings, User, Save, Shield, Bell, Palette, CreditCard, Key,
  Mail, Globe, Target, DollarSign, Calendar, AlertTriangle, Trash2,
  Lock, Eye, EyeOff, CheckCircle2, Zap, Crown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [currency, setCurrency] = useState("BRL");
  const [savingsGoal, setSavingsGoal] = useState("0");
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).single().then(({ data }) => {
      if (data) {
        setProfile(data);
        setFullName(data.full_name || "");
        setCurrency(data.preferred_currency || "BRL");
        setSavingsGoal(String(data.monthly_savings_goal || 0));
      }
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);
    const { error } = await supabase.from("profiles").update({
      full_name: fullName,
      preferred_currency: currency,
      monthly_savings_goal: Number(savingsGoal),
    }).eq("user_id", user.id);
    setIsLoading(false);
    if (error) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } else {
      toast({ title: "Configurações salvas! ✅" });
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Senhas não conferem" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ variant: "destructive", title: "A senha deve ter no mínimo 6 caracteres" });
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) {
      toast({ variant: "destructive", title: "Erro ao alterar senha", description: error.message });
    } else {
      toast({ title: "Senha alterada com sucesso! 🔐" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "EXCLUIR") return;
    toast({ title: "Funcionalidade em desenvolvimento", description: "Entre em contato com o suporte para excluir sua conta." });
    setDeleteConfirmOpen(false);
  };

  const SectionCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`rounded-xl border border-border bg-card p-6 space-y-5 ${className}`}>{children}</div>
  );

  const SectionHeader = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc?: string }) => (
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-primary/10">{icon}</div>
      <div>
        <h2 className="font-semibold text-foreground">{title}</h2>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" /> Configurações
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie seu perfil, preferências e segurança</p>
      </div>

      <Tabs defaultValue="perfil">
        <TabsList className="bg-secondary border border-border">
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="plano">Plano</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
          <TabsTrigger value="conta">Conta</TabsTrigger>
        </TabsList>

        {/* ========== PERFIL ========== */}
        <TabsContent value="perfil" className="mt-4 space-y-4">
          {/* User overview */}
          <SectionCard>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-primary/20">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-lg">{fullName || "Usuário"}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-primary/20 text-primary border-none text-xs">
                    <Crown className="h-3 w-3 mr-1" /> Nível {profile?.level || 1}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" /> {profile?.xp || 0} XP
                  </Badge>
                  <Badge variant="outline" className="text-xs capitalize">{profile?.plan || "free"}</Badge>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Edit profile */}
          <SectionCard>
            <SectionHeader icon={<User className="h-4 w-4 text-primary" />} title="Informações Pessoais" desc="Atualize seus dados de perfil" />
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome completo</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-secondary border-border" placeholder="Seu nome" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="relative">
                  <Input value={user?.email || ""} disabled className="bg-muted border-border opacity-60 pr-20" />
                  <Badge variant="outline" className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    <Lock className="h-3 w-3 mr-1" /> Fixo
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">O email não pode ser alterado por segurança.</p>
              </div>
            </div>
            <Button onClick={handleSave} disabled={isLoading} className="gap-2">
              <Save className="h-4 w-4" />
              {isLoading ? "Salvando..." : "Salvar Perfil"}
            </Button>
          </SectionCard>
        </TabsContent>

        {/* ========== PLANO ========== */}
        <TabsContent value="plano" className="mt-4 space-y-4">
          {/* Current plan */}
          <SectionCard>
            <SectionHeader icon={<Crown className="h-4 w-4 text-primary" />} title="Seu Plano Atual" desc="Gerencie sua assinatura" />
            <div className={`rounded-lg border p-4 flex items-center justify-between ${(profile?.plan || "free") === "pro" ? "border-primary/30 bg-primary/5" : "border-border bg-secondary/50"}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${(profile?.plan || "free") === "pro" ? "bg-primary/20" : "bg-muted"}`}>
                  {(profile?.plan || "free") === "pro" ? <Crown className="h-5 w-5 text-primary" /> : <User className="h-5 w-5 text-muted-foreground" />}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{(profile?.plan || "free") === "pro" ? "Plano Completo" : "Plano Free"}</p>
                  <p className="text-xs text-muted-foreground">{(profile?.plan || "free") === "pro" ? "Acesso ilimitado a todos os recursos" : "Acesso limitado aos recursos básicos"}</p>
                </div>
              </div>
              <Badge className={`${(profile?.plan || "free") === "pro" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"} border-none`}>
                {(profile?.plan || "free") === "pro" ? "Ativo" : "Gratuito"}
              </Badge>
            </div>
          </SectionCard>

          {/* Plan comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Free */}
            <div className={`rounded-xl border p-6 space-y-5 ${(profile?.plan || "free") === "free" ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-foreground">Free</h3>
                  {(profile?.plan || "free") === "free" && <Badge className="bg-primary/20 text-primary border-none text-xs">Atual</Badge>}
                </div>
                <p className="text-3xl font-bold text-foreground mt-2">R$ 0<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                <p className="text-xs text-muted-foreground mt-1">Para começar a organizar sua vida</p>
              </div>
              <Separator />
              <ul className="space-y-2.5">
                {[
                  { text: "Até 50 transações/mês", included: true },
                  { text: "3 metas ativas", included: true },
                  { text: "Hábitos ilimitados", included: true },
                  { text: "3 sonhos ativos", included: true },
                  { text: "Relatórios básicos", included: true },
                  { text: "Investimentos limitados (5)", included: true },
                  { text: "Relatórios avançados", included: false },
                  { text: "Exportação PDF/Excel", included: false },
                  { text: "Simulador financeiro", included: false },
                  { text: "Conquistas premium", included: false },
                ].map((item, i) => (
                  <li key={i} className={`flex items-center gap-2 text-sm ${item.included ? "text-foreground" : "text-muted-foreground line-through opacity-50"}`}>
                    {item.included ? <CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> : <div className="h-4 w-4 rounded-full border border-border shrink-0" />}
                    {item.text}
                  </li>
                ))}
              </ul>
              {(profile?.plan || "free") === "free" && (
                <Button variant="outline" className="w-full" disabled>Plano Atual</Button>
              )}
            </div>

            {/* Pro / Completo */}
            <div className={`rounded-xl border p-6 space-y-5 relative overflow-hidden ${(profile?.plan || "free") === "pro" ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                RECOMENDADO
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2"><Crown className="h-5 w-5 text-primary" /> Completo</h3>
                  {(profile?.plan || "free") === "pro" && <Badge className="bg-primary/20 text-primary border-none text-xs">Atual</Badge>}
                </div>
                <p className="text-3xl font-bold text-foreground mt-2">R$ 19,90<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                <p className="text-xs text-muted-foreground mt-1">Desbloqueie todo o potencial do TRILHA</p>
              </div>
              <Separator />
              <ul className="space-y-2.5">
                {[
                  "Transações ilimitadas",
                  "Metas ilimitadas",
                  "Hábitos ilimitados",
                  "Sonhos ilimitados",
                  "Investimentos ilimitados",
                  "Relatórios avançados completos",
                  "Exportação PDF e Excel",
                  "Simulador financeiro completo",
                  "Conquistas e badges premium",
                  "Suporte prioritário",
                ].map((text, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>
              {(profile?.plan || "free") === "pro" ? (
                <Button variant="outline" className="w-full" disabled>Plano Atual</Button>
              ) : (
                <Button className="w-full gap-2" onClick={() => toast({ title: "Em breve!", description: "A integração de pagamento será ativada em breve." })}>
                  <Zap className="h-4 w-4" /> Fazer Upgrade
                </Button>
              )}
            </div>
          </div>

          {/* FAQ */}
          <SectionCard>
            <SectionHeader icon={<Shield className="h-4 w-4 text-primary" />} title="Perguntas Frequentes" />
            <div className="space-y-3">
              {[
                { q: "Posso cancelar a qualquer momento?", a: "Sim, você pode cancelar sua assinatura quando quiser. Seu acesso continua até o final do período pago." },
                { q: "Meus dados são mantidos se eu fizer downgrade?", a: "Sim, seus dados são preservados. Apenas o acesso a recursos premium será limitado." },
                { q: "Quais formas de pagamento são aceitas?", a: "Em breve: Cartão de crédito, PIX e boleto via Stripe/Mercado Pago." },
              ].map((faq, i) => (
                <div key={i} className="py-2.5 border-b border-border last:border-0">
                  <p className="text-sm font-medium text-foreground">{faq.q}</p>
                  <p className="text-xs text-muted-foreground mt-1">{faq.a}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </TabsContent>

        {/* ========== FINANCEIRO ========== */}
        <TabsContent value="financeiro" className="mt-4 space-y-4">
          <SectionCard>
            <SectionHeader icon={<DollarSign className="h-4 w-4 text-primary" />} title="Preferências Financeiras" desc="Configure moeda e metas de economia" />
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Moeda preferida</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRL">🇧🇷 Real (BRL)</SelectItem>
                    <SelectItem value="USD">🇺🇸 Dólar (USD)</SelectItem>
                    <SelectItem value="EUR">🇪🇺 Euro (EUR)</SelectItem>
                    <SelectItem value="GBP">🇬🇧 Libra (GBP)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Meta mensal de economia (R$)</Label>
                <Input type="number" value={savingsGoal} onChange={(e) => setSavingsGoal(e.target.value)} className="bg-secondary border-border" placeholder="0,00" />
                <p className="text-xs text-muted-foreground">Defina quanto deseja economizar por mês. Isso será usado nos relatórios e indicadores financeiros.</p>
              </div>
            </div>
            <Button onClick={handleSave} disabled={isLoading} className="gap-2">
              <Save className="h-4 w-4" />
              {isLoading ? "Salvando..." : "Salvar Preferências"}
            </Button>
          </SectionCard>

          <SectionCard>
            <SectionHeader icon={<Target className="h-4 w-4 text-primary" />} title="Resumo Rápido" desc="Visão geral do seu plano" />
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Plano Atual", value: (profile?.plan || "free").charAt(0).toUpperCase() + (profile?.plan || "free").slice(1), icon: <CreditCard className="h-4 w-4 text-primary" /> },
                { label: "Moeda", value: currency, icon: <Globe className="h-4 w-4 text-primary" /> },
                { label: "Meta Mensal", value: `R$ ${Number(savingsGoal).toLocaleString("pt-BR")}`, icon: <Target className="h-4 w-4 text-primary" /> },
                { label: "Membro Desde", value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString("pt-BR") : "—", icon: <Calendar className="h-4 w-4 text-primary" /> },
              ].map((item, i) => (
                <div key={i} className="p-3 rounded-lg bg-secondary/50 flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-primary/10">{item.icon}</div>
                  <div>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-semibold text-foreground">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </TabsContent>

        {/* ========== SEGURANÇA ========== */}
        <TabsContent value="seguranca" className="mt-4 space-y-4">
          <SectionCard>
            <SectionHeader icon={<Key className="h-4 w-4 text-primary" />} title="Alterar Senha" desc="Mantenha sua conta segura com uma senha forte" />
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nova senha</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-secondary border-border pr-10"
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Confirmar nova senha</Label>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-secondary border-border"
                  placeholder="Repita a senha"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> As senhas não conferem</p>
                )}
                {confirmPassword && newPassword === confirmPassword && newPassword.length >= 6 && (
                  <p className="text-xs text-primary flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Senhas conferem</p>
                )}
              </div>
            </div>
            <Button onClick={handleChangePassword} disabled={changingPassword || !newPassword || newPassword !== confirmPassword} className="gap-2">
              <Shield className="h-4 w-4" />
              {changingPassword ? "Alterando..." : "Alterar Senha"}
            </Button>
          </SectionCard>

          <SectionCard>
            <SectionHeader icon={<Shield className="h-4 w-4 text-primary" />} title="Informações de Segurança" />
            <div className="space-y-3">
              {[
                { label: "Autenticação", value: "Email e Senha", status: "active" },
                { label: "Sessão Ativa", value: "Navegador atual", status: "active" },
                { label: "Último Acesso", value: user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString("pt-BR") : "Agora", status: "info" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground">{item.value}</span>
                    {item.status === "active" && <div className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </TabsContent>

        {/* ========== CONTA ========== */}
        <TabsContent value="conta" className="mt-4 space-y-4">
          <SectionCard>
            <SectionHeader icon={<User className="h-4 w-4 text-primary" />} title="Sessão" desc="Gerenciar sua sessão ativa" />
            <Button variant="outline" onClick={async () => { await signOut(); navigate("/login"); }} className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10">
              Sair da Conta
            </Button>
          </SectionCard>

          <SectionCard className="border-destructive/20">
            <SectionHeader icon={<AlertTriangle className="h-4 w-4 text-destructive" />} title="Zona de Perigo" desc="Ações irreversíveis na sua conta" />
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <div className="flex items-start gap-3">
                <Trash2 className="h-5 w-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">Excluir conta permanentemente</p>
                  <p className="text-xs text-muted-foreground mt-1">Todos os seus dados, incluindo finanças, metas, hábitos, sonhos e progresso serão excluídos permanentemente. Esta ação não pode ser desfeita.</p>
                </div>
              </div>
              <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="mt-3 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive gap-2">
                    <Trash2 className="h-3 w-3" /> Excluir Conta
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle className="text-destructive flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Excluir Conta</DialogTitle>
                    <DialogDescription>Esta ação é permanente e não pode ser desfeita. Todos os seus dados serão excluídos.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Digite <span className="font-bold text-destructive">EXCLUIR</span> para confirmar</Label>
                      <Input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} className="bg-secondary border-border" placeholder="EXCLUIR" />
                    </div>
                    <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteConfirmText !== "EXCLUIR"} className="w-full gap-2">
                      <Trash2 className="h-4 w-4" /> Confirmar Exclusão
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
