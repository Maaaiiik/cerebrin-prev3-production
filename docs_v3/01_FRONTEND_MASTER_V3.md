# 🖥️ CEREBRIN MVP — FRONTEND BRIEF v3.3 (FULL UX MASTER)
### Para: Equipo Frontend | Versión completa con detalle de UX
### Fecha: Feb 2026

> [!IMPORTANT]
> Este documento reemplaza todas las versiones anteriores del brief. Contiene el detalle completo de UX para cada pantalla: estados, interacciones, copy, comportamiento mobile y casos borde. **No asumas nada; si no está aquí, pregunta antes de implementar.**

---

## 🎯 Contexto del Producto

**Cerebrin** es un sistema operativo para personas y equipos que quieren delegar trabajo repetitivo a agentes de inteligencia artificial. El usuario no es un experto en IA; es un vendedor, asistente, jefe de área o estudiante que quiere ahorrar tiempo.

**El usuario no "configura una IA". El usuario tiene un asistente que trabaja mientras él vive.**

---

## 🏛️ Estructura Ideal V3 (Arquitectura de Información)

Para garantizar consistencia, Cerebrin v3 se organiza en **5 niveles jerárquicos**. Esta estructura es flexible y se adapta según la **Persona** activa:

1. **PERSONA** (La Identidad)  
   *   Define la "piel", el tono del agente y los widgets específicos.
   *   Ej: *Estudiante*, *Vendedor*, *Project Manager*.

2. **WORKSPACE** (El Contenedor)  
   *   El espacio raíz de trabajo (ej: Universidad de Chile, Mi Empresa, Freelance).

3. **UNITS: IDEAS & PROYECTOS** (La Estrategia / Ramos)  
   *   Las unidades de ejecución a medio-largo plazo. En estudiantes, estos son los **Ramos**.

4. **ACTIONS: TAREAS & SUBTAREAS** (La Ejecución)  
   *   El trabajo granular diario. Incluye evaluaciones, certámenes y tareas recurrentes.

5. **KNOWLEDGE: DOCUMENTOS** (El Cerebro)  
   *   Los artefactos generados o consultados (Apuntes, Cotizaciones, Mallas Curriculares).

---

## 🏗️ Arquitectura de Navegación

```
/setup              → Onboarding guiado (solo primera vez)
/                   → Dashboard (pantalla principal)
/my-agent           → Panel del Agente Personal
/my-agent/memory    → Gestión de Memorias del Agente
/templates/builder  → Constructor de Plantillas
/activity           → Historial de Acciones
/settings           → Configuración (perspectiva, cuenta, etc.)
```

### Layout General
- **Sidebar izquierdo** (desktop): navegación principal, colapsable
- **Top bar**: nombre del agente activo + indicador de estado
- **Área principal**: contenido de la ruta activa
- **Shadow Chat**: panel derecho (desktop) o bottom sheet (mobile)

---

## 📐 PANTALLA 1: ONBOARDING GUIADO `/setup`

### Cuándo aparece
- **Solo la primera vez** que el usuario entra después de registrarse.
- Si el usuario cierra la ventana a mitad, la sesión se guarda. Al volver, retoma desde donde estaba (mostrar mensaje: *"Continuamos desde donde lo dejaste 👋"*).
- El usuario puede saltarse el onboarding con un link pequeño al fondo: *"Quiero configurarlo yo mismo →"*. Si lo hace, se le asigna un agente genérico y puede configurarlo desde `/my-agent`.

### Diseño Visual
- Pantalla completa, sin sidebar ni topbar.
- Fondo oscuro con gradiente sutil (oscuro a muy oscuro). No hay distracciones.
- En el centro: un avatar del agente "The Architect" (icono de brújula + IA animado con pulso suave).
- El "chat" aparece abajo como una interfaz de messaging, no como un formulario.

### Flujo Paso a Paso

**Paso 0 — Bienvenida (automático, no requiere input)**
```
Avatar pulsa suavemente.
Texto aparece con efecto de máquina de escribir (20ms/carácter):

"Hola, soy The Architect 🧭"
[pausa 800ms]
"Mi trabajo es diseñar tu asistente de IA perfecto en menos de 5 minutos."
[pausa 600ms]
"Solo necesito hacerte 4 preguntas. ¿Empezamos?"

[Botón grande centrado]: "Empecemos →"
```

**Paso 1 — La gran pérdida de tiempo**
```
Pregunta:
"¿Qué tarea te consume más tiempo y más te aburre hacer?"

Opciones (chips seleccionables, puede elegir hasta 2):
  📋 Cotizaciones y propuestas manuales
  📊 Informes y reportes recurrentes
  📅 Gestión de agenda y reuniones
  🔍 Buscar información o investigar temas
  📧 Responder emails repetitivos
  📝 Tomar apuntes y documentar procesos
  ✏️ Otro (input de texto libre aparece)

UX: los chips tienen hover con un borde de color y un pequeño ícono animado.
Al seleccionar, el chip hace un mini "bounce" y cambia a estado activo (fondo sólido).
```

