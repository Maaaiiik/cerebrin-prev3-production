# ✅ QA & VERIFICATION: System Quality (v3.3 MASTER)

Este documento define los estándares de calidad que debe cumplir cualquier implementación de la v3 para ser considerada "Production Ready".

---

## 📱 ESTÁNDAR MOBILE & RESPONSIVE

Toda nueva pantalla o widget debe pasar el checklist **"Sofía en Movimiento"**:
1.  **Breakpoints:** Debe funcionar perfectamente en 320px (Mobile), 768px (Tablet) y 1024px+ (Desktop).
2.  **Touch Targets:** Botones y elementos interactivos deben tener un área mínima de **44x44px**.
3.  **Gestures:**
    *   `Swipe-down`: Para cerrar hojas de tareas (UniversalTaskSheet).
    *   `Pull-to-refresh`: Obligatorio en listas de tareas y actividades.
4.  **Tipografía:** 14px en mobile → 16px en desktop.

---

## 🛠️ FEATURE FLAGS (Rollout Gradual)

No activamos funciones a ciegas. Usamos el sistema de **Feature Flags** para controlar el acceso:
*   **Scopes:** `page`, `section`, `widget`, `button`, `action`.
*   **Tiers:** `free`, `starter`, `pro`, `enterprise`.
*   **Panel Administrativo:** Accesible en `/settings` para activar/desactivar funciones en tiempo real sin desplegar código.

---

## 🧪 PROTOCOLO DE PRUEBAS (QA)

### 1. Test de Resonancia
Validar que las acciones del usuario incrementen el `Resonance Score` correctamente y que el modo del agente cambie de `OBSERVER` a `OPERATOR` al cruzar el umbral.

### 2. Test de Integridad RAG
Validar que el **Investigador** solo tenga acceso a los documentos del `workspace_id` activo, respetando el aislamiento de datos (RLS).

### 3. Test de Entrega (HITL)
Validar que n8n genere el PDF correctamente y que el sistema no envíe nada a clientes externos sin el estado `approved` en la cola de aprobación.

---

## 📊 MÉTRICAS DE SALUD (Mantenimiento)
*   **Token Bloat:** Monitoreo semanal del uso de tokens para evitar loops infinitos de agentes.
*   **Storage Health:** Verificación de subida de archivos externos y limpieza de temporales de n8n.

---
*Versión: 3.3 | Última actualización: 22 Feb 2026 | Estado: Protocolo de Calidad v3*
