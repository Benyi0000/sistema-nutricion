# Adaptación de Archivos Batch - Sistema Nutrición

## Resumen de la Fase
Se adaptaron los archivos `setup.bat` y `start.bat` para el proyecto Sistema Nutrición con autenticación JWT y modelo de usuario personalizado, optimizando su configuración y funcionalidad específica para este sistema.

## Archivos Modificados

### 1. setup.bat
**Ubicación**: `sistema-nutricion/setup.bat`

**Cambios realizados**:
- Actualizado el título del script a "SETUP AUTOMATICO - SISTEMA NUTRICION"
- Adaptado para la nueva rama con autenticación JWT y modelo de usuario personalizado
- Expandido a 8 pasos para incluir configuración completa
- Agregado configuración automática de variables de entorno (.env) incluyendo JWT
- Agregado creación opcional de usuarios de demostración
- Actualizado las URLs de acceso al sistema:
  - Frontend: http://localhost:5173
  - Backend API: http://localhost:8000/api
  - Admin Django: http://localhost:8000/admin
  - Login JWT: http://localhost:8000/api/auth/login/
- Mejorado el manejo de errores y verificación del entorno virtual

**Funcionalidades**:
1. Verificación y activación del entorno virtual Python
2. Instalación de dependencias Python (requirements.txt)
3. Instalación de dependencias Node.js (package.json)
4. Configuración automática de variables de entorno (.env)
5. Aplicación de migraciones Django
6. Recolección de archivos estáticos
7. Creación opcional de usuarios de demostración
8. Verificación de la configuración del sistema

### 2. start.bat
**Ubicación**: `sistema-nutricion/start.bat`

**Cambios realizados**:
- Actualizado el título a "INICIANDO SERVIDOR - SISTEMA NUTRICION"
- Mejorado los mensajes informativos para cada opción de servidor
- Actualizado las URLs mostradas para ser más específicas:
  - Backend API: http://localhost:8000/api
  - Admin Django: http://localhost:8000/admin
  - Frontend React: http://localhost:5173
  - Login JWT: http://localhost:8000/api/auth/login/
- Agregado información sobre autenticación JWT configurada
- Mejorado los títulos de las ventanas separadas para mayor claridad
- Agregado información adicional sobre las URLs del sistema

**Opciones disponibles**:
1. Solo Django (Backend) - Puerto 8000
2. Solo Frontend (Vite) - Puerto 5173
3. Ambos servidores (Django + Vite)

## Cómo Usar los Archivos

### Configuración Inicial
```bash
# Ejecutar para configurar el proyecto por primera vez
setup.bat
```

### Inicio del Sistema
```bash
# Ejecutar para iniciar los servidores
start.bat
```

## URLs del Sistema

- **Aplicación Web (Frontend)**: http://localhost:5173
- **API Backend**: http://localhost:8000/api
- **Admin Django**: http://localhost:8000/admin
- **Login JWT**: http://localhost:8000/api/auth/login/

## Autenticación JWT

El sistema ahora incluye autenticación JWT configurada para desarrollo:
- Tokens de acceso válidos por 15 minutos
- Tokens de refresh válidos por 7 días
- Rotación automática de tokens de refresh
- Autenticación por DNI disponible

## Dependencias del Proyecto

### Python (requirements.txt)
- django == 5.2.5
- django-environ == 0.12.0
- django-cors-headers == 4.7.0
- djangorestframework == 3.16.1
- Pillow == 11.3.0
- django-storages == 1.14.6
- django-ckeditor == 6.7.3
- psycopg == 3.2.9
- djangorestframework_simplejwt == 5.5.1
- djoser == 2.3.3
- social-auth-app-django == 5.5.1

### Node.js (package.json)
- React 19.1.1
- Vite 7.1.2
- Tailwind CSS 4.1.12
- Redux 5.0.1
- React Router DOM 7.8.2
- Axios 1.11.0

## Problemas Identificados y Solucionados

### Problema Principal
El proyecto requería variables de entorno específicas y configuración de autenticación JWT que no estaban configuradas, causando errores al ejecutar Django.

### Soluciones Implementadas

1. **Configuración de variables de entorno**: 
   - Corregido el archivo `core/settings.py` para leer correctamente el archivo `.env`
   - Agregado configuración automática de variables de entorno en `setup.bat`
   - Incluido configuración JWT en las variables de entorno

2. **Mejora del setup.bat**:
   - Adaptado para la nueva rama con autenticación JWT y modelo de usuario personalizado
   - Expandido a 8 pasos para incluir configuración completa
   - Agregado manejo automático de archivo `.env` con variables JWT
   - Agregado creación opcional de usuarios de demostración
   - Mejorado el manejo de errores del entorno virtual

3. **Corrección del settings.py**:
   - Corregido el orden de definición de variables
   - Agregado lectura explícita del archivo `.env` con ruta completa
   - Configurado autenticación JWT con SimpleJWT
   - Configurado modelo de usuario personalizado con autenticación por DNI

4. **Adaptación del start.bat**:
   - Agregado información sobre endpoints de autenticación JWT
   - Incluido URLs de login JWT en la información del sistema

## Razón de los Cambios

Los archivos batch fueron adaptados para:

1. **Resolver problemas de configuración**: Automatizar la creación del archivo `.env` necesario con variables JWT
2. **Adaptar a la nueva arquitectura**: Incluir soporte para autenticación JWT y modelo de usuario personalizado
3. **Mejorar la experiencia del usuario**: Proporcionar URLs más específicas incluyendo endpoints de autenticación
4. **Optimizar para el desarrollo**: Incluir creación automática de usuarios de demostración
5. **Mantener la funcionalidad esencial**: Conservar todas las funcionalidades críticas para el desarrollo
6. **Soportar autenticación avanzada**: Configurar JWT con rotación de tokens y autenticación por DNI

## Próximos Pasos

1. Ejecutar `setup.bat` para configurar el entorno de desarrollo
2. Ejecutar `start.bat` para iniciar los servidores
3. Acceder a la aplicación web en http://localhost:5173
4. Configurar el panel de administración en http://localhost:8000/admin

---
*Documentación generada el: 3 de octubre de 2025*
*Proyecto: Sistema Nutrición*
