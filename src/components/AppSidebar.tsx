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
  Zap,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
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

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Tarefas", url: "/tasks", icon: CheckSquare },
  { title: "Hábitos", url: "/habits", icon: Repeat },
  { title: "Metas", url: "/goals", icon: Target },
  { title: "Financeiro", url: "/finances", icon: Wallet },
  { title: "Investimentos", url: "/investments", icon: TrendingUp },
  { title: "Relatórios", url: "/reports", icon: BarChart3 },
  { title: "Ranking", url: "/ranking", icon: Trophy },
  { title: "Configurações", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <Sidebar className="border-r border-border bg-sidebar">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
        <Zap className="h-6 w-6 text-primary" />
        <span className="text-xl font-bold gradient-text">TRILHA</span>
      </div>

      <SidebarContent className="px-3 py-4">
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
                      activeClassName="bg-primary/10 text-primary neon-text font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-3 pb-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          <span>Sair</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
