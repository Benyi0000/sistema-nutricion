# API de Plantillas - Documentación

## Base URL
```
/api/user/plantillas/
```

## Autenticación
Todos los endpoints requieren autenticación JWT.
Solo los **nutricionistas** pueden acceder a estos endpoints.

---

## 📋 Endpoints Disponibles

### 1. Listar Plantillas
**GET** `/api/user/plantillas/`

Retorna todas las plantillas disponibles para el nutricionista:
- Plantillas del sistema (owner=null)
- Plantillas propias del nutricionista

#### Query Parameters
- `tipo_consulta` - Filtrar por tipo: `INICIAL` o `SEGUIMIENTO`
- `activo` - Filtrar por estado: `true` o `false`

#### Ejemplo
```bash
GET /api/user/plantillas/?tipo_consulta=INICIAL&activo=true
```

#### Respuesta (200 OK)
```json
[
  {
    "id": 1,
    "owner": null,
    "owner_info": {
      "tipo": "sistema",
      "nombre": "Sistema"
    },
    "nombre": "Consulta Inicial Estándar",
    "descripcion": "Plantilla predeterminada del sistema",
    "tipo_consulta": "INICIAL",
    "es_predeterminada": true,
    "activo": true,
    "cantidad_preguntas": 7,
    "created_at": "2025-01-25T10:00:00Z"
  },
  {
    "id": 2,
    "owner": 42,
    "owner_info": {
      "tipo": "nutricionista",
      "id": 42,
      "nombre": "Dr. Juan Pérez"
    },
    "nombre": "Mi Plantilla Diabetes",
    "descripcion": "Plantilla personalizada para pacientes diabéticos",
    "tipo_consulta": "SEGUIMIENTO",
    "es_predeterminada": false,
    "activo": true,
    "cantidad_preguntas": 12,
    "created_at": "2025-01-25T15:30:00Z"
  }
]
```

---

### 2. Detalle de Plantilla
**GET** `/api/user/plantillas/{id}/`

Retorna el detalle completo de una plantilla, incluyendo todas sus preguntas.

#### Respuesta (200 OK)
```json
{
  "id": 1,
  "owner": null,
  "owner_info": {
    "tipo": "sistema",
    "nombre": "Sistema"
  },
  "nombre": "Consulta Inicial Estándar",
  "descripcion": "Plantilla predeterminada del sistema",
  "tipo_consulta": "INICIAL",
  "es_predeterminada": true,
  "activo": true,
  "config": {
    "calcular_imc": true,
    "mostrar_graficos": true
  },
  "preguntas_config": [
    {
      "id": 1,
      "pregunta": {
        "id": 42,
        "texto": "¿Cuál es tu peso actual?",
        "tipo": "DECIMAL",
        "codigo": "peso",
        "requerido": true,
        "opciones": null,
        "unidad": "kg",
        "orden": 1,
        "es_personalizada": false
      },
      "orden": 0,
      "requerido_en_plantilla": true,
      "visible": true,
      "config": {
        "placeholder": "Ej: 70.5",
        "min": 20,
        "max": 300
      },
      "created_at": "2025-01-25T10:00:00Z"
    },
    {
      "id": 2,
      "pregunta": {
        "id": 43,
        "texto": "¿Cuál es tu altura?",
        "tipo": "DECIMAL",
        "codigo": "altura",
        "requerido": true,
        "opciones": null,
        "unidad": "cm",
        "orden": 2,
        "es_personalizada": false
      },
      "orden": 1,
      "requerido_en_plantilla": true,
      "visible": true,
      "config": {},
      "created_at": "2025-01-25T10:00:00Z"
    }
  ],
  "cantidad_preguntas": 2,
  "created_at": "2025-01-25T10:00:00Z",
  "updated_at": "2025-01-25T10:00:00Z"
}
```

---

### 3. Crear Plantilla
**POST** `/api/user/plantillas/`

Crea una nueva plantilla con sus preguntas.

#### Request Body
```json
{
  "nombre": "Mi Nueva Plantilla",
  "descripcion": "Descripción de la plantilla",
  "tipo_consulta": "INICIAL",
  "es_predeterminada": false,
  "activo": true,
  "config": {
    "calcular_imc": true
  },
  "preguntas": [
    {
      "pregunta_id": 42,
      "orden": 0,
      "requerido_en_plantilla": true,
      "visible": true,
      "config": {
        "placeholder": "Ingresa tu peso"
      }
    },
    {
      "pregunta_id": 43,
      "orden": 1,
      "requerido_en_plantilla": true,
      "visible": true,
      "config": {}
    }
  ]
}
```

