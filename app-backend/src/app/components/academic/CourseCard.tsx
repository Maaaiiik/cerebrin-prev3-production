/**
 * CourseCard — Tarjeta de ramo con info básica
 */

import React from 'react';
import { BookOpen, Clock, User, Calendar } from 'lucide-react';
import type { CourseInfo } from '../../services/academic';

interface CourseCardProps {
  course: CourseInfo;
  evaluationCount: number;
}

export function CourseCard({ course, evaluationCount }: CourseCardProps) {
  const totalHours = course.schedule.reduce((acc, slot) => {
    const start = parseInt(slot.startTime.split(':')[0]);
    const end = parseInt(slot.endTime.split(':')[0]);
    const minutes = parseInt(slot.endTime.split(':')[1]) - parseInt(slot.startTime.split(':')[1]);
    return acc + (end - start) + (minutes / 60);
  }, 0);

  return (
    <div
      className="bg-card border-2 rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer group"
      style={{ borderColor: `${course.color}40` }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${course.color}20` }}
        >
          <BookOpen className="w-6 h-6" style={{ color: course.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate group-hover:text-violet-600 transition-colors">
            {course.name}
          </h3>
          <p className="text-sm text-muted-foreground">{course.code}</p>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {course.professor && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="w-4 h-4" />
            <span className="truncate">{course.professor}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{totalHours.toFixed(1)}h semanales • {course.credits} créditos</span>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{evaluationCount} evaluaciones</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground">
          {course.schedule.length} bloques semanales
        </p>
      </div>
    </div>
  );
}
