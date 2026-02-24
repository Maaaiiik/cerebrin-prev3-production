# ⚖️ AUDIT & CORRECTION: Human-in-the-Loop (v3.3 MASTER)

Este documento define el sistema de control y supervisión que garantiza que el usuario siempre tenga la última palabra sobre las acciones de la IA.

## 🏛️ EL PRINCIPIO: "Optimismo con Red de Seguridad"
Cerebrin opera bajo una filosofía de **Ejecución Optimista** para tareas de bajo riesgo y **Confirmación Obligatoria** para tareas de alto impacto.

---

## 🚦 ZONAS DE IMPACTO (Impact Zones)

| Zona | Riesgo | Comportamiento | Ejemplo |
| :--- | :--- | :--- | :--- |
| **🟢 VERDE** | Bajo | **Ejecutar y Avisar**: La IA realiza la acción y envía una notificación con opción a deshacer. | Anotar un gasto, registrar una comida, crear una nota de contacto. |
| **🟡 AMARILLA**| Medio| **Proponer y Esperar**: La IA prepara la acción pero requiere un "OK" rápido en el chat. | Crear un evento en el calendario, mover un hito de proyecto. |
| **🔴 ROJA** | Alto | **Bloqueo Total (HITL)**: Requiere revisión completa del contenido antes de disparar servicios externos. | Enviar email a cliente, procesar un pago, borrar una "Unit" completa. |

---

## 🛠️ EL CÍRCULO DE AUDITORÍA (Correction Loop)

Para que el sistema sea un complemento real, debe aprender de sus errores. Cuando un usuario corrige un dato (ya sea en el chat o directamente en el Google Sheet):

1.  **Detección de Cambio:** n8n detecta una edición manual en una celda que fue escrita originalmente por la IA.
2.  **Análisis de Discrepancia:** El agente compara lo que él escribió vs lo que el humano corrigió.
3.  **Ajuste de Memoria:**
    *   Si el error fue de clasificación (ej: "Café" era "Gasto de Empresa", no "Personal"), la IA actualiza el **Blueprint** del usuario.
    *   La próxima vez, aplicará el nuevo criterio automáticamente.

---

## 🖥️ INTERFAZ DE AUDITORÍA (UI/UX)

1.  **Undo Button:** En el chat, cada acción automática de "Zona Verde" incluye un botón de `[Deshacer]` que expira a los 5 minutos.
2.  **Recent Actions Log:** Un panel lateral donde el usuario puede ver las últimas 20 acciones de la IA y marcarlas como "Correctas" o "Corregir".
3.  **Sheet Highlight:** (Opcional) Las celdas escritas por la IA pueden tener un color de fondo sutil hasta que el usuario las "valide" visualmente.

---

## 🔐 SEGURIDAD: CONTROL DE DAÑOS
*   **Recuperación de Desastres:** Todo lo que la IA borre en el sistema queda en un estado de "Soft Delete" por 30 días.
*   **Audit Trail:** Cada fila en el Sheets tiene un ID de ejecución que permite rastrear qué Agente y qué Prompt generó ese dato.

---
*Versión: 3.3 | Estado: Sistema de Control HITL | Sincronizado con PROACTIVE RESONANCE*
