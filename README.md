# AIFM
agente administrativo y financiero para manejo de airbnbs

# Agente Administrativo Financiero de Inmuebles (AIFM)

AIFM es una solución integral de software diseñada para la gestión inteligente de propiedades de alquiler a corto plazo (tipo Airbnb). El objetivo principal del proyecto es automatizar y optimizar todas las tareas administrativas y financieras asociadas con el manejo de múltiples propiedades, permitiendo a los propietarios operar su negocio de manera más eficiente y rentable.

## Características Principales

### 📋 Gestión de Reservas Inteligente
- **Monitoreo 24/7**: Sistema de alerta que notifica inmediatamente ante nuevas reservas, cancelaciones o modificaciones.
- **Automatización de Confirmaciones**: Envío automático de correos electrónicos de bienvenida y confirmación a los huéspedes.
- **Sincronización Multi-Plataforma**: Integración con las principales plataformas de alquiler (Airbnb, Booking.com, Vrbo, etc.) para evitar overbooking.

### 💰 Conciliación Financiera Automatizada
- **Agregación de Ingresos**: Recopila automáticamente los pagos y comisiones de todas las plataformas en un solo lugar.
- **Informes de Rentabilidad**: Genera reportes detallados sobre ingresos brutos vs netos, ocupación y rendimiento por propiedad.
- **Análisis de Gastos**: Registro y seguimiento de gastos operativos (limpieza, mantenimiento, servicios públicos) para calcular la rentabilidad real.

### 🤖 Asistente Virtual de Huéspedes
- **Respuestas Instantáneas**: Chatbot integrado para responder preguntas frecuentes de los huéspedes (check-in, Wi-Fi, instrucciones de llegada).
- **Gestión de Check-in/Check-out**: Facilita el proceso automatizando la entrega de códigos de acceso y solicitudes de limpieza.
- **Solicitudes Proactivas**: Envío de recordatorios antes de la llegada y encuestas de satisfacción post-estancia.

## 🚀 Tecnologías Utilizadas

El proyecto se desarrolla utilizando un stack tecnológico moderno y escalable:

- **Frontend**: **React** y **TypeScript** para una interfaz de usuario dinámica, segura y tipada.
- **Backend**: **Node.js** y **Express** para un servidor rápido y eficiente.
- **Base de Datos**: **PostgreSQL** para el almacenamiento estructurado de datos de propiedades y transacciones.
- **Orquestación**: **Apache Airflow** para la automatización de flujos de trabajo complejos (conciliación, scraping, reportes).
- **Infraestructura**: Despliegue mediante **Docker** y **Kubernetes** para escalabilidad y gestión simplificada.

## 🛠️ Instalación y Ejecución

### Prerrequisitos
- Docker y Docker Compose instalados.
- Node.js (v16 o superior) y npm/yarn.

### Pasos de Despliegue

1. **Clonar el repositorio**:
   ```bash
   git clone <url-del-repositorio>
   cd AIFM
   ```

2. **Configurar Variables de Entorno**:
   Crea un archivo `.env` en el directorio raíz basado en el archivo `.env.example`:
   ```bash
   cp .env.example .env
   # Editar variables según tu configuración local (claves de API, DB, etc.)
   ```

3. **Levantar la Infraestructura**:
   Utiliza Docker Compose para iniciar todos los servicios necesarios (Base de Datos, Airflow, Backend, Frontend):
   ```bash
   docker-compose up -d --build
   ```

4. **Instalar Dependencias del Frontend**:
   ```bash
   cd frontend
   npm install
   ```

5. **Ejecutar la Aplicación**:
   - **Servidor de Desarrollo (React)**: `npm start`
   - **Acceso al Backend**: `http://localhost:3000` (configurable en docker-compose)
   - **Acceso a Airflow UI**: `http://localhost:8080` (si está expuesto)

## 🗺️ Roadmap

El desarrollo de AIFM está planificado en fases para garantizar una implementación modular y controlada:

- **Fase 1: MVP**
  - [ ] Dashboard de Resumen General.
  - [ ] Integración básica con 2 plataformas principales.
  - [ ] Módulo de Conciliación Manual.
- **Fase 2: Automatización**
  - [ ] Agente de Chatbot para huéspedes.
  - [ ] Flujos de Airflow para conciliación automática.
  - [ ] Informes de Rentabilidad Personalizados.
- **Fase 3: Escalabilidad**
  - [ ] Integración con APIs de Cutz, Stripe y PayPal.
  - [ ] Optimización de precios basada en IA.
  - [ ] App Móvil (React Native).
