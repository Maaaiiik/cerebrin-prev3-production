# 🎓 PROFILE: Academic & Student (v3.3 MASTER)

Este documento detalla la experiencia del **Estudiante Estratégico** en Cerebrin v3, enfocada en la eliminación de tareas manuales y la organización instantánea.

## 🏛️ OBJETIVO: "Semestre Organizado en 60 Segundos"
El valor de Cerebrin para el estudiante no es el reemplazo de su estudio, sino la **automatización de la logística académica** que quema su tiempo y energía.

---

## 🚀 QUICK-VALUE AUTOMATIONS (El "Wow" Moment)

### 1. Sistema "One-Upload" (Onboarding)
El estudiante sube una foto o PDF de su **Programa de Curso / Malla**. n8n captura los datos y ejecuta:
*   **En DB:** Crea las Unidades (Ramos) y Acciones (Certámenes/Tareas).
*   **En Calendar:** Agrega todas las fechas de exámenes y entregas con recordatorios.
*   **En Drive:** Crea la estructura de carpetas: `[Año] > [Semestre] > [Nombre del Ramo]`.
*   **Resultado:** En menos de 1 minuto, el semestre completo está cableado digitalmente.

### 2. Captura de Documentos Inteligente (WhatsApp/Telegram)
*   **Manual:** El estudiante recibe un papel en clase, le saca una foto y la envía al bot.
*   **Automatización:** n8n identifica a qué ramo pertenece -> Lo sube a la carpeta de Drive correcta -> Genera un nombre de archivo limpio (ej: `MAT101_Guia_Integrales.pdf`).
*   **Valor:** Cero carpetas desordenadas y acceso total desde cualquier dispositivo.

### 3. Apoyo en Problemas Puntuales (The "Help-Me" Trigger)
*   **Acción:** El estudiante envía un mensaje: *"No entiendo este ejercicio de Química [Foto]"*.
*   **Proceso:** El agente no resuelve el problema (no es intrusivo); busca en YouTube el video mejor valorado sobre ese tema específico o busca en el PDF del libro el capítulo correspondiente.
*   **Valor:** Ahorro de búsqueda y frustración; guía directa a la fuente confiable.

---

## 📊 ESQUEMA DE EXTRACCIÓN (IA Data Schema)

Para que la automatización sea perfecta, la IA busca estos campos en los documentos subidos:
```json
{
  "unit_name": "Cálculo I",
  "unit_code": "MAT101",
  "evaluations": [
    { "title": "Certamen 1", "date": "15-Abr", "weight": "25%" },
    { "title": "Proyecto Final", "date": "10-Jun", "weight": "30%" }
  ],
  "schedule": [
    { "day": "Lunes", "time": "08:15 - 09:45", "room": "A-201" }
  ]
}
```

---

## ⚙️ FUNCIONES DE APOYO PRÁCTICO

### Cálculo Automático de Notas
*   **Valor:** El estudiante ingresa una nota y el sistema recalcula su promedio ponderado al instante. 
*   **Visibilidad:** Muestra de forma clara (no intrusiva) cuánto falta para el aprobado, eliminando el estrés de "hacer la cuenta" a mano.

### Resúmenes de Respaldo
*   **Valor:** El usuario sube un PDF largo y pide: *"Dame los 5 puntos clave para la clase de mañana"*.
*   **Resultado:** Un resumen ejecutivo que permite ir preparado a clase con el mínimo esfuerzo previo.

---

## ⚙️ DETALLES TÉCNICOS: MOTOR DE CÁLCULO (Domain Logic)

El cálculo de promedios se ejecuta exclusivamente en el **Backend** mediante un **Trigger de base de datos** para asegurar que el Front-end siempre vea datos consistentes.

### SQL Logic (Conceptual):
```sql
CREATE OR REPLACE FUNCTION calculate_unit_average(u_id UUID) 
RETURNS NUMERIC AS $$
BEGIN
  UPDATE units 
  SET metadata = jsonb_set(metadata, '{current_average}', 
    (SELECT SUM(score * weight) / SUM(weight) 
     FROM actions 
     WHERE unit_id = u_id AND score IS NOT NULL)::text::jsonb)
  WHERE id = u_id;
END;
$$ LANGUAGE plpgsql;
```

---

## 📄 EJEMPLO: JSON DE RETORNO (Cartola de Notas)

Este es el objeto que el Backend entrega al Front para renderizar la tarjeta del Ramo y su detalle de evaluaciones:

```json
{
  "unit_id": "u-987-calc-1",
  "name": "Cálculo I",
  "metadata": {
    "current_average": 3.82,
    "status": "warning",
    "prediction": {
      "min_score_needed": 5.2,
      "remaining_weight": 0.30
    }
  },
  "actions": [
    { "title": "Certamen 1", "weight": 0.20, "score": 4.5, "status": "completed" },
    { "title": "Examen Final", "weight": 0.30, "score": null, "status": "scheduled" }
  ]
}
```

---

## 🔗 INTEGRACIÓN: ACADEMIA + PIPELINE MULTI-ROL

¿Cómo ayuda la IA a un estudiante en riesgo?
1.  **Detección:** Backend nota que el promedio bajó a un umbral crítico (ej: 3.8).
2.  **Activación:** Se dispara el endpoint `POST /api/student/trigger-support-pipeline`.
3.  **Ejecución:** El **Investigador** (Pilar 5) busca contenido de refuerzo y el **Escritor** genera el material de apoyo.

---

## 🔗 INTEGRACIONES CLAVE
*   **Google Calendar:** Sincronización bidireccional de alertas.
*   **Google Drive:** Soberanía absoluta de archivos personales.
*   **n8n Webhook:** Orquestador de todos los flujos de "subida y organización".

---
*Versión: 3.3 | Perfil: Académico | Enfoque: Valor Práctico y Ahorro de Tiempo*