**Paso 2 — El equipo / Organización**
```
Pregunta:
"¿Cómo operarás en Cerebrin?"

Opciones (3 cards grandes, solo 1 seleccionable):
  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
  │   Solo/a 🧍        │  │   En equipo 👥      │  │  Organización 🏢   │
  │ Soy freelancer,    │  │ Tengo colegas o     │  │ Soy líder/gerente. │
  │ estudiante o       │  │ reporto a alguien   │  │ Busco potenciar a  │
  │ profesional        │  │                     │  │ mis equipos con IA │
  └────────────────────┘  └────────────────────┘  └────────────────────┘

Lógica de bifurcación:
- "Solo/a": Continúa a Paso 3 (Personalización).
- "En equipo": Aparece un sub-step preguntando el Área (Ventas, Tech, etc) para elegir el agente inicial.
- "Organización": (A futuro) Desbloquea el **Organization Builder**:
   - Permite invitar a múltiples miembros.
   - Despliega un "Swarm" (Enjambre) de agentes por defecto para la empresa.
   - Panel de control de tokens por área.
```

**Paso 3 — La preferencia de control**
```
Pregunta:
"¿Cómo prefieres trabajar con tu asistente?"

Cards tipo "perfil":
  ┌─────────────────────────────────────────┐
  │ 🎯 Yo quiero decidir todo               │
  │ El agente me muestra opciones y yo      │
  │ apruebo cada paso. Máximo control.      │
  └─────────────────────────────────────────┘
  ┌─────────────────────────────────────────┐
  │ ⚡ Que trabaje solo, solo avísame        │
  │ El agente trabaja en background y me    │
  │ muestra el resultado cuando termina.    │
  └─────────────────────────────────────────┘
  ┌─────────────────────────────────────────┐
  │ 🔄 Equilibrado (recomendado)            │
  │ El agente me pide aprobación solo para  │
  │ acciones importantes. El resto va solo. │
  └─────────────────────────────────────────┘
```

**Paso 4 — Generación (Estado de carga)**
```
El agente "procesa" las respuestas (animación de puntos 1.5s):

"Perfecto, Sofía. Estoy diseñando tu asistente..."
[Barra de progreso animada, 0→100% en 2.5s]

Mensajes que van apareciendo durante la carga (fade in cada 0.6s):
  "✅ Activando agente Comercial"
  "✅ Configurando nivel de autonomía: Equilibrado"
  "✅ Creando tu primer espacio de trabajo"
  "✅ Tu asistente está listo"
```

**Paso 5 — Preview de la estructura (antes de confirmar)**
```
"He diseñado esto para ti. ¿Te parece bien?"

Muestra un mini-mapa de la estructura generada:
  ┌──────────────────────────────────────────────┐
  │  Tu asistente "Sofia AI" 🤖                  │
  │                                              │
  │  Modo: Equilibrado (aprueba lo importante)   │
  │  Especialidad: Ventas y Comercial             │
  │  Primera habilidad: Cotizaciones automáticas │
  │                                              │
  │  Memorizará: Clientes, Plantillas, Productos │
  └──────────────────────────────────────────────┘

[Botón primario]: "¡Activar mi asistente! →"
[Link pequeño]: "Ajustar algo antes →" (vuelve al paso 1)
```

**Transición final:**
- Confetti suave cae por 2 segundos.
- Aparece el mensaje: *"Tu asistente está activo. Él ya te está observando. 👁️"*
- Redirect automático a `/` (Dashboard) después de 2s.

---

## 📐 PANTALLA 2: DASHBOARD `/`

### Concepto general
El Dashboard es diferente según el modo del usuario:
- **Modo Focus** (el default del MVP): limpio, centrado en tareas y el agente.
- **Modo Director**: denso, métricas, KPIs, proyectos. (Futuro — no implementar en MVP).

### Layout Modo Focus (Mobile First)

```
┌─────────────────────────────────────────┐
│ TopBar                                  │
│ [≡ Menú]  "Buenos días, Sofía 👋"  [🤖] │ ← El [🤖] abre el Shadow Chat
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ 🤖 Sofia AI está activa 🟢      │    │ ← AgentStatusBanner
│  │ "Tengo 2 tareas listas para ti" │    │
│  │ [Ver sugerencias]               │    │
│  └─────────────────────────────────┘    │
│                                         │
│  MIS TAREAS HOY                         │ ← Sección fija
│  ─────────────────────────────────────  │
│  ☐ Cotización para Empresa ABC     H🔴  │
│  ☐ Responder email de Juan Pérez   🟡   │
│  ✓ Revisar informe semanal         ✅   │
│                                         │
│  [+ Agregar tarea]                      │
│                                         │
│  SUGERENCIAS DEL AGENTE                 │ ← Solo aparece si tiene suggestions
│  ─────────────────────────────────────  │
│  💡 "Tengo lista la cotización de ABC.  │
│      ¿La revisas?" [Ver borrador]       │
│                                         │
└─────────────────────────────────────────┘
│ BottomNav: [🏠] [📋] [⚡Chat] [📄] [⚙️] │
└─────────────────────────────────────────┘
```

