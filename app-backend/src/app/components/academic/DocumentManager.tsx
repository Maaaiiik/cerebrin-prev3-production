/**
 * DocumentManager — Gestor de documentos por ramo
 * Mock de integración con Google Drive + n8n + WhatsApp/Telegram
 */

import React, { useState } from 'react';
import { FileText, Upload, Download, Trash2, ExternalLink, MessageCircle, Folder } from 'lucide-react';
import { Button } from '../ui/button';
import type { AcademicWorkspace } from '../../services/academic';
import { saveDocumentFromMessaging } from '../../services/academic';

interface DocumentManagerProps {
  workspace: AcademicWorkspace;
}

interface MockDocument {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'doc';
  size: string;
  uploadDate: string;
  source: 'manual' | 'whatsapp' | 'telegram' | 'drive';
  driveLink: string;
}

export function DocumentManager({ workspace }: DocumentManagerProps) {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(
    workspace.courses[0]?.course.id || null
  );
  const [isUploading, setIsUploading] = useState(false);

  // Mock documents
  const [documents, setDocuments] = useState<Record<string, MockDocument[]>>({
    [workspace.courses[0]?.course.id || '']: [
      {
        id: 'doc-1',
        name: 'Apuntes Clase 1.pdf',
        type: 'pdf',
        size: '2.4 MB',
        uploadDate: '2026-02-15',
        source: 'manual',
        driveLink: 'https://drive.google.com/file/d/mock-1/view',
      },
      {
        id: 'doc-2',
        name: 'Ejercicios resueltos.jpg',
        type: 'image',
        size: '1.2 MB',
        uploadDate: '2026-02-18',
        source: 'whatsapp',
        driveLink: 'https://drive.google.com/file/d/mock-2/view',
      },
      {
        id: 'doc-3',
        name: 'Guía estudio certamen 1.pdf',
        type: 'pdf',
        size: '3.1 MB',
        uploadDate: '2026-02-20',
        source: 'telegram',
        driveLink: 'https://drive.google.com/file/d/mock-3/view',
      },
    ],
  });

  const selectedCourseDocs = documents[selectedCourse || ''] || [];
  const selectedCourseInfo = workspace.courses.find(c => c.course.id === selectedCourse)?.course;

  const handleUpload = async (file: File) => {
    if (!selectedCourse) return;

    setIsUploading(true);

    // Simular upload
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newDoc: MockDocument = {
      id: `doc-${Date.now()}`,
      name: file.name,
      type: file.type.includes('pdf') ? 'pdf' : file.type.includes('image') ? 'image' : 'doc',
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      uploadDate: new Date().toISOString().split('T')[0],
      source: 'manual',
      driveLink: `https://drive.google.com/file/d/mock-${Date.now()}/view`,
    };

    setDocuments(prev => ({
      ...prev,
      [selectedCourse]: [...(prev[selectedCourse] || []), newDoc],
    }));

    setIsUploading(false);
  };

  const handleDelete = (docId: string) => {
    if (!selectedCourse) return;
    setDocuments(prev => ({
      ...prev,
      [selectedCourse]: prev[selectedCourse].filter(d => d.id !== docId),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Course selector */}
      <div className="flex flex-wrap gap-2">
        {workspace.courses.map(({ course }) => (
          <button
            key={course.id}
            onClick={() => setSelectedCourse(course.id)}
            className={`
              px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium
              ${selectedCourse === course.id
                ? 'border-violet-500 bg-violet-500/10 text-violet-600'
                : 'border-border hover:border-violet-500/50'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: course.color }}
              />
              {course.code}
            </div>
          </button>
        ))}
      </div>

      {/* Integration info */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <MessageCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium text-blue-600">
              Integración automática activada
            </p>
            <p className="text-xs text-muted-foreground">
              Los documentos que envíes por WhatsApp o Telegram se guardarán automáticamente
              en la carpeta de {selectedCourseInfo?.name} en Google Drive.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs">
                <ExternalLink className="w-3 h-3 mr-1" />
                Ver carpeta Drive
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                Configurar n8n
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Upload area */}
      <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
        <input
          type="file"
          id="doc-upload"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
          }}
        />
        <label htmlFor="doc-upload" className="cursor-pointer space-y-2 block">
          {isUploading ? (
            <div className="space-y-2">
              <Upload className="w-8 h-8 mx-auto text-violet-500 animate-pulse" />
              <p className="text-sm text-muted-foreground">Subiendo...</p>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">Arrastra archivos aquí o haz clic</p>
              <p className="text-xs text-muted-foreground">
                PDF, imágenes, documentos (máx 50MB)
              </p>
            </>
          )}
        </label>
      </div>

      {/* Documents list */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30">
          <h3 className="font-semibold flex items-center gap-2">
            <Folder className="w-4 h-4" />
            {selectedCourseInfo?.name || 'Selecciona un ramo'}
            <span className="text-sm text-muted-foreground font-normal">
              ({selectedCourseDocs.length} documentos)
            </span>
          </h3>
        </div>

        {selectedCourseDocs.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No hay documentos aún. Sube tu primer archivo.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {selectedCourseDocs.map(doc => (
              <div
                key={doc.id}
                className="p-4 hover:bg-muted/50 transition-colors flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{doc.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{doc.size}</span>
                    <span>•</span>
                    <span>{new Date(doc.uploadDate).toLocaleDateString('es-CL')}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      {doc.source === 'whatsapp' && '📱 WhatsApp'}
                      {doc.source === 'telegram' && '✈️ Telegram'}
                      {doc.source === 'manual' && '📤 Manual'}
                      {doc.source === 'drive' && '📁 Drive'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(doc.driveLink, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(doc.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
