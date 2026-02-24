# 🏭 FLOW FACTORY: Dynamic Orchestration Engine (v3.3 MASTER)

Este documento define el motor de orquestación de Cerebrin v3, que permite generar y ejecutar flujos de automatización dinámicos sin necesidad de programar cada caso individualmente.

## 🏛️ FILOSOFÍA: "Enseñar, no Programar"
En lugar de crear flujos 1 a 1, Cerebrin utiliza un sistema de **Mapeo de Intenciones**. La IA actúa como el ingeniero que ensambla "piezas de lego" (Skills) para cumplir el deseo del usuario en tiempo real.

---

## 🏗️ ARQUITECTURA DEL MOTOR

### 1. El Catálogo de Habilidades Atómicas (Atomic Skills)
El sistema cuenta con un conjunto de funciones base que n8n puede ejecutar de forma paramétrica:
*   `GenericReader`: Lee emails, documentos, scraps webs o transcribe audios.
*   `DataExtractor`: Extrae entidades (montos, fechas, nombres) usando LLM.
*   `SheetWriter`: Escribe en cualquier columna/fila de Google Sheets/Excel.
*   `CalendarManager`: Agregas/modifica eventos.
*   `Notifier`: Envía mensajes por WhatsApp, Telegram, Email o Slack.

### 2. SISTEMA DE CREACIÓN EN 3 NIVELES (Onboarding de Flujos)
Para evitar la fricción y ahorrar tokens, el "Flow Factory" opera en tres niveles de complejidad según la necesidad del usuario:

| Nivel | Nombre | Interacción | Resultado Técnico |
| :--- | :--- | :--- | :--- |
| **L1** | **Básico / Simple** | "Quiero controlar mis gastos" | La IA crea una planilla vacía con columnas mínimas basadas *solo* en lo que el usuario dijo. |
| **L2** | **Guiado (Sugerido)** | "Quiero controlar mis gastos" -> IA: "¿Deseas agregar 'Categoría' y 'Medio de Pago'?" | El Agente propone mejoras. La persona acepta o modifica. Crea una estructura de mayor utilidad. |
| **L3** | **Avanzado (A Medida)** | "Crea una tabla con estas 10 columnas..." o "Usa esta hoja que ya tengo lista". | Iteración profunda. Mapeo de columnas existentes o creación de lógica compleja (Macros de Voz). |

### 3. El Orquestador Paramétrico de n8n
Existe **un solo Workflow maestro** en n8n que recibe un objeto de configuración (Blueprint):
```json
{
  "trigger_type": "voice_message",
  "intent": "expense_tracking",
  "steps": [
    { "action": "transcribe", "provider": "whisper" },
    { "action": "extract_data", "schema": "money_expense" },
    { "action": "write_to_sheet", "target": "user_finances_2026" }
  ]
}
```

---

## 🧠 DYNAMIC INTENT MAPPING (¿Cómo aprende la IA?)

Cuando un usuario dice algo nuevo, por ejemplo: *"Cerebrin, cada vez que te mande una foto de una planta, anota el riego en mi planilla de jardín"*:

1.  **Detección de Nueva Automatización:** El Agente Director detecta que el usuario no está pidiendo una tarea, sino definiendo una **Regla**.
2.  **Generación de Blueprint:** La IA genera internamente el JSON de configuración necesario para cumplir esa tarea usando las Habilidades Atómicas.
3.  **Persistencia:** Se guarda en la tabla `workspace_blueprints`.
4.  **Activación Silenciosa:** La próxima vez que envíes una foto de planta, el Director reconoce el patrón y dispara el **Orquestador Paramétrico**.

### 5. TOKEN EFFICIENCY & STANDARDS
Para optimizar el consumo de tokens y asegurar la consistencia, el motor utiliza **Estructuras Estandarizadas (Blueprints)** en lugar de razonar desde cero en cada petición:

1.  **Detección de Patrones:** Si el usuario pide "control de gastos", la IA no inventa las columnas; carga el `Standard_Financial_Schema` como base.
2.  **Ahorro de "Reasoning":** Solo se gastan tokens en los *cambios* que el usuario pide sobre el estándar, no en definir qué es un "monto" o una "fecha".
3.  **Confirmación HITL:** En L2 y L3, la IA envía un mensaje corto: *"He diseñado este esquema: [Fecha | Monto | Item]. ¿Lo activo?"*. Al confirmar, se guarda la regla permanente.

---

## 📚 EL SISTEMA DE BLUEPRINTS (Plantillas)

Para reducir la fricción inicial, Cerebrin ofrece Blueprints pre-configurados que el usuario puede "activar" con una frase:

| Blueprint | Activador Sugerido | Resultado |
| :--- | :--- | :--- |
| **B-001: Finance Tracker** | "Registra mis gastos..." | Audio -> Sheets (Finanzas) |
| **B-002: Health Log** | "Anota lo que comí..." | Audio -> Sheets (Salud) |
| **B-003: Lead Capture** | "Me contactó un cliente..." | Email/Audio -> CRM (Sheets) |
| **B-004: Academic Sync** | "Organiza mi programa..." | PDF -> Calendar + Drive |

---

## 🛠️ EJEMPLO TÉCNICO: Blueprint de Captura de Lead (V3)

Este es el JSON que genera la IA internamente cuando el usuario dice: *"Me llamó Juan de Ebox, le interesa el diseño web por 2 palos. Tarea: mandarle la propuesta el viernes."*

```json
{
  "blueprint_id": "BP-SALE-001",
  "name": "Captura de Lead de Trinchera",
  "trigger": {
    "type": "voice_message",
    "platform": "whatsapp"
  },
  "pipeline": [
    {
      "step": 1,
      "skill": "GenericReader",
      "params": { "provider": "whisper", "output": "raw_text" }
    },
    {
      "step": 2,
      "skill": "DataExtractor",
      "params": {
        "model": "gemini-1.5-flash",
        "schema": {
          "cliente": "string",
          "empresa": "string",
          "presupuesto": "number",
          "tarea_pendiente": "string",
          "dead_line": "date"
        }
      }
    },
    {
      "step": 3,
      "skill": "SheetWriter",
      "params": {
        "spreadsheet_id": "CRM_SALES_2026",
        "range": "Leads!A:E",
        "mapping": {
          "A": "{{step2.cliente}}",
          "B": "{{step2.empresa}}",
          "C": "{{step2.presupuesto}}",
          "D": "Lead Calificado",
          "E": "{{timestamp}}"
        }
      }
    },
    {
      "step": 4,
      "skill": "TaskCreator",
      "params": {
        "title": "{{step2.tarea_pendiente}}",
        "priority": "high",
        "due_date": "{{step2.dead_line}}",
        "workspace_id": "ws-current"
      }
    },
    {
      "step": 5,
      "skill": "Notifier",
      "params": {
        "message": "✅ Juan (Ebox) anotado en el CRM. Tarea creada: '{{step2.tarea_pendiente}}' para el viernes."
      }
    }
  ]
}
```

---

## 🚀 ESCALABILIDAD AL INFINITO (Marketplace Vision)
Este motor permite que Cerebrin crezca sin aumentar el código base:
*   **Comunidad:** Los usuarios podrán compartir sus "Blueprints" con otros (ej: "Pack para Abogados").
*   **Adaptabilidad:** La IA ajusta las categorías del Blueprint según el contexto. Si un abogado usa el "Lead Capture" de un diseñador, la IA cambia "Proyecto" por "Caso Judicial" automáticamente.

---
*Versión: 3.3 | Estado: Motor de Orquestación Dinámica | "The Heart of Cerebrin v3"*
