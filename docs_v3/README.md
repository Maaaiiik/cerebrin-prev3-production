# 🗄️ CEREBRIN V3: Single Source of Truth

Este directorio contiene la documentación **MAESTRA** de la arquitectura v3 de Cerebrin. Estos documentos reemplazan a cualquier brief, handoff o especificación anterior.

## 📄 Pilares de la Arquitectura

1.  **[Frontend Master V3](./01_FRONTEND_MASTER_V3.md)**: UI Shared, Layouts, Design System y Flujos Generales.
    *   **[Perfiles: Individual (V3 Focus)](./01a_PROFILE_INDIVIDUAL_V3.md)**: UX para Freelancers y Profesionales.
    *   **[Perfiles: Académico](./01b_PROFILE_ACADEMIC_V3.md)**: UX para Estudiantes y Lógica de Notas.
    *   **[Perfiles: Organización](./01c_PROFILE_ORGANIZATION_V3.md)**: UX para Líderes, Managers y Swarms.
    *   **[Flujos Universales: Life Log](./01d_GENERAL_FLOWS_V3.md)**: Registro de gastos, salud y notas vía Audio -> Sheets.
2.  **[Database Master V3](./02_DATABASE_MASTER_V3.md)**: Esquema PostgreSQL, RLS y AI Twin Engine.
3.  **[Backend Master V3](./03_BACKEND_MASTER_V3.md)**: Orquestación, APIs y Sistema de Memoria Semántica.
4.  **[Pipeline Execution Master](./05_PIPELINE_EXECUTION_V3.md)**: El motor multi-rol (Investigador, Escritor, Revisor).
5.  **[Identity & Avatars Master](./06_IDENTITY_AVATARS_V3.md)**: Sistema visual de agentes y jerarquías.
6.  **[Skill & Automation Catalog](./07_SKILL_AUTOMATION_CATALOG.md)**: Catálogo de habilidades y workflows n8n.
7.  **[QA & Verification Master](./08_TESTING_VERIFICATION_V3.md)**: Estándares Mobile y Feature Flags.
8.  **[Flow Factory Master](./09_FLOW_FACTORY_V3.md)**: Motor de orquestación dinámica y creación de flujos vía IA.
9.  **[Proactive Resonance Master](./10_PROACTIVE_RESONANCE_V3.md)**: Inteligencia proactiva y el principio de "Preguntar antes de Analizar".
10. **[Audit & Correction Master](./11_AUDIT_CORRECTION_V3.md)**: Sistema de control humano (HITL) y corrección de errores.
11. **[Integration & Testing Guide](./12_INTEGRATION_TESTING_GUIDE.md)**: Checklist para conectar Front con Back y protocolos de prueba.
12. **[Minimal Experience MVP](./13_MINIMAL_EXPERIENCE_MVP.md)**: El camino mínimo para operar (Chat, Sheets, Memoria).

## 🏛️ La Jerarquía de 5 Niveles
Toda implementación debe respetar esta estructura base:
1. **Persona** (Identidad/Tono)
2. **Workspace** (Contenedor/Aislamiento)
3. **Units** (Proyectos/Ramos)
4. **Actions** (Tareas/Certámenes)
5. **Knowledge** (Documentos/Memoria)

---
**IMPORTANTE:** Si encuentras una discrepancia entre el código y estos documentos, el documento tiene la razón hasta que se decida un cambio oficial.
