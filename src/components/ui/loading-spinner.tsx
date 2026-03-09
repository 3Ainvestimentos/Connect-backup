import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  /** Mensagem exibida abaixo do spinner (ex.: "Carregando Painel Estratégico") */
  message?: string;
}

export function LoadingSpinner({ className, message }: LoadingSpinnerProps) {
  const spinner = (
    <Loader2 className={cn("h-10 w-10 animate-spin text-admin-primary", className)} />
  );
  if (message) {
    return (
      <div className="flex flex-col items-center justify-center gap-3">
        {spinner}
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
    );
  }
  return spinner;
}
