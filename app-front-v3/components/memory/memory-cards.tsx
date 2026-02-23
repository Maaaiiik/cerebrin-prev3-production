"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  DollarSign,
  Heart,
  Users,
  ChevronDown,
  Trash2,
  Eye,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Types
export interface MemoryCategory {
  id: string
  name: string
  icon: "expense" | "health" | "clients"
  rowCount: number
  lastUpdated: string
  color: string
  data: Array<Record<string, string>>
  columns: string[]
}

const iconMap = {
  expense: DollarSign,
  health: Heart,
  clients: Users,
}

// Demo data
export const demoCategories: MemoryCategory[] = [
  {
    id: "gastos",
    name: "Gastos",
    icon: "expense",
    rowCount: 156,
    lastUpdated: "Hace 5 min",
    color: "bg-cerebrin-violet",
    columns: ["Fecha", "Concepto", "Monto", "Categoria"],
    data: [
      { Fecha: "2026-02-23", Concepto: "Almuerzo negocios", Monto: "$45.50", Categoria: "Alimentacion" },
      { Fecha: "2026-02-23", Concepto: "Uber oficina", Monto: "$12.00", Categoria: "Transporte" },
      { Fecha: "2026-02-22", Concepto: "Licencia Figma", Monto: "$15.00", Categoria: "Software" },
      { Fecha: "2026-02-22", Concepto: "Cafe cliente", Monto: "$8.50", Categoria: "Alimentacion" },
      { Fecha: "2026-02-21", Concepto: "Hosting VPS", Monto: "$24.00", Categoria: "Infraestructura" },
      { Fecha: "2026-02-21", Concepto: "Papeleria", Monto: "$6.75", Categoria: "Oficina" },
      { Fecha: "2026-02-20", Concepto: "Dominio .com", Monto: "$12.99", Categoria: "Infraestructura" },
      { Fecha: "2026-02-20", Concepto: "Almuerzo equipo", Monto: "$67.00", Categoria: "Alimentacion" },
      { Fecha: "2026-02-19", Concepto: "Taxi aeropuerto", Monto: "$35.00", Categoria: "Transporte" },
      { Fecha: "2026-02-19", Concepto: "Material oficina", Monto: "$22.30", Categoria: "Oficina" },
    ],
  },
  {
    id: "salud",
    name: "Salud",
    icon: "health",
    rowCount: 42,
    lastUpdated: "Hace 2 horas",
    color: "bg-cerebrin-pink",
    columns: ["Fecha", "Tipo", "Valor", "Notas"],
    data: [
      { Fecha: "2026-02-23", Tipo: "Peso", Valor: "75 kg", Notas: "Mantenido" },
      { Fecha: "2026-02-23", Tipo: "Sueno", Valor: "7.5 hrs", Notas: "Buena calidad" },
      { Fecha: "2026-02-22", Tipo: "Ejercicio", Valor: "45 min", Notas: "Cardio" },
      { Fecha: "2026-02-22", Tipo: "Agua", Valor: "2.5 L", Notas: "Meta cumplida" },
      { Fecha: "2026-02-21", Tipo: "Peso", Valor: "75.2 kg", Notas: "" },
      { Fecha: "2026-02-21", Tipo: "Sueno", Valor: "6 hrs", Notas: "Poco descanso" },
      { Fecha: "2026-02-20", Tipo: "Ejercicio", Valor: "60 min", Notas: "Pesas" },
      { Fecha: "2026-02-20", Tipo: "Agua", Valor: "2 L", Notas: "" },
      { Fecha: "2026-02-19", Tipo: "Peso", Valor: "75.5 kg", Notas: "" },
      { Fecha: "2026-02-19", Tipo: "Sueno", Valor: "8 hrs", Notas: "Excelente" },
    ],
  },
  {
    id: "clientes",
    name: "Clientes",
    icon: "clients",
    rowCount: 23,
    lastUpdated: "Hace 1 dia",
    color: "bg-cerebrin-blue",
    columns: ["Nombre", "Email", "Proyecto", "Estado"],
    data: [
      { Nombre: "Ana Garcia", Email: "ana@empresa.com", Proyecto: "Rediseno web", Estado: "Activo" },
      { Nombre: "Carlos Lopez", Email: "carlos@startup.io", Proyecto: "App movil", Estado: "Activo" },
      { Nombre: "Maria Torres", Email: "maria@corp.com", Proyecto: "Branding", Estado: "Pausado" },
      { Nombre: "Pedro Ruiz", Email: "pedro@tech.co", Proyecto: "Dashboard", Estado: "Activo" },
      { Nombre: "Laura Diaz", Email: "laura@agency.es", Proyecto: "E-commerce", Estado: "Completado" },
      { Nombre: "Jose Martinez", Email: "jose@saas.com", Proyecto: "Landing page", Estado: "Activo" },
      { Nombre: "Sofia Herrera", Email: "sofia@design.mx", Proyecto: "UI Kit", Estado: "Pausado" },
      { Nombre: "Diego Morales", Email: "diego@fin.com", Proyecto: "Fintech app", Estado: "Activo" },
      { Nombre: "Elena Castro", Email: "elena@edu.org", Proyecto: "Plataforma LMS", Estado: "Activo" },
      { Nombre: "Raul Vega", Email: "raul@retail.com", Proyecto: "POS System", Estado: "Completado" },
    ],
  },
]