### Desktop Layout (Modo Focus)
```
┌────────────┬─────────────────────────────┬──────────────┐
│  Sidebar   │  Área Principal              │ Shadow Chat  │
│  (240px)   │                              │  (320px)     │
│            │  Buenos días, Sofía 👋       │              │
│  🏠 Inicio │                              │  🤖 Sofia AI │
│  📋 Tareas │  [AgentStatusBanner]         │  ──────────  │
│  📄 Docs   │                              │  mensajes... │
│  📊 Proyec │  MIS TAREAS HOY              │              │
│  ⚙️ Config │  [ lista de tareas ]         │  [input...] │
│            │                              │              │
└────────────┴─────────────────────────────┴──────────────┘
```

### Estados del Dashboard

**Estado: Sin tareas (Primera vez)**
```
[Icono de lista vacía con animación suave]
"Aún no tienes tareas para hoy 🌅"
"Tu agente puede ayudarte a crearlas. ¿Empezamos?"
[Botón]: "Dile a tu agente qué necesitas →"
→ Abre el Shadow Chat con el prompt pre-llenado:
  "Hola, necesito organizar mi día de hoy..."
```

**Estado: Primer uso después del onboarding**
```
Banner amarillo suave en la parte superior:
"⚡ ¡Tu agente está listo! Cuéntale qué necesitas hacer hoy."
[Botón]: "Abrir chat →"  [X para cerrar]
```

**Estado: Tiene ApprovalCard pendiente**
```
Aparece un card flotante STICKY en la parte superior del área de tareas:

┌──────────────────────────────────────────────┐
│ 🤖 Sofia AI necesita tu aprobación           │
│ ─────────────────────────────────────────    │
│ Propongo enviar la cotización de Empresa ABC  │
│ a juanperez@abc.com por $1.250.000           │
│                                              │
│ [👁️ Ver borrador]  [✅ Aprobar]  [❌ Cancelar] │
└──────────────────────────────────────────────┘

Animación: el card entra con slide-down desde arriba.
Si hay múltiples approvals: "1 de 3" con flechas para navegar.
```

### Comportamiento de las Tareas
- **Tap en tarea** → abre un sheet de detalle (UniversalTaskSheet)
- **Swipe derecha** (mobile) → marca como completada (con animación de ✅)
- **Swipe izquierda** (mobile) → opciones: Editar, Delegar al agente, Eliminar
- **Prioridades visuales**: 🔴 Alta (hoy), 🟡 Media (esta semana), gris (sin fecha)
- **Tareas del agente** muestran un pequeño badge 🤖 junto al título

---

## 📐 PANTALLA 3: SHADOW CHAT (Panel lateral / Bottom Sheet)

### Dónde vive
- **Desktop**: Panel fijo de 320px en el lado derecho. Siempre visible en modo Focus.
- **Mobile**: Bottom sheet. Cerrado por defecto. Se abre con el botón flotante 🤖 (FAB, bottom-right).

### Header del Chat
```
┌─────────────────────────────────────────┐
│  🟢 Sofia AI                    [⚙️][✕] │
│  Modo: OPERATOR · Resonance: 73%        │
│  "Tengo 2 sugerencias listas"           │
└─────────────────────────────────────────┘
```
- 🟢 Verde = agente activo y en buen estado
- 🟡 Amarillo = agente pensando/procesando
- 🔴 Rojo = error o requiere atención
- Clic en ⚙️ → va a `/my-agent`

### Estados del modo del agente (indicator pill)
```
OBSERVER  → "Estoy aprendiendo de ti"        (gris, solo lee)
OPERATOR  → "Propongo, tú decides"           (azul, hace sugerencias)
EXECUTOR  → "Actúo cuando es necesario"      (verde, autonomía alta)
```

### Área de mensajes

**Mensaje del agente:**
```
┌──────────────────────────────────────────┐
│ 🤖                                       │
│  He analizado los últimos 5 proyectos    │
│  de tu workspace. Noto que siempre       │
│  usas el mismo formato de cotización.   │
│  ¿Quieres que lo guarde como plantilla? │
│                                          │
│  📄 Según [Cotización_tipo.docx]         │ ← SourceCitation
│  🟢 Alta confianza                       │ ← ConfidenceBadge
│  Hace 2 min                              │
└──────────────────────────────────────────┘
```

**Mensaje del usuario:**
```
                    ┌────────────────────┐
                    │  Sí, guárdala      │
                    │  Hace 2 min  ✓✓    │
                    └────────────────────┘
```

