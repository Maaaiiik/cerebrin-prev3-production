/**
 * EvaluationTimeline — Timeline de evaluaciones con filtros por ramo
 */

import React, { useState } from 'react';
import { Calendar, FileText, Clock, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import type { CourseStructure, Evaluation } from '../../services/academic';

interface EvaluationTimelineProps {
  courses: CourseStructure[];
}

export function EvaluationTimeline({ courses }: EvaluationTimelineProps) {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  // Combinar todas las evaluaciones con info del curso
  const allEvaluations = courses
    .flatMap(({ course, evaluations }) =>
      evaluations.map(e => ({ ...e, course }))
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const filteredEvaluations = selectedCourse
    ? allEvaluations.filter(e => e.course.id === selectedCourse)
    : allEvaluations;

  const upcomingCount = filteredEvaluations.filter(
    e => new Date(e.date) > new Date()
  ).length;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={selectedCourse === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCourse(null)}
          className={selectedCourse === null ? 'bg-violet-600 hover:bg-violet-500' : ''}
        >
          Todos los ramos ({allEvaluations.length})
        </Button>
        {courses.map(({ course }) => (
          <Button
            key={course.id}
            variant={selectedCourse === course.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCourse(course.id)}
            className={selectedCourse === course.id ? 'bg-violet-600 hover:bg-violet-500' : ''}
          >
            <div
              className="w-2 h-2 rounded-full mr-2"
              style={{ backgroundColor: course.color }}
            />
            {course.code}
          </Button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{filteredEvaluations.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Próximas</p>
          <p className="text-2xl font-bold text-amber-500">{upcomingCount}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Completadas</p>
          <p className="text-2xl font-bold text-green-500">
            {filteredEvaluations.length - upcomingCount}
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="space-y-4">
          {filteredEvaluations.map((evaluation, index) => {
            const isPast = new Date(evaluation.date) < new Date();
            const isNext = index === filteredEvaluations.findIndex(
              e => new Date(e.date) > new Date()
            );

            return (
              <div
                key={evaluation.id}
                className={`
                  relative pl-8 pb-4 border-l-2
                  ${isPast ? 'border-muted' : 'border-violet-500'}
                  ${index === filteredEvaluations.length - 1 ? 'border-l-transparent' : ''}
                `}
              >
                {/* Timeline dot */}
                <div
                  className={`
                    absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full border-2
                    ${isPast
                      ? 'bg-muted border-muted'
                      : isNext
                      ? 'bg-violet-500 border-violet-500 animate-pulse'
                      : 'bg-background border-violet-500'
                    }
                  `}
                />

                <div
                  className={`
                    p-4 rounded-lg border transition-colors
                    ${isNext
                      ? 'bg-violet-500/10 border-violet-500'
                      : 'bg-card border-border hover:bg-muted/50'
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: evaluation.course.color }}
                        />
                        <h3 className="font-semibold">{evaluation.name}</h3>
                        {isNext && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-600 font-medium">
                            Próxima
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {evaluation.course.name}
                      </p>
                      {evaluation.description && (
                        <p className="text-sm text-muted-foreground">
                          {evaluation.description}
                        </p>
                      )}
                    </div>

                    <div className="text-right space-y-1">
                      <p className="text-sm font-medium">
                        {new Date(evaluation.date).toLocaleDateString('es-CL', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Ponderación: {evaluation.weight}%
                      </p>
                      <div className={`
                        inline-flex items-center gap-1 text-xs px-2 py-1 rounded
                        ${isPast
                          ? 'bg-green-500/10 text-green-600'
                          : 'bg-amber-500/10 text-amber-600'
                        }
                      `}>
                        {isPast ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Pasada
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            Pendiente
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm">
                      <FileText className="w-3 h-3 mr-1" />
                      Ver documentos
                    </Button>
                    {!isPast && (
                      <Button variant="outline" size="sm">
                        <Calendar className="w-3 h-3 mr-1" />
                        Agregar recordatorio
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
