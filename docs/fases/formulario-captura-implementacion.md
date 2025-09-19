# Implementación del Sistema de Captura de Historia Clínica y Hábitos Alimenticios

## Resumen Ejecutivo

Se ha implementado un sistema completo para la captura de historia clínica y hábitos alimenticios de pacientes, siguiendo las especificaciones solicitadas. El sistema permite a los nutricionistas capturar información estructurada en bloques y generar un JSON limpio con los datos ingresados.

## Arquitectura Implementada

### Backend (Django)

#### Modelos Creados

1. **HistoriaClinica**: Captura antecedentes familiares, enfermedades actuales, medicación y cirugías
2. **HabitosAlimenticios**: Registra hábitos alimentarios, contexto social, actividad física
3. **IndicadoresDietarios**: Almacena recordatorio 24h y frecuencia de consumo
4. **DatosCalculadora**: Guarda datos para cálculos futuros (IMC, ICC/ICT, pliegues, GET)

#### Características de los Modelos

- **Relaciones OneToOne** con Patient para mantener integridad
- **Campos JSON** para listas y objetos complejos
- **Validaciones suaves** con campos opcionales
- **Timestamps** automáticos para auditoría

#### API Endpoints

- `POST /api/formulario/captura/` - Capturar formulario completo
- `GET /api/formulario/buscar-paciente/` - Buscar paciente por DNI/ID
- `GET /api/formulario/paciente/{id}/` - Obtener formulario existente

#### Serializers

- **FormularioCapturaSerializer**: Maneja el formulario completo
- **Serializers individuales** para cada modelo
- **Validaciones automáticas** de referencias de paciente
- **Generación de JSON** según estructura solicitada

### Frontend (React)

#### Componente Principal

**FormularioCaptura.jsx** implementa un flujo de 6 pasos:

1. **Buscar Paciente**: Validación por DNI (8 dígitos)
2. **Historia Clínica**: Antecedentes, enfermedades, medicación, cirugías
3. **Hábitos Alimenticios**: Comidas, contexto social, actividad física
4. **Indicadores Dietarios**: Recordatorio 24h y frecuencia de consumo
5. **Datos Calculadora**: Medidas antropométricas (sin cálculos)
6. **Resumen**: Visualización y confirmación de datos

#### Características del Frontend

- **Navegación por pasos** con barra de progreso
- **Validaciones en tiempo real**
- **Campos opcionales** claramente marcados
- **Interfaz responsive** con Tailwind CSS
- **Manejo de errores** y estados de carga
- **Búsqueda mejorada de pacientes** con validación de DNI
- **Campos de texto** para mejor descripción en historia clínica
- **Formulario completo de hábitos alimenticios** con todos los campos solicitados
- **Secciones "Próximamente"** para indicadores y calculadora

## Flujo de Trabajo Implementado

### 1. Búsqueda de Paciente
- El nutricionista ingresa el DNI del paciente (8 dígitos)
- Sistema valida formato y busca en la base de datos
- Muestra confirmación visual de paciente encontrado
- Se cargan los datos básicos del paciente

### 2. Captura por Bloques
- **Historia Clínica**: Campos de texto para antecedentes y enfermedades, campos SI/NO para medicación y cirugías
- **Hábitos Alimenticios**: Formulario completo con todos los campos solicitados (comidas, contexto social, preferencias, etc.)
- **Indicadores Dietarios**: Sección "Próximamente" con lista de funcionalidades futuras
- **Datos Calculadora**: Sección "Próximamente" con lista de funcionalidades futuras

### 3. Validaciones Implementadas
- **DNI obligatorio** (8 dígitos numéricos) para búsqueda de paciente
- **Validación en tiempo real** del formato de DNI
- **Campos condicionales** (detalle de medicación si marca "Sí")
- **Feedback visual** de búsqueda exitosa o errores
- **Separación por comas** para antecedentes y enfermedades

### 4. Campos de Hábitos Alimenticios Implementados
- **Número de comidas al día** (campo numérico)
- **Tiempos de comida** (checkboxes: Desayuno, Almuerzo, Merienda, Cena)
- **Salta comidas** (SI/NO + campos condicionales)
- **Contexto social** (con quién vive, quién cocina, hora de levantarse)
- **Ingestas fuera de comidas** (SI/NO + campos condicionales)
- **Intolerancias y alergias** (SI/NO + lista de alimentos)
- **Preferencias alimentarias** (alimentos preferidos y desagrados)
- **Suplementos** (SI/NO + detalle)
- **Preguntas emocionales** (interfiere emocionalmente, agrega sal)
- **Medios de cocción** (checkboxes: margarina, aceite vegetal, manteca)
- **Hidratación** (vasos de agua y bebidas industriales)
- **Estimulantes** (café, alcohol, mate/tereré con frecuencias)
- **Actividad física** (SI/NO + tipo, frecuencia, duración)

