# Registro de Comidas - Funcionalidad Completa

## 📸 Sistema de Fotos de Comidas

Esta funcionalidad permite a los pacientes documentar sus comidas mediante fotos y a los nutricionistas revisarlas y comentarlas para un mejor seguimiento nutricional.

---

## ✨ Características Principales

### Para Pacientes
- ✅ Subir fotos de sus comidas
- ✅ Especificar tipo de comida (desayuno, almuerzo, merienda, etc.)
- ✅ Agregar descripción y notas
- ✅ Ver historial de fotos subidas
- ✅ Ver comentarios del nutricionista
- ✅ Filtrar por fecha y tipo de comida
- ✅ Eliminar sus propias fotos

### Para Nutricionistas
- ✅ Ver todas las fotos de comidas de sus pacientes
- ✅ Filtrar por paciente, fecha, tipo de comida
- ✅ Ver fotos pendientes de revisión
- ✅ Agregar comentarios nutricionales
- ✅ Estimar calorías de las comidas
- ✅ Ver estadísticas de comidas por paciente
- ✅ Historial completo de consultas con filtros avanzados

---

## 📊 Modelo de Datos: `MealPhoto`

### Campos Principales

```python
class MealPhoto(models.Model):
    # Relación
    patient: ForeignKey -> Patient
    
    # Información de la comida
    meal_type: CharField  # breakfast, lunch, dinner, etc.
    meal_date: DateField  # Fecha de la comida
    meal_time: TimeField  # Hora de la comida
    photo: ImageField     # Foto de la comida
    
    # Descripción
    description: TextField           # Descripción del paciente
    notes: TextField                 # Notas adicionales
    estimated_calories: IntegerField # Calorías estimadas (opcional)
    
    # Revisión del nutricionista
    nutritionist_comment: TextField  # Comentario del nutricionista
    reviewed_by: ForeignKey -> User  # Nutricionista que revisó
    reviewed_at: DateTimeField       # Fecha de revisión
    
    # Propiedades
    is_reviewed: bool  # True si fue revisada por nutricionista
```

### Tipos de Comida Disponibles
- `breakfast` - Desayuno
- `morning_snack` - Colación Media Mañana
- `lunch` - Almuerzo
- `afternoon_snack` - Merienda
- `dinner` - Cena
- `night_snack` - Colación Nocturna
- `other` - Otro

---

## 🔌 Endpoints API

### 1. Listar y Subir Fotos de Comidas

#### Listar Fotos (GET)
```
GET /api/meal-photos/
```

**Query Parameters (para nutricionistas):**
- `patient_id`: Filtrar por paciente específico
- `meal_type`: Filtrar por tipo de comida (breakfast, lunch, etc.)
- `start_date`: Fecha de inicio (YYYY-MM-DD)
- `end_date`: Fecha de fin (YYYY-MM-DD)
- `reviewed`: Filtrar por revisadas (true/false)

**Query Parameters (para pacientes):**
- `meal_type`: Filtrar por tipo de comida
- `start_date`: Fecha de inicio
- `end_date`: Fecha de fin

**Response:**
```json
[
  {
    "id": 1,
    "patient": 1,
    "patient_name": "Juan Pérez",
    "patient_dni": "12345678",
    "meal_type": "breakfast",
    "meal_date": "2025-10-27",
    "meal_time": "08:30:00",
    "photo": "/media/meal_photos/foto.jpg",
    "photo_url": "http://localhost:8000/media/meal_photos/foto.jpg",
    "description": "Desayuno saludable con frutas",
    "notes": "Me sentí con mucha energía después",
    "estimated_calories": 350,
    "nutritionist_comment": "Excelente elección de alimentos",
    "reviewed_by": 2,
    "reviewed_by_name": "Dra. María García",
    "reviewed_at": "2025-10-27T10:00:00Z",
    "is_reviewed": true,
    "created_at": "2025-10-27T08:35:00Z",
    "updated_at": "2025-10-27T10:00:00Z"
  }
]
```

