# Nuevas Funcionalidades Implementadas

## Resumen de Implementación

Este documento describe todas las funcionalidades nuevas agregadas al sistema de nutrición para cumplir con los requisitos funcionales y no funcionales especificados.

---

## 1. Campo de Género en Perfil de Persona

### Descripción
Se agregó el campo `gender` al modelo `Person` para almacenar el género del paciente, necesario para cálculos nutricionales precisos.

### Cambios en Modelos
```python
Person.gender: CharField con opciones 'M' (Masculino), 'F' (Femenino), 'O' (Otro)
```

### Impacto
- Permite cálculos de TMB y GET más precisos
- Mejora los reportes con información demográfica completa

---

## 2. Sistema de Adjuntos de Documentos

### Descripción
Permite a nutricionistas y pacientes adjuntar documentos (análisis clínicos, recetas médicas, imágenes) asociados a pacientes o consultas específicas.

### Modelo: `DocumentAttachment`
**Campos principales:**
- `document_type`: Tipo de documento (análisis, receta, imagen, reporte, otro)
- `title`: Título del documento
- `description`: Descripción opcional
- `file`: Archivo adjunto
- `patient`: Relación con paciente (opcional)
- `consultation`: Relación con consulta (opcional)
- `uploaded_by`: Usuario que subió el documento
- `uploaded_at`: Fecha de carga

### Endpoints API
```
GET    /api/documents/                    - Listar documentos
POST   /api/documents/                    - Subir documento
GET    /api/documents/{id}/               - Ver documento
DELETE /api/documents/{id}/               - Eliminar documento
```

### Query Params
- `patient_id`: Filtrar por paciente
- `consultation_id`: Filtrar por consulta

### Permisos
- **Nutricionista**: Ve documentos de sus pacientes asignados
- **Paciente**: Ve solo sus propios documentos

---

## 3. Cálculos Automáticos de TMB y GET

### Descripción
Implementación de cálculos automáticos de Tasa Metabólica Basal (TMB) y Gasto Energético Total (GET) usando la ecuación de Harris-Benedict revisada.

### Métodos en `AnthropometricMeasurement`

#### `calculate_tmb(age, gender)`
Calcula la TMB según:
- **Hombres**: TMB = 88.362 + (13.397 × peso) + (4.799 × altura cm) - (5.677 × edad)
- **Mujeres**: TMB = 447.593 + (9.247 × peso) + (3.098 × altura cm) - (4.330 × edad)

#### `calculate_get(age, gender, activity_level)`
Calcula el GET = TMB × Factor de Actividad

**Niveles de actividad:**
- `sedentary`: 1.2 (poco o ningún ejercicio)
- `light`: 1.375 (ejercicio 1-3 días/semana)
- `moderate`: 1.55 (ejercicio 3-5 días/semana)
- `active`: 1.725 (ejercicio 6-7 días/semana)
- `very_active`: 1.9 (ejercicio intenso diario)

### Uso en API
Los valores de TMB y GET se calculan automáticamente al obtener medidas antropométricas si hay datos de fecha de nacimiento y género disponibles.

---

## 4. Sistema de Pagos y Comprobantes

### Descripción
Sistema completo de gestión de pagos con integración a MercadoPago y generación de comprobantes.

### Modelo: `Payment`
**Campos principales:**
- `patient`: Paciente que realiza el pago
- `nutritionist`: Nutricionista que recibe el pago
- `amount`: Monto del pago
- `payment_method`: Método (efectivo, transferencia, mercadopago, tarjeta)
- `status`: Estado (pending, approved, rejected, cancelled, refunded)
- `description`: Descripción del pago
- `consultation/appointment/nutrition_plan`: Relación opcional
- `mercadopago_payment_id`: ID de pago en MercadoPago
- `mercadopago_preference_id`: ID de preferencia
- `payment_date`: Fecha de pago

### Modelo: `PaymentProof`
**Campos principales:**
- `payment`: Pago relacionado (OneToOne)
- `proof_number`: Número de comprobante único
- `pdf_file`: Archivo PDF del comprobante
- `tax_id`: CUIT/CUIL (opcional)
- `fiscal_address`: Domicilio fiscal (opcional)

### Endpoints API
```
GET  /api/payments/                - Listar pagos
POST /api/payments/                - Crear pago
GET  /api/payments/{id}/           - Ver pago
PUT  /api/payments/{id}/           - Actualizar pago
POST /api/payments/webhook/        - Webhook de MercadoPago
```

