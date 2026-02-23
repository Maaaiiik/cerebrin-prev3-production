# 🚀 Guía de Despliegue: Cerebrin PRE-V3 (Docker Grid)

Esta guía detalla los pasos para desplegar la infraestructura de 4 contenedores interconectados en tu VPS.

## 📦 Arquitectura del Sistema
El despliegue levantará 4 servicios en una red privada aislada (`cerebrin-grid`):
1.  **Front-v3 (Puerto 3000)**: Interfaz de usuario y Chat (Next.js).
2.  **Backend (Puerto 3001)**: API Core y procesamiento de Lógica (Next.js).
3.  **Nexo (Puerto 3002)**: Panel de Administración Superior (Next.js).
4.  **n8n (Puerto 5678)**: Orquestador de flujos y automatizaciones.

---

## 🛠️ Paso 1: Preparación del VPS

1.  **Conéctate a tu VPS**:
    ```bash
    ssh usuario@tu-ip-vps
    ```

2.  **Instala Docker y Docker Compose** (si no están instalados):
    ```bash
    # Para Ubuntu/Debian
    sudo apt update && sudo apt install -y docker.io docker-compose
    sudo systemctl start docker
    sudo systemctl enable docker
    ```

---

## 📥 Paso 2: Clonar el Repositorio de Despliegue

Utiliza el repositorio específico de despliegue que acabamos de crear:

```bash
git clone https://github.com/Maaaiiik/cerebrin-prev-v3.git
cd cerebrin-prev-v3
```

---

## 🔐 Paso 3: Configuración de Variables de Entorno

Debes crear un archivo `.env` en la raíz de la carpeta `cerebrin-prev-v3`. Este archivo **no se sube a GitHub** por seguridad.

```bash
nano .env
```

**Copia y pega el siguiente contenido, reemplazando con tus valores reales:**

```env
# 🔵 Supabase Config
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-de-supabase

# 🤖 IA Config
GEMINI_API_KEY=tu-api-key-de-google-gemini
GEMINI_ENABLED=true

# 🛡️ Security
ADMIN_SECRET=una-clave-muy-segura-para-nexo
AGENT_SECRET=clave-secreta-para-comunicacion-backend

# ⚙️ n8n Config
N8N_PASSWORD=tu-password-para-n8n
```

---

## 🚀 Paso 4: Lanzamiento de la Infraestructura

Una vez configurado el `.env`, ejecuta el comando maestro:

```bash
# Construir e iniciar en segundo plano
sudo docker-compose up -d --build
```

---

## ⚙️ Paso 5: Configuración de n8n (Importante)

1.  Accede a `http://tu-ip-vps:5678`.
2.  Inicia sesión (User: `admin`, Pass: El que pusiste en `N8N_PASSWORD`).
3.  **Importar Workflows**: 
    - Ve a "Workflows" -> "Import from File".
    - Sube los archivos que están en la carpeta `/infra-n8n` del repositorio.
    - El archivo más importante es `master_orchestrator_PRE_V3.json`.

---

## 🔍 Paso 6: Verificación de Puertos

Asegúrate de que los siguientes puertos estén abiertos en el Firewall de tu VPS:
- `3000`: Front UI (Público)
- `3001`: Backend API (Interno/Opcional)
- `3002`: Nexo Admin (Restringido)
- `5678`: n8n Dashboard (Restringido)

---

## 🛠️ Comandos de Mantenimiento Útiles

- **Ver logs en tiempo real**: `sudo docker-compose logs -f`
- **Detener todo**: `sudo docker-compose down`
- **Actualizar cambios**: 
  ```bash
  git pull origin master
  sudo docker-compose up -d --build
  ```

---
**Guía generada por Antigravity para la implementación PRE-V3.**
