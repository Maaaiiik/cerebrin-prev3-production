/**
 * academic.ts — Servicio de parseo académico y generación de estructura
 * Simula procesamiento de malla curricular y horario para crear workspace completo
 */

export interface CourseInfo {
  id: string;
  code: string; // "MAT101"
  name: string; // "Cálculo I"
  credits: number;
  schedule: ScheduleSlot[];
  professor?: string;
  color: string; // Para UI
}

export interface ScheduleSlot {
  day: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado';
  startTime: string; // "08:00"
  endTime: string; // "09:30"
  room?: string;
  type: 'Cátedra' | 'Ayudantía' | 'Laboratorio';
}

export interface Evaluation {
  id: string;
  name: string;
  type: 'Prueba' | 'Examen' | 'Proyecto' | 'Tarea' | 'Presentación';
  date: string; // ISO date
  weight: number; // % de la nota final
  description?: string;
}

export interface CourseStructure {
  course: CourseInfo;
  evaluations: Evaluation[];
  weeklyTopics?: string[]; // Temario semanal
}

export interface AcademicWorkspace {
  workspace_id: string;
  workspace_name: string;
  semester: string; // "2026-1"
  courses: CourseStructure[];
  student: {
    name: string;
    program: string; // "Ingeniería Civil Informática"
    year: number;
  };
}

/**
 * Simula el parseo de una malla curricular (PDF/imagen)
 * En producción: llamaría a una IA (GPT-4 Vision, Claude, etc.) o servicio de OCR
 */
export async function parseCurriculum(file: File): Promise<CourseInfo[]> {
  // Simular delay de procesamiento
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Mock data: ramos típicos de ingeniería
  const mockCourses: CourseInfo[] = [
    {
      id: 'MAT101',
      code: 'MAT101',
      name: 'Cálculo I',
      credits: 6,
      schedule: [
        { day: 'Lunes', startTime: '08:00', endTime: '09:30', room: 'A-201', type: 'Cátedra' },
        { day: 'Miércoles', startTime: '08:00', endTime: '09:30', room: 'A-201', type: 'Cátedra' },
        { day: 'Viernes', startTime: '10:00', endTime: '11:30', room: 'B-105', type: 'Ayudantía' },
      ],
      professor: 'Prof. Andrea Martínez',
      color: '#3b82f6', // blue
    },
    {
      id: 'FIS110',
      code: 'FIS110',
      name: 'Física I',
      credits: 6,
      schedule: [
        { day: 'Martes', startTime: '10:00', endTime: '11:30', room: 'C-301', type: 'Cátedra' },
        { day: 'Jueves', startTime: '10:00', endTime: '11:30', room: 'C-301', type: 'Cátedra' },
        { day: 'Viernes', startTime: '14:00', endTime: '15:30', room: 'Lab-2', type: 'Laboratorio' },
      ],
      professor: 'Prof. Carlos Ruiz',
      color: '#8b5cf6', // violet
    },
    {
      id: 'ING101',
      code: 'ING101',
      name: 'Introducción a la Ingeniería',
      credits: 4,
      schedule: [
        { day: 'Lunes', startTime: '14:00', endTime: '15:30', room: 'D-102', type: 'Cátedra' },
        { day: 'Miércoles', startTime: '16:00', endTime: '17:30', room: 'D-102', type: 'Ayudantía' },
      ],
      professor: 'Prof. María González',
      color: '#10b981', // green
    },
    {
      id: 'QUI101',
      code: 'QUI101',
      name: 'Química General',
      credits: 5,
      schedule: [
        { day: 'Martes', startTime: '08:00', endTime: '09:30', room: 'E-201', type: 'Cátedra' },
        { day: 'Jueves', startTime: '14:00', endTime: '15:30', room: 'Lab-3', type: 'Laboratorio' },
      ],
      professor: 'Prof. Roberto Silva',
      color: '#f59e0b', // amber
    },
    {
      id: 'HUM101',
      code: 'HUM101',
      name: 'Comunicación Efectiva',
      credits: 3,
      schedule: [
        { day: 'Viernes', startTime: '08:00', endTime: '09:30', room: 'F-105', type: 'Cátedra' },
      ],
      professor: 'Prof. Laura Pérez',
      color: '#ec4899', // pink
    },
  ];

  return mockCourses;
}

/**
 * Genera estructura completa de evaluaciones para un ramo
 * Basado en calendario académico típico
 */
