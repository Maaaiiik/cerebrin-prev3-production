# 🧍 PROFILE: Individual Professional & Freelancer (v3.3 MASTER)

Este documento detalla la experiencia del **Freelancer y Profesional Solo** en Cerebrin v3, enfocada en eliminar el "trabajo administrativo invisible" y optimizar la entrega de valor a los clientes.

## 🏛️ OBJETIVO: "Zero Admin Freelancer"
El valor de Cerebrin para el profesional independiente es actuar como un **Secretario Ejecutivo Digital** que gestiona la burocracia, permitiendo al usuario dedicar el 100% de su energía a su especialidad.

---

## 🚀 QUICK-VALUE AUTOMATIONS (Ahorro de Tiempo Real)

### 1. Captura de Leads y Briefs Instantánea
Muchos freelancers pierden tiempo leyendo correos largos para entender qué quiere el cliente.
*   **Acción:** El usuario reenvía un correo de un cliente potencial al bot de Cerebrin.
*   **Proceso (n8n + IA):**
    1.  Extrae los 3 puntos clave del pedido.
    2.  Identifica el presupuesto mencionado (si existe).
    3.  Genera un **Borrador de Propuesta** basado en una plantilla predefinida del usuario.
*   **Valor:** Ahorro de 20-30 min de redacción y análisis inicial. El usuario solo revisa y envía.

### 2. Validación y Control de Gastos/Facturas
Eliminar el error humano en el seguimiento financiero del proyecto.
*   **Acción:** El usuario sube un PDF de una factura o boleta de un proveedor.
*   **Proceso:** La IA extrae los datos (Monto, Fecha, Proveedor) y los compara automáticamente con el presupuesto asignado al proyecto en Cerebrin.
*   **Valor:** Control financiero total sin necesidad de hojas de cálculo manuales. Certeza total en 5 segundos.

### 3. CRM Semántico (Memoria de Cliente)
*   **Acción:** El usuario pregunta por chat: *"¿Qué fue lo último que acordamos con el equipo de Acme Corp sobre los colores?"*
*   **Proceso:** El agente busca en la **Memoria Semántica (Nivel 5)** entre minutas de reuniones y chats pasados, entregando la respuesta exacta con la fuente original.
*   **Valor:** Se acabó el "scroll" infinito buscando un mensaje perdido. Recuperación de contexto inmediata.

---

## 📊 ESQUEMA DE DATOS (Foco Freelance)

Para que el sistema sea útil, el freelancer maneja estos metadatos en sus Proyectos (Units):
```json
{
  "client_name": "Nombre de la Empresa",
  "project_budget": 2500.00,
  "currency": "USD",
  "billing_cycle": "milestone_based",
  "next_milestone_date": "2026-05-15",
  "tags": ["diseño", "marketing", "activo"]
}
```

---

## 🎨 DASHBOARD ESPECÍFICO (Foco en Metas)

### Widgets de Valor Tangible:
1.  **Revenue Tracker:** Visualización simple de facturacón pendiente vs. ejecutada.
2.  **Hitos Críticos:** Calendario minimalista que solo muestra entregas que disparan pagos.
3.  **Investigación Express:** Botón para pedir fuentes o validación de datos externos sobre un tema específico sin salir de la app.

---

## 🔗 INTEGRACIONES CLAVE
*   **Correo/Email:** Captura de oportunidades.
*   **Document Builder:** Generación de PDFs profesionales (Cotizaciones/Facturas).
*   **Messaging (WSP/TG):** La oficina móvil del freelancer para subir archivos y consultar datos sobre la marcha.

---
*Versión: 3.3 | Perfil: Individual | Enfoque: Valor Práctico y Optimización de Ingresos*
