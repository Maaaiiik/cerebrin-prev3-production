/**
 * WeeklySchedule — Vista de horario semanal tipo calendario
 */

import React from 'react';
import type { CourseInfo, ScheduleSlot } from '../../services/academic';

interface WeeklyScheduleProps {
  courses: CourseInfo[];
}

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const HOURS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

export function WeeklySchedule({ courses }: WeeklyScheduleProps) {
  // Agrupar slots por día y hora
  const scheduleByDayAndHour: Record<string, Array<{ slot: ScheduleSlot; course: CourseInfo }>> = {};

  courses.forEach(course => {
    course.schedule.forEach(slot => {
      const key = `${slot.day}-${slot.startTime}`;
      if (!scheduleByDayAndHour[key]) {
        scheduleByDayAndHour[key] = [];
      }
      scheduleByDayAndHour[key].push({ slot, course });
    });
  });

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Desktop view */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/30 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground w-20">
                Hora
              </th>
              {DAYS.map(day => (
                <th key={day} className="px-4 py-3 text-left text-sm font-medium">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {HOURS.map(hour => (
              <tr key={hour}>
                <td className="px-4 py-2 text-sm text-muted-foreground font-mono">
                  {hour}
                </td>
                {DAYS.map(day => {
                  const key = `${day}-${hour}`;
                  const classes = scheduleByDayAndHour[key] || [];

                  return (
                    <td key={day} className="px-2 py-2 align-top">
                      {classes.map(({ slot, course }, i) => (
                        <div
                          key={i}
                          className="rounded-lg p-2 mb-1 text-xs border"
                          style={{
                            backgroundColor: `${course.color}20`,
                            borderColor: course.color,
                          }}
                        >
                          <p className="font-semibold" style={{ color: course.color }}>
                            {course.code}
                          </p>
                          <p className="text-foreground/80 text-[10px]">{slot.type}</p>
                          <p className="text-muted-foreground text-[10px]">
                            {slot.startTime}-{slot.endTime}
                          </p>
                          {slot.room && (
                            <p className="text-muted-foreground text-[10px]">{slot.room}</p>
                          )}
                        </div>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile view */}
      <div className="lg:hidden p-4 space-y-4">
        {DAYS.map(day => {
          const dayClasses = courses
            .flatMap(course =>
              course.schedule
                .filter(slot => slot.day === day)
                .map(slot => ({ slot, course }))
            )
            .sort((a, b) => a.slot.startTime.localeCompare(b.slot.startTime));

          if (dayClasses.length === 0) return null;

          return (
            <div key={day} className="space-y-2">
              <h3 className="font-semibold text-sm">{day}</h3>
              <div className="space-y-2">
                {dayClasses.map(({ slot, course }, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                    style={{
                      backgroundColor: `${course.color}10`,
                      borderColor: course.color,
                    }}
                  >
                    <div
                      className="w-1 h-12 rounded-full"
                      style={{ backgroundColor: course.color }}
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{course.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {slot.type} • {slot.room}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium font-mono">
                        {slot.startTime}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {slot.endTime}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
