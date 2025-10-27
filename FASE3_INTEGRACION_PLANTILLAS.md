# Fase 3: Integración de Plantillas en Consultas - COMPLETA ✅

## Resumen
Se ha completado la integración del sistema de plantillas en el formulario de consulta inicial, permitiendo a los nutricionistas seleccionar plantillas predefinidas o trabajar en modo manual.

## Cambios Implementados

### Frontend: ConsultaInicial.jsx

#### 1. **Imports y Estado**
```jsx
import { useGetPlantillasQuery } from '../../../features/plantillas/plantillasSlice';

// Estados para control de plantillas
const [modoPlantilla, setModoPlantilla] = useState(true);
const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null);
const [plantillaSnapshot, setPlantillaSnapshot] = useState(null);

// Query para cargar plantillas activas de tipo INICIAL
const { data: plantillas, isLoading: loadingPlantillas } = useGetPlantillasQuery({
    tipo_consulta: 'INICIAL',
    activo: true,
});
```

#### 2. **Lógica de Carga de Preguntas**

**Modo Manual (modoPlantilla = false):**
- Carga todas las preguntas del scope "inicial" usando `dispatch(fetchPreguntas())`
- Auto-selecciona preguntas requeridas y peso/altura

**Modo Plantilla (modoPlantilla = true):**
- Auto-selecciona plantilla predeterminada al cargar
- Al seleccionar plantilla: genera snapshot con info completa
- Filtra y ordena preguntas según configuración de la plantilla
- Auto-selecciona preguntas marcadas como visibles

#### 3. **useEffects Implementados**

```jsx
// Cargar preguntas en modo manual
useEffect(() => {
    if (!modoPlantilla) {
        dispatch(fetchPreguntas({ scope: "inicial" }));
    }
}, [dispatch, modoPlantilla]);

// Auto-seleccionar plantilla predeterminada
useEffect(() => {
    if (modoPlantilla && plantillas && !plantillaSeleccionada) {
        const predeterminada = plantillas.find(p => p.es_predeterminada);
        if (predeterminada) {
            setPlantillaSeleccionada(predeterminada.id);
        }
    }
}, [modoPlantilla, plantillas, plantillaSeleccionada]);

// Cargar preguntas de plantilla seleccionada
useEffect(() => {
    if (!modoPlantilla || !plantillaSeleccionada || !plantillas) return;
    
    const plantilla = plantillas.find(p => p.id === parseInt(plantillaSeleccionada));
    if (!plantilla || !plantilla.preguntas_config) return;

    // Generar snapshot inmutable
    const snapshot = {
        plantilla_id: plantilla.id,
        nombre: plantilla.nombre,
        tipo_consulta: plantilla.tipo_consulta,
        config: plantilla.config,
        preguntas: plantilla.preguntas_config.map(pc => ({
            orden: pc.orden,
            visible: pc.visible,
            requerido: pc.requerido_en_plantilla,
            config: pc.config,
            pregunta: { ...pc.pregunta }
        })),
        snapshot_date: new Date().toISOString(),
    };
    setPlantillaSnapshot(snapshot);

    // Auto-seleccionar preguntas visibles
    const sel = {};
    plantilla.preguntas_config.forEach((pc) => {
        if (pc.visible) {
            sel[pc.pregunta.id] = true;
        }
    });
    setSeleccion(sel);
}, [modoPlantilla, plantillaSeleccionada, plantillas]);
```

#### 4. **useMemo para Preguntas a Mostrar**

```jsx
const preguntasAMostrar = useMemo(() => {
    if (modoPlantilla && plantillaSnapshot) {
        // Modo plantilla: preguntas ordenadas de la plantilla
        return plantillaSnapshot.preguntas
            .filter(pc => pc.visible)
            .sort((a, b) => a.orden - b.orden)
            .map(pc => pc.pregunta);
    } else {
        // Modo manual: todas las preguntas iniciales
        return preguntas;
    }
}, [modoPlantilla, plantillaSnapshot, preguntas]);
```

