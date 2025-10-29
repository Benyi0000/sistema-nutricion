# ✅ Implementación Completa de Buffers

## 📋 Resumen
Se implementó el sistema completo de **buffers antes y después de cada consulta** para evitar solapamientos y dar tiempo de preparación/finalización entre turnos.

## 🔧 ¿Qué son los Buffers?

Los buffers son **tiempos adicionales bloqueados** antes y después de cada consulta:

### Buffer Antes (Preparación)
- ⏰ Tiempo para **preparar** la consulta
- Revisar historial del paciente
- Preparar el consultorio
- Revisar materiales necesarios

### Buffer Después (Finalización)
- 📝 Tiempo para **completar** tareas post-consulta
- Escribir notas clínicas
- Actualizar registros
- Limpiar/ventilar el consultorio
- Atender retrasos sin afectar el siguiente turno

## 📊 Ejemplo Visual

```
Sin Buffers (PROBLEMA):
═════════════════════════════════════════════════
10:00 ───── 11:00 | 11:00 ───── 12:00
  Turno 1            Turno 2
❌ Sin tiempo entre turnos - imposible preparar

Con Buffers (SOLUCIÓN):
═════════════════════════════════════════════════
09:45 ─── 10:00 ═══════ 11:00 ─── 11:30 | 11:45 ─── 12:00 ═══════ 13:00 ─── 13:30
  ↑       ↑                ↑      ↑         ↑       ↑                ↑      ↑
Buffer  Turno 1         Turno 1  Buffer   Buffer  Turno 2         Turno 2  Buffer
antes   inicia          termina  después  antes   inicia          termina  después

✅ 15 min para preparar antes
✅ 30 min para finalizar después
✅ Sin solapamientos
```

## 🎯 Configuración

### 1. Buffers Globales (ProfessionalSettings)
En `/panel/nutri/agenda/configuracion`:

```
Buffer antes (minutos): 15
Buffer después (minutos): 30
```

Aplica a **todos** los tipos de consulta por defecto.

### 2. Buffers por Tipo de Consulta (TipoConsultaConfig)
En `/panel/nutri/agenda/consultas`:

```
Consulta Inicial:
  - Duración: 60 min
  - Buffer antes: 20 min  ← Más tiempo para revisar historial
  - Buffer después: 40 min ← Más tiempo para notas completas

Consulta de Seguimiento:
  - Duración: 30 min
  - Buffer antes: 10 min  ← Menos preparación necesaria
  - Buffer después: 20 min ← Menos documentación
```

**Prioridad**: Los buffers del **tipo de consulta específico** tienen prioridad sobre los globales.

## 🔄 Funcionamiento Técnico

### Backend

#### 1. Generación de Slots (`apps/agenda/utils.py`)

```python
# Cálculo de tiempo total
total_duration = buffer_before + consulta + buffer_after

# Ejemplo:
# Buffer antes: 15 min
# Consulta: 60 min
# Buffer después: 30 min
# Total bloqueado: 105 min

# Al paciente se le muestra solo la consulta (60 min)
# Pero internamente se bloquean 105 min
```

**Proceso:**
1. Obtener buffers del `TipoConsultaConfig` o `ProfessionalSettings`
2. Calcular rango total: `[inicio - buffer_antes, fin + buffer_despues]`
3. Verificar que NO se solape con:
   - Otros turnos + sus buffers
   - Bloqueos
   - Límites de disponibilidad
4. Retornar solo el horario de consulta al frontend

#### 2. Validación al Crear Turno (`apps/agenda/views.py`)

```python
# Ejemplo turno nuevo: 10:00 - 11:00 (60 min)
# Buffer antes: 15 min
# Buffer después: 30 min
# Rango total: 09:45 - 11:30

# Verificar contra turno existente: 11:00 - 12:00
# Buffer antes: 10 min (del turno existente)
# Buffer después: 20 min
# Rango total existente: 10:50 - 12:20

# Solapamiento detectado:
# Nuevo: 09:45 ────────── 11:30
# Existente:     10:50 ──────────── 12:20
#                  ↑ OVERLAP ↑

# ❌ Rechazo: "El horario seleccionado no está disponible 
#             (incluyendo tiempos de preparación)"
```

