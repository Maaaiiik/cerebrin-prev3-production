/**
 * PerspectiveDebug — Dev tool para testing UserPerspective
 * 
 * Muestra el estado actual del perspective y permite cambiar modos.
 * Remover en producción o esconder detrás de feature flag.
 */

import * as React from "react";
import { useUserPerspective } from "../../contexts/UserPerspective";
import { Eye, Crown, Target, Sliders } from "lucide-react";

export function PerspectiveDebug() {
  const { profile, mode, setMode, canAccess, canUseFeature } = useUserPerspective();
  const [isOpen, setIsOpen] = React.useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 left-5 z-50 w-10 h-10 rounded-full bg-orange-600/90 hover:bg-orange-500 text-white shadow-lg flex items-center justify-center transition-all"
        title="Debug Perspective"
      >
        <Eye className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 left-5 z-50 w-80 bg-card border border-border rounded-xl shadow-2xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-semibold">Perspective Debug</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="w-6 h-6 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground"
        >
          ×
        </button>
      </div>

      {/* Current Mode */}
      <div className="p-3 bg-muted rounded-lg">
        <div className="text-xs text-muted-foreground mb-1">Modo Actual</div>
        <div className="text-sm font-semibold">{profile.name}</div>
        <div className="text-xs text-muted-foreground">Role: {profile.role}</div>
      </div>

      {/* Mode Switcher */}
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">Cambiar Modo:</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={() => setMode("director")}
            className={`p-2 rounded-lg border text-xs flex flex-col items-center gap-1 transition-colors ${
              mode === "director"
                ? "bg-violet-500/20 border-violet-500"
                : "border-border hover:bg-muted"
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Director</span>
          </button>
          <button
            onClick={() => setMode("focus")}
            className={`p-2 rounded-lg border text-xs flex flex-col items-center gap-1 transition-colors ${
              mode === "focus"
                ? "bg-emerald-500/20 border-emerald-500"
                : "border-border hover:bg-muted"
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Focus</span>
          </button>
          <button
            onClick={() => setMode("custom")}
            className={`p-2 rounded-lg border text-xs flex flex-col items-center gap-1 transition-colors ${
              mode === "custom"
                ? "bg-blue-500/20 border-blue-500"
                : "border-border hover:bg-muted"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Custom</span>
          </button>
        </div>
      </div>

      {/* Sections Access */}
      <div className="space-y-1">
        <div className="text-xs text-muted-foreground">Secciones Visibles:</div>
        <div className="text-xs space-y-0.5">
          {Object.entries(profile.sections).map(([key, visible]) => (
            <div key={key} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${visible ? "bg-emerald-500" : "bg-red-500"}`} />
              <span className={visible ? "text-foreground" : "text-muted-foreground"}>
                {key}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="space-y-1">
        <div className="text-xs text-muted-foreground">Features:</div>
        <div className="text-xs space-y-0.5">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${canUseFeature("shadow_chat_enabled") ? "bg-emerald-500" : "bg-red-500"}`} />
            <span>Shadow Chat</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${canUseFeature("can_see_analytics") ? "bg-emerald-500" : "bg-red-500"}`} />
            <span>Analytics</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${canUseFeature("can_approve_hitl") ? "bg-emerald-500" : "bg-red-500"}`} />
            <span>Aprobar HITL</span>
          </div>
        </div>
      </div>
    </div>
  );
}
