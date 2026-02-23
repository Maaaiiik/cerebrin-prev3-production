/**
 * AcademicDashboard — Dashboard principal para estudiantes
 * Vista de horario, tareas, evaluaciones y documentos
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Calendar,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Upload,
  BookOpen,
  TrendingUp,
  MessageSquare,
} from 'lucide-react';
import { Button } from '../ui/button';
import type { AcademicWorkspace, CourseStructure, Evaluation } from '../../services/academic';
import { WeeklySchedule } from './WeeklySchedule';
import { EvaluationTimeline } from './EvaluationTimeline';
import { CourseCard } from './CourseCard';
import { DocumentManager } from './DocumentManager';

interface AcademicDashboardProps {
  workspace: AcademicWorkspace;
}

type View = 'overview' | 'schedule' | 'tasks' | 'documents';

export function AcademicDashboard({ workspace }: AcademicDashboardProps) {
  const [currentView, setCurrentView] = useState<View>('overview');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  // Calcular estadísticas
  const totalEvaluations = workspace.courses.reduce(
    (acc, c) => acc + c.evaluations.length,
    0
  );

  const upcomingEvaluations = workspace.courses
    .flatMap(c =>
      c.evaluations.map(e => ({ ...e, course: c.course }))
    )
    .filter(e => new Date(e.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{workspace.workspace_name}</h1>
              <p className="text-sm text-muted-foreground">
                {workspace.student.program} • {workspace.semester}
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat con IA
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Subir documento
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-border bg-card/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {[
              { id: 'overview', label: 'Vista general', icon: BookOpen },
              { id: 'schedule', label: 'Horario', icon: Calendar },
              { id: 'tasks', label: 'Tareas', icon: CheckCircle },
              { id: 'documents', label: 'Documentos', icon: FileText },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setCurrentView(id as View)}
                className={`
                  px-4 py-3 text-sm font-medium transition-colors relative
                  ${currentView === id
                    ? 'text-violet-600'
                    : 'text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {label}
                </div>
                {currentView === id && (
                  <motion.div
                    layoutId="active-tab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {currentView === 'overview' && (
          <OverviewView
            workspace={workspace}
            upcomingEvaluations={upcomingEvaluations}
            onViewSchedule={() => setCurrentView('schedule')}
            onViewTasks={() => setCurrentView('tasks')}
          />
        )}

        {currentView === 'schedule' && (
          <ScheduleView workspace={workspace} />
        )}

        {currentView === 'tasks' && (
          <TasksView workspace={workspace} />
        )}

        {currentView === 'documents' && (
          <DocumentsView workspace={workspace} />
        )}
      </main>
    </div>
  );
}

// ─── Overview View ─────────────────────────────────────────────────────────────

function OverviewView({
  workspace,
  upcomingEvaluations,
  onViewSchedule,
  onViewTasks,
}: {
  workspace: AcademicWorkspace;
  upcomingEvaluations: any[];
  onViewSchedule: () => void;
  onViewTasks: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Ramos activos"
          value={workspace.courses.length}
          icon={BookOpen}
          color="blue"
        />
        <StatCard
          label="Evaluaciones totales"
          value={workspace.courses.reduce((acc, c) => acc + c.evaluations.length, 0)}
          icon={FileText}
          color="violet"
        />
        <StatCard
          label="Próximas 7 días"
          value={upcomingEvaluations.length}
          icon={AlertCircle}
          color="amber"
        />
      </div>

      {/* Próximas evaluaciones */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Próximas evaluaciones</h2>
          <Button variant="ghost" size="sm" onClick={onViewTasks}>
            Ver todas
          </Button>
        </div>

        <div className="space-y-2">
          {upcomingEvaluations.slice(0, 3).map((evaluation) => (
            <div
              key={evaluation.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: evaluation.course.color }}
                />
                <div>
                  <p className="font-medium text-sm">{evaluation.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {evaluation.course.name}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">
                  {new Date(evaluation.date).toLocaleDateString('es-CL', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
                <p className="text-xs text-muted-foreground">{evaluation.weight}%</p>
              </div>
            </div>
          ))}

          {upcomingEvaluations.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay evaluaciones próximas
            </p>
          )}
        </div>
      </div>

      {/* Horario de hoy */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Horario de hoy</h2>
          <Button variant="ghost" size="sm" onClick={onViewSchedule}>
            Ver semana completa
          </Button>
        </div>

        <TodaySchedule workspace={workspace} />
      </div>

      {/* Ramos */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Tus ramos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspace.courses.map(({ course, evaluations }) => (
            <CourseCard
              key={course.id}
              course={course}
              evaluationCount={evaluations.length}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Schedule View ─────────────────────────────────────────────────────────────

function ScheduleView({ workspace }: { workspace: AcademicWorkspace }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Horario Semanal</h2>
        <Button variant="outline" size="sm">
          <FileText className="w-4 h-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      <WeeklySchedule courses={workspace.courses.map(c => c.course)} />
    </div>
  );
}

// ─── Tasks View ────────────────────────────────────────────────────────────────

function TasksView({ workspace }: { workspace: AcademicWorkspace }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Evaluaciones</h2>
      </div>

      <EvaluationTimeline courses={workspace.courses} />
    </div>
  );
}

// ─── Documents View ────────────────────────────────────────────────────────────

function DocumentsView({ workspace }: { workspace: AcademicWorkspace }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Documentos</h2>
        <Button className="bg-violet-600 hover:bg-violet-500">
          <Upload className="w-4 h-4 mr-2" />
          Subir documento
        </Button>
      </div>

      <DocumentManager workspace={workspace} />
    </div>
  );
}

// ─── Helper Components ─────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: any;
  color: 'blue' | 'violet' | 'amber';
}) {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-500',
    violet: 'bg-violet-500/10 text-violet-500',
    amber: 'bg-amber-500/10 text-amber-500',
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-3">
      <div className={`inline-flex p-2 rounded-lg ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-3xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function TodaySchedule({ workspace }: { workspace: AcademicWorkspace }) {
  const today = new Date().toLocaleDateString('es-CL', { weekday: 'long' });
  const todayNormalized = today.charAt(0).toUpperCase() + today.slice(1) as any;

  const todayClasses = workspace.courses
    .flatMap(({ course }) =>
      course.schedule
        .filter(slot => slot.day === todayNormalized)
        .map(slot => ({ ...slot, course }))
    )
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  if (todayClasses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No tienes clases hoy 🎉
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {todayClasses.map((slot, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-lg border border-border"
        >
          <div
            className="w-1 h-12 rounded-full"
            style={{ backgroundColor: slot.course.color }}
          />
          <div className="flex-1">
            <p className="font-medium text-sm">{slot.course.name}</p>
            <p className="text-xs text-muted-foreground">
              {slot.type} • {slot.room}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">
              {slot.startTime} - {slot.endTime}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
