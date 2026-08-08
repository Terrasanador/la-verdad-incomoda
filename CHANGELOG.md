# Versión 1.6.2 - Verificación de Search Console (2026-08-07)

- Se incorpora la etiqueta oficial de verificación de Google Search Console para la propiedad `https://www.laverdadincomoda.mx/`.
- Se mantienen la URL canónica y las configuraciones existentes de Vercel, Analytics, AdSense y verificación de enlaces.

# Versión 1.6.1 - URL canónica para Search Console (2026-08-07)

- La página principal declara `https://www.laverdadincomoda.mx/` como URL canónica.
- Se conserva la redirección del dominio sin `www` y la configuración de Vercel, Analytics, Search Console, AdSense y verificación de enlaces.

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
# Versión 1.6.0 - Perfiles sociales y recuperación de conexión (2026-08-06)

- Los perfiles completos de Threads y otras redes se tratan como auditorías de perfil, no como afirmaciones individuales.
- Se conservan y analizan nombre, usuario, biografía, seguidores y volumen declarado de publicaciones cuando la plataforma limita el historial completo.
- La búsqueda web para enlaces es obligatoria y usa consultas específicas del usuario y de la plataforma.
- El acceso parcial ya no borra los hallazgos verificables ni fuerza automáticamente un resultado vacío de “sin acceso”.
- Se excluyen del informe las fuentes exploratorias que no fueron seleccionadas o citadas como relevantes.
- La interfaz reintenta una vez los fallos transitorios de red y sustituye “Failed to fetch” por una explicación útil en español.
- La función de análisis admite hasta 300 segundos en plataformas Vercel compatibles.
- El endpoint de salud informa si las claves de OpenAI y YouTube están configuradas, sin exponer sus valores.
