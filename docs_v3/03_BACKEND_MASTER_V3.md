# ⚙️ BACKEND ARCHITECTURE: AI Engine & Orchestration (v3.3 MASTER)

Este documento define la lógica de negocio, el motor de agentes y la orquestación de servicios externos de Cerebrin v3.

## 🏗️ ARQUITECTURA DEL MOTOR DE AGENTES (Twin Engine)

Cerebrin v3 abandona el modelo de "Prompt fijo" por un modelo de **Orquestación Dinámica**:

1.  **Context Injection (RAG):** El backend no envía todo el conocimiento al LLM. Usa `pgvector` para inyectar solo lo relevante al `unit_id` actual.
2.  **HITL Managed Execution:** Todas las acciones destructivas (email, borrar, pagar) pasan por la tabla `agent_approval_queue`. El backend bloquea la ejecución hasta que `status = 'approved'`.
3.  **Resonance Loop:** Cada interacción exitosa dispara un evento en `resonance_events`, recalculando el `resonance_score` en tiempo real. Al llegar a 60, el backend desbloquea automáticamente el modo `EXECUTOR`.

---

## 🔌 API ENDPOINTS: ESTRUCTURA UNIFICADA

### 🎓 Módulo Académico (Student Arc)
*   `POST /api/setup/student/process-schedule`:
    *   **Input:** multipart/form-data (image).
    *   **Logic:** Envia a Gemini Vision -> Parsea JSON de Horario -> Crea registros en `calendar_events`.
*   `POST /api/setup/student/setup-drive`:
    *   **Input:** { curruculum_pdf_id, workspace_id }.
    *   **Logic:** Dispara webhook a **n8n** -> n8n crea carpetas en Drive -> Retorna estructura al backend.

### 🤖 Chat & Streaming (SSE)
*   `POST /api/agent/chat`: Inicia el pipeline.
*   `GET /api/agent/chat/:sessionId/stream`: Implementación de **Server-Sent Events** para:
    *   `token`: Palabras de la respuesta (streaming).
    *   `thought`: "Pensamientos" internos de la IA (Hidden from UI, optionally shown).
    *   `action_required`: Envío silencioso de un ID de `approval_queue`.

---

## 🤖 MEMORIA ESTILO "AI TWIN"

El Twin no recuerda todo, recuerda lo **relevante**.
*   **Buffer Memory:** Últimos 10 mensajes (Redis/Vercel KV).
*   **Semantic Memory:** Guardada en `agent_memory` con embeddings.
*   **Synthesis Service:** Un worker nocturno (Cron) que toma las memorias del día y las "resume" para evitar duplicidad, manteniendo el `content` limpio y eficiente.

---

## 🛠️ ORQUESTACIÓN EXTERNA (n8n & Tools)

El backend no hace todo solo. Delega tareas pesadas a n8n:
1.  **PDF Generation:** Backend envía Markdown -> n8n retorna URL de PDF en Storage.
2.  **Folder Sync:** n8n monitorea cambios en Drive y notifica al Webhook del backend para re-indexar.
3.  **Notifications:** Telegram/WhatsApp logic vive en n8n, el backend solo dispara triggers.

---

## 📋 STACK TÉCNICO V3
*   **Runtime:** Node.js (TypeScript) / Next.js API Routes.
*   **Database:** PostgreSQL (Supabase) + pgvector.
*   **LLMs:** Gemini 1.5 Flash (Default) / GPT-4o (High-level reasoning).
*   **Automation:** n8n self-hosted.

---
*Versión: 3.3 | Última actualización: 22 Feb 2026 | Estado: Sincronizado con DB Schema v3 y Frontend Master*
