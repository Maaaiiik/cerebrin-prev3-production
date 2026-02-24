# 🎨 IDENTITY & AVATARS: Visual Language (v3.3 MASTER)

Este documento define las reglas visuales y de identidad de los agentes en Cerebrin v3.

---

## 🏛️ JERARQUÍA DE AGENTES (Tiers)

Para que el usuario comprenda el "rango" y poder de cada agente, implementamos tres niveles de jerarquía visual:

| Rango | Icono | Color | Descripción | Propósito |
| :--- | :--- | :--- | :--- | :--- |
| **👑 CAPTAIN** | Corona | Dorado (#F59E0B) | Líder de Swarm | Orquestación completa de múltiples agentes. |
| **🎯 DT** | Blanco | Violeta (#8B5CF6) | Director Técnico | Especialista Senior con autonomía avanzada. |
| **⚙️ SPECIALIST**| Engranaje | Azul (#3B82F6) | Ejecutor | Tareas granulares y específicas. |

---

## 🔷 SISTEMA DE AVATARES (Hexagonal Design)

Cerebrin v3 utiliza formas geométricas para diferenciar entidades:
*   **Hexágonos:** Reservado exclusivamente para **Agentes de IA**. Representa la estructura de colmena y tecnología.
*   **Círculos:** Reservado para **Humanos** (Miembros del Workspace).

### Componentes UI:
1.  **`AgentAvatar`**: Soporta 5 tamaños (`xs` a `xl`). Usa `clip-path` hexagonal.
2.  **`AgentHierarchyBadge`**: Muestra el rango (Captain/DT/Specialist) junto al nombre del agente.
3.  **`Resonance Ring`**: Un borde con gradiente que brilla más fuerte según el `Resonance Score` del agente.

---

## 🎨 PERSONALIZACIÓN (Persona Mapping)

El avatar no es solo estético; refleja la **Persona** (Nivel 1):
*   **Estudiantes:** Colores pasteles, emojis académicos (📚, 🧬).
*   **Vendedores:** Colores corporativos, tonos serios, iconos de metas (📈, 🤝).
*   **Freelancers:** Estilo minimalista, iconos de creatividad (🎨, ✍️).

---

## 📂 ALMACENAMIENTO (Supabase Storage)
Los avatares personalizados se guardan en:
*   **Bucket:** `agent-avatars`
*   **Formatos:** PNG, JPG, WEBP (recomendado).
*   **Resolución:** 256x256px (procesado por backend).

---
*Versión: 3.3 | Última actualización: 22 Feb 2026 | Sincronizado con FRONTEND MASTER v3.3*
