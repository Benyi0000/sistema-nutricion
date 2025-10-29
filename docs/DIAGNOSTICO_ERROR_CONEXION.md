# Diagnóstico: Error de Conexión al Subir Fotos

## 🔍 Pasos para Diagnosticar el Problema

### 1. Abrir la Consola del Navegador

1. Presiona **F12** o **Ctrl+Shift+I** (en Windows)
2. Ve a la pestaña **"Console"** (Consola)
3. Limpia la consola (icono de 🚫 o botón "Clear console")
4. Intenta subir la foto nuevamente
5. **Lee los mensajes en la consola** - Te dirán exactamente qué está fallando

---

## 📋 Posibles Causas y Soluciones

### ❌ Causa 1: Token Expirado o No Válido

**Síntomas:**
- Error: "Tu sesión ha expirado"
- Error: "El token dado no es valido"
- En consola: Status 401

**Solución:**
```
1. Cierra sesión
2. Vuelve a iniciar sesión
3. Intenta subir la foto nuevamente
```

**Para verificar el token manualmente:**
1. Abre la consola del navegador (F12)
2. Ve a la pestaña **"Application"** → **"Local Storage"** → `http://localhost:5173`
3. Busca la clave `access_token`
4. Si no existe o está vacío → Vuelve a iniciar sesión

---

### ❌ Causa 2: Backend No Está Corriendo

**Síntomas:**
- Error: "Error de conexión: Failed to fetch"
- Error: "No se puede conectar con el servidor"
- En consola: `TypeError: Failed to fetch`

**Solución:**
```bash
# Opción 1: Iniciar ambos servidores
cd sistema-nutricion
.\start-dev.bat

# Opción 2: Iniciar solo el backend
cd sistema-nutricion
venv\Scripts\activate
python manage.py runserver

# Verificar que esté corriendo:
# Abre en el navegador: http://localhost:8000/api/
# Deberías ver la API de Django REST Framework
```

---

### ❌ Causa 3: Problema de CORS

**Síntomas:**
- En consola: `Access-Control-Allow-Origin`
- En consola: "CORS policy blocked"

**Solución:**

Verifica que tu archivo `.env` tenga:
```env
CORS_ORIGIN_WHITELIST_DEV=http://localhost:5173,http://127.0.0.1:5173
CSRF_TRUSTED_ORIGINS_DEV=http://localhost:5173,http://127.0.0.1:5173
```

Si no existe, copia de `ENV_CONFIG_EXAMPLE.txt` y reinicia el backend.

---

### ❌ Causa 4: Puerto Incorrecto

**Síntomas:**
- El backend funciona pero no recibe las peticiones
- En consola: URL diferente a `http://localhost:8000`

**Verificación:**
1. Abre la consola (F12) → Pestaña "Console"
2. Busca el mensaje: `URL de API: http://localhost:8000/api/meal-photos/`
3. Si la URL es diferente, el problema está en la configuración

**Solución:**
El frontend debe usar `http://localhost:8000/api`

---

## 🛠️ Solución Rápida (Reinicio Completo)

Si nada funciona, haz un reinicio completo:

```bash
# 1. Detén todos los servidores (Ctrl+C en ambas terminales)

# 2. Terminal 1 - Backend:
cd sistema-nutricion
venv\Scripts\activate
python manage.py runserver

# 3. Terminal 2 - Frontend:
cd sistema-nutricion
npm run dev

# 4. Cierra sesión en el navegador
# 5. Limpia el localStorage:
#    F12 → Application → Local Storage → Clear All
# 6. Vuelve a iniciar sesión
# 7. Intenta subir la foto
```

---

## 📊 Información de Depuración

Con los cambios recientes, ahora verás en la consola:

```
Cargando fotos con token: Token presente
URL de API: http://localhost:8000/api/meal-photos/
Respuesta del servidor: 200 OK
Fotos cargadas: 5
```

O en caso de error:
```
Error del servidor: {detail: "El token dado no es valido...", code: "token_not_valid"}
```

---

## ✅ Cómo Verificar que Todo Funciona

### Test Manual del Backend:

**PowerShell/CMD:**
```bash
# Test 1: Verificar que el endpoint existe
curl http://localhost:8000/api/meal-photos/

# Deberías ver: {"detail": "Authentication credentials were not provided."}
# ✅ Esto es BUENO - significa que el endpoint funciona
```

### Test desde el Navegador:

1. Abre: `http://localhost:8000/api/`
2. Deberías ver la interfaz de Django REST Framework
3. Ve a: `http://localhost:8000/api/meal-photos/`
4. Si pide login → ✅ El endpoint funciona
5. Si sale 404 → ❌ Hay un problema con las URLs

---

## 📞 Si el Problema Persiste

1. **Copia TODO el contenido de la consola** (F12 → Console)
2. **Copia el error exacto** que aparece en pantalla
3. **Copia la pestaña Network:**
   - F12 → Network
   - Intenta subir la foto
   - Busca la petición a `meal-photos`
   - Clic derecho → Copy → Copy as fetch
   
Con esta información podremos diagnosticar el problema exacto.

---

## 🎯 Checklist de Verificación

- [ ] Backend corriendo en puerto 8000
- [ ] Frontend corriendo en puerto 5173  
- [ ] Sesión iniciada en el navegador
- [ ] Token presente en localStorage
- [ ] Consola del navegador abierta para ver errores
- [ ] Sin errores de CORS en consola
- [ ] Endpoint `/api/meal-photos/` responde (aunque sea con error de autenticación)

---

## 💡 Nota Importante

El mensaje "Error de conexión" es genérico. Con los cambios recientes, ahora verás mensajes MÁS ESPECÍFICOS:

- ✅ "Tu sesión ha expirado" → Reinicia sesión
- ✅ "No tienes permiso" → Verifica que eres paciente
- ✅ "No se puede conectar con el servidor" → Backend detenido
- ✅ Error específico del servidor → El mensaje real de la API

**Revisa la consola del navegador para ver el mensaje real.**