### Flujo de Pago Manual
1. Nutricionista crea pago con método `cash`, `transfer` o `card`
2. El pago se aprueba automáticamente
3. Se registra la fecha de pago

### Flujo de Pago con MercadoPago
1. Nutricionista/Paciente crea pago con método `mercadopago`
2. Sistema genera preferencia de pago en MercadoPago
3. Usuario paga mediante link de MercadoPago
4. Webhook recibe notificación y actualiza estado
5. Se envía email de confirmación al paciente

### Configuración Requerida
Ver archivo `ENV_CONFIG_EXAMPLE.txt` para configurar:
- `MERCADOPAGO_ACCESS_TOKEN`
- `MERCADOPAGO_PUBLIC_KEY`

---

## 5. Sistema de Reportes (PDF y Excel)

### Descripción
Generación automática de reportes profesionales en formato PDF y Excel para seguimiento de pacientes y actividad del nutricionista.

### Tipos de Reportes

#### Reporte de Paciente (PDF)
**Endpoint:** `GET /api/reports/patient/{patient_id}/pdf/`

**Contenido:**
- Información personal del paciente
- Historial de consultas
- Evolución de peso e IMC
- Datos antropométricos

**Permisos:**
- Nutricionista: Sus pacientes asignados
- Paciente: Su propio reporte

#### Evolución de Paciente (Excel)
**Endpoint:** `GET /api/reports/patient/{patient_id}/excel/`

**Contenido:**
- Información del paciente
- Tabla de evolución con todas las consultas
- Columnas: Fecha, Tipo, Peso, Altura, IMC, ICC, TMB, GET
- Formato profesional con estilos y colores

#### Reporte Mensual del Nutricionista (PDF)
**Endpoint:** `GET /api/reports/monthly/pdf/?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`

**Contenido:**
- Estadísticas del período
- Total de citas
- Total de consultas
- Ingresos totales

**Parámetros opcionales:**
- `start_date`: Fecha de inicio (default: primer día del mes actual)
- `end_date`: Fecha de fin (default: último día del mes actual)

### Bibliotecas Utilizadas
- **ReportLab**: Generación de PDFs
- **OpenPyXL**: Generación de archivos Excel

---

## 6. Sistema de Notificaciones por Email

### Descripción
Sistema automatizado de envío de emails para recordatorios de citas, confirmaciones de pago y alertas.

### Servicios Implementados

#### `EmailNotificationService`

##### `send_appointment_reminder(appointment)`
Envía recordatorio de cita al paciente con:
- Nombre del nutricionista
- Fecha y hora de la cita
- Tipo de consulta
- Notas adicionales

##### `send_payment_confirmation(payment)`
Envía confirmación de pago al paciente con:
- Monto pagado
- Método de pago
- Descripción
- Fecha de pago

##### `send_plan_renewal_reminder(patient, nutritionist)`
Envía recordatorio de renovación de plan nutricional

### Endpoint para Envío Manual
```
POST /api/appointments/{appointment_id}/send-reminder/
```

**Permisos:** Solo nutricionistas

### Configuración de Email
Ver archivo `ENV_CONFIG_EXAMPLE.txt` para configurar SMTP:
- Gmail (recomendado para desarrollo)
- Otro proveedor SMTP

**Para desarrollo local:**
```python
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
```
Los emails se mostrarán en la consola.

---

## 7. Gestión de Consultas

### Descripción
Sistema completo CRUD para gestión de consultas nutricionales.

### Modelo: `Consultation` (Mejorado)
**Relaciones:**
- `measurements`: Medidas antropométricas (OneToOne)
- `documents`: Documentos adjuntos (ManyToMany)
- `payments`: Pagos relacionados

### Endpoints API
```
GET  /api/consultations/              - Listar consultas
POST /api/consultations/              - Crear consulta
GET  /api/consultations/{id}/         - Ver consulta
PUT  /api/consultations/{id}/         - Actualizar consulta
DELETE /api/consultations/{id}/       - Eliminar consulta
```

### Query Params
- `patient_id`: Filtrar por paciente (solo para nutricionistas)

### Permisos
- **Nutricionista**: Ve sus propias consultas
- **Paciente**: Ve solo sus consultas

### Datos Incluidos en Response
- Información básica de la consulta
- Medidas antropométricas con cálculos (IMC, ICC, TMB, GET)
- Documentos adjuntos

---

## 8. Integración con MercadoPago (Sandbox)

### Descripción
Integración completa con MercadoPago para pagos online en modo sandbox (pruebas).

### Funcionalidades