**ApprovalCard dentro del chat:**
```
┌──────────────────────────────────────────┐
│ 🤖 Acción propuesta                      │
│ ──────────────────────────────────       │
│ Guardando plantilla "Cotización Estándar"│
│ en tus documentos                        │
│                                          │
│  [✅ Aprobar]          [❌ Cancelar]      │
└──────────────────────────────────────────┘
```

**Mensaje con subtareas (plan de trabajo):**
```
┌──────────────────────────────────────────┐
│ 🤖 He planificado cómo hacer el informe: │
│                                          │
│  1. 🔍 Investigar uso de IA en Chile     │
│  2. 📊 Extraer 5 estadísticas clave      │
│  3. ✍️ Redactar resumen ejecutivo        │
│  4. 📄 Generar PDF formal                │
│                                          │
│  Tiempo estimado: ~8 minutos             │
│                                          │
│  [✅ Aprobar plan]   [✏️ Modificar]       │
└──────────────────────────────────────────┘
```

### Barra de Input
```
┌──────────────────────────────────────────────┐
│ 📎 │ ¿En qué te ayudo hoy?     │ [Enviar ↑] │
└──────────────────────────────────────────────┘

📎 = adjuntar archivo (sube y se indexa para RAG)
```

**Acciones rápidas** (aparecen sobre el input al hacer foco o al tocar ⚡):
```
[📋 Crear cotización] [📊 Resumir] [🔍 Investigar] [📝 Redactar email]
```

### Estados de carga del agente
```
Mientras la IA procesa → 3 puntos animados en burbuja del agente:
  🤖 ·  ·  ·

Si tarda más de 5s → aparece texto: "Buscando en tus documentos..."
Si tarda más de 10s → "Esto está tomando más de lo normal..."
Si falla → "Ocurrió un error. ¿Intentamos de nuevo?" [Reintentar]
```

---

## 📐 PANTALLA 4: PANEL "MI AGENTE" `/my-agent`

### Layout (tabs internos)
```
[🤖 Mi Agente]  [🧠 Memorias]  [⚙️ Configuración]  [📊 Consumo]
```

### Tab 1: Mi Agente (overview)
```
┌──────────────────────────────────────────────────────┐
│                                                      │
│   🤖  Sofia AI                          [Editar]     │
│   Agente Comercial · Modo: OPERATOR                  │
│                                                      │
│   Resonance Score                                    │
│   ████████████░░░░░░  73 / 100                       │
│   "Sofia AI te conoce mejor cada día que trabajáis  │
│    juntos. A este ritmo, alcanzará modo EXECUTOR     │
│    en aproximadamente 12 días."                      │
│                                                      │
├──────────────────────────────────────────────────────┤
│  📄 Documentos disponibles (3)           [+ Añadir]  │
│  ─────────────────────────────────────────────────   │
│  🟢 Catálogo Productos 2026.pdf                      │
│  🟢 Plantilla Cotización Estándar.docx               │
│  🟡 Manual Precios Mayoristas.xlsx  ← ¿Activar?      │
│                                                      │
├──────────────────────────────────────────────────────┤
│  ⏳ Aprobaciones pendientes (2)                      │
│  ─────────────────────────────────────────────────   │
│  → Enviar cotización a ABC Corp     [Ver] [✅] [❌]  │
│  → Crear resumen de reunión del Lunes [Ver] [✅] [❌] │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Estados del Resonance Score:**
- 0–30: "Tu agente está aprendiendo. La IA en modo OBSERVER."
- 31–60: "Buen progreso. Puede hacer propuestas. Modo OPERATOR."
- 61–90: "Alta confianza. Puede actuar en tareas rutinarias. EXECUTOR."
- 91–100: "Sintonía total. Tu gemelo digital está calibrado. 🏆"

**Añadir documento:**
- Drag & drop área o "Seleccionar archivo"
- Formatos aceptados: PDF, DOCX, XLSX, TXT, MD
- Máx. 50MB por archivo
- AL subir: barra de progreso → "Indexando para que tu agente pueda leerlo..." → "✅ Listo"

### Tab 2: Memorias `/my-agent/memory`

```
┌──────────────────────────────────────────────────────┐
│  🧠 Memorias del Agente                  [+ Nueva]   │
│                                                      │
│  [🧠 Profesional] [📚 Estudios] [👥 Clientes]         │
│  [📅 Agenda] [🛒 Proveedores] [📊 Proyectos] [💡 Ideas]│
│         ↑ tabs de categoría                          │
├──────────────────────────────────────────────────────┤
│  Categoría: Clientes  (4 entradas activas)           │
│  ─────────────────────────────────────────────────   │
│                                                      │
│  🟢 Juan Pérez — Empresa ABC Corp                    │
│  Email: juan@abc.com · Cel: +56 9 1234 5678          │
│  Última interacción: 3 días                          │
│  [Ver] [Editar] [••• Más opciones]                   │
│                                                      │
│  🟢 María López — Distribuidora Sur                  │
│  Email: mlopez@sur.cl                                │
│  [Ver] [Editar] [••• Más opciones]                   │
│                                                      │
│  🔴 Roberto Neira — OLD Corp  ← desactivada          │
│  "Desactivada el 15 Feb"                             │
│  [Reactivar] [Eliminar]                              │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Estados de una entrada de memoria:**
- 🟢 Activa: el agente la lee cuando es relevante
- 🟡 Inactiva: guardada pero el agente la ignora
- 🔴 Expirada: tenía fecha de expiración y ya pasó

