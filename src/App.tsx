import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";

// Layouts
import PublicLayout from "@/components/PublicLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";

// Páginas públicas
import LandingPage from "@/pages/LandingPage";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import TermsPage from "@/pages/TermsPage";
import PrivacyPage from "@/pages/PrivacyPage";
import RoadmapPage from "@/pages/RoadmapPage";
import HelpPage from "@/pages/HelpPage";
import NotFound from "@/pages/NotFound";

// Páginas protegidas
import Dashboard from "@/pages/Dashboard";
import TasksPage from "@/pages/TasksPage";
import HabitsPage from "@/pages/HabitsPage";
import GoalsPage from "@/pages/GoalsPage";
import FinancePage from "@/pages/FinancePage";
import InvestmentsPage from "@/pages/InvestmentsPage";
import DreamsPage from "@/pages/DreamsPage";
import ReportsPage from "@/pages/ReportsPage";
import RankingPage from "@/pages/RankingPage";
import SettingsPage from "@/pages/SettingsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SubscriptionProvider>
            <Routes>
              {/* ── Landing (nav/footer próprios com scroll dinâmico) */}
              <Route path="/" element={<LandingPage />} />

              {/* ── Auth (sem nav/footer público) */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* ── Páginas públicas com nav + footer compartilhados */}
              <Route element={<PublicLayout />}>
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/roadmap" element={<RoadmapPage />} />
                <Route path="/help" element={<HelpPage />} />
              </Route>

              {/* ── Páginas protegidas (dashboard com sidebar) */}
              <Route
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/habits" element={<HabitsPage />} />
                <Route path="/goals" element={<GoalsPage />} />
                <Route path="/finances" element={<FinancePage />} />
                <Route path="/investments" element={<InvestmentsPage />} />
                <Route path="/dreams" element={<DreamsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/ranking" element={<RankingPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>

              {/* ── 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SubscriptionProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