#### Crear Preferencia de Pago
Cuando se crea un pago con método `mercadopago`:
1. Sistema crea preferencia en MercadoPago
2. Genera link de pago único
3. Configura URLs de retorno (éxito, fallo, pendiente)
4. Configura webhook para notificaciones

#### Webhook de Notificaciones
**Endpoint:** `POST /api/payments/webhook/`

Recibe notificaciones de MercadoPago y actualiza automáticamente:
- Estado del pago
- ID de pago de MercadoPago
- Detalles del estado
- Envía confirmación por email si es aprobado

### Configuración

#### 1. Obtener Credenciales de Prueba
1. Ingresar a https://www.mercadopago.com.ar/developers
2. Ir a "Tus integraciones" > "Credenciales"
3. Seleccionar "Credenciales de prueba"
4. Copiar Access Token y Public Key

#### 2. Configurar Variables de Entorno
```
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxx
MERCADOPAGO_PUBLIC_KEY=TEST-yyyy
```

#### 3. Usuarios de Prueba
MercadoPago proporciona usuarios de prueba para simular pagos:
- **Comprador**: Usuario que realiza el pago
- **Vendedor**: Usuario que recibe el pago

### Tarjetas de Prueba
Para probar pagos en sandbox:
- **Aprobado**: 5031 7557 3453 0604
- **Rechazado**: 5031 4332 1540 6351

---

## 9. Validaciones Implementadas

### Validaciones en Serializers

#### `DocumentAttachmentSerializer`
- ✅ Documento debe estar asociado a paciente O consulta
- ✅ Validación de tipos de archivo permitidos

#### `PaymentCreateSerializer`
- ✅ Monto debe ser mayor a 0
- ✅ Método de pago válido
- ✅ Paciente existe y está asignado al nutricionista

#### `AnthropometricMeasurementSerializer`
- ✅ Peso y altura deben ser positivos
- ✅ Porcentajes deben estar entre 0-100
- ✅ Cálculos automáticos de IMC, ICC, TMB, GET

#### `AppointmentSerializer`
- ✅ Fecha no puede ser en el pasado
- ✅ No puede haber conflicto de horarios
- ✅ Duración debe ser positiva

### Validaciones en Vistas

#### Permisos por Rol
- **Nutricionista**: Solo ve/edita sus pacientes asignados
- **Paciente**: Solo ve/edita su propia información
- **Administrador**: Gestión completa de nutricionistas

#### Validación de Propiedad
- Usuario solo puede acceder a recursos que le pertenecen
- Verificación en cada operación CRUD

---

## 10. Mejoras de Seguridad

### Protección de Datos Sensibles
- ✅ Tokens JWT con expiración
- ✅ Refresh tokens con rotación
- ✅ Blacklist de tokens revocados
- ✅ Cifrado de contraseñas con bcrypt
- ✅ Validación de contraseñas fuertes

### CORS y CSRF
- ✅ Configuración de dominios permitidos
- ✅ Protección CSRF en formularios
- ✅ Headers de seguridad configurados

### Auditoría
- ✅ Timestamps en todos los modelos
- ✅ Registro de usuario que crea/modifica
- ✅ Logs de operaciones importantes

---

## Próximos Pasos

### Para Desarrollo
1. Crear migraciones:
```bash
python manage.py makemigrations
python manage.py migrate
```

2. Instalar dependencias:
```bash
pip install -r requirements.txt
```

3. Configurar variables de entorno (ver `ENV_CONFIG_EXAMPLE.txt`)

4. Crear superusuario:
```bash
python manage.py createsuperuser
```

5. Ejecutar servidor:
```bash
python manage.py runserver
```

### Para Testing
1. Crear datos de prueba en Django Admin
2. Configurar credenciales de MercadoPago (sandbox)
3. Probar flujo completo de pagos
4. Generar reportes de prueba
5. Verificar envío de emails (consola o SMTP real)

### Para Producción
1. Configurar base de datos PostgreSQL
2. Configurar servidor SMTP real
3. Configurar credenciales de MercadoPago producción
4. Configurar HTTPS
5. Configurar copias de seguridad automáticas
6. Implementar monitoreo y logs
7. Configurar CDN para archivos estáticos

---

## Soporte y Documentación Adicional

### Documentación de APIs Externas
- **MercadoPago**: https://www.mercadopago.com.ar/developers/es/docs
- **ReportLab**: https://www.reportlab.com/docs/reportlab-userguide.pdf
- **OpenPyXL**: https://openpyxl.readthedocs.io/

### Contacto de Desarrollo
Para consultas técnicas o reportar issues, contactar al equipo de desarrollo.