#### Subir Foto (POST) - Solo para Pacientes
```
POST /api/meal-photos/
Content-Type: multipart/form-data
```

**Body (Form Data):**
```
meal_type: "breakfast"
meal_date: "2025-10-27"
meal_time: "08:30"
photo: [archivo de imagen]
description: "Desayuno saludable"
notes: "Incluye avena, frutas y yogurt"
estimated_calories: 350  (opcional)
```

**Validaciones:**
- ✅ Imagen máximo 5MB
- ✅ Formatos: JPEG, PNG, GIF, WEBP
- ✅ Fecha no puede ser futura
- ✅ Solo pacientes pueden subir fotos

**Response:**
```json
{
  "id": 1,
  "meal_type": "breakfast",
  "meal_date": "2025-10-27",
  "meal_time": "08:30:00",
  "photo_url": "http://localhost:8000/media/meal_photos/foto.jpg",
  "description": "Desayuno saludable",
  "is_reviewed": false,
  "created_at": "2025-10-27T08:35:00Z"
}
```

---

### 2. Ver, Editar y Eliminar Foto

```
GET    /api/meal-photos/{id}/
PUT    /api/meal-photos/{id}/
DELETE /api/meal-photos/{id}/
```

**Permisos:**
- **Nutricionista**: Ver y editar fotos de sus pacientes (NO puede eliminar)
- **Paciente**: Ver, editar y eliminar solo sus propias fotos

---

### 3. Revisar Foto de Comida (Nutricionista)

```
PUT /api/meal-photos/{id}/review/
```

**Body:**
```json
{
  "nutritionist_comment": "Excelente elección de alimentos. La combinación de proteínas y carbohidratos es ideal para el desayuno.",
  "estimated_calories": 350
}
```

**Función:**
- Agrega comentario del nutricionista
- Estima calorías (opcional)
- Marca automáticamente como revisada
- Registra quién revisó y cuándo

**Response:**
```json
{
  "id": 1,
  "nutritionist_comment": "Excelente elección...",
  "estimated_calories": 350,
  "reviewed_by": 2,
  "reviewed_by_name": "Dra. María García",
  "reviewed_at": "2025-10-27T10:00:00Z",
  "is_reviewed": true
}
```

---

### 4. Estadísticas de Comidas del Paciente

```
GET /api/meal-photos/stats/{patient_id}/
```

**Response:**
```json
{
  "patient_id": 1,
  "patient_name": "Juan Pérez",
  "total_meals": 45,
  "reviewed_meals": 38,
  "pending_review": 7,
  "meals_by_type": {
    "breakfast": 15,
    "lunch": 15,
    "dinner": 12,
    "morning_snack": 2,
    "afternoon_snack": 1
  },
  "last_meal_date": "2025-10-27"
}
```

**Permisos:**
- **Nutricionista**: Ver estadísticas de sus pacientes
- **Paciente**: Ver solo sus propias estadísticas

---

## 📋 Historial de Consultas para Nutricionistas

### 1. Historial Completo del Nutricionista

```
GET /api/consultations/history/
```

**Query Parameters:**
- `patient_id`: Filtrar por paciente
- `consultation_type`: Tipo (inicial o seguimiento)
- `start_date`: Fecha de inicio
- `end_date`: Fecha de fin

**Response:**
```json
{
  "consultations": [
    {
      "id": 1,
      "patient": 1,
      "patient_name": "Juan Pérez",
      "nutritionist_name": "Dra. María García",
      "consultation_type": "inicial",
      "date": "2025-10-15T10:00:00Z",
      "notes": "Primera consulta...",
      "measurements": {
        "weight": 75.5,
        "height": 1.75,
        "bmi": 24.65,
        "tmb": 1650,
        "get_value": 2280
      },
      "documents": []
    }
  ],
  "stats": {
    "total_consultations": 25,
    "by_type": {
      "inicial": 5,
      "seguimiento": 20
    },
    "unique_patients": 8
  }
}
```

---

### 2. Historial de Consultas de un Paciente Específico

