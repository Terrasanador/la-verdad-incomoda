# La Verdad Incómoda 1.0 — Android

Todos los archivos van en la raíz del repositorio. No se necesitan carpetas.

Vercel publica:
- `analyze.js` como `/api/analyze`
- `health.js` como `/api/health`

Configura `OPENAI_API_KEY` en Vercel.

## Extracción profunda de YouTube y redes

El analizador recupera metadatos públicos, texto estructurado, descripción y subtítulos disponibles. Para consultar mediante la API oficial una muestra de hasta 50 comentarios públicos relevantes de YouTube, configura también en Vercel:

`YOUTUBE_API_KEY`

Esta segunda variable es opcional: si no está configurada, el verificador continúa funcionando con metadatos, subtítulos y búsqueda web, y declara que no pudo solicitar comentarios. La clave debe permanecer únicamente en las variables de entorno de Vercel y nunca debe subirse a GitHub.

En otras redes sociales se procesan exclusivamente el texto y los comentarios realmente expuestos en la página pública o en datos estructurados. El sistema no evade inicios de sesión ni controles de acceso.
Actualización de configuración.


## Guía visual
La página incluye una ventana emergente en **¿Cómo funciona?**, con formas de enviar contenido, explicación del proceso, ejemplos visuales y la leyenda **COMPARTE ESTA PÁGINA PARA COMBATIR LAS FAKE NEWS**.
