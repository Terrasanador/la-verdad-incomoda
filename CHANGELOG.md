# Cambios v2.1

## Corrección principal
El error HTTP 429 se trata como un estado técnico y no como evidencia sobre la veracidad de una publicación.

## Respuesta nueva
- `credibilidad: null`
- `confianza: null`
- `estado_tecnico`
- `acciones_disponibles`
- `reintentar`

## Compatibilidad
El endpoint conserva los campos anteriores y añade campos auxiliares. La interfaz debe comprobar `null` antes de añadir el símbolo `%`.

- Motor Antiamarillismo v1.0: análisis de alarmismo, riesgo, fuentes matriz, réplicas y posible difusión por bots.