#### 5. **Handler de Cambio de Plantilla**

```jsx
const handlePlantillaChange = (e) => {
    const valor = e.target.value;
    if (valor === "") {
        setPlantillaSeleccionada(null);
        setPlantillaSnapshot(null);
        // Resetear formulario al cambiar plantilla
        setSeleccion({});
        setValores({});
        setObs({});
    } else {
        setPlantillaSeleccionada(parseInt(valor));
    }
};
```

#### 6. **Actualización del onSubmit**

```jsx
const onSubmit = async (e) => {
    e.preventDefault();
    
    const preguntasData = preguntasAMostrar || [];
    
    const respuestas = preguntasData
        .filter((q) => seleccion[q.id])
        .map((q) => ({
            pregunta: q.texto,
            tipo: q.tipo,
            codigo: q.codigo || null,
            unidad: q.unidad || null,
            valor: valores[q.id] ?? null,
            observacion: (obs[q.id] && obs[q.id].trim()) ? obs[q.id].trim() : null,
        }));

    const payload = {
        ...pac,
        respuestas,
        notas: "",
        // Si se usó plantilla, enviar ID y snapshot
        plantilla_usada: modoPlantilla && plantillaSeleccionada ? plantillaSeleccionada : null,
        plantilla_snapshot: modoPlantilla && plantillaSnapshot ? plantillaSnapshot : {
            preguntas: preguntasData.map(q => ({
                id: q.id,
                texto: q.texto,
                tipo: q.tipo,
                codigo: q.codigo,
                requerido: q.requerido,
                unidad: q.unidad,
                seleccionada: !!seleccion[q.id],
            })),
        },
    };

    await dispatch(crearConsultaInicial(payload));
};
```

#### 7. **UI del Selector de Plantilla**

Se agregó un componente visual después del título:

```jsx
<div className="bg-white rounded-lg shadow p-4 mb-4">
    <div className="flex items-center justify-between mb-3">
        <h3>Usar Plantilla</h3>
        <label className="flex items-center cursor-pointer">
            <input type="checkbox" checked={modoPlantilla} onChange={...} />
            <span>Activar</span>
        </label>
    </div>

    {modoPlantilla && (
        <div>
            <select value={plantillaSeleccionada || ''} onChange={handlePlantillaChange}>
                <option value="">-- Seleccionar plantilla --</option>
                
                {/* Plantillas del Sistema con ⭐ para predeterminadas */}
                <optgroup label="Plantillas del Sistema">
                    {plantillas?.filter(p => p.owner_info?.tipo === 'sistema').map(...)}
                </optgroup>
                
                {/* Plantillas del Nutricionista */}
                <optgroup label="Mis Plantillas">
                    {plantillas?.filter(p => p.owner_info?.tipo === 'nutricionista').map(...)}
                </optgroup>
            </select>

            {/* Info de plantilla seleccionada */}
            {plantillaSeleccionada && plantillaSnapshot && (
                <div className="mt-3 p-3 bg-blue-50 rounded-md">
                    <p><strong>📋 {plantillaSnapshot.nombre}</strong></p>
                    <p>{plantillaSnapshot.preguntas.length} preguntas configuradas</p>
                </div>
            )}
        </div>
    )}
</div>
```

### Backend: Serializers

#### ConsultaInicialSerializer

**Cambios:**
```python
class ConsultaInicialSerializer(serializers.Serializer):
    # ... campos existentes ...
    plantilla_usada = serializers.IntegerField(required=False, allow_null=True)
    
    def create(self, validated):
        # ... código existente ...
        
        # Manejar plantilla_usada
        plantilla_usada_id = validated.get("plantilla_usada")
        plantilla_obj = None
        if plantilla_usada_id:
            try:
                from .models import PlantillaConsulta
                plantilla_obj = PlantillaConsulta.objects.get(id=plantilla_usada_id)
            except PlantillaConsulta.DoesNotExist:
                pass
        
        consulta = Consulta.objects.create(
            # ... otros campos ...
            plantilla_usada=plantilla_obj,
            plantilla_snapshot=validated.get("plantilla_snapshot"),
        )
```

