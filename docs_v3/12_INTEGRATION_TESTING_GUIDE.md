# 🧪 INTEGRATION & TESTING: Connectivity Guide (v3.3 MASTER)

Este documento detalla los pasos pendientes para conectar el Frontend con el "Cerebro" (Backend/IA/n8n) y los protocolos de prueba para validar los flujos de la v3.

## 🔗 CHECKLIST DE INTEGRACIÓN (Pendientes Críticos)

### 1. Conexión de Servicios API
El Frontend tiene mocks completos, pero necesitamos cablear los 6 servicios principales a los endpoints reales:
*   [ ] **AutomationsService**: Conectar con el orquestador de n8n.
*   [ ] **IntegrationsService**: Validar tokens de Google Drive y Sheets.
*   [ ] **ActivityService**: Sincronizar el feed con la tabla `activity_feed`.
*   [ ] **Profile & Onboarding**: Implementar el flujo de bifurcación de los 3 perfiles (Individual/Académico/Org).

### 2. Infraestructura de Streaming (SSE)
*   [ ] Implementar el canal de **Server-Sent Events** para que el Dashboard reaccione en tiempo real cuando un audio se procesa y aparece en el Sheets.

### 3. n8n Parametric Workflow
*   [ ] Crear el "Master Orchestrator" en n8n que reciba los Blueprints del **Flow Factory**.

---

## 🧪 PROTOCOLOS DE PRUEBA (Flow Testing)

### Prueba 1: El "Wow Mode" Académico
1.  **Acción:** Subir el PDF `syllabus_ejemplo.pdf`.
2.  **Verificación:** 
    *   ¿Se crearon las carpetas en Drive?
    *   ¿Aparecieron los eventos en Google Calendar?
    *   ¿El dashboard de Cerebrin muestra el ramo y el promedio inicial?

### Prueba 2: El "Zero-Fricción" de Gastos (Audio)
1.  **Acción:** Enviar audio: *"Gasté 5 lucas en almuerzo hoy"*.
2.  **Verificación:** 
    *   ¿Aparece la fila en el Google Sheet al segundo siguiente?
    *   ¿El bot responde con el "Undo Button" en el chat?

### Prueba 3: La "Resonancia Proactiva"
1.  **Acción:** Registrar 3 gastos de "Café" seguidos.
2.  **Verificación:** 
    *   ¿El sistema lanza un "Hook" preguntando si queremos ahorrar en café?
    *   ¿Se respeta el principio de "Preguntar antes de Analizar"?

---

## 🛠️ HERRAMIENTAS DE DEBUGGING
*   **Log de Blueprints:** `/api/debug/blueprints` para ver qué JSON generó la IA ante un comando.
*   **n8n Execution Log:** Para rastrear fallos en la conexión con Sheets o Drive.
*   **Supabase Realtime Inspector:** Para validar que los triggers de base de datos están disparando los cálculos de promedio.

---
*Versión: 3.3 | Estado: Guía de Implementación Final | Enfoque: Conectividad & QA*
