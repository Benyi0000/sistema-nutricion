# 🚨 SOLUCIÓN INMEDIATA: Botón no funciona

## ⚡ PASOS A SEGUIR AHORA

### 1. Abre la consola del navegador

1. Presiona **F12** en el navegador
2. Ve a la pestaña **Console**
3. Deja esta pestaña abierta

### 2. Refresca la página

1. Presiona **Ctrl + Shift + R** (refresco duro)
2. O presiona **F5**

### 3. Ve a Configuración

1. Login con DNI `44464273`
2. Click en "Configuración" en el menú

### 4. Revisa la consola

**Busca alguno de estos mensajes**:

❌ **Si ves**: `Failed to compile` o `Error: ...`
- **HAY UN ERROR DE CÓDIGO**
- Copia el error completo y envíalo

❌ **Si ves**: `Module not found: @react-oauth/google`
- **FALTA INSTALAR LA LIBRERÍA**
- Ejecuta: `npm install @react-oauth/google`
- Reinicia Vite: `npm run dev`

❌ **Si ves**: `GOOGLE_CLIENT_ID is undefined`
- **FALTA LA VARIABLE DE ENTORNO**
- Ver solución abajo ⬇️

✅ **Si NO ves errores**: Continúa al paso 5

### 5. Click en "Vincular cuenta de Google"

**Observa la consola inmediatamente después del click**

✅ **Si ves**: `Intentando vincular Google...`
- **EL BOTÓN FUNCIONA** 
- Si no se abre el popup de Google, ve a "Problema: Popup bloqueado"

❌ **Si NO ves nada**:
- El botón NO está ejecutando la función
- Ve a "Problema: Botón no responde"

---

## 🔴 PROBLEMA: FALTA LA VARIABLE DE ENTORNO

### Solución:

1. **Verifica el archivo `.env`** en la raíz del proyecto:
   ```bash
   cat .env
   ```
   
2. **Debe contener**:
   ```
   VITE_GOOGLE_CLIENT_ID="879676093619-vacm88jq32dpihgqrj06muu0p6p5e6oi.apps.googleusercontent.com"
   ```

3. **Si NO existe**, créalo:
   ```bash
   echo 'VITE_GOOGLE_CLIENT_ID="879676093619-vacm88jq32dpihgqrj06muu0p6p5e6oi.apps.googleusercontent.com"' > .env
   ```

4. **IMPORTANTE**: Reinicia el servidor Vite:
   ```bash
   # Detén el servidor (Ctrl+C)
   npm run dev
   ```

5. **Refresca el navegador** (Ctrl + Shift + R)

---

## 🔴 PROBLEMA: POPUP BLOQUEADO

### Solución:

1. **Verifica la barra de direcciones del navegador**
   - Busca un ícono de popup bloqueado 🚫
   - Click en él y permite popups

2. **O configura manualmente**:
   - Chrome: `chrome://settings/content/popups`
   - Permite popups para `localhost:5173`

3. **Intenta nuevamente** hacer click en "Vincular cuenta de Google"

---

## 🔴 PROBLEMA: BOTÓN NO RESPONDE

### Diagnóstico:

1. **En la consola del navegador** (F12), ejecuta:
   ```javascript
   // Verifica que el componente está montado
   document.querySelector('button:has-text("Vincular cuenta de Google")')
   ```

2. **Si devuelve `null`**: El componente no se renderizó
   - Verifica que estás en `/panel/admin/configuracion`
   - Verifica que no hay errores en la consola

3. **Si devuelve el botón**: El botón existe pero no tiene el evento
   - **Reinstala las dependencias**:
     ```bash
     rm -rf node_modules
     npm install
     npm run dev
     ```

---

## ✅ CHECKLIST RÁPIDO

Ejecuta cada comando y anota el resultado:

```bash
# 1. Verificar archivo .env
echo "=== .env ===" && cat .env | grep VITE_GOOGLE

# 2. Verificar que Vite está corriendo
echo "=== Procesos ===" && ps aux | grep vite

# 3. Verificar que el puerto 5173 está en uso
echo "=== Puerto 5173 ===" && netstat -an | grep 5173
```

**Resultados esperados**:
1. Debe mostrar: `VITE_GOOGLE_CLIENT_ID="879676093619..."`
2. Debe mostrar un proceso de Vite corriendo
3. Debe mostrar que el puerto 5173 está en LISTENING

---

## 🎯 PRUEBA SIMPLE

### Opción 1: Botón de prueba directo

Agrega este botón temporalmente en `ConfiguracionAdmin.jsx` (línea 180):

```jsx
<button 
    onClick={() => alert('Click detectado!')}
    className="px-4 py-2 bg-green-500 text-white rounded"
>
    PRUEBA - Click aquí
</button>
```

**Si este botón funciona pero el de Google no**: El problema está en `googleLogin()`

### Opción 2: Test de la función

En la consola del navegador (F12), ejecuta:

```javascript
// Verifica que useGoogleLogin está disponible
console.log(typeof window.google);
```

**Si devuelve `undefined`**: Google OAuth no se cargó.

---

## 📞 INFORMACIÓN PARA REPORTAR

Si nada funciona, envía esta información:

1. **Contenido del archivo `.env`**:
   ```bash
   cat .env
   ```

2. **Logs de Vite** (lo que aparece en la terminal donde corre `npm run dev`)

3. **Consola del navegador** (captura de pantalla del tab Console con F12)

4. **Network tab**: 
   - F12 → Network
   - Refresca la página
   - Busca requests que fallen (en rojo)
   - Captura de pantalla

5. **Versión de paquetes**:
   ```bash
   npm list @react-oauth/google
   ```

---

**SIGUIENTE PASO**: Abre la consola del navegador (F12) y sigue los pasos de este documento.
