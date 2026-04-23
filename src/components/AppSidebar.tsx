import {
  LayoutDashboard,
  CheckSquare,
  Repeat,
  Target,
  Wallet,
  TrendingUp,
  BarChart3,
  Trophy,
  Settings,
  LogOut,
  Sparkles,
  Sun,
  Moon,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import logoTrilha from "@/assets/logo-trilha.x.png";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Tarefas", url: "/tasks", icon: CheckSquare },
  { title: "Hábitos", url: "/habits", icon: Repeat },
  { title: "Metas", url: "/goals", icon: Target },
  { title: "Financeiro", url: "/finances", icon: Wallet },
  { title: "Investimentos", url: "/investments", icon: TrendingUp },
  { title: "Sonhos", url: "/dreams", icon: Sparkles },
  { title: "Relatórios", url: "/reports", icon: BarChart3 },
  { title: "Ranking", url: "/ranking", icon: Trophy },
  { title: "Configurações", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [profileName, setProfileName] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.full_name) setProfileName(data.full_name);
      });
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const fullName = profileName || user?.user_metadata?.full_name || "Usuário";
  const email = user?.email || "";
  const initials = fullName
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Sidebar className="border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <img
          src={logoTrilha}
          alt="TRILHA.X"
          className="h-10 w-10 rounded-lg object-cover border border-primary/40 shadow-[0_0_8px_rgba(34,197,94,0.25)]"
        />
        <span className="text-xl font-black gradient-text tracking-tighter uppercase">
          TRILHA.X
        </span>
      </div>

      <SidebarContent className="px-3 py-4">
        {/* Perfil do usuário */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-sidebar-accent/50 border border-border">
          <div className="h-8 w-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
            <span className="text-primary font-bold text-xs">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {fullName.split(" ").slice(0, 2).join(" ")}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {email}
            </p>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-3 pb-4 space-y-2">
        {/* Toggle de tema */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
        >
          <div className="flex items-center gap-3">
            {theme === "dark" ? (
              <Sun className="h-4 w-4 shrink-0" />
            ) : (
              <Moon className="h-4 w-4 shrink-0" />
            )}
            <span>{theme === "dark" ? "Modo Claro" : "Modo Escuro"}</span>
          </div>
          <div
            className={`w-8 h-4 rounded-full transition-colors duration-300 relative ${theme === "dark" ? "bg-muted" : "bg-primary"}`}
          >
            <div
              className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all duration-300 ${theme === "dark" ? "left-0.5" : "left-4"}`}
            />
          </div>
        </button>

        {/* Botão sair com confirmação */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full">
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Sair</span>
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sair da conta?</AlertDialogTitle>
              <AlertDialogDescription>
                Você será desconectado e redirecionado para a tela de login.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleLogout}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Sair
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarFooter>
    </Sidebar>
  );
}