**"Más opciones" de una entrada:**
```
○ Desactivar del contexto (agente la ignora)
○ Mover a otra categoría
○ Ver cuándo fue usada por el agente
○ Eliminar permanentemente
```

**Estado vacío de una categoría:**
```
[Icono de carpeta abierta vacía]
"No tienes memorias en esta categoría."
"Puedes añadir una manualmente o pedirle a tu agente que guarde algo importante."
[+ Añadir memoria]
```

### Tab 3: Configuración (HITL Level)

```
┌──────────────────────────────────────────────────────┐
│  ⚙️ ¿Cuánto control quieres?                         │
│                                                      │
│  ● MANUAL TOTAL                                      │
│    El agente te muestra cada subtarea antes de       │
│    ejecutarla. Tú tienes la última palabra siempre.  │
│                                                      │
│  ○ SOLO APROBAR EL PLAN ← Recomendado                │
│    Ves el plan antes de que empiece. Luego trabaja   │
│    solo hasta darte el resultado final.              │
│                                                      │
│  ○ SOLO VER EL RESULTADO                             │
│    El agente trabaja en background. Solo te avisa    │
│    cuando termina para que revises.                  │
│                                                      │
│  ○ AUTÓNOMO ⚠️                                       │
│    El agente trabaja y ejecuta sin consultarte.      │
│    Solo para tareas que ya aprobaste antes.          │
│                                                      │
│  ─────────────────────────────────                   │
│  Siempre preguntarme antes de:                       │
│  ☑ Enviar emails a personas externas                │
│  ☑ Modificar o borrar archivos                      │
│  ☑ Contactar clientes en mi nombre                  │
│  ☐ Crear tareas nuevas en mis proyectos             │
│  ☐ Generar documentos internos                      │
│                                                      │
│  [Guardar cambios]                                   │
└──────────────────────────────────────────────────────┘
```

> Si el usuario activa "AUTÓNOMO", aparece un modal de confirmación:
> "¿Estás seguro? El agente tomará decisiones rutinarias sin preguntarte. Puedes revertir esto en cualquier momento." [Entendido, activar] [Cancelar]

### Tab 4: Consumo

```
┌──────────────────────────────────────────────────────┐
│  📊 Uso esta semana (Lun 17 — Dom 23 Feb)            │
│                                                      │
│  ██████████░░░░░░░░░░  2.480 / 10.000 tokens         │
│  💰 Costo estimado: ~$0.08 USD                       │
│  Resetea el Lunes                                    │
│                                                      │
│  Desglose por modelo:                                │
│  Gemini Flash  ·  2.100 tokens  ·  $0.06             │
│  GPT-4o-mini   ·    380 tokens  ·  $0.02             │
│                                                      │
│  Últimas acciones (tokens usados):                   │
│  Cotización ABC Corp       · 420 tokens · Hoy 10:32  │
│  Resumen reunión Marketing · 280 tokens · Ayer 17:05 │
│  Investigación uso IA Chile· 890 tokens · Lun 09:20  │
│                                                      │
│  Plan actual: Free (10.000 tokens/sem)               │
│  [🚀 Aumentar mi límite]                             │
└──────────────────────────────────────────────────────┘
```

---

## 📐 PANTALLA 5: CONSTRUCTOR DE PLANTILLAS `/templates/builder`

### Concepto
Una plantilla es un documento con campos variables (`{{campo}}`) que el agente rellenará automáticamente cada vez que se use. Se crea UNA VEZ y se usa infinitas veces.

### Paso 1: Elegir tipo
```
┌──────────────────────────────────────────────────────┐
│  📄 Nueva Plantilla                                  │
│  "¿Qué tipo de documento quieres crear?"             │
│                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│  │ 💼        │ │ 📋        │ │ 📊        │             │
│  │ Cotización│ │ Propuesta │ │ Reporte   │             │
│  └──────────┘ └──────────┘ └──────────┘             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│  │ 📅        │ │ 📧        │ │ ✏️        │             │
│  │ Acta de   │ │ Email     │ │ Personaliz│             │
│  │ reunión   │ │ tipo      │ │ ado       │             │
│  └──────────┘ └──────────┘ └──────────┘             │
└──────────────────────────────────────────────────────┘
```

### Paso 2: Editor con variables dinámicas

Dos modos:
- **Modo "Mostrarme cómo"**: la IA genera una plantilla de ejemplo según el tipo elegido. El usuario la edita.
- **Modo "Desde cero"**: editor de texto en blanco.

