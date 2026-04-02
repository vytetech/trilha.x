import { useSubscription, PLAN_LIMITS } from "@/contexts/SubscriptionContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PlanLimitBannerProps {
  resource: keyof typeof PLAN_LIMITS.free;
  currentCount: number;
  resourceLabel: string;
}

export default function PlanLimitBanner({ resource, currentCount, resourceLabel }: PlanLimitBannerProps) {
  const { plan, canCreate, getLimit, getRemainder } = useSubscription();
  const navigate = useNavigate();

  if (plan === "ultimate") return null;

  const limit = getLimit(resource);
  const remainder = getRemainder(resource, currentCount);
  const atLimit = !canCreate(resource, currentCount);

  if (remainder > 2 && !atLimit) return null;

  return (
    <div className={`rounded-lg border p-3 flex items-center justify-between gap-3 ${atLimit ? "border-destructive/30 bg-destructive/5" : "border-primary/20 bg-primary/5"}`}>
      <div className="flex items-center gap-2">
        {atLimit ? <Lock className="h-4 w-4 text-destructive" /> : <Crown className="h-4 w-4 text-primary" />}
        <span className="text-sm text-foreground">
          {atLimit
            ? `Limite atingido: ${limit} ${resourceLabel} no plano ${plan === "free" ? "Free" : "Pro"}`
            : `${remainder} ${resourceLabel} restante(s) no plano ${plan === "free" ? "Free" : "Pro"}`}
        </span>
      </div>
      <Button size="sm" variant={atLimit ? "default" : "outline"} onClick={() => navigate("/settings?tab=plano")} className="gap-1.5 shrink-0">
        <Crown className="h-3.5 w-3.5" /> Upgrade
      </Button>
    </div>
  );
}
