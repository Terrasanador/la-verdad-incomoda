# La Verdad Incómoda 1.6.1 — Android

Todos los archivos van en la raíz del repositorio. No se necesitan carpetas.

La página principal declara `https://www.laverdadincomoda.mx/` como URL canónica para mantener unificada la indexación en Google Search Console.

Vercel publica:
- `analyze.js` como `/api/analyze`
- `health.js` como `/api/health`

Configura `OPENAI_API_KEY` en Vercel.

## Extracción profunda de YouTube y redes

El analizador recupera metadatos públicos, texto estructurado, descripción y subtítulos disponibles. Para consultar mediante la API oficial una muestra de hasta 50 comentarios públicos relevantes de YouTube, configura también en Vercel:

`YOUTUBE_API_KEY`

Esta segunda variable es opcional: si no está configurada, el verificador continúa funcionando con metadatos, subtítulos y búsqueda web, y declara que no pudo solicitar comentarios. La clave debe permanecer únicamente en las variables de entorno de Vercel y nunca debe subirse a GitHub.

En otras redes sociales se procesan exclusivamente el texto y los comentarios realmente expuestos en la página pública o en datos estructurados. El sistema no evade inicios de sesión ni controles de acceso.

## Perfiles completos de redes sociales

Cuando el usuario pega la URL de un perfil, el sistema realiza una auditoría de perfil y no exige una afirmación aislada. Conserva la ficha pública disponible —nombre, usuario, biografía, seguidores y volumen declarado de publicaciones—, busca publicaciones y menciones indexadas con consultas específicas y analiza únicamente contenido realmente recuperado.

Si Threads u otra plataforma limita el historial completo, el informe mantiene los datos verificables del perfil, explica exactamente qué publicaciones pudo revisar y cuáles quedaron fuera de alcance. Un acceso parcial no se presenta como un fallo total.
Actualización de configuración.


## Guía visual
La página incluye una ventana emergente en **¿Cómo funciona?**, con formas de enviar contenido, explicación del proceso, ejemplos visuales y la leyenda **COMPARTE ESTA PÁGINA PARA COMBATIR LAS FAKE NEWS**.