#### 3. Validación al Aprobar Turno

Mismo proceso de validación cuando el nutricionista aprueba un turno tentativo.

### Frontend

#### 1. API Query (`agendaApiSlice.js`)

```javascript
getAvailableSlots: builder.query({
  query: ({ nutricionistaId, fechaInicio, fechaFin, tipoConsultaId }) => {
    // Pasar tipoConsultaId para obtener buffers específicos
    let url = `nutricionista/${nutricionistaId}/slots/...`;
    if (tipoConsultaId) {
      url += `&tipo_consulta_id=${tipoConsultaId}`;
    }
    return url;
  }
})
```

#### 2. Componente de Reserva (`TurnosViewPage.jsx`)

```javascript
const { data: availableSlots } = useGetAvailableSlotsQuery({
  nutricionistaId,
  fechaInicio,
  fechaFin,
  tipoConsultaId: selectedTipoConsulta?.id  // ← IMPORTANTE
});

// Los slots retornados YA tienen buffers aplicados
// Solo se muestran horarios realmente disponibles
```

#### 3. UI Mejorada

**ProfessionalSettingsEdit.jsx:**
```jsx
<label>
  <span>⏰ Buffer antes (minutos)</span>
  <span className="text-xs text-gray-500">
    Tiempo de preparación antes de cada consulta
  </span>
  <input type="number" min="0" />
  <span className="text-xs text-gray-400">
    Este tiempo se bloquea automáticamente antes de cada turno
  </span>
</label>
```

**TipoConsultaListEdit.jsx:**
- Emojis para identificación visual (⏰📝)
- Explicaciones detalladas
- Indicación de bloqueo automático

## 📝 Flujo Completo

### Escenario: Paciente Reserva Turno

1. **Paciente selecciona:**
   - Tipo consulta: "Inicial" (60 min, buffer antes 20 min, buffer después 40 min)
   - Fecha: Hoy
   - Ubicación: Consultorio Centro

2. **Frontend solicita slots:**
   ```javascript
   GET /api/agenda/nutricionista/1/slots/
     ?fecha_inicio=2025-10-28T00:00:00
     &fecha_fin=2025-10-28T23:59:59
     &tipo_consulta_id=3
   ```

3. **Backend calcula:**
   ```python
   # Para cada slot potencial de la disponibilidad:
   for horario in disponibilidad:
       # Expandir con buffers
       slot_total = [horario.inicio - 20min, horario.fin + 40min]
       
       # Verificar contra turnos existentes (con SUS buffers)
       for turno_existente in turnos:
           turno_total = [
               turno.inicio - turno.buffer_antes,
               turno.fin + turno.buffer_despues
           ]
           
           if overlap(slot_total, turno_total):
               # ❌ Descartar este slot
               continue
       
       # ✅ Slot disponible
       slots_disponibles.append({
           'inicio': horario.inicio,  # Solo la consulta
           'fin': horario.fin
       })
   ```

4. **Frontend muestra slots:**
   ```
   Horarios disponibles:
   □ 10:00 - 11:00  ← Paciente ve solo esto
   □ 14:00 - 15:00
   □ 16:00 - 17:00
   ```

5. **Paciente confirma:** 10:00 - 11:00

6. **Backend valida:**
   ```python
   # Crear rango con buffers
   turno_total = [09:40, 11:40]  # 20 min antes, 40 min después
   
   # Verificar solapamiento
   for turno in turnos_existentes:
       if overlap(turno_total, turno_con_sus_buffers):
           raise ValidationError(
               "El horario seleccionado no está disponible..."
           )
   
   # ✅ Guardar turno
   ```

7. **Turno guardado:**
   ```
   Turno: 10:00 - 11:00 (visible)
   Bloqueado realmente: 09:40 - 11:40 (interno)
   ```

## ✅ Beneficios

1. **🚫 Evita Solapamientos**
   - Imposible reservar turnos muy cercanos
   - Los buffers se consideran automáticamente

2. **⏱️ Tiempo de Calidad**
   - Preparación adecuada antes
   - Finalización sin prisas después