// -- Memory Category Card --
interface MemoryCategoryCardProps {
  category: MemoryCategory
  index: number
}

export function MemoryCategoryCard({ category, index }: MemoryCategoryCardProps) {
  const [expanded, setExpanded] = useState(false)
  const Icon = iconMap[category.icon]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      {/* Card header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-secondary/30"
        aria-expanded={expanded}
      >
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${category.color}/10`}>
          <Icon className={`h-5 w-5`} style={{ color: `var(--cerebrin-${category.icon === "expense" ? "violet" : category.icon === "health" ? "pink" : "blue"})` }} aria-hidden="true" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-card-foreground">{category.name}</h3>
          <p className="text-xs text-muted-foreground">
            {category.rowCount} registros - {category.lastUpdated}
          </p>
        </div>
        <Badge variant="outline" className="mr-2 rounded-lg font-mono text-[10px]">
          {category.rowCount}
        </Badge>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </motion.div>
      </button>

      {/* Data Explorer */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      {category.columns.map((col) => (
                        <TableHead
                          key={col}
                          className="h-9 whitespace-nowrap px-4 text-[11px] font-bold uppercase tracking-wide text-muted-foreground"
                        >
                          {col}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {category.data.map((row, i) => (
                      <TableRow key={i} className="hover:bg-secondary/30">
                        {category.columns.map((col) => (
                          <TableCell
                            key={col}
                            className="whitespace-nowrap px-4 py-2.5 text-xs font-medium text-card-foreground"
                          >
                            {col === "Estado" ? (
                              <Badge
                                variant="outline"
                                className={`rounded-lg text-[10px] ${
                                  row[col] === "Activo"
                                    ? "border-cerebrin-green/30 bg-cerebrin-green/10 text-cerebrin-green"
                                    : row[col] === "Pausado"
                                    ? "border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#F59E0B]"
                                    : "border-muted-foreground/30 bg-muted text-muted-foreground"
                                }`}
                              >
                                {row[col]}
                              </Badge>
                            ) : (
                              row[col]
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <p className="text-[10px] text-muted-foreground">
                  Mostrando 10 de {category.rowCount} registros
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1 rounded-lg text-xs">
                    <Eye className="h-3 w-3" aria-hidden="true" />
                    Ver todo
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// -- Purge Button --
interface PurgeButtonProps {
  onPurge?: () => void
}

export function PurgeButton({ onPurge }: PurgeButtonProps) {
  const [confirming, setConfirming] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="rounded-2xl border border-destructive/20 bg-destructive/5 px-5 py-4"
    >
      <div className="flex items-center gap-3">
        <Trash2 className="h-5 w-5 text-destructive" aria-hidden="true" />
        <div className="flex-1">
          <h4 className="text-sm font-bold text-card-foreground">Limpiar Memoria</h4>
          <p className="text-xs text-muted-foreground">
            Vaciar hojas o reiniciar el entrenamiento
          </p>
        </div>
      </div>
      <AnimatePresence mode="wait">
        {confirming ? (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 flex gap-2"
          >
            <Button
              variant="destructive"
              size="sm"
              className="flex-1 rounded-xl font-semibold"
              onClick={() => {
                onPurge?.()
                setConfirming(false)
              }}
            >
              Confirmar Limpieza
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl font-semibold"
              onClick={() => setConfirming(false)}
            >
              Cancelar
            </Button>
          </motion.div>
        ) : (
          <motion.div key="initial" className="mt-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-xl border-destructive/30 font-semibold text-destructive hover:bg-destructive/10"
              onClick={() => setConfirming(true)}
            >
              Limpiar Memoria
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// -- Create Memory Node Button --
interface CreateNodeButtonProps {
  onCreate?: () => void
}

export function CreateNodeButton({ onCreate }: CreateNodeButtonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <Button
        onClick={onCreate}
        className="w-full gap-2 rounded-2xl bg-primary py-6 font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
      >
        <Plus className="h-5 w-5" aria-hidden="true" />
        Crear Nueva Memoria
      </Button>
    </motion.div>
  )
}
