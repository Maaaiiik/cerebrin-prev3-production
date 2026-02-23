// ─── Document Category (PHI-OS v2 contract — from /api/admin/* brief) ──────────
// Replaces old "En Progreso" → now "Ejecución"
export type DocumentCategory =
  | "Investigación"   // Fase inicial de recolección
  | "Planificación"   // Definición de pasos y arquitectura
  | "Ejecución"       // Trabajo activo del agente o humano (≡ antiguo "En Progreso")
  | "Revisión"        // Control de calidad / HITL
  | "Terminado";      // Nodo archivado / completado

// ─── Document Metadata (required by brief) ─────────────────────────────────────
export interface DocumentMetadata {
  progress_pct: number;    // 0-100
  priority_score: number;  // 0-10  (>7 activa color Critical/rojo)
  weight: number;          // Para cálculo de cascada
}

export interface TaskMetadata {
  weight: number;        // 0–100 (importance % within parent)
  estimated_hours: number;
  cost: number;          // USD
}

export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";
export type AssigneeType = "HUMAN" | "AGENT";

export interface SubTask {
  id: string;
  correlativeId?: string;
  title: string;
  assignee_type: AssigneeType;
  progress_pct: number;
  status: TaskStatus;
  due_date: string;
  metadata: TaskMetadata;
}

export interface Task {
  id: string;
  correlativeId?: string;
  title: string;
  assignee_type: AssigneeType;
  progress_pct: number;
  status: TaskStatus;
  due_date: string;
  metadata: TaskMetadata;
  subtasks?: SubTask[];
}

export interface Project {
  id: string;
  correlativeId?: string;
  title: string;
  client: string;
  progress_pct: number;
  tasks: Task[];
}

export interface SelectedItem {
  item: Task | SubTask;
  project: Project;
  parentTask?: Task;
}