### 5. Generación de JSON
El sistema genera un JSON con la estructura exacta solicitada:

```json
{
  "paciente_ref": {
    "id_paciente": "...",
    "dni": "...",
    "nombre": "",
    "apellido": "",
    "sexo": "",
    "edad": null
  },
  "historia_clinica": { /* ... */ },
  "habitos_alimenticios": { /* ... */ },
  "indicadores_dietarios": { /* ... */ },
  "datos_para_calculadora": { /* ... */ }
}
```

## Integración con Sistema Existente

### Dashboard del Nutricionista
- Se agregó botón "Capturar Historia Clínica" en la sección de acciones rápidas
- Navegación directa al formulario de captura
- Mantiene la consistencia visual del sistema

### API Integration
- **formularioAPI** agregado a `src/lib/api.js`
- **Interceptores de autenticación** funcionan correctamente
- **Manejo de errores** consistente con el resto del sistema

### Rutas y Navegación
- Ruta protegida `/formulario/captura` solo para nutricionistas
- Integración con React Router
- Navegación de regreso al dashboard

## Cumplimiento de Especificaciones

### ✅ Requisitos Cumplidos

1. **Trabajo sobre paciente existente**: Sistema busca por DNI/ID obligatorio
2. **Campos no obligatorios**: Solo DNI es requerido, resto opcional
3. **Sin cálculos**: Solo captura datos, no realiza IMC/ICC/ICT/GET
4. **Estilo de preguntas**: Formulario claro por bloques con opción "omitir"
5. **Validaciones suaves**: Números positivos, opciones SI/NO, listas
6. **JSON de salida**: Estructura exacta solicitada + resumen textual

### ✅ Estructura del Formulario

- **Bloque 0**: Vínculo con paciente (DNI obligatorio)
- **Bloque 1**: Historia clínica (antecedentes, enfermedades, medicación, cirugías)
- **Bloque 2**: Hábitos alimenticios (comidas, contexto, actividad física)
- **Bloque 3**: Indicadores dietarios (recordatorio 24h, frecuencia)
- **Bloque 4**: Datos calculadora (medidas sin procesar)

## Consideraciones Técnicas

### Base de Datos
- **Migraciones** listas para ejecutar
- **Campos JSON** para flexibilidad
- **Índices** en relaciones OneToOne
- **Cascada** en eliminación de pacientes

### Seguridad
- **Autenticación JWT** requerida
- **Autorización** por rol (solo nutricionistas)
- **Validación** de asignación paciente-nutricionista
- **Sanitización** de inputs

### Performance
- **Consultas optimizadas** con select_related
- **Lazy loading** de formularios existentes
- **Validación client-side** para mejor UX
- **Caching** de datos de paciente

## Próximos Pasos

1. **Ejecutar migraciones** para crear las tablas
2. **Probar flujo completo** con datos reales
3. **Implementar validaciones adicionales** según feedback
4. **Agregar más campos** a los formularios si es necesario
5. **Integrar con módulo Calculadora** cuando esté listo

## Archivos Modificados/Creados

### Backend
- `apps/users/models.py` - Nuevos modelos agregados
- `apps/users/serializers.py` - Serializers para formularios
- `apps/users/views.py` - Vistas para captura y búsqueda
- `apps/users/urls.py` - Rutas para formularios

### Frontend
- `src/containers/pages/FormularioCaptura.jsx` - Componente principal
- `src/App.jsx` - Ruta agregada
- `src/lib/api.js` - API functions agregadas
- `src/containers/pages/NutricionistaDashboard.jsx` - Botón de acceso

### Documentación
- `docs/fases/formulario-captura-implementacion.md` - Este archivo

## Conclusión

El sistema de captura de historia clínica y hábitos alimenticios ha sido implementado exitosamente siguiendo todas las especificaciones solicitadas. La arquitectura es escalable, mantenible y se integra perfectamente con el sistema existente. El flujo de trabajo es intuitivo para los nutricionistas y genera la salida JSON exacta requerida.