```
GET /api/consultations/history/patient/{patient_id}/
```

**Query Parameters:**
- `consultation_type`: Tipo de consulta
- `start_date`: Fecha de inicio
- `end_date`: Fecha de fin

**Response:**
```json
{
  "patient": {
    "id": 1,
    "name": "Juan Pérez",
    "dni": "12345678",
    "email": "juan@example.com",
    "phone": "1234567890"
  },
  "consultations": [...],
  "total_consultations": 5,
  "measurements_evolution": [
    {
      "date": "2025-10-15",
      "weight": 75.5,
      "height": 1.75,
      "bmi": 24.65,
      "waist_hip_ratio": 0.85
    },
    {
      "date": "2025-09-15",
      "weight": 78.0,
      "height": 1.75,
      "bmi": 25.47,
      "waist_hip_ratio": 0.88
    }
  ]
}
```

**Características:**
- ✅ Historial completo de consultas
- ✅ Datos del paciente
- ✅ Evolución de medidas antropométricas
- ✅ Gráfico de evolución de peso e IMC
- ✅ Filtros por fecha y tipo

---

## 💡 Casos de Uso

### Caso 1: Paciente Registra su Desayuno

1. **Paciente inicia sesión**
2. **Navega a "Registro de Comidas"**
3. **Presiona "Subir Foto"**
4. **Completa el formulario:**
   - Selecciona tipo: "Desayuno"
   - Selecciona fecha y hora
   - Toma o selecciona foto
   - Agrega descripción: "Avena con frutas y yogurt"
   - Agrega notas: "Aproximadamente 1 taza de avena"
5. **Presiona "Guardar"**
6. **Foto se guarda y queda pendiente de revisión**

---

### Caso 2: Nutricionista Revisa Comidas del Paciente

1. **Nutricionista inicia sesión**
2. **Navega a "Pacientes" > Selecciona paciente**
3. **Ve sección "Fotos de Comidas"**
4. **Filtra por "Pendientes de Revisión"**
5. **Selecciona una foto**
6. **Ve la imagen y descripción del paciente**
7. **Agrega comentario:**
   ```
   "Excelente elección. La avena es una excelente fuente de fibra.
   Sugiero agregar proteína (huevo o frutos secos) para mejorar
   la saciedad. Estimación: 350 calorías."
   ```
8. **Ingresa calorías estimadas: 350**
9. **Presiona "Guardar Revisión"**
10. **Foto queda marcada como revisada**
11. **Paciente recibe notificación del comentario**

---

### Caso 3: Nutricionista Revisa Historial del Paciente

1. **Nutricionista selecciona paciente**
2. **Ve "Historial de Consultas"**
3. **Sistema muestra:**
   - Lista de todas las consultas
   - Gráfico de evolución de peso
   - Gráfico de evolución de IMC
   - Medidas antropométricas por consulta
4. **Aplica filtros:**
   - Últimos 3 meses
   - Solo consultas de seguimiento
5. **Exporta reporte en PDF o Excel**

---

## 🎨 Integración Frontend

### Componente de Subida de Foto (Paciente)

```javascript
// Ejemplo de uso
const UploadMealPhoto = () => {
  const handleUpload = async (formData) => {
    const response = await fetch('/api/meal-photos/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData  // multipart/form-data
    });
    
    const data = await response.json();
    // Mostrar confirmación
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <select name="meal_type">
        <option value="breakfast">Desayuno</option>
        <option value="lunch">Almuerzo</option>
        <option value="dinner">Cena</option>
        {/* ... más opciones */}
      </select>
      <input type="date" name="meal_date" />
      <input type="time" name="meal_time" />
      <input type="file" name="photo" accept="image/*" />
      <textarea name="description" />
      <button type="submit">Subir Foto</button>
    </form>
  );
};
```

---

### Vista de Galería de Comidas (Nutricionista)

