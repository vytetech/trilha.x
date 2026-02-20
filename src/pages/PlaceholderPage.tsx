import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export default function PlaceholderPage({ title, description, icon: Icon }: PlaceholderPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center"
    >
      <div className="rounded-2xl bg-primary/10 p-6 mb-6">
        <Icon className="h-12 w-12 text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
      <p className="text-muted-foreground max-w-md">{description}</p>
      <span className="mt-4 text-xs text-muted-foreground px-3 py-1 rounded-full bg-secondary">Em breve</span>
    </motion.div>
  );
}
