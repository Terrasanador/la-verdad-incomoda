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

## 2026-08-02 — Estadísticas de uso
- Se añadió Vercel Web Analytics mediante `/_vercel/insights/script.js`.
- Se agregó `ACTIVAR-ESTADISTICAS.txt` con instrucciones para ver visitantes, páginas vistas e invocaciones de `/api/analyze`.