```javascript
const MealGallery = ({ patientId }) => {
  const [meals, setMeals] = useState([]);
  const [filter, setFilter] = useState('pending'); // pending, all
  
  useEffect(() => {
    fetchMeals();
  }, [patientId, filter]);
  
  const fetchMeals = async () => {
    const reviewed = filter === 'pending' ? 'false' : '';
    const response = await fetch(
      `/api/meal-photos/?patient_id=${patientId}&reviewed=${reviewed}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    const data = await response.json();
    setMeals(data);
  };
  
  return (
    <div className="meal-gallery">
      <FilterButtons />
      <div className="grid">
        {meals.map(meal => (
          <MealCard 
            key={meal.id}
            meal={meal}
            onReview={handleReview}
          />
        ))}
      </div>
    </div>
  );
};
```

---

## 🔒 Seguridad y Validaciones

### Validaciones Implementadas

✅ **Tamaño de imagen**: Máximo 5MB
✅ **Formatos permitidos**: JPEG, PNG, GIF, WEBP
✅ **Fecha de comida**: No puede ser futura
✅ **Permisos de subida**: Solo pacientes
✅ **Permisos de revisión**: Solo nutricionistas
✅ **Permisos de eliminación**: Solo el paciente dueño
✅ **Acceso a fotos**: Solo nutricionista asignado o paciente dueño

---

## 📱 Recomendaciones de UX

### Para Pacientes
1. **Captura rápida**: Botón directo desde cámara
2. **Recordatorios**: Notificaciones para registrar comidas
3. **Vista previa**: Antes de subir la foto
4. **Feedback visual**: Indicador de fotos pendientes/revisadas
5. **Historial**: Ver todas las fotos en formato galería
6. **Búsqueda**: Filtrar por fecha y tipo de comida

### Para Nutricionistas
1. **Dashboard**: Contador de fotos pendientes por revisar
2. **Vista por paciente**: Galería organizada por paciente
3. **Revisión rápida**: Modal o slide-over para revisar sin cambiar de página
4. **Plantillas**: Comentarios predefinidos frecuentes
5. **Comparación**: Ver fotos side-by-side para analizar evolución
6. **Exportación**: Descargar fotos para informes

---

## 📊 Métricas y Analytics

### Estadísticas Disponibles

**Por Paciente:**
- Total de comidas registradas
- Comidas por tipo (desayuno, almuerzo, etc.)
- Tasa de adherencia (comidas registradas vs esperadas)
- Comidas revisadas vs pendientes
- Última comida registrada

**Por Nutricionista:**
- Total de comidas a revisar
- Comidas revisadas hoy/semana/mes
- Pacientes más activos
- Tipos de comida más registrados
- Promedio de calorías estimadas

---

## 🚀 Próximas Mejoras (Futuras)

### Versión 2.0
- [ ] Reconocimiento automático de alimentos con IA
- [ ] Estimación automática de calorías con ML
- [ ] Análisis nutricional automático
- [ ] Compartir fotos directamente desde WhatsApp
- [ ] Etiquetado de alimentos en la foto
- [ ] Comparación con plan nutricional asignado
- [ ] Sugerencias automáticas de mejora
- [ ] Gamificación (badges por adherencia)

---

## ✅ Checklist de Implementación

- [x] Modelo `MealPhoto` creado
- [x] Migraciones generadas
- [x] Serializers implementados
- [x] Vistas API completadas
- [x] URLs configuradas
- [x] Admin panel configurado
- [x] Validaciones de seguridad
- [x] Permisos por rol
- [x] Filtros y búsqueda
- [x] Estadísticas por paciente
- [x] Historial de consultas mejorado
- [x] Documentación completa

---

## 📞 Soporte

Para consultas sobre esta funcionalidad:
- Ver documentación de API en `/api/docs/` (si Swagger está habilitado)
- Revisar ejemplos en `docs/REGISTRO_DE_COMIDAS.md`
- Contactar al equipo de desarrollo

---

**Fecha de implementación:** Octubre 2025  
**Versión:** 2.1  
**Estado:** ✅ FUNCIONAL Y LISTO PARA PRODUCCIÓN