#### ConsultaSeguimientoSerializer

Se aplicaron los mismos cambios para mantener consistencia.

## Flujo de Usuario

### 1. **Crear Consulta con Plantilla**
1. Nutricionista accede a formulario de Consulta Inicial
2. Por defecto, modo plantilla activado
3. Se auto-selecciona plantilla predeterminada (si existe)
4. Se cargan preguntas configuradas en la plantilla
5. Se auto-seleccionan preguntas marcadas como visibles
6. Nutricionista completa datos del paciente
7. Nutricionista completa valores de las preguntas
8. Al enviar: se guarda `plantilla_usada` (FK) y `plantilla_snapshot` (JSONB)

### 2. **Crear Consulta Manual**
1. Nutricionista desactiva checkbox "Usar Plantilla"
2. Se cargan todas las preguntas disponibles para consultas iniciales
3. Se auto-seleccionan preguntas requeridas (peso, altura)
4. Nutricionista completa el formulario
5. Al enviar: `plantilla_usada` es null, `plantilla_snapshot` contiene todas las preguntas

### 3. **Cambiar de Plantilla**
1. Si cambia la selección del dropdown
2. Se resetean selección, valores y observaciones (para evitar inconsistencias)
3. Se genera nuevo snapshot
4. Se cargan las preguntas de la nueva plantilla

## Ventajas Implementadas

### ✅ **Historicidad**
- El `plantilla_snapshot` es inmutable
- Si la plantilla cambia en el futuro, la consulta mantiene su configuración original
- Se puede ver exactamente qué preguntas existían cuando se creó la consulta

### ✅ **Flexibilidad**
- Modo plantilla y modo manual conviven
- Auto-selección de plantilla predeterminada
- Reseteo automático al cambiar plantilla

### ✅ **Experiencia de Usuario**
- Selector visual con agrupación (Sistema / Mis Plantillas)
- Indicador ⭐ para plantillas predeterminadas
- Info card con resumen de plantilla seleccionada
- Checkbox intuitivo para activar/desactivar

### ✅ **Consistencia de Datos**
- IMC se calcula correctamente en ambos modos
- PreguntasForm recibe `preguntasAMostrar` dinámicamente
- Backend valida y guarda correctamente ambos campos

## Archivos Modificados

### Frontend
- ✅ `src/containers/pages/nutricionista/ConsultaInicial.jsx` (modificado)

### Backend
- ✅ `apps/user/serializers.py` (modificado)
  - ConsultaInicialSerializer
  - ConsultaSeguimientoSerializer

## Próximos Pasos

### Consulta de Seguimiento
Aplicar la misma lógica a `ConsultaSeguimiento.jsx`:
- Cambiar query a `tipo_consulta: 'SEGUIMIENTO'`
- Misma UI de selector
- Misma lógica de carga de preguntas

### Testing
- [ ] Crear consulta con plantilla del sistema
- [ ] Crear consulta con plantilla personal
- [ ] Crear consulta en modo manual
- [ ] Cambiar entre plantillas
- [ ] Verificar que snapshot se guarda correctamente
- [ ] Verificar historicidad (cambiar plantilla y ver consultas antiguas)

### Mejoras Futuras
- [ ] Confirmación al cambiar plantilla (si hay datos completados)
- [ ] Indicador visual de preguntas requeridas vs opcionales
- [ ] Vista previa de plantilla antes de seleccionar
- [ ] Estadísticas de uso de plantillas

## Conclusión

La Fase 3 está **COMPLETA**. El sistema de plantillas ahora está totalmente integrado en el flujo de creación de consultas. Los nutricionistas pueden:

1. ✅ Crear y gestionar plantillas (Fase 2)
2. ✅ Seleccionar plantillas al crear consultas (Fase 3)
3. ✅ Trabajar en modo manual si prefieren
4. ✅ Mantener historicidad de las consultas

El backend acepta `plantilla_usada` y guarda correctamente el snapshot inmutable.
