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
# Versión 1.5.0 - Videos largos y contexto (2026-08-06)

- Recuperación reforzada de subtítulos de YouTube mediante datos del reproductor y ruta alternativa de YouTube.
- Transcripciones con marcas de tiempo y mayor capacidad para programas extensos.
- Resumen completo, segmentación temática y verificación diferenciada de las afirmaciones principales.
- Un noticiero con varios temas ya no recibe automáticamente un único porcentaje de credibilidad.
- La credibilidad aparece como "No aplica" cuando no existe una afirmación global única; nunca como 0% por falta de una afirmación indicada por el usuario.
- Los comentarios continúan tratándose como contexto social y no como evidencia de veracidad.
- Se conserva la configuración existente de Vercel, Analytics, Search Console, AdSense y verificación de enlaces.
