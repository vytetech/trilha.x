import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import {
  Settings,
  User,
  Save,
  Shield,
  CreditCard,
  Globe,
  Target,
  DollarSign,
  Calendar,
  AlertTriangle,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Zap,
  Crown,
  Loader2,
  ExternalLink,
  Key,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function SettingsPage() {
  const { user, session, signOut } = useAuth();
  const {
    plan,
    subscribed,
    subscriptionEnd,
    loading: subLoading,
    checkSubscription,
  } = useSubscription();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "perfil";

  const [fullName, setFullName] = useState("");
  const [currency, setCurrency] = useState("BRL");
  const [savingsGoal, setSavingsGoal] = useState("0");
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly",
  );

  useEffect(() => {
    const success = searchParams.get("success");
    if (success === "true") {
      toast({
        title: "Assinatura confirmada! 🎉",
        description: "A atualizar a sua conta, por favor aguarde...",
      });

      setTimeout(() => {
        checkSubscription();
      }, 1500);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          setFullName(data.full_name || "");
          setCurrency(data.preferred_currency || "BRL");
          setSavingsGoal(String(data.monthly_savings_goal || 0));
        }
      });
  }, [user]);

  // ─── CHECKOUT — com token de autenticação ───────────────────
  const handleCheckout = async (selectedPlan: "pro" | "ultimate" = "pro") => {
    if (!session?.access_token) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Sessão expirada. Faça login novamente.",
      });
      return;
    }

    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "create-checkout",
        {
          body: { plan: selectedPlan },
          headers: {
            Authorization: `Bearer ${session.access_token.trim()}`,
          },
        },
      );

      if (error) throw error;

      // REDIRECIONAMENTO SEGURO (Evita bloqueio de popup)
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro ao iniciar checkout",
        description: err.message || "Tente novamente.",
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  // ─── PORTAL — com token de autenticação ─────────────────────
  const handleManageSubscription = async () => {
    if (!session?.access_token) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Você precisa estar logado.",
      });
      return;
    }

    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "customer-portal",
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro ao abrir portal",
        description: err.message || "Tente novamente.",
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        preferred_currency: currency,
        monthly_savings_goal: Number(savingsGoal),
      })
      .eq("user_id", user.id);
    setIsLoading(false);
    if (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
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
      toast({ variant: "destructive", title: "Mínimo 6 caracteres" });
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao alterar senha",
        description: error.message,
      });
    } else {
      toast({ title: "Senha alterada com sucesso! 🔐" });
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "EXCLUIR") return;
    toast({ title: "Entre em contato com o suporte para excluir sua conta." });
    setDeleteConfirmOpen(false);
  };

  const SectionCard = ({
    children,
    className = "",
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div
      className={`rounded-xl border border-border bg-card p-6 space-y-5 ${className}`}
    >
      {children}
    </div>
  );

  const SectionHeader = ({
    icon,
    title,
    desc,
  }: {
    icon: React.ReactNode;
    title: string;
    desc?: string;
  }) => (
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-primary/10">{icon}</div>
      <div>
        <h2 className="font-semibold text-foreground">{title}</h2>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" /> Configurações
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie seu perfil, preferências e segurança
        </p>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList className="bg-secondary border border-border">
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="plano">Plano</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
          <TabsTrigger value="conta">Conta</TabsTrigger>
        </TabsList>

        {/* ========== PERFIL ========== */}
        <TabsContent value="perfil" className="mt-4 space-y-4">
          <SectionCard>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-primary/20">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-lg">
                  {fullName || "Usuário"}
                </h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-primary/20 text-primary border-none text-xs">
                    <Crown className="h-3 w-3 mr-1" /> Nível{" "}
                    {profile?.level || 1}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" /> {profile?.xp || 0} XP
                  </Badge>
                  <Badge variant="outline" className="text-xs capitalize">
                    {plan}
                  </Badge>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard>
            <SectionHeader
              icon={<User className="h-4 w-4 text-primary" />}
              title="Informações Pessoais"
              desc="Atualize seus dados de perfil"
            />
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome completo</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-secondary border-border"
                  placeholder="Seu nome"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="relative">
                  <Input
                    value={user?.email || ""}
                    disabled
                    className="bg-muted border-border opacity-60 pr-20"
                  />
                  <Badge
                    variant="outline"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground"
                  >
                    <Lock className="h-3 w-3 mr-1" /> Fixo
                  </Badge>
                </div>
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
          <SectionCard>
            <SectionHeader
              icon={<Crown className="h-4 w-4 text-primary" />}
              title="Seu Plano Atual"
              desc="Gerencie sua assinatura"
            />
            <div
              className={`rounded-lg border p-4 flex items-center justify-between ${plan !== "free" ? "border-primary/30 bg-primary/5" : "border-border bg-secondary/50"}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${plan !== "free" ? "bg-primary/20" : "bg-muted"}`}
                >
                  {plan !== "free" ? (
                    <Crown className="h-5 w-5 text-primary" />
                  ) : (
                    <User className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {/* Lógica para mostrar Nome do Plano + Ciclo */}
                    {plan.includes("ultimate")
                      ? "Plano Ultimate"
                      : plan.includes("pro")
                        ? "Plano Pro"
                        : "Plano Free"}
                    {plan.includes("yearly") && (
                      <span className="text-xs font-normal ml-1 text-primary">
                        (Anual)
                      </span>
                    )}
                    {plan.includes("monthly") && (
                      <span className="text-xs font-normal ml-1 text-primary">
                        (Mensal)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {plan !== "free"
                      ? subscriptionEnd
                        ? `Renova em ${new Date(subscriptionEnd).toLocaleDateString("pt-BR")}`
                        : "Ativo"
                      : "Acesso limitado aos recursos básicos"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  className={`${plan !== "free" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"} border-none`}
                >
                  {plan !== "free" ? "Ativo" : "Gratuito"}
                </Badge>
                {plan !== "free" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                    className="gap-1.5"
                  >
                    {portalLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <ExternalLink className="h-3 w-3" />
                    )}
                    Gerenciar
                  </Button>
                )}
              </div>
            </div>
          </SectionCard>

          {/* SELETOR DE MENSAL / ANUAL */}
          <div className="flex justify-center my-6">
            <div className="bg-secondary p-1 rounded-lg border border-border inline-flex">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${billingCycle === "monthly" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                Mensal
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${billingCycle === "yearly" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                Anual{" "}
                <span className="text-[10px] ml-1 bg-green-500/20 text-green-500 px-1.5 py-0.5 rounded">
                  -20%
                </span>
              </button>
            </div>
          </div>

          {/* Planos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Free */}
            <div
              className={`rounded-xl border p-5 space-y-4 ${plan === "free" ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-foreground">Free</h3>
                  {plan === "free" && (
                    <Badge className="bg-primary/20 text-primary border-none text-xs">
                      Atual
                    </Badge>
                  )}
                </div>
                <p className="text-2xl font-bold text-foreground mt-2">
                  R$ 0
                  <span className="text-sm font-normal text-muted-foreground">
                    /mês
                  </span>
                </p>
              </div>
              <Separator />
              <ul className="space-y-2">
                {[
                  "5 tarefas",
                  "3 hábitos",
                  "2 metas",
                  "3 sonhos",
                  "5 investimentos",
                  "50 transações/mês",
                ].map((text, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-sm text-foreground"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    {text}
                  </li>
                ))}
                {[
                  "Exportação PDF/Excel",
                  "Ranking global",
                  "Suporte prioritário",
                ].map((text, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-sm text-muted-foreground line-through opacity-50"
                  >
                    <div className="h-3.5 w-3.5 rounded-full border border-border shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full" disabled>
                {plan === "free" ? "Plano Atual" : "Plano Base"}
              </Button>
            </div>

            {/* Pro */}
            <div
              className={`rounded-xl border p-5 space-y-4 relative overflow-hidden ${plan.includes("pro") ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}
            >
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                POPULAR
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Crown className="h-5 w-5 text-primary" /> Pro
                  </h3>
                  {plan.includes("pro") && (
                    <Badge className="bg-primary/20 text-primary border-none text-xs">
                      Atual
                    </Badge>
                  )}
                </div>
                <p className="text-2xl font-bold text-foreground mt-2">
                  {billingCycle === "monthly" ? "R$ 19,90" : "R$ 199,00"}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{billingCycle === "monthly" ? "mês" : "ano"}
                  </span>
                </p>
              </div>
              <Separator />
              <ul className="space-y-2">
                {[
                  "20 tarefas",
                  "10 hábitos",
                  "10 metas",
                  "10 sonhos",
                  "20 investimentos",
                  "200 transações/mês",
                  "Exportação PDF/Excel",
                  "Ranking global",
                ].map((text, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-sm text-foreground"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    {text}
                  </li>
                ))}
                {["Suporte prioritário"].map((text, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-sm text-muted-foreground line-through opacity-50"
                  >
                    <div className="h-3.5 w-3.5 rounded-full border border-border shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>
              {/* Lógica de Botão Inteligente */}
              {plan === `pro_${billingCycle}` ? (
                <Button variant="outline" className="w-full" disabled>
                  Plano Atual
                </Button>
              ) : (
                <Button
                  className="w-full gap-2"
                  onClick={() => handleCheckout(`pro_${billingCycle}`)}
                  disabled={checkoutLoading || plan.includes("ultimate")}
                >
                  {checkoutLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  {plan.includes("ultimate")
                    ? "Membro Ultimate"
                    : plan ===
                        `pro_${billingCycle === "monthly" ? "yearly" : "monthly"}`
                      ? "Trocar Ciclo"
                      : `Assinar Pro ${billingCycle === "monthly" ? "Mensal" : "Anual"}`}
                </Button>
              )}
            </div>

            {/* Ultimate */}
            <div
              className={`rounded-xl border p-5 space-y-4 relative overflow-hidden ${plan.includes("ultimate") ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}
            >
              <div className="absolute top-0 right-0 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                COMPLETO
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" /> Ultimate
                  </h3>
                  {plan.includes("ultimate") && (
                    <Badge className="bg-primary/20 text-primary border-none text-xs">
                      Atual
                    </Badge>
                  )}
                </div>
                <p className="text-2xl font-bold text-foreground mt-2">
                  {billingCycle === "monthly" ? "R$ 39,90" : "R$ 399,00"}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{billingCycle === "monthly" ? "mês" : "ano"}
                  </span>
                </p>
              </div>
              <Separator />
              <ul className="space-y-2">
                {[
                  "Tarefas ilimitadas",
                  "Hábitos ilimitados",
                  "Metas ilimitadas",
                  "Sonhos ilimitados",
                  "Investimentos ilimitados",
                  "Transações ilimitadas",
                  "Exportação PDF/Excel",
                  "Ranking global",
                  "Suporte prioritário",
                ].map((text, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-sm text-foreground"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>
              {plan === `ultimate_${billingCycle}` ? (
                <Button variant="outline" className="w-full" disabled>
                  Plano Atual
                </Button>
              ) : (
                <Button
                  className="w-full gap-2"
                  onClick={() => handleCheckout(`ultimate_${billingCycle}`)}
                  disabled={checkoutLoading}
                >
                  {checkoutLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Crown className="h-4 w-4" />
                  )}
                  {plan ===
                  `ultimate_${billingCycle === "monthly" ? "yearly" : "monthly"}`
                    ? "Trocar Ciclo"
                    : `Assinar Ultimate ${billingCycle === "monthly" ? "Mensal" : "Anual"}`}
                </Button>
              )}
            </div>
          </div>

          <SectionCard>
            <SectionHeader
              icon={<Shield className="h-4 w-4 text-primary" />}
              title="Perguntas Frequentes"
            />
            <div className="space-y-3">
              {[
                {
                  q: "Posso cancelar a qualquer momento?",
                  a: "Sim. Seu acesso continua até o final do período pago.",
                },
                {
                  q: "Meus dados são mantidos se eu fizer downgrade?",
                  a: "Sim, seus dados são preservados. Apenas o acesso a recursos premium será limitado.",
                },
                {
                  q: "Posso trocar de plano?",
                  a: "Sim! Upgrade ou downgrade a qualquer momento pelo portal de gerenciamento.",
                },
                {
                  q: "Quais formas de pagamento são aceitas?",
                  a: "Cartão de crédito via Stripe. Pagamento seguro e criptografado.",
                },
              ].map((faq, i) => (
                <div
                  key={i}
                  className="py-2.5 border-b border-border last:border-0"
                >
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
            <SectionHeader
              icon={<DollarSign className="h-4 w-4 text-primary" />}
              title="Preferências Financeiras"
              desc="Configure moeda e metas de economia"
            />
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Moeda preferida</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
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
                <Input
                  type="number"
                  value={savingsGoal}
                  onChange={(e) => setSavingsGoal(e.target.value)}
                  className="bg-secondary border-border"
                  placeholder="0,00"
                />
              </div>
            </div>
            <Button onClick={handleSave} disabled={isLoading} className="gap-2">
              <Save className="h-4 w-4" />
              {isLoading ? "Salvando..." : "Salvar Preferências"}
            </Button>
          </SectionCard>

          <SectionCard>
            <SectionHeader
              icon={<Target className="h-4 w-4 text-primary" />}
              title="Resumo Rápido"
            />
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Plano Atual",
                  value: (() => {
                    const p = (profile?.plan || "free").toLowerCase();
                    if (p === "free") return "Free";
                    const name = p.includes("ultimate") ? "Ultimate" : "Pro";
                    const cycle = p.includes("yearly") ? "(Anual)" : "(Mensal)";
                    return `${name} ${cycle}`;
                  })(),
                  icon: <CreditCard className="h-4 w-4 text-primary" />,
                },
                {
                  label: "Moeda",
                  value: currency,
                  icon: <Globe className="h-4 w-4 text-primary" />,
                },
                {
                  label: "Meta Mensal",
                  value: `R$ ${Number(savingsGoal).toLocaleString("pt-BR")}`,
                  icon: <Target className="h-4 w-4 text-primary" />,
                },
                {
                  label: "Membro Desde",
                  value: profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString("pt-BR")
                    : "—",
                  icon: <Calendar className="h-4 w-4 text-primary" />,
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-secondary/50 flex items-center gap-3"
                >
                  <div className="p-1.5 rounded-md bg-primary/10">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </TabsContent>

        {/* ========== SEGURANÇA ========== */}
        <TabsContent value="seguranca" className="mt-4 space-y-4">
          <SectionCard>
            <SectionHeader
              icon={<Key className="h-4 w-4 text-primary" />}
              title="Alterar Senha"
              desc="Mantenha sua conta segura"
            />
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
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
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
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> As senhas não conferem
                  </p>
                )}
                {confirmPassword &&
                  newPassword === confirmPassword &&
                  newPassword.length >= 6 && (
                    <p className="text-xs text-primary flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Senhas conferem
                    </p>
                  )}
              </div>
            </div>
            <Button
              onClick={handleChangePassword}
              disabled={
                changingPassword ||
                !newPassword ||
                newPassword !== confirmPassword
              }
              className="gap-2"
            >
              <Shield className="h-4 w-4" />
              {changingPassword ? "Alterando..." : "Alterar Senha"}
            </Button>
          </SectionCard>

          <SectionCard>
            <SectionHeader
              icon={<Shield className="h-4 w-4 text-primary" />}
              title="Informações de Segurança"
            />
            <div className="space-y-3">
              {[
                {
                  label: "Autenticação",
                  value: "Email e Senha",
                  status: "active",
                },
                {
                  label: "Sessão Ativa",
                  value: "Navegador atual",
                  status: "active",
                },
                {
                  label: "Último Acesso",
                  value: user?.last_sign_in_at
                    ? new Date(user.last_sign_in_at).toLocaleString("pt-BR")
                    : "Agora",
                  status: "info",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2.5 border-b border-border last:border-0"
                >
                  <span className="text-sm text-muted-foreground">
                    {item.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground">
                      {item.value}
                    </span>
                    {item.status === "active" && (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </TabsContent>

        {/* ========== CONTA ========== */}
        <TabsContent value="conta" className="mt-4 space-y-4">
          <SectionCard>
            <SectionHeader
              icon={<User className="h-4 w-4 text-primary" />}
              title="Sessão"
              desc="Gerenciar sua sessão ativa"
            />
            <Button
              variant="outline"
              onClick={async () => {
                await signOut();
                navigate("/login");
              }}
              className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              Sair da Conta
            </Button>
          </SectionCard>

          <SectionCard className="border-destructive/20">
            <SectionHeader
              icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
              title="Zona de Perigo"
              desc="Ações irreversíveis na sua conta"
            />
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <div className="flex items-start gap-3">
                <Trash2 className="h-5 w-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">
                    Excluir conta permanentemente
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Todos os seus dados serão excluídos permanentemente. Esta
                    ação não pode ser desfeita.
                  </p>
                </div>
              </div>
              <Dialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive gap-2"
                  >
                    <Trash2 className="h-3 w-3" /> Excluir Conta
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle className="text-destructive flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" /> Excluir Conta
                    </DialogTitle>
                    <DialogDescription>
                      Esta ação é permanente e não pode ser desfeita.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>
                        Digite{" "}
                        <span className="font-bold text-destructive">
                          EXCLUIR
                        </span>{" "}
                        para confirmar
                      </Label>
                      <Input
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        className="bg-secondary border-border"
                        placeholder="EXCLUIR"
                      />
                    </div>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmText !== "EXCLUIR"}
                      className="w-full gap-2"
                    >
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