export function generateEvaluations(course: CourseInfo, semesterStart: Date): Evaluation[] {
  const evaluations: Evaluation[] = [];
  
  // Generar evaluaciones según el tipo de ramo
  if (course.credits >= 5) {
    // Ramos principales: 3 pruebas + examen
    evaluations.push(
      {
        id: `${course.id}-C1`,
        name: 'Certamen 1',
        type: 'Prueba',
        date: new Date(semesterStart.getTime() + 4 * 7 * 24 * 60 * 60 * 1000).toISOString(),
        weight: 25,
        description: 'Primera evaluación del semestre',
      },
      {
        id: `${course.id}-C2`,
        name: 'Certamen 2',
        type: 'Prueba',
        date: new Date(semesterStart.getTime() + 9 * 7 * 24 * 60 * 60 * 1000).toISOString(),
        weight: 25,
        description: 'Segunda evaluación del semestre',
      },
      {
        id: `${course.id}-C3`,
        name: 'Certamen 3',
        type: 'Prueba',
        date: new Date(semesterStart.getTime() + 14 * 7 * 24 * 60 * 60 * 1000).toISOString(),
        weight: 25,
        description: 'Tercera evaluación del semestre',
      },
      {
        id: `${course.id}-EX`,
        name: 'Examen Final',
        type: 'Examen',
        date: new Date(semesterStart.getTime() + 17 * 7 * 24 * 60 * 60 * 1000).toISOString(),
        weight: 25,
        description: 'Examen final del ramo',
      }
    );
  } else {
    // Ramos menores: proyecto + presentación
    evaluations.push(
      {
        id: `${course.id}-P1`,
        name: 'Proyecto Semestral',
        type: 'Proyecto',
        date: new Date(semesterStart.getTime() + 12 * 7 * 24 * 60 * 60 * 1000).toISOString(),
        weight: 60,
        description: 'Proyecto principal del ramo',
      },
      {
        id: `${course.id}-PR`,
        name: 'Presentación Final',
        type: 'Presentación',
        date: new Date(semesterStart.getTime() + 15 * 7 * 24 * 60 * 60 * 1000).toISOString(),
        weight: 40,
        description: 'Presentación del proyecto',
      }
    );
  }

  return evaluations;
}

/**
 * Genera temario semanal para un ramo
 * En producción: podría usar IA para generar contenido personalizado
 */
export function generateWeeklyTopics(course: CourseInfo): string[] {
  const topics: Record<string, string[]> = {
    'Cálculo I': [
      'Límites y continuidad',
      'Derivadas y reglas de derivación',
      'Aplicaciones de derivadas',
      'Integrales indefinidas',
      'Integrales definidas',
      'Técnicas de integración',
      'Aplicaciones de integrales',
      'Funciones trascendentes',
    ],
    'Física I': [
      'Cinemática en una dimensión',
      'Cinemática en dos dimensiones',
      'Leyes de Newton',
      'Aplicaciones de las leyes de Newton',
      'Trabajo y energía',
      'Conservación de la energía',
      'Momentum lineal',
      'Rotación de cuerpos rígidos',
    ],
    'Química General': [
      'Estructura atómica',
      'Tabla periódica',
      'Enlaces químicos',
      'Reacciones químicas',
      'Estequiometría',
      'Estados de la materia',
    ],
  };

  return topics[course.name] || ['Introducción', 'Fundamentos', 'Aplicaciones', 'Proyecto final'];
}

/**
 * Genera workspace académico completo a partir de archivos subidos
 */
export async function generateAcademicWorkspace(
  curriculumFile: File,
  studentInfo: { name: string; program: string; year: number; semester: string }
): Promise<AcademicWorkspace> {
  // 1. Parsear malla curricular
  const courses = await parseCurriculum(curriculumFile);

  // 2. Generar evaluaciones para cada ramo
  const semesterStart = new Date('2026-03-01'); // Inicio semestre 1-2026
  
  const coursesStructure: CourseStructure[] = courses.map(course => ({
    course,
    evaluations: generateEvaluations(course, semesterStart),
    weeklyTopics: generateWeeklyTopics(course),
  }));

  // 3. Crear workspace
  const workspace: AcademicWorkspace = {
    workspace_id: `ws-academic-${Date.now()}`,
    workspace_name: `📚 Estudios - ${studentInfo.name}`,
    semester: studentInfo.semester,
    courses: coursesStructure,
    student: studentInfo,
  };

  return workspace;
}

/**
 * Simula creación de carpetas en Google Drive vía n8n
 * En producción: llamaría a webhook de n8n
 */
export async function createDriveFolders(workspace: AcademicWorkspace): Promise<{
  root_folder_id: string;
  course_folders: Record<string, string>;
}> {
  // Simular delay de API
  await new Promise(resolve => setTimeout(resolve, 1500));

  const mockFolders = {
    root_folder_id: 'drive-folder-estudios-2026-1',
    course_folders: {} as Record<string, string>,
  };

  workspace.courses.forEach(({ course }) => {
    mockFolders.course_folders[course.id] = `drive-folder-${course.code.toLowerCase()}`;
  });

  console.log('📁 Carpetas creadas en Drive (mock):', mockFolders);
  
  return mockFolders;
}

/**
 * Simula webhook de n8n para guardar documento desde WhatsApp/Telegram
 */
export async function saveDocumentFromMessaging(
  documentUrl: string,
  courseId: string,
  taskId: string,
  source: 'whatsapp' | 'telegram'
): Promise<{ success: boolean; drive_link: string }> {
  await new Promise(resolve => setTimeout(resolve, 800));

  console.log(`📱 Documento guardado desde ${source}:`, {
    documentUrl,
    courseId,
    taskId,
  });

  return {
    success: true,
    drive_link: `https://drive.google.com/file/d/mock-file-${taskId}/view`,
  };
}
