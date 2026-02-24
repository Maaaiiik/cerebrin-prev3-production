# 🎯 MINIMAL EXPERIENCE: MVP "Zero-Fricción" (v3.3 MASTER)

Este documento define la versión "absolutamente mínima" necesaria para operar y validar la experiencia del Perfil 01a (Individual). El objetivo es pasar del mensaje de voz a la planilla de Google Sheets con la estética "Premium Mission Control".

---

## 🖥️ LAS 3 PANTALLAS ESENCIALES

### 1. El Cockpit de Chat (The "Mission Control")
Una interfaz ultra-limpia centrada en la interacción directa.
*   **Avatar "Cerebrin":** Un gráfico animado y expresivo (estilo Duolingo) que reacciona según la IA está "pensando", "anotando" o "confirmando".
*   **Input Dual:** Caja de texto minimalista y un botón de micrófono grande para audios de "trinchera".
*   **Action Cards:** En lugar de solo texto, la IA responde con tarjetas interactivas:
    *   *Tarjeta de Éxito:* "He anotado tu gasto. [Ver Planilla 🔗]"
    *   *Tarjeta de Propuesta:* "He notado que gastas mucho en Café. ¿Vemos un resumen? [Si] [No]"

### 2. Hub de Conectores (Settings Básicos)
Donde sucede la "magia" técnica de forma simplificada.
*   **Google Connect:** Botón único para vincular Drive y Sheets.
*   **Telegram/WhatsApp Bridge:** Configuración del bot externo para recibir audios desde el móvil.
*   **Brain Config:** Selector de modelo (Gemini/OpenAI) y el "System Prompt" del Twin.

### 3. Bóveda de Memoria (Semantic Vault)
Visualización de lo que la IA "sabe".
*   **Gestión de Núcleos:** Lista de memorias (ej: "Finanzas Personales", "Contactos").
*   **Explorador de Datos:** Una vista simple para ver qué información está indexada en los vectores y poder borrar o corregir datos erróneos.

---

## 🚀 EL FLUJO "KILLER" (User Story 1.1)

1.  **Input:** El usuario manda un audio por WhatsApp: *"Cerebrin, me tomé un café por 2500"*.
2.  **Orquestación (n8n):** 
    *   Whisper transcribe -> LLM extrae `item: café`, `precio: 2500`.
    *   Busca la planilla "Seguimiento de Compras Diarias". Si no existe, **la crea automáticamente** con los encabezados: `ID | Fecha | Item | Monto | Categoría`.
    *   Agrega la fila.
3.  **Confirmación:** El bot responde por WhatsApp y en la Web: *"Anotado en tu libro de compras diarias. ¡Llevas $15.500 esta semana!"*.
4.  **Valor Proactivo:** Al tercer registro, la IA pregunta: *"He detectado 3 gastos de cafetería seguidos. ¿Quieres que te cree un gráfico de gastos hormiga en tu próximo resumen semanal?"*.

---

## 📄 GENERACIÓN DE INFORMES (El Entregable)

Cuando el usuario pide un informe (ej: "Mándame el resumen del mes"):
*   **IA Selector:** Selecciona la plantilla ideal basada en los datos de la planilla.
*   **n8n PDF Engine:** Genera un PDF profesional con gráficos minimalistas.
*   **Validación de Formato:** El usuario ve un preview. Si le gusta (`Aprobado`), ese formato queda asignado como el **Estándar Personal** para futuros reportes sin volver a preguntar.

---

## 🛠️ REQUERIMIENTOS TÉCNICOS MÍNIMOS
*   **Backend:** Una base de datos `workspaces` vinculada a un `spreadsheet_id`.
*   **Motor de Reglas:** Un mapeador que asocie la palabra "gasto" con la Skill `SheetWriter`.
*   **n8n Master:** El flujo paramétrico que maneja la creación y actualización de archivos.

---
*Versión: 3.3 | Enfoque: MVP Zero-Fricción | Estado: Blueprint de Desarrollo*