3. **😌 Reduce Estrés**
   - No correr entre consultas
   - Tiempo para tareas administrativas

4. **📊 Configuración Flexible**
   - Buffers globales para todos
   - Buffers específicos por tipo de consulta
   - Ajustables en cualquier momento

5. **🔄 Automático y Transparente**
   - Se aplica sin intervención manual
   - El paciente no ve complejidad técnica
   - Solo ve horarios realmente disponibles

## 🎨 Ejemplo Real

```
Configuración Nutricionista:
═══════════════════════════════════════════════════════════════

Consulta Inicial (Primera Vez):
  Duración: 90 minutos
  Buffer antes: 30 min  ← Revisar historial completo
  Buffer después: 45 min ← Notas detalladas, plan nutricional
  Total bloqueado: 165 min (2h 45min)

Consulta de Seguimiento:
  Duración: 45 minutos
  Buffer antes: 15 min  ← Revisar última consulta
  Buffer después: 30 min ← Actualizar plan
  Total bloqueado: 90 min (1h 30min)

Control Peso:
  Duración: 15 minutos
  Buffer antes: 5 min   ← Mínima preparación
  Buffer después: 10 min ← Registro rápido
  Total bloqueado: 30 min

═══════════════════════════════════════════════════════════════

Agenda del día (lo que ve el nutricionista):
───────────────────────────────────────────────────────────────
08:00 - 09:30 | Consulta Inicial - Juan Pérez
              | (Bloqueado: 07:30 - 10:15)

10:30 - 11:15 | Seguimiento - María García  
              | (Bloqueado: 10:15 - 11:45)

12:00 - 12:15 | Control Peso - Carlos López
              | (Bloqueado: 11:55 - 12:25)

14:00 - 15:30 | Consulta Inicial - Ana Martínez
              | (Bloqueado: 13:30 - 16:15)

16:30 - 17:15 | Seguimiento - Pedro Sánchez
              | (Bloqueado: 16:15 - 17:45)
───────────────────────────────────────────────────────────────
```

## 🔍 Testing

Para probar que funciona:

1. **Configurar buffers:**
   - Ir a `/panel/nutri/agenda/configuracion`
   - Buffer antes: 15 min
   - Buffer después: 30 min
   - Guardar

2. **Configurar tipo de consulta:**
   - Ir a `/panel/nutri/agenda/consultas`
   - Editar "Consulta Inicial"
   - Duración: 60 min
   - Buffer antes: 20 min
   - Buffer después: 40 min
   - Guardar

3. **Crear disponibilidad:**
   - Horario: 10:00 - 14:00
   - Día: Lunes

4. **Intentar reservar como paciente:**
   - Seleccionar "Consulta Inicial"
   - Ver slots disponibles
   - Debería mostrar: 10:00-11:00, 11:40-12:40 (no 11:00-12:00)

5. **Reservar primer slot:** 10:00-11:00
   - Bloqueo real: 09:40-11:40

6. **Intentar reservar:** 11:00-12:00
   - ❌ Error: "No disponible (incluyendo tiempos de preparación)"
   - ✅ Buffers funcionando!

## 📚 Archivos Modificados

### Backend
- ✅ `apps/agenda/models.py` - Campos ya existían
- ✅ `apps/agenda/utils.py` - Generación de slots con buffers
- ✅ `apps/agenda/views.py` - Validación con buffers en create y aprobar

### Frontend
- ✅ `src/features/agenda/agendaApiSlice.js` - Pasar tipoConsultaId
- ✅ `src/containers/pages/paciente/TurnosViewPage.jsx` - Usar tipoConsultaId
- ✅ `src/features/agenda/components/Nutricionista/ProfessionalSettingsEdit.jsx` - UI mejorada
- ✅ `src/containers/pages/nutricionista/TipoConsultaListEdit.jsx` - UI mejorada

## 🎉 Resultado Final

Los buffers ahora funcionan **completamente automatizados**:
- ✅ Se aplican en generación de slots
- ✅ Se validan al crear turnos
- ✅ Se validan al aprobar turnos
- ✅ UI explicativa para configuración
- ✅ Transparente para el paciente
- ✅ Flexible por tipo de consulta