#### Respuesta (201 Created)
```json
{
  "id": 3,
  "nombre": "Mi Nueva Plantilla",
  ...
}
```

#### Errores
- **400 Bad Request** - Validación fallida
  ```json
  {
    "es_predeterminada": [
      "Ya existe una plantilla predeterminada para consultas de tipo 'Inicial'."
    ]
  }
  ```
- **403 Forbidden** - Usuario no es nutricionista

---

### 4. Actualizar Plantilla
**PATCH** `/api/user/plantillas/{id}/`

Actualiza una plantilla existente. Solo se pueden editar plantillas propias.

#### Request Body (parcial permitido)
```json
{
  "nombre": "Nuevo nombre",
  "es_predeterminada": true,
  "preguntas": [
    {
      "pregunta_id": 42,
      "orden": 0,
      "requerido_en_plantilla": false,
      "visible": true,
      "config": {}
    }
  ]
}
```

#### Respuesta (200 OK)
```json
{
  "id": 3,
  "nombre": "Nuevo nombre",
  ...
}
```

#### Errores
- **403 Forbidden** - No puedes editar plantillas de otros o del sistema
- **404 Not Found** - Plantilla no encontrada

---

### 5. Eliminar Plantilla
**DELETE** `/api/user/plantillas/{id}/`

Elimina una plantilla propia. No se pueden eliminar plantillas del sistema.

#### Respuesta (204 No Content)

#### Errores
- **403 Forbidden** - No puedes eliminar plantillas del sistema o de otros
- **404 Not Found** - Plantilla no encontrada

---

### 6. Duplicar Plantilla
**POST** `/api/user/plantillas/{id}/duplicar/`

Crea una copia de una plantilla existente (sistema o propia).

#### Request Body (opcional)
```json
{
  "nuevo_nombre": "Copia de Plantilla Inicial"
}
```

Si no se proporciona `nuevo_nombre`, se usa "{nombre} (copia)".

#### Respuesta (201 Created)
```json
{
  "id": 4,
  "owner": 42,
  "owner_info": {
    "tipo": "nutricionista",
    "id": 42,
    "nombre": "Dr. Juan Pérez"
  },
  "nombre": "Copia de Plantilla Inicial",
  "descripcion": "Plantilla predeterminada del sistema",
  "tipo_consulta": "INICIAL",
  "es_predeterminada": false,
  "activo": true,
  "config": {
    "calcular_imc": true
  },
  "preguntas_config": [...],
  "cantidad_preguntas": 7,
  "created_at": "2025-01-25T16:00:00Z",
  "updated_at": "2025-01-25T16:00:00Z"
}
```

---

### 7. Listar Plantillas Predeterminadas
**GET** `/api/user/plantillas/predeterminadas/`

Retorna solo las plantillas marcadas como predeterminadas del nutricionista.

#### Query Parameters
- `tipo_consulta` - Filtrar por tipo: `INICIAL` o `SEGUIMIENTO`

#### Ejemplo
```bash
GET /api/user/plantillas/predeterminadas/?tipo_consulta=INICIAL
```

#### Respuesta (200 OK)
```json
[
  {
    "id": 2,
    "owner": 42,
    "owner_info": {
      "tipo": "nutricionista",
      "id": 42,
      "nombre": "Dr. Juan Pérez"
    },
    "nombre": "Mi Plantilla Inicial por Defecto",
    "descripcion": "...",
    "tipo_consulta": "INICIAL",
    "es_predeterminada": true,
    "activo": true,
    "cantidad_preguntas": 10,
    "created_at": "2025-01-25T10:00:00Z"
  }
]
```

---

## 🔗 Endpoints Anidados (Preguntas en Plantilla)

### Base URL
```
/api/user/plantillas/{plantilla_id}/preguntas/
```

### 1. Listar Preguntas de Plantilla
**GET** `/api/user/plantillas/{plantilla_id}/preguntas/`

#### Respuesta (200 OK)
```json
[
  {
    "id": 1,
    "pregunta": {
      "id": 42,
      "texto": "¿Cuál es tu peso actual?",
      "tipo": "DECIMAL",
      "codigo": "peso",
      "requerido": true,
      "opciones": null,
      "unidad": "kg",
      "orden": 1,
      "es_personalizada": false
    },
    "orden": 0,
    "requerido_en_plantilla": true,
    "visible": true,
    "config": {},
    "created_at": "2025-01-25T10:00:00Z"
  }
]
```

---

