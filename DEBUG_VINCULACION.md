# 🐛 DEBUG: Botón "Vincular cuenta de Google" no funciona

## 🔍 Diagnóstico paso a paso

### 1. Verificar que el frontend está corriendo
```bash
# En una terminal diferente a la del backend
npm run dev
# o
npm start
```

### 2. Abrir la consola del navegador (F12)

1. Abre el navegador en `http://localhost:5173/login`
2. Presiona **F12** para abrir las DevTools
3. Ve a la pestaña **Console**
4. Deja la consola abierta

### 3. Hacer login y verificar logs

1. Login con DNI `44464273`
2. Ir a Configuración
3. Observar la consola del navegador

**Deberías ver**:
```
Usuario: {dni: '44464273', email: '...', ...}
```

### 4. Click en "Vincular cuenta de Google"

**Deberías ver en la consola**:
```
Intentando vincular Google...
```

**Si NO ves este mensaje**: El botón no está ejecutando la función.

---

## ❌ Problema: El botón no hace nada

### Posible causa 1: GOOGLE_CLIENT_ID no configurado

**Verificar en la consola del navegador**:
```javascript
// Ejecuta esto en la consola (F12 -> Console):
import.meta.env.VITE_GOOGLE_CLIENT_ID
```

**Si muestra `undefined`**:

1. Verifica que existe el archivo `.env` en la raíz del proyecto
2. Verifica que contiene:
   ```
   VITE_GOOGLE_CLIENT_ID="879676093619-vacm88jq32dpihgqrj06muu0p6p5e6oi.apps.googleusercontent.com"
   ```
3. **REINICIA el servidor de Vite** (Ctrl+C y vuelve a ejecutar `npm run dev`)

### Posible causa 2: Error de importación

**Verificar en la consola del navegador**:
- Si ves errores en rojo sobre `@react-oauth/google`
- Si ves errores sobre `useGoogleLogin`

**Solución**: Reinstalar la librería
```bash
npm install @react-oauth/google
```

### Posible causa 3: El componente no se cargó correctamente

**Verificar en la consola**:
```
Failed to compile
```

**Si ves esto**: Hay un error de sintaxis en el código.

---

## ✅ Verificación completa

### Paso 1: Verifica variables de entorno

**Terminal (en la raíz del proyecto)**:
```bash
# PowerShell
Get-Content .env | Select-String -Pattern "VITE_GOOGLE"
```

**Deberías ver**:
```
VITE_GOOGLE_CLIENT_ID="879676093619-vacm88jq32dpihgqrj06muu0p6p5e6oi.apps.googleusercontent.com"
```

### Paso 2: Reinicia el servidor de Vite

```bash
# Detener el servidor actual (Ctrl+C)
# Luego reiniciar
npm run dev
```

### Paso 3: Limpiar caché del navegador

1. Presiona **Ctrl + Shift + Delete**
2. Selecciona "Caché" o "Cached images and files"
3. Click en "Borrar datos"
4. Refresca la página (F5)

### Paso 4: Verificar en la consola del navegador

1. Abre `http://localhost:5173/login`
2. Presiona **F12**
3. Ve a la pestaña **Console**
4. Ejecuta:
   ```javascript
   console.log('GOOGLE_CLIENT_ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID)
   ```

**Resultado esperado**:
```
GOOGLE_CLIENT_ID: 879676093619-vacm88jq32dpihgqrj06muu0p6p5e6oi.apps.googleusercontent.com
```

**Si muestra `undefined`**: El problema es la variable de entorno.

---

## 🔧 Solución rápida

### Opción 1: Verificar y reiniciar

```bash
# 1. Verifica el .env
cat .env | grep VITE_GOOGLE

# 2. Detén el servidor Vite (Ctrl+C)

# 3. Reinicia
npm run dev

# 4. Refresca el navegador (F5 o Ctrl+F5)
```

### Opción 2: Agregar console.logs para debug

**Verifica que veas estos mensajes al hacer click en el botón**:

```
Consola del navegador (F12):
1. "Intentando vincular Google..."
2. "Google token recibido: {access_token: '...'}"
3. "Cuenta vinculada con éxito" (si funciona)
```

**Si NO ves el mensaje 1**: El evento onClick no se está ejecutando.

---

## 📊 Checklist de verificación

- [ ] Servidor Vite corriendo (`npm run dev`)
- [ ] Servidor Django corriendo (`python manage.py runserver`)
- [ ] Archivo `.env` existe en la raíz del proyecto
- [ ] Variable `VITE_GOOGLE_CLIENT_ID` está definida en `.env`
- [ ] Servidor Vite reiniciado después de modificar `.env`
- [ ] Consola del navegador abierta (F12)
- [ ] No hay errores en rojo en la consola
- [ ] Al hacer login, llegas a `/panel/admin`
- [ ] Ves la sección "Cuentas Vinculadas"
- [ ] Ves el botón "Vincular cuenta de Google"

---

## 🎯 Prueba manual

1. **Abre el archivo**: `src/components/EditPerfil/ConfiguracionAdmin.jsx`

2. **Busca la línea** (aproximadamente línea 147):
   ```jsx
   <button
       onClick={handleLinkGoogle}
       className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
   >
       Vincular cuenta de Google
   </button>
   ```

3. **Verifica que dice** `onClick={handleLinkGoogle}` (sin paréntesis)

4. **Si dice** `onClick={handleLinkGoogle()}` ← **INCORRECTO** (tiene paréntesis)
   - Quitar los paréntesis
   - Guardar el archivo
   - El hot reload debería actualizar automáticamente

---

## 📞 Si sigue sin funcionar

### Captura de pantalla de lo siguiente:

1. **Consola del navegador** (F12 -> Console)
2. **Network tab** (F12 -> Network) cuando haces click en el botón
3. **Resultado del comando**:
   ```bash
   Get-Content .env | Select-String -Pattern "VITE_GOOGLE"
   ```

### Envía también:

4. **Versión de Node.js**:
   ```bash
   node --version
   ```

5. **Versión de npm**:
   ```bash
   npm --version
   ```

6. **Lista de paquetes instalados** (relacionados con Google):
   ```bash
   npm list @react-oauth/google
   ```

---

**Fecha**: 19/10/2025  
**Próximo paso**: Verificar consola del navegador
