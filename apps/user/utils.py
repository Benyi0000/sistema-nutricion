from django.utils import timezone

def _norm_item(item, user=None, prev=None):
    """
    Asegura campos de observación por ítem de 'respuestas':
      - observacion (str|null)
      - observacion_editada_por (id de usuario)
      - observacion_editada_en (iso datetime)
    Si el texto de 'observacion' cambió respecto a 'prev', registra trazabilidad.
    """
    if not isinstance(item, dict):
        return item

    prev_obs = ""
    if isinstance(prev, dict):
        prev_obs = (prev.get("observacion") or "").strip()

    new_obs = (item.get("observacion") or "").strip()

    # Garantizar claves presentes
    if "observacion" not in item:
        item["observacion"] = None
    if "observacion_editada_por" not in item:
        item["observacion_editada_por"] = None
    if "observacion_editada_en" not in item:
        item["observacion_editada_en"] = None

    # Trazabilidad si cambió el texto
    if new_obs != prev_obs and user is not None:
        item["observacion_editada_por"] = getattr(user, "id", None)
        item["observacion_editada_en"] = timezone.now().isoformat()

    return item


def normalize_respuestas(respuestas, user=None, previous=None):
    """
    Recorre 'respuestas' y aplica _norm_item.
    Si 'previous' existe (update), apareamos por 'pregunta' o 'codigo'.
    """
    prev_by_key = {}
    if isinstance(previous, list):
        for it in previous:
            if not isinstance(it, dict):
                continue
            key = it.get("pregunta") or it.get("codigo")
            if key is not None:
                prev_by_key[key] = it

    out = []
    for it in (respuestas or []):
        if not isinstance(it, dict):
            out.append(it)
            continue
        key = it.get("pregunta") or it.get("codigo")
        prev = prev_by_key.get(key) if key is not None else None
        out.append(_norm_item(it, user=user, prev=prev))
    return out