### 2. Agregar Pregunta a Plantilla
**POST** `/api/user/plantillas/{plantilla_id}/preguntas/`

#### Request Body
```json
{
  "pregunta_id": 45,
  "orden": 5,
  "requerido_en_plantilla": false,
  "visible": true,
  "config": {
    "ayuda": "Responde con sinceridad"
  }
}
```

#### Respuesta (201 Created)
```json
{
  "id": 10,
  "pregunta": {...},
  "orden": 5,
  "requerido_en_plantilla": false,
  "visible": true,
  "config": {...},
  "created_at": "2025-01-25T16:30:00Z"
}
```

#### Errores
- **403 Forbidden** - No puedes editar plantillas de otros o del sistema
- **400 Bad Request** - No puedes usar preguntas de otros nutricionistas

---

### 3. Actualizar Pregunta en Plantilla
**PATCH** `/api/user/plantillas/{plantilla_id}/preguntas/{pregunta_id}/`

#### Request Body
```json
{
  "orden": 2,
  "visible": false
}
```

#### Respuesta (200 OK)
```json
{
  "id": 10,
  "pregunta": {...},
  "orden": 2,
  "requerido_en_plantilla": false,
  "visible": false,
  "config": {...},
  "created_at": "2025-01-25T16:30:00Z"
}
```

---

### 4. Eliminar Pregunta de Plantilla
**DELETE** `/api/user/plantillas/{plantilla_id}/preguntas/{pregunta_id}/`

#### Respuesta (204 No Content)

---

## 🔐 Permisos y Validaciones

### Permisos
- ✅ Solo **nutricionistas autenticados** pueden acceder
- ✅ Solo el **owner** puede editar/eliminar sus plantillas
- ❌ No se pueden editar plantillas del sistema (owner=null)
- ❌ No se pueden editar plantillas de otros nutricionistas
- ✅ Cualquier nutricionista puede **duplicar** plantillas del sistema

### Validaciones
- ✅ Solo una plantilla predeterminada por tipo_consulta por owner
- ✅ No se pueden usar preguntas personalizadas de otros nutricionistas
- ✅ `preguntas` array en create/update es opcional
- ✅ Unique constraint: plantilla + pregunta (no duplicados)

---

## 💡 Ejemplos de Uso

### Flujo Típico 1: Crear Plantilla desde Cero

```javascript
// 1. Obtener preguntas disponibles
const preguntas = await fetch('/api/user/preguntas/').then(r => r.json());

// 2. Crear plantilla
const nuevaPlantilla = await fetch('/api/user/plantillas/', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    nombre: 'Mi Plantilla Deportistas',
    tipo_consulta: 'INICIAL',
    es_predeterminada: true,
    preguntas: preguntas.slice(0, 5).map((p, i) => ({
      pregunta_id: p.id,
      orden: i,
      requerido_en_plantilla: true,
      visible: true,
      config: {}
    }))
  })
});
```

### Flujo Típico 2: Duplicar y Personalizar

```javascript
// 1. Duplicar plantilla del sistema
const copiada = await fetch('/api/user/plantillas/1/duplicar/', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    nuevo_nombre: 'Mi Plantilla Personalizada'
  })
}).then(r => r.json());

// 2. Modificar preguntas (agregar una nueva)
await fetch(`/api/user/plantillas/${copiada.id}/preguntas/`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    pregunta_id: 99,
    orden: 10,
    requerido_en_plantilla: false,
    visible: true,
    config: {}
  })
});
```

### Flujo Típico 3: Usar Plantilla en Consulta

```javascript
// 1. Obtener plantilla predeterminada
const predeterminada = await fetch(
  '/api/user/plantillas/predeterminadas/?tipo_consulta=INICIAL'
).then(r => r.json())[0];

// 2. Generar snapshot (backend lo hace automáticamente)
const consulta = await fetch('/api/user/consultas/inicial/', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    paciente_id: 123,
    plantilla_usada: predeterminada.id,  // FK
    respuestas: [...],
    metricas: {...}
    // El backend genera plantilla_snapshot automáticamente
  })
});
```

---

## 🧪 Testing con cURL

```bash
# Listar plantillas
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/user/plantillas/

# Crear plantilla
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test","tipo_consulta":"INICIAL","preguntas":[]}' \
  http://localhost:8000/api/user/plantillas/

# Duplicar plantilla
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nuevo_nombre":"Copia Test"}' \
  http://localhost:8000/api/user/plantillas/1/duplicar/

# Obtener detalle
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/user/plantillas/1/

# Eliminar plantilla
curl -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/user/plantillas/2/
```
