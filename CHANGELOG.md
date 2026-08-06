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
# Versión 1.4.0 — contexto profundo de enlaces y redes

- YouTube: extracción ampliada de título, canal, descripción, fecha, subtítulos y estadísticas disponibles.
- Comentarios de YouTube: muestra pública de hasta 50 comentarios relevantes mediante YouTube Data API v3 cuando existe `YOUTUBE_API_KEY`.
- Redes sociales y páginas: lectura de metadatos y JSON-LD, incluidos comentarios realmente publicados en datos estructurados.
- Informe visible: nueva sección de contexto recuperado, muestra de comentarios, tendencias, representatividad y posibles señales de coordinación.
- Salvaguardas: los comentarios no se tratan como prueba de verdad ni como muestra representativa; los datos relevantes se verifican mediante búsqueda web.
- Corrección de coherencia: `PARCIALMENTE VERDADERO` ahora corresponde a `PARCIALMENTE CIERTA`.
