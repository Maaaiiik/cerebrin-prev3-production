# 🔧 Guía de Configuración — Workflows n8n para Cerebrin

## Workflows Incluidos

| # | Archivo | Descripción | Trigger |
|---|---------|-------------|---------|
| 1 | `01_generate_pdf_and_deliver.json` | Genera PDF desde pipeline aprobado, sube a Supabase, envía por WhatsApp/Telegram | Webhook: `POST /webhook/generate-pdf` |
| 2 | `02_daily_notifications.json` | Resumen diario de tareas y aprobaciones pendientes | Cron: Todos los días a las 9:00 AM |
| 3 | `03_email_report.json` | Envía informe por email con diseño profesional | Webhook: `POST /webhook/send-email-report` |

---

## Paso 1: Importar los Workflows

1. Abre n8n en tu navegador: `http://tu-vps-ip:5678`
2. Click en **"Add workflow"** → menú **⋯** → **"Import from file"**
3. Selecciona cada archivo `.json` de esta carpeta
4. Repite para los 3 workflows

---

## Paso 2: Configurar Variables de Entorno en n8n

En tu `docker-compose.yml` de n8n, agrega estas variables:

```yaml
services:
  n8n:
    environment:
      # Supabase
      - SUPABASE_URL=https://rtkyeggkclqegzkqlvjj.supabase.co
      - SUPABASE_ANON_KEY=eyJhbGci...tu_anon_key
      - SUPABASE_SERVICE_KEY=tu_service_role_key
      
      # OpenClaw Gateway
      - OPENCLAW_GATEWAY_URL=http://openclaw:3100
      - OPENCLAW_API_KEY=tu_openclaw_api_key
      
      # PDF Service (opcional — solo si usas html2pdf.app)
      - HTML2PDF_API_KEY=tu_api_key_de_html2pdf
      
      # Email (si usas el workflow 03)
      - SMTP_FROM_EMAIL=cerebrin@tudominio.com
      - SMTP_REPLY_TO=no-reply@tudominio.com
```

> **Nota**: Si OpenClaw y n8n están en la misma red Docker, usa el nombre del servicio (ej: `http://openclaw:3100`) en vez de `localhost`.

---

## Paso 3: Configurar Credenciales SMTP (Workflow 03)

Solo si vas a enviar emails:

1. En n8n: **Settings** → **Credentials** → **New Credential**
2. Tipo: **SMTP**
3. Configuración según tu proveedor:

### Gmail:
```
Host: smtp.gmail.com
Port: 587
User: tu_email@gmail.com
Password: tu_app_password (no la contraseña normal)
SSL/TLS: STARTTLS
```

### SendGrid:
```
Host: smtp.sendgrid.net
Port: 587
User: apikey
Password: tu_sendgrid_api_key
SSL/TLS: STARTTLS
```

### Resend:
```
Host: smtp.resend.com
Port: 587
User: resend
Password: re_tu_api_key
SSL/TLS: STARTTLS
```

---

## Paso 4: Configurar la generación de PDF

Tienes **2 opciones** para generar PDFs:

### Opción A: html2pdf.app (Servicio externo — más fácil)

1. Regístrate en [html2pdf.app](https://html2pdf.app)
2. Obtén tu API key
3. Agrégala como `HTML2PDF_API_KEY` en las variables de n8n
4. El nodo "Generar PDF (html2pdf.app)" ya está configurado

### Opción B: Puppeteer local (Gratis — tu VPS)

1. Agrega este servicio a tu `docker-compose.yml`:

```yaml
  pdf-generator:
    image: browserless/chrome:latest
    ports:
      - "3200:3000"
    environment:
      - MAX_CONCURRENT_SESSIONS=5
      - TOKEN=tu_token_secreto
```

2. En el workflow 01:
   - **Desactiva** el nodo "Generar PDF (html2pdf.app)"
   - **Activa** el nodo "Alternativa: PDF Local (Puppeteer)"
   - Actualiza la URL a `http://pdf-generator:3000/pdf`

---

## Paso 5: Crear bucket en Supabase Storage

Los PDFs se guardan en Supabase Storage. Crea el bucket:

```sql
-- Ejecutar en Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', true);

-- Política para que el servicio pueda subir
CREATE POLICY "Service can upload reports"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'reports');

-- Política para que cualquiera pueda leer (públicos)
CREATE POLICY "Public can read reports"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'reports');
```

---

## Paso 6: Activar los Workflows

1. Abre cada workflow en n8n
2. Click en el toggle **"Active"** (arriba a la derecha)
3. Verifica que el webhook URL esté disponible:
   - Workflow 1: `http://tu-vps:5678/webhook/generate-pdf`
   - Workflow 3: `http://tu-vps:5678/webhook/send-email-report`
   - Workflow 2: Se ejecuta automáticamente a las 9 AM

---

## Paso 7: Conectar con Cerebrin (.env.local)

En tu archivo `.env.local` del backend de Cerebrin, asegúrate de tener:

```
N8N_PDF_WEBHOOK_URL=http://tu-vps-ip:5678/webhook/generate-pdf
N8N_EMAIL_WEBHOOK_URL=http://tu-vps-ip:5678/webhook/send-email-report
```

> Si Cerebrin y n8n están en la misma red Docker, usa `http://n8n:5678/webhook/...`

---

## Arquitectura del Flujo Completo

```
Usuario aprueba pipeline (WhatsApp/Web)
    │
    ▼
POST /api/webhooks/openclaw ("aprobar")
    │
    ▼
PipelineService.approvePipeline()
    │
    ├──▶ Actualiza DB (documents, approvals)
    │
    └──▶ POST http://n8n:5678/webhook/generate-pdf
              │
              ▼
        ┌───────────────────────────────┐
        │  Workflow 01 (n8n)            │
        │                               │
        │  1. Recibe contenido          │
        │  2. Convierte MD → HTML       │
        │  3. Genera PDF                │
        │  4. Sube a Supabase Storage   │
        │  5. Registra en DB            │
        │  6. Envía por WhatsApp        │
        │  7. Envía archivo PDF         │
        │  8. Envía mensaje sugerido    │
        └───────────────────────────────┘

        ┌───────────────────────────────┐
        │  Workflow 02 (n8n)            │
        │  Cron: 9:00 AM diario        │
        │                               │
        │  1. Lee workspaces activos    │
        │  2. Obtiene tareas pendientes │
        │  3. Obtiene aprobaciones      │
        │  4. Construye resumen         │
        │  5. Envía por WhatsApp        │
        └───────────────────────────────┘
```

---

## Troubleshooting

### El webhook no responde
- Verifica que n8n esté corriendo: `docker ps | grep n8n`
- Verifica que el workflow esté **activo** (toggle verde)
- Prueba con curl: `curl -X POST http://tu-vps:5678/webhook/generate-pdf -H "Content-Type: application/json" -d '{"title":"Test","content":"# Hola"}'`

### No llegan mensajes de WhatsApp
- Verifica que OpenClaw esté corriendo y el QR esté escaneado
- Revisa logs: `docker logs openclaw`
- Prueba envío directo: `curl -X POST http://tu-vps:3100/api/send -d '{"to":"+56912345678","platform":"whatsapp","text":"Test"}'`

### El PDF no se genera
- Si usas html2pdf.app: verifica tu API key
- Si usas Puppeteer local: `docker logs pdf-generator`
- Verifica que el bucket "reports" exista en Supabase Storage