```
┌──────────────────────────────────────────────────────┐
│  Editando: Cotización                  [+ Variable]  │
│  ─────────────────────────────────────────────────   │
│                                                      │
│  Estimado/a {{cliente_nombre}},                      │
│                                                      │
│  Es un placer presentarle nuestra propuesta          │
### Paso 2: Editor con variables dinámicas (cont.)
│  comercial para {{empresa_cliente}}.                 │
│                                                      │
│  Producto: {{producto_nombre}}                       │
│  Cantidad: {{cantidad}}                              │
│  Precio unitario: ${{precio_unitario}}               │
│  Total: ${{precio_total}}                            │
│                                                      │
│  Válida hasta: {{fecha_vencimiento}}                 │
│                                                      │
│  Atentamente,                                        │
│  {{nombre_emisor}}                                   │
│  {{cargo_emisor}}                                    │
│                                                      │
└──────────────────────────────────────────────────────┘
│  Variables detectadas (8):                           │
│  [cliente_nombre] [empresa_cliente] [producto_nombre]│
│  [cantidad] [precio_unitario] [precio_total]         │
│  [fecha_vencimiento] [nombre_emisor] + 1 más         │
└──────────────────────────────────────────────────────┘
```

**Cómo insertar variables:**
- Escribir `{{` en el editor → aparece autocomplete con variables ya creadas.
- Botón `[+ Variable]` → modal para crear nueva variable con nombre y tipo (texto, número, fecha, moneda).

### Paso 3: Guardar
```
Nombre: [Cotización Estándar v1     ]
Categoría: [Ventas ▾]
Formato de salida: ○ Word  ○ PDF  ● Ambos

[Vista previa]     [Guardar plantilla]
```

**Confirmación:**
```
✅ "Plantilla 'Cotización Estándar v1' guardada."
"Ahora puedes pedirle a Sofia AI: 'Hazme una cotización para Juan Pérez'"
[Ver mis plantillas] [Hacer una cotización ahora]
```

---

## 📐 PANTALLA 6: HISTORIAL DE ACCIONES `/activity`

### Layout
```
┌──────────────────────────────────────────────────────┐
│  ⚡ Actividad del Agente                             │
│                                                      │
│  [Todo ▾]  [Hoy]  [Esta semana]  [Solo IA]           │
│  ─────────────────────────────────────────────────   │
│                                                      │
│  HOY                                                 │
│  ─────                                               │
│  ✅ Cotización generada — Empresa ABC Corp           │
│     10:45 · PDF · 850 tokens · $0.03                 │
│     [Ver PDF] [Reenviar al agente para editar]       │
│                                                      │
│  🕐 Informe semanal — EN ESPERA TU APROBACIÓN        │
│     09:30 · Word                                     │
│     [Ver borrador] [✅ Aprobar] [❌ Rechazar]         │
│                                                      │
│  AYER                                                │
│  ─────                                               │
│  ✅ Resumen de reunión creado                        │
│     17:20 · 3 próximos pasos identificados           │
│     [Ver] [Guardar en memoria]                       │
│                                                      │
│  ❌ Envío de email cancelado por el usuario          │
│     15:10 · Motivo: "Contenido incorrecto"           │
│     [Ver qué propuso] [El agente aprendió de esto ✓] │
└──────────────────────────────────────────────────────┘
```

**Nota de UX importante:** cuando el usuario cancela una acción del agente, aparece un pequeño texto: *"El agente aprendió de esto ✓"* — esto genera confianza al mostrar que la IA mejora con el feedback.

---

## 📐 PANTALLA 7: CONFIGURACIÓN `/settings`

### Layout (sin cambios al approach actual, con adiciones)

```
┌──────────────────────────────────────────────────────┐
│  ⚙️ Configuración                                    │
│                                                      │
│  PERFIL                                              │
│  ─────────                                           │
│  Nombre: Sofía Martínez        [Editar]              │
│  Email: sofia@empresa.cl                             │
│  Plan: Free · 10.000 tokens/sem [🚀 Mejorar plan]    │
│                                                      │
│  PERSPECTIVA DE TRABAJO                              │
│  ──────────────────────                              │
│  ● Focus Mode (actual)                               │
│    Vista limpia, solo mis tareas y mi agente         │
│  ○ Director Mode                                     │
│    Vista completa con métricas y proyectos           │
│                                                      │
│  MI AGENTE                                           │
│  ──────────                                          │
│  [→ Ir a configuración del agente]                   │
│                                                      │
│  INTEGRACIONES                                       │
│  ─────────────                                       │
│  Google Drive: [No conectado] [Conectar]             │
│  Email (Gmail): [No conectado] [Conectar]            │
│  WhatsApp Business: [No conectado] [Conectar]        │
│                                                      │
│  MI API KEY (BYOK)                                   │
│  ─────────────────                                   │
│  Usa tu propia clave de IA para mayor control        │
│  [+ Añadir API key]                                  │
│                                                      │
│  SEGURIDAD                                           │
│  ─────────                                           │
│  Cambiar contraseña · Sesiones activas               │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 📐 PANTALLA 8: ONBOARDING DE INTEGRACIÓN (Modal, no página nueva)

### Cuándo aparece
Al tocar "Conectar" en Google Drive, Gmail o WhatsApp.

```
┌──────────────────────────────────────────────────────┐
│  Conectar Google Drive                        [✕]    │
│  ─────────────────────────────────────────────────   │
│                                                      │
│  Al conectar Drive, tu agente podrá:                 │
│  ✅ Leer tus documentos para responder preguntas     │
│  ✅ Guardar cotizaciones y reportes directamente     │
│  ✅ Acceder a plantillas compartidas de tu equipo    │
│                                                      │
│  🔒 Seguridad: Solo accederemos a las carpetas       │
│  que tú elijas. Tus datos son tuyos.                 │
│                                                      │
│  [Conectar con Google Drive]  ← abre OAuth flow      │
│  [Cancelar]                                          │
└──────────────────────────────────────────────────────┘
```

Post-conexión:
```
✅ Google Drive conectado
"¿Qué carpetas puede leer tu agente?"

