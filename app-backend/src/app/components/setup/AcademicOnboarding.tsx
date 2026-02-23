/**
 * AcademicOnboarding — Onboarding específico para estudiantes
 * Upload de malla curricular + horario → Genera workspace completo
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, FileText, Calendar, Sparkles, CheckCircle, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { CerebrinLogo } from '../shared/CerebrinLogo';
import { generateAcademicWorkspace, createDriveFolders, type AcademicWorkspace } from '../../services/academic';

interface AcademicOnboardingProps {
  onComplete: (workspace: AcademicWorkspace) => void;
  onBack?: () => void;
}

type Step = 'welcome' | 'upload-curriculum' | 'student-info' | 'processing' | 'preview' | 'drive-setup' | 'complete';

export function AcademicOnboarding({ onComplete, onBack }: AcademicOnboardingProps) {
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [curriculumFile, setCurriculumFile] = useState<File | null>(null);
  const [studentInfo, setStudentInfo] = useState({
    name: '',
    program: '',
    year: 1,
    semester: '2026-1',
  });
  const [workspace, setWorkspace] = useState<AcademicWorkspace | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (file: File) => {
    setCurriculumFile(file);
    setCurrentStep('student-info');
  };

  const handleGenerateWorkspace = async () => {
    if (!curriculumFile) return;

    setCurrentStep('processing');
    setIsProcessing(true);

    try {
      // Generar workspace académico
      const ws = await generateAcademicWorkspace(curriculumFile, studentInfo);
      setWorkspace(ws);
      
      setCurrentStep('preview');
    } catch (error) {
      console.error('Error generando workspace:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSetupDrive = async () => {
    if (!workspace) return;

    setCurrentStep('drive-setup');
    
    try {
      await createDriveFolders(workspace);
      setCurrentStep('complete');
    } catch (error) {
      console.error('Error configurando Drive:', error);
    }
  };

  const handleFinish = () => {
    if (workspace) {
      onComplete(workspace);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <AnimatePresence mode="wait">
          {currentStep === 'welcome' && (
            <StepWelcome onNext={() => setCurrentStep('upload-curriculum')} onBack={onBack} />
          )}

          {currentStep === 'upload-curriculum' && (
            <StepUploadCurriculum
              onFileSelect={handleFileUpload}
              onBack={() => setCurrentStep('welcome')}
            />
          )}

          {currentStep === 'student-info' && (
            <StepStudentInfo
              info={studentInfo}
              onChange={setStudentInfo}
              onNext={handleGenerateWorkspace}
              onBack={() => setCurrentStep('upload-curriculum')}
            />
          )}

          {currentStep === 'processing' && (
            <StepProcessing />
          )}

          {currentStep === 'preview' && workspace && (
            <StepPreview
              workspace={workspace}
              onConfirm={handleSetupDrive}
              onBack={() => setCurrentStep('student-info')}
            />
          )}

          {currentStep === 'drive-setup' && (
            <StepDriveSetup />
          )}

          {currentStep === 'complete' && workspace && (
            <StepComplete workspace={workspace} onFinish={handleFinish} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Step: Welcome ─────────────────────────────────────────────────────────────

function StepWelcome({ onNext, onBack }: { onNext: () => void; onBack?: () => void }) {
  return (
    <motion.div
      key="welcome"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="text-center space-y-6"
    >
      <CerebrinLogo size={100} animated />

      <div className="space-y-3">
        <h1 className="text-3xl font-bold">Modo Estudiante 📚</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Voy a organizar todo tu semestre automáticamente. Solo necesito tu malla curricular.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4 max-w-md mx-auto">
        <h3 className="font-semibold text-left">Voy a crear automáticamente:</h3>
        <ul className="text-sm text-left space-y-2 text-muted-foreground">
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
            <span>Un proyecto por cada ramo con todas las evaluaciones</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
            <span>Tu horario semanal visual</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
            <span>Carpetas en Google Drive organizadas por ramo</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
            <span>Temarios semanales y ejercicios personalizados</span>
          </li>
        </ul>
      </div>

      <div className="flex gap-3 justify-center">
        {onBack && (
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-2 w-4 h-4" />
            Volver
          </Button>
        )}
        <Button
          size="lg"
          onClick={onNext}
          className="bg-violet-600 hover:bg-violet-500"
        >
          Empezar
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Step: Upload Curriculum ───────────────────────────────────────────────────

function StepUploadCurriculum({
  onFileSelect,
  onBack,
}: {
  onFileSelect: (file: File) => void;
  onBack: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <motion.div
      key="upload"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Sube tu malla curricular</h2>
        <p className="text-sm text-muted-foreground">
          Puede ser PDF, foto o captura de pantalla
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center transition-all
          ${isDragging
            ? 'border-violet-500 bg-violet-500/10 scale-105'
            : 'border-border hover:border-violet-500/50 bg-card'
          }
        `}
      >
        <input
          type="file"
          id="curriculum-file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileInput}
          className="hidden"
        />
        
        <label htmlFor="curriculum-file" className="cursor-pointer space-y-4 block">
          <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
          <div className="space-y-1">
            <p className="font-medium">Arrastra tu archivo aquí</p>
            <p className="text-sm text-muted-foreground">o haz clic para seleccionar</p>
          </div>
          <p className="text-xs text-muted-foreground">PDF, JPG, PNG (máx 10MB)</p>
        </label>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 w-4 h-4" />
          Atrás
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Step: Student Info ────────────────────────────────────────────────────────

function StepStudentInfo({
  info,
  onChange,
  onNext,
  onBack,
}: {
  info: { name: string; program: string; year: number; semester: string };
  onChange: (info: any) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const canProceed = info.name && info.program && info.year;

  return (
    <motion.div
      key="student-info"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Cuéntame sobre ti</h2>
        <p className="text-sm text-muted-foreground">Para personalizar tu experiencia</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Tu nombre</label>
          <input
            type="text"
            value={info.name}
            onChange={(e) => onChange({ ...info, name: e.target.value })}
            placeholder="Ej: María González"
            className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Carrera</label>
          <input
            type="text"
            value={info.program}
            onChange={(e) => onChange({ ...info, program: e.target.value })}
            placeholder="Ej: Ingeniería Civil Informática"
            className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Año</label>
            <select
              value={info.year}
              onChange={(e) => onChange({ ...info, year: parseInt(e.target.value) })}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {[1, 2, 3, 4, 5, 6].map(year => (
                <option key={year} value={year}>{year}° año</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Semestre</label>
            <select
              value={info.semester}
              onChange={(e) => onChange({ ...info, semester: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="2026-1">2026-1</option>
              <option value="2026-2">2026-2</option>
              <option value="2027-1">2027-1</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 w-4 h-4" />
          Atrás
        </Button>
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="bg-violet-600 hover:bg-violet-500"
        >
          Generar workspace
          <Sparkles className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Step: Processing ──────────────────────────────────────────────────────────

function StepProcessing() {
  const [messages, setMessages] = useState<string[]>([]);

  React.useEffect(() => {
    const timeouts = [
      setTimeout(() => setMessages(m => [...m, '📄 Leyendo malla curricular...']), 300),
      setTimeout(() => setMessages(m => [...m, '🧠 Identificando ramos y horarios...']), 1000),
      setTimeout(() => setMessages(m => [...m, '📅 Generando calendario de evaluaciones...']), 1600),
      setTimeout(() => setMessages(m => [...m, '✅ Estructura creada con éxito']), 2200),
    ];

    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      key="processing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="text-center space-y-8"
    >
      <CerebrinLogo size={80} animated />

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Procesando tu información...</h2>
        
        <div className="space-y-2 min-h-[120px]">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-sm text-muted-foreground"
            >
              {msg}
            </motion.div>
          ))}
        </div>

        <Loader2 className="w-8 h-8 animate-spin mx-auto text-violet-500" />
      </div>
    </motion.div>
  );
}

// ─── Step: Preview ─────────────────────────────────────────────────────────────

function StepPreview({
  workspace,
  onConfirm,
  onBack,
}: {
  workspace: AcademicWorkspace;
  onConfirm: () => void;
  onBack: () => void;
}) {
  return (
    <motion.div
      key="preview"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">¡Tu workspace está listo!</h2>
        <p className="text-sm text-muted-foreground">
          He detectado {workspace.courses.length} ramos
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4 max-h-[400px] overflow-y-auto">
        <div className="space-y-3">
          {workspace.courses.map(({ course, evaluations }) => (
            <div
              key={course.id}
              className="border border-border rounded-lg p-4 space-y-2"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: course.color }}
                  />
                  <div>
                    <h3 className="font-semibold">{course.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {course.code} • {course.credits} créditos • {course.professor}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground pl-6">
                {evaluations.length} evaluaciones programadas
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Ajustar algo
        </Button>
        <Button
          onClick={onConfirm}
          className="bg-violet-600 hover:bg-violet-500"
        >
          Continuar
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Step: Drive Setup ─────────────────────────────────────────────────────────

function StepDriveSetup() {
  return (
    <motion.div
      key="drive-setup"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="text-center space-y-6"
    >
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
        <FileText className="w-10 h-10 text-white" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Configurando Google Drive</h2>
        <p className="text-muted-foreground">
          Creando carpetas organizadas para cada ramo...
        </p>
      </div>

      <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
    </motion.div>
  );
}

// ─── Step: Complete ────────────────────────────────────────────────────────────

function StepComplete({
  workspace,
  onFinish,
}: {
  workspace: AcademicWorkspace;
  onFinish: () => void;
}) {
  return (
    <motion.div
      key="complete"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="text-center space-y-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
      >
        <CheckCircle className="w-20 h-20 mx-auto text-green-500" />
      </motion.div>

      <div className="space-y-2">
        <h2 className="text-3xl font-bold">¡Todo listo! 🎉</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Tu workspace académico está configurado. Ahora puedes ver tu horario, 
          tareas y organizar tus estudios.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-3 max-w-md mx-auto">
        <h3 className="font-semibold text-left">¿Qué puedes hacer ahora?</h3>
        <ul className="text-sm text-left space-y-2 text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-violet-500">→</span>
            <span>Ver tu horario semanal completo</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-violet-500">→</span>
            <span>Revisar evaluaciones próximas</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-violet-500">→</span>
            <span>Subir documentos organizados por ramo</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-violet-500">→</span>
            <span>Recibir ejercicios y temarios semanales</span>
          </li>
        </ul>
      </div>

      <Button
        size="lg"
        onClick={onFinish}
        className="bg-violet-600 hover:bg-violet-500"
      >
        Ir a mi dashboard académico
        <Sparkles className="ml-2 w-4 h-4" />
      </Button>
    </motion.div>
  );
}
