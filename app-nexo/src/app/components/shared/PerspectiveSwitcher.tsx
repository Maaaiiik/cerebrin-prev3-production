/**
 * PerspectiveSwitcher — Dropdown para cambiar entre Director/Focus/Custom
 * 
 * Se integra en TopNav junto a Theme y Language selectors.
 */

import * as React from "react";
import { Crown, Target, Sliders, Eye, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useUserPerspective, type PerspectiveMode } from "../../contexts/UserPerspective";
import { cn } from "../ui/utils";

const MODE_CONFIG: Record<PerspectiveMode, { icon: React.ElementType; label: string; color: string; desc: string }> = {
  director: {
    icon: Crown,
    label: "Vista Director",
    color: "text-violet-400",
    desc: "Acceso completo · Analytics · Admin",
  },
  focus: {
    icon: Target,
    label: "Vista Focus",
    color: "text-emerald-400",
    desc: "Solo tareas · Sin distracciones",
  },
  custom: {
    icon: Sliders,
    label: "Vista Personalizada",
    color: "text-blue-400",
    desc: "Configuración a medida",
  },
};

export function PerspectiveSwitcher() {
  const { mode, setMode } = useUserPerspective();
  const currentConfig = MODE_CONFIG[mode];
  const CurrentIcon = currentConfig.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all duration-150",
            "hover:bg-muted text-muted-foreground hover:text-foreground"
          )}
          title="Cambiar vista"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="text-xs hidden md:inline">{currentConfig.label}</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72 bg-card border-border">
        <DropdownMenuLabel className="flex items-center gap-2 px-3 py-2">
          <Eye className="w-4 h-4 text-muted-foreground/60" />
          <span className="text-sm">Perspectiva de Usuario</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />

        {(Object.keys(MODE_CONFIG) as PerspectiveMode[]).map((m) => {
          const config = MODE_CONFIG[m];
          const Icon = config.icon;
          const isActive = mode === m;

          return (
            <DropdownMenuItem
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "flex items-start gap-3 px-3 py-2.5 cursor-pointer rounded-lg transition-all",
                isActive
                  ? "bg-muted/80"
                  : "hover:bg-muted/40"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  isActive ? "bg-background border border-border" : "bg-muted"
                )}
              >
                <Icon className={cn("w-4 h-4", config.color)} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn("text-sm font-semibold", isActive && "text-foreground")}>
                    {config.label}
                  </span>
                  {isActive && (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  {config.desc}
                </p>
              </div>
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator className="bg-border" />
        
        <div className="px-3 py-2">
          <p className="text-xs text-muted-foreground/40">
            Personaliza tu experiencia desde Configuración → Perspectiva
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