☐ 📁 /Cotizaciones          ← checkbox
☑ 📁 /Catálogos y precios   ← checkbox activo
☑ 📁 /Plantillas de trabajo ← checkbox activo
☐ 📁 /Proyectos 2026

[Guardar acceso]    (el agente indexa las carpetas seleccionadas)
```

---

## 🧩 Resumen de Componentes Nuevos

| Componente | Prioridad | Pantalla |
|:---|:---|:---|
| `SetupWizard` | 🔴 Alta | `/setup` — 5 pasos + confetti |
| `AgentStatusBanner` | 🔴 Alta | Dashboard — banner del agente activo |
| `ApprovalCard` | 🔴 Alta | Dashboard + Shadow Chat |
| `AgentStatusBar` | 🔴 Alta | Header del Shadow Chat |
| `ConfidenceBadge` | 🟡 Media | Shadow Chat — badge en respuestas |
| `SourceCitation` | 🟡 Media | Shadow Chat — link a fuente |
| `SubtaskPlanCard` | 🔴 Alta | Shadow Chat — aprobación de plan |
| `AgentPanel` | 🔴 Alta | `/my-agent` — 4 tabs |
| `MemoryPanel` | 🔴 Alta | `/my-agent/memory` |
| `AutoModeSelector` | 🔴 Alta | `/my-agent` — config HITL |
| `TokenUsageBar` | 🟡 Media | `/my-agent` — tab consumo |
| `TemplateBuilder` | 🔴 Alta | `/templates/builder` |
| `ActivityFeed` | 🟡 Media | `/activity` |
| `AgendaEventCard` | 🟡 Media | Dashboard + Chat |
| `IntegrationModal` | 🟡 Media | `/settings` |
| `ResonanceScore` | 🟢 Baja | `/my-agent` — gauge visual |

---

## 📐 PANTALLA 9: FLUJO ESPECIAL — ESTUDIANTES 🎓

### Perfil Personalizado: El Estudiante
Cuando el usuario selecciona "Soy estudiante 📚" en el login o onboarding, la interfaz activa el "Modo Academia":
- Los **Proyectos** pasan a llamarse **Ramos**.
- El **Activity Feed** prioriza fechas de exámenes.
- El **Agente** asume el rol de "Tutor / Organizador".

### Onboarding Especial: "The Student Architect"
Este flujo sustituye al `/setup` estándar:

**Paso 1: Captura de Horario (Vision AI)**
*   **Prompt**: "Sube una foto de tu horario académico 📸"
*   **UI**: Área de drag & drop para imágenes.
*   **Lógica**: El agente procesa la imagen, detecta días, horas y nombres de ramos.
*   **Resultado**: Genera automáticamente el calendario semestral interactivo.

**Paso 2: Malla Curricular + n8n Automation**
*   **Prompt**: "Comparte tu malla curricular para organizar tus carpetas 📄"
*   **UI**: Upload de PDF/Imagen.
*   **Lógica**: El agente identifica Año, Semestre y Ramos activos.
*   **Acción n8n**: Se dispara una automatización que crea en Google Drive:
    `[Carrera] > [Año] > [Semestre] > [Ramo]`
*   **Sincronización**: La carpeta de cada ramo se vincula al "Espacio de Trabajo" del estudiante.

### Vista de Espacio de Trabajo Académico
La estructura visual se adapta a la jerarquía v3:
1.  **Persona**: Perfil con avatar personalizado "Cerebrin Estudiantil".
2.  **Workspace**: "Semestre 2026-1 / Ingeniería".
3.  **Unidades (Ramos)**: Tarjetas visuales de cada materia (Cálculo, Física, etc.).
4.  **Acciones (Tareas)**: Timeline de certámenes y entregas próximas.
5.  **Conocimiento (Documentos)**: Repositorio de apuntes y guías vinculados a Drive.

---

## 🔌 APIs del Backend a Consumir (v3 Extended)

```typescript
// AUTH
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me

