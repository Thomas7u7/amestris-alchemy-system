Sistema de Gestión Alquímica
Software Necesario:
🐳 Docker & Docker Compose

Versión mínima: Docker 20.10+, Docker Compose 2.0+

🌐 Navegador Web Moderno
Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

Verificar Instalaciones:

# Abrir terminal/CMD y ejecutar:
docker --version
docker-compose --version

Instalación y Ejecución
Paso 1: Clonar/Descargar el Proyecto

# Si tienes Git:
git clone <url-del-repositorio>
cd amestris-alchemy-system

# Si descargaste ZIP:
# Extraer y navegar al directorio

Paso 2: Ejecutar el Sistema

# Opción 1 - Ejecución normal (RECOMENDADO)
docker-compose up --build

# Opción 2 - Ejecución en segundo plano
docker-compose up -d --build

# Opción 3 - Reconstrucción completa (si hay problemas)
docker-compose down -v
docker system prune -f
docker-compose up --build

Paso 3: Verificar que los Servicios Estén Activos

# Ver estado de los contenedores
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f

# Ver logs específicos
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

Acceso a la Aplicación
Una vez ejecutado, accede a:

🌍 Frontend (Interfaz Principal): http://localhost:3000

🔧 Backend API: http://localhost:8080

🗄️ Base de Datos (pgAdmin): http://localhost:5050

Credenciales de Prueba
Usuarios del Sistema:

Usuario	Contraseña	Rol	Descripción

edward_elric	password123	Alquimista	Alquimista de Acero
alphonse_elric	password123	Alquimista	Alquimista Defensivo
roy_mustang	password123	Supervisor	Alquimista de Fuego
admin	password123	Admin	Administrador del Sistema

Configuración de Base de Datos (pgAdmin):
Acceder a pgAdmin: http://localhost:5050

Credenciales:

Email: admin@amestris.com
Password: admin

Configurar Servidor:
Nombre: Amestris DB
Host: postgres
Puerto: 5432
Base de datos: amestris_db
Usuario: alchemist
Password: equivalent_exchange

🎯 Funcionalidades Implementadas
👥 Gestión de Alquimistas
✅ Registro de nuevos alquimistas
✅ Asignación de especialidades y rangos
✅ Control de estado (Activo/Inactivo)
✅ Gestión de automails

📋 Sistema de Misiones
✅ Creación y asignación de misiones
✅ Seguimiento de estado (Pendiente/En Progreso/Completada)
✅ Sistema de prioridades (Alta/Media/Baja)
✅ Auditoría de actividades

🔬 Solicitudes de Experimentos
✅ Solicitudes de experimentos por alquimistas
✅ Aprobación/Rechazo por supervisores
✅ Niveles de riesgo (Bajo/Medio/Alto/Prohibido)
✅ Seguimiento de estado

⚡ Sistema de Transmutaciones
✅ Simulación de transmutaciones
✅ Cálculo de costos y energía requerida
✅ Verificación de Ley de Intercambio Equivalente
✅ Evaluación de riesgos
✅ Historial de transmutaciones

📦 Catálogo de Materiales
✅ Gestión de materiales alquímicos
✅ Clasificación por tipo y rareza
✅ Valores base y niveles de peligro
✅ Búsqueda y filtrado

📊 Dashboard y Auditoría
✅ Estadísticas del sistema
✅ Actividad reciente
✅ Logs de auditoría automáticos
✅ Verificaciones de seguridad

🛠️ Comandos de Mantenimiento

Gestión de Contenedores:

# Iniciar servicios específicos
docker-compose up backend frontend postgres

# Detener todos los servicios
docker-compose down

# Reiniciar servicios
docker-compose restart

# Ver uso de recursos
docker stats

Limpieza y Mantenimiento:

# Limpiar contenedores detenidos
docker container prune

# Limpiar imágenes no utilizadas
docker image prune

# Limpiar todo el sistema Docker
docker system prune -f

# Limpiar volúmenes (¡CUIDADO! Borra datos)
docker volume prune

Desarrollo y Debug:

# Acceder a contenedores
docker-compose exec backend sh
docker-compose exec postgres psql -U alchemist -d amestris_db

# Ver variables de entorno
docker-compose exec backend env

# Backup de base de datos
docker-compose exec postgres pg_dump -U alchemist amestris_db > backup.sql

Estructura de la Base de Datos
Tablas Principales:
alchemists - Registro de alquimistas estatales
missions - Sistema de misiones y asignaciones
experiment_requests - Solicitudes de experimentos
transmutation_logs - Historial de transmutaciones
materials - Catálogo de materiales alquímicos
audit_logs - Registro de auditoría
users - Sistema de autenticación

Solución de Problemas
Problemas Comunes y Soluciones:
"Port already in use"

bash
# Liberar puertos
netstat -ano | findstr :3000
taskkill /PID [PID] /F
Error de conexión a base de datos

bash
# Reiniciar base de datos
docker-compose restart postgres
# Esperar 10 segundos y reiniciar backend
docker-compose restart backend
Frontend no carga

bash
# Reconstruir frontend
docker-compose build frontend --no-cache
docker-compose up -d frontend
Credenciales no funcionan

bash
# Resetear base de datos completa
docker-compose down -v
docker-compose up --build

Verificación de Estado:
bash
# Salud de la API
curl http://localhost:8080/health

# Verificar usuarios
curl http://localhost:8080/debug-users

# Probar autenticación
curl -X POST http://localhost:8080/login \
  -H "Content-Type: application/json" \
  -d '{"username":"edward_elric","password":"password123"}'

Características Técnicas
Backend (Go):
Framework: Gin Gonic
ORM: GORM con PostgreSQL
Autenticación: JWT con bcrypt
CORS: Configurado para desarrollo
Logs: Structured logging
Frontend (React/Next.js):
Framework: Next.js 13+
Estado: React Hooks
HTTP Client: Axios con interceptors
Estilos: CSS-in-JS
Routing: Client-side navigation

Infraestructura:
Contenedores: Docker + Docker Compose
Base de datos: PostgreSQL 15
Proxy: Nginx (integrado en Next.js)
Persistencia: Docker Volumes



