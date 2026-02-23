import { AlertTriangle, Trash2, TrendingUp, Sparkles, Check } from "lucide-react";
import { cn } from "../ui/utils";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "../ui/alert-dialog";

export type ConfirmVariant = "destructive" | "warning" | "promote" | "convert";

interface ConfirmActionDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
  variant?: ConfirmVariant;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  entityId?: string;
  entityTitle?: string;
}

const VARIANT_CONFIG: Record<
  ConfirmVariant,
  {
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    actionClass: string;
  }
> = {
  destructive: {
    icon: Trash2,
    iconBg: "bg-destructive/10 border-destructive/30",
    iconColor: "text-destructive",
    actionClass:
      "bg-destructive/10 border border-destructive/40 text-destructive hover:bg-destructive hover:text-white rounded-xl text-xs",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-amber-500/10 border-amber-500/30",
    iconColor: "text-amber-400",
    actionClass:
      "bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-white rounded-xl text-xs",
  },
  promote: {
    icon: TrendingUp,
    iconBg: "bg-blue-500/10 border-blue-500/30",
    iconColor: "text-blue-400",
    actionClass:
      "bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500 hover:text-white rounded-xl text-xs",
  },
  convert: {
    icon: Sparkles,
    iconBg: "bg-violet-500/10 border-violet-500/30",
    iconColor: "text-violet-400",
    actionClass:
      "bg-violet-500/10 border border-violet-500/30 text-violet-400 hover:bg-violet-500 hover:text-white rounded-xl text-xs",
  },
};

export function ConfirmActionDialog({
  open,
  onOpenChange,
  onConfirm,
  variant = "warning",
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  entityId,
  entityTitle,
}: ConfirmActionDialogProps) {
  const cfg = VARIANT_CONFIG[variant];
  const Icon = cfg.icon;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card border border-border rounded-2xl shadow-2xl max-w-sm">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div
              className={cn(
                "w-9 h-9 rounded-xl border flex items-center justify-center shrink-0",
                cfg.iconBg
              )}
            >
              <Icon className={cn("w-4 h-4", cfg.iconColor)} />
            </div>
            <AlertDialogTitle
              className="text-foreground text-sm"
              style={{ fontWeight: 700 }}
            >
              {title}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-muted-foreground text-xs space-y-2">
            <span className="block">{description}</span>
            {(entityId || entityTitle) && (
              <span className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/60 border border-border">
                {entityId && (
                  <span className="font-mono text-[10px] text-muted-foreground/60">
                    {entityId}
                  </span>
                )}
                {entityTitle && (
                  <span className="text-foreground/80 text-xs truncate">
                    {entityTitle}
                  </span>
                )}
              </span>
            )}
            <span className="block text-muted-foreground/50 text-[11px]">
              Esta acción se mostrará en la notificación con opción de deshacer.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 mt-2">
          <AlertDialogCancel className="rounded-xl text-xs border-border">
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(cfg.actionClass)}
            style={{ fontWeight: 600 }}
          >
            <Check className="w-3 h-3 mr-1.5" />
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