// ONBOARDING & STUDENT SPECIAL
POST  /api/setup/start
PATCH /api/setup/session/:id
POST  /api/setup/session/:id/confirm
POST  /api/setup/student/process-schedule  // Analiza imagen de horario
POST  /api/setup/student/setup-drive       // Dispara automatización n8n

// AGENT CHAT (núcleo del producto)
POST  /api/agent/chat          // body: { message, workspace_id, agent_id }
GET   /api/agent/chat/:sessionId/stream  // SSE para respuesta en tiempo real

// APPROVALS (HITL)
GET   /api/agent/approvals     // lista aprobaciones pendientes
POST  /api/agent/approvals/:id/approve
POST  /api/agent/approvals/:id/reject

// AGENT CONFIG
GET   /api/workspaces/:id/agents/:agentId
PATCH /api/workspaces/:id/agents/:agentId
PATCH /api/workspaces/:id/agents/:agentId/hitl-config

// AGENT MEMORY
GET    /api/agent/memory
GET    /api/agent/memory?category=clientes
POST   /api/agent/memory
PATCH  /api/agent/memory/:id   // activar/desactivar
DELETE /api/agent/memory/:id

// DOCUMENTOS + RAG
GET    /api/workspaces/:id/documents
POST   /api/workspaces/:id/documents  // upload + auto-index
DELETE /api/documents/:id

// PLANTILLAS
GET  /api/workspaces/:id/templates
POST /api/workspaces/:id/templates
POST /api/templates/:id/use    // instanciar con variables

// TAREAS
GET   /api/workspaces/:id/tasks?assignee=me&period=today
POST  /api/workspaces/:id/tasks
PATCH /api/tasks/:id
DELETE /api/tasks/:id

// CONSUMO
GET  /api/workspaces/:id/usage
GET  /api/workspaces/:id/usage/history

// ACTIVIDAD
GET  /api/workspaces/:id/activity  // historial de acciones del agente

// INTEGRACIONES
POST /api/integrations/google-drive/connect
POST /api/integrations/google-drive/select-folders
GET  /api/integrations/status
```

---

## 🎨 Sistema de Diseño

### Paleta (Dark Mode por defecto en Focus Mode)
```
Background:     #0a0a0f  (casi negro)
Surface:        #13131a  (cards, panels)
Border:         #1e1e2e
Text Primary:   #e8e8f0
Text Secondary: #6b6b80
Accent:         #6366f1  (indigo — acciones primarias)
Success:        #10b981  (emerald — aprobaciones, online)
Warning:        #f59e0b  (amber — pendiente de revisión)
Error:          #ef4444  (rojo — rechazo, error)
```

### Tipografía
```
Font: Inter (Google Fonts)
Hero:     32px / 700 (weight)
Título:   20px / 700
Subtít:   14px / 600 uppercase tracking-wider
Body:     14px / 400
Caption:  12px / 400 (timestamps, metadata)
```

### Animaciones
```
Entrada de cards:    fade-in + translateY(8px→0)  · 200ms ease-out
Salida de cards:     fade-out + scale(0.97)        · 150ms ease-in
ApprovalCard:        slide-down desde arriba       · 300ms spring
Confetti setup:      particles.js or CSS keyframes · 2s
Loading dots:        bounce delay 0/0.2/0.4s       · infinite
Toggle switch:       background transition          · 200ms
```

### Mobile (320–768px)
- **Bottom Navigation** de 5 items: Inicio, Tareas, ⚡Chat (prominente), Docs, Config
- **Shadow Chat** → bottom sheet con handle visible, drag para cerrar
- **FAB** (Floating Action Button) 🤖 en esquina inferior-derecha, 56px, sombra verde
- **Cards** → pantalla completa (sin gutters laterales en mobile)
- **Fonts** → +2px en todos los tamaños para legibilidad

---

## ⛔ No implementar en el MVP

- Integraciones con Slack, Teams, WhatsApp (llega en Phase 9)
- Marketplace de agentes público
- Analytics de agentes con gráficas avanzadas
- Modo Director con KPIs y Cockpit (Phase 10)
- Cualquier feature que requiera más de 3 clics
- Cualquier modal con más de 3 campos de formulario

---

## ✅ Criterios de éxito del MVP

El MVP está listo para testear cuando:
1. Un usuario nuevo puede completar el onboarding en < 5 minutos
2. El agente puede tomar una petición en texto y devolver un documento PDF
3. El usuario puede aprobar o rechazar una acción del agente
4. El usuario puede ver cuántos tokens usó esta semana
5. Las plantillas funcionan: crear una → el agente la usa en el chat

---
*Versión: 3.3 | Historia de referencia: "El Semestre de Sofía" | Prioridad: MVP + Módulo Académico*
