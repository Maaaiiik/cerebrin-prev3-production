/**
 * AgentProfileBuilder — Preview del agente generado
 * Muestra mini-mapa de la estructura del agente
 */

import React from 'react';
import { motion } from 'motion/react';
import { Bot, Brain, Zap, FileText } from 'lucide-react';

interface AgentProfileBuilderProps {
  agentConfig: {
    name: string;
    mode: string;
    specialty: string;
    first_skill: string;
  };
}

export function AgentProfileBuilder({ agentConfig }: AgentProfileBuilderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-6 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">{agentConfig.name}</h3>
          <p className="text-xs text-muted-foreground">Tu asistente personalizado</p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-3">
        <DetailRow
          icon={<Brain className="w-4 h-4" />}
          label="Modo"
          value={agentConfig.mode}
          description="Nivel de autonomía configurado"
        />

        <DetailRow
          icon={<Zap className="w-4 h-4" />}
          label="Especialidad"
          value={agentConfig.specialty}
          description="Área de enfoque principal"
        />

        <DetailRow
          icon={<FileText className="w-4 h-4" />}
          label="Primera habilidad"
          value={agentConfig.first_skill}
          description="Lo primero que te ayudará a hacer"
        />
      </div>

      {/* Memory info */}
      <div className="pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Memorizará:</span> Clientes, Plantillas, Documentos relevantes
        </p>
      </div>
    </motion.div>
  );
}

function DetailRow({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-muted-foreground">{label}:</span>
          <span className="text-sm font-semibold">{value}</span>
        </div>
        <p className="text-xs text-muted-foreground/70">{description}</p>
      </div>
    </div>
  );
}
