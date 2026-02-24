# ⚙️ SKILL & AUTOMATION CATALOG (v3.3 MASTER)

Este documento centraliza todas las capacidades ejecutables del sistema. Define qué puede hacer el Agente y qué flujos dispara n8n.

---

## 🤖 OPENCLAW SKILLS (El Cerebro)

Los agentes de Cerebrin v3 utilizan "sombreros" (roles) con habilidades específicas.

| Skill | Agente | Descripción | Herramientas |
| :--- | :--- | :--- | :--- |
| `web_search` | Investigador | Busca datos en tiempo real en la web. | Google Search API |
| `data_extraction` | Investigador | Toma una URL y extrae solo el texto relevante. | Scraper Service |
| `storytelling` | Escritor | Adapta datos crudos al tono del usuario (Persona). | LLM Specialized Prompt |
| `quality_gate` | Revisor | Valida que el documento cumpla el brief (Score 1-10). | LLM Critic |
| `task_orchestrator`| Director | Divide un pedido complejo en subtareas para otros. | Task Manager |
| `hitl_manager` | Director | Envía el ApprovalCard al usuario y espera. | Webhook Trigger |

---

## 🔗 WORKFLOWS n8n (Los Brazos)

Las automatizaciones que ocurren fuera del servidor de Cerebrin para mayor eficiencia.

### 1. Delivery & PDF (`01_generate_pdf_and_deliver.json`)
*   **Trigger:** Propuesta aprobada por el usuario.
*   **Acción:** Convierte Markdown → HTML → PDF (Puppeteer).
*   **Resultado:** Guarda en Supabase Storage y envía por WhatsApp/Email.

### 2. Estructura Académica (`02_student_onboarding_drive.json`)
*   **Trigger:** Malla curricular subida.
*   **Acción:** Crea carpetas en Drive: `[Año] > [Semestre] > [Ramo]`.
*   **Resultado:** Devuelve los IDs de carpeta al backend para sincronizar.

### 3. Recopilación de Documentos (`03_messaging_to_knowledge.json`)
*   **Trigger:** Usuario envía archivo por WhatsApp/Telegram.
*   **Acción:** IA identifica el ramo/proyecto -> Guarda en Drive -> Indexa para RAG.
*   **Resultado:** El documento aparece en el panel de Knowledge instantáneamente.

### 4. Reporte de Resonancia (`04_daily_recap.json`)
*   **Trigger:** Cron job (9:00 AM).
*   **Acción:** Resume las tareas del día anterior y las metas de hoy.
*   **Resultado:** Envía un mensaje motivador con el `Resonance Score` actualizado.

---

## 📡 TRIGGERS & WEBHOOKS

| Evento | Endpoint Backend | Destino n8n |
| :--- | :--- | :--- |
| Aprobación HITL | `POST /api/agent/approvals/:id/approve` | `Webhook: Start Delivery` |
| Nuevo Documento| `POST /api/webhooks/openclaw` | `Webhook: Sort Knowledge` |
| Fallo de Promedio| `POST /api/student/trigger-support` | `Webhook: Create Guide` |

---
*Versión: 3.3 | Última actualización: 22 Feb 2026 | Estado: Catálogo Activo v3*
