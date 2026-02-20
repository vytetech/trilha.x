import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import SettingsPage from "@/pages/SettingsPage";
import PlaceholderPage from "@/pages/PlaceholderPage";
import NotFound from "@/pages/NotFound";
import { CheckSquare, Repeat, Target, Wallet, TrendingUp, BarChart3, Trophy } from "lucide-react";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tasks" element={<PlaceholderPage title="Tarefas" description="Gerencie suas tarefas diárias e mantenha a produtividade em alta." icon={CheckSquare} />} />
              <Route path="/habits" element={<PlaceholderPage title="Hábitos" description="Crie e acompanhe hábitos positivos para transformar sua rotina." icon={Repeat} />} />
              <Route path="/goals" element={<PlaceholderPage title="Metas" description="Defina metas claras e acompanhe seu progresso até alcançá-las." icon={Target} />} />
              <Route path="/finances" element={<PlaceholderPage title="Financeiro" description="Controle receitas, despesas e acompanhe sua saúde financeira." icon={Wallet} />} />
              <Route path="/investments" element={<PlaceholderPage title="Investimentos" description="Acompanhe seu portfólio e tome decisões inteligentes." icon={TrendingUp} />} />
              <Route path="/reports" element={<PlaceholderPage title="Relatórios" description="Visualize gráficos e análises detalhadas da sua evolução." icon={BarChart3} />} />
              <Route path="/ranking" element={<PlaceholderPage title="Ranking" description="Compare seu progresso e conquistas com outros usuários." icon={Trophy} />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
