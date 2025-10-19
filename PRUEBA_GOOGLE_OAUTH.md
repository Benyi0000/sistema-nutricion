# 🚀 Prueba del sistema Google OAuth - Guía rápida

## ⚡ Inicio rápido

### 1. Reiniciar el servidor Django

```bash
# Si el servidor está corriendo, deténlo con Ctrl+C

# Luego inicia nuevamente
E:/Biblioteca/Escritorio/REpo/sistema-nutricion/venv/Scripts/python.exe manage.py runserver
```

### 2. Pasos para probar la vinculación

1. **Abre el navegador** en `http://localhost:5173/login`

2. **Inicia sesión con credenciales normales**:
   - DNI: `44464273`
   - Contraseña: (tu contraseña actual)
   - El sistema te redirigirá a `/panel/admin` (eres administrador)

3. **Ve a Configuración**:
   - Busca la sección "Cuentas Vinculadas"
   - Verás que la cuenta de Google NO está vinculada (ya eliminamos la vinculación incorrecta)

4. **Haz clic en "Vincular cuenta de Google"**:
   - Se abrirá un popup de Google
   - Selecciona tu cuenta: `benjaminbenitez55@gmail.com`
   - Acepta los permisos
   - Deberías ver un mensaje de éxito

5. **Verifica la vinculación**:
   - Refresca la página de configuración
   - Deberías ver: "Conectado como: benjaminbenitez55@gmail.com"

6. **Prueba el login con Google**:
   - Cierra sesión (logout)
   - Vuelve a `http://localhost:5173/login`
   - Haz clic en "Iniciar sesión con Google"
   - Selecciona tu cuenta de Google
   - ✅ **Deberías ingresar correctamente y ser redirigido a /panel/admin**

## 🔍 Verificar que todo funciona

En una terminal de Django:

```bash
E:/Biblioteca/Escritorio/REpo/sistema-nutricion/venv/Scripts/python.exe manage.py shell
```

Luego ejecuta:

```python
from social_django.models import UserSocialAuth
from apps.user.models import UserAccount

# Ver el usuario
user = UserAccount.objects.get(dni='44464273')
print(f"Usuario: {user.email}")

# Ver si tiene vinculación
social = UserSocialAuth.objects.filter(user=user)
if social.exists():
    s = social.first()
    print(f"✅ Vinculado: {s.provider}")
    print(f"UID: {s.uid}")
    print(f"Email en extra_data: {s.extra_data.get('email')}")
    
    # Verificar que el UID NO sea un email
    if '@' in s.uid:
        print("❌ ERROR: El UID es un email (incorrecto)")
    else:
        print("✅ OK: El UID es un ID numérico (correcto)")
else:
    print("⚠️  No hay vinculación (vincular desde el panel)")
```

## 📝 Logs útiles

Para ver los logs del proceso de autenticación:

```bash
# En el servidor Django, verás logs como:
# [INFO] Usuario encontrado: 44464273 - benjaminbenitez55@gmail.com
# [INFO] Guardando detalles del perfil...
```

## ❌ Si algo sale mal

### Problema: "Esta cuenta de Google no está vinculada"
```bash
# Eliminar vinculación incorrecta
python manage.py shell -c "from social_django.models import UserSocialAuth; UserSocialAuth.objects.filter(user__dni='44464273').delete()"

# Volver a vincular desde el panel
```

### Problema: Error 400 al iniciar sesión
```bash
# Verificar el UID
python fix_google_uid.py

# Si está en formato de email, eliminarlo y re-vincular
```

### Problema: "El correo de Google no coincide"
- Asegúrate de usar la cuenta `benjaminbenitez55@gmail.com`
- Verifica que el usuario tenga ese email en la base de datos:
  ```bash
  python manage.py shell -c "from apps.user.models import UserAccount; u = UserAccount.objects.get(dni='44464273'); print(u.email)"
  ```

## 🎯 Checklist de prueba

- [ ] Servidor Django corriendo en `http://localhost:8000`
- [ ] Frontend Vite corriendo en `http://localhost:5173`
- [ ] Vinculación anterior eliminada
- [ ] Usuario puede acceder al panel de configuración
- [ ] Botón "Vincular cuenta de Google" visible
- [ ] Popup de Google se abre correctamente
- [ ] Vinculación se completa sin errores
- [ ] Mensaje "Conectado como: benjaminbenitez55@gmail.com" aparece
- [ ] Logout funciona
- [ ] Botón "Iniciar sesión con Google" en login
- [ ] Login con Google funciona ✅

## 📊 Estado actual

```bash
# Ver todas las vinculaciones
python manage.py shell -c "from social_django.models import UserSocialAuth; [print(f'{s.user.dni} | {s.provider} | UID: {s.uid[:20]}... | Email: {s.extra_data.get(\"email\")}') for s in UserSocialAuth.objects.all()]"
```

## 💡 Tip

Si quieres probar con otro usuario:
1. El admin debe crear el usuario primero (con email)
2. El usuario inicia sesión con DNI/password
3. El usuario vincula su Google desde configuración
4. Luego puede usar Google login

---

**¿Listo para probar?** Ejecuta:
```bash
E:/Biblioteca/Escritorio/REpo/sistema-nutricion/venv/Scripts/python.exe manage.py runserver
```
