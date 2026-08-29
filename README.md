# La Verdad Incómoda 1.9.10 — Android

Todos los archivos van en la raíz del repositorio. No se necesitan carpetas.

La página principal declara `https://www.laverdadincomoda.mx/` como URL canónica para mantener unificada la indexación en Google Search Console.

Vercel publica:
- `analyze.js` como `/api/analyze`
- `health.js` como `/api/health`

Configura `OPENAI_API_KEY` en Vercel.

Para recuperar perfiles, publicaciones y comentarios públicos de Threads y TikTok, configura también `CAPTAPI_API_KEY` exclusivamente en las variables de entorno de Vercel. El conector nunca envía esta clave al navegador ni la incluye en los resultados. Las demás redes conservan la extracción pública existente sin consumir créditos de Captapi.

La auditoría de perfiles consulta inicialmente hasta 20 publicaciones para controlar créditos. Los límites pueden ajustarse con `SOCIAL_PROFILE_POST_LIMIT` y `SOCIAL_COMMENT_LIMIT`, con un máximo de 50. Los resultados repetidos usan caché de 24 horas cuando el proveedor la ofrece.

## Extracción profunda de YouTube y redes

El analizador recupera metadatos públicos, texto estructurado, descripción y subtítulos disponibles. Para consultar mediante la API oficial una muestra de hasta 50 comentarios públicos relevantes de YouTube, configura también en Vercel:

`YOUTUBE_API_KEY`

Esta segunda variable es opcional: si no está configurada, el verificador continúa funcionando con metadatos, subtítulos y búsqueda web, y declara que no pudo solicitar comentarios. La clave debe permanecer únicamente en las variables de entorno de Vercel y nunca debe subirse a GitHub.

En Threads y TikTok, Captapi complementa el texto realmente expuesto con los datos públicos que pueda recuperar. En las demás redes se procesan exclusivamente el texto y los comentarios expuestos en la página pública o en datos estructurados. El sistema no evade inicios de sesión ni controles de acceso.

## Perfiles completos de redes sociales

Cuando el usuario pega la URL de un perfil, el sistema realiza una auditoría de perfil y no exige una afirmación aislada. Conserva la ficha pública disponible —nombre, usuario, biografía, seguidores y volumen declarado de publicaciones—, busca publicaciones y menciones indexadas con consultas específicas y analiza únicamente contenido realmente recuperado.

Si Threads o TikTok limita el historial completo, el informe mantiene los datos verificables del perfil, explica exactamente qué publicaciones pudo revisar y cuáles quedaron fuera de alcance. Un acceso parcial no se presenta como un fallo total.
Actualización de configuración.


## Guía visual
La página incluye una ventana emergente en **¿Cómo funciona?**, con formas de enviar contenido, explicación del proceso, ejemplos visuales y la leyenda **COMPARTE ESTA PÁGINA PARA COMBATIR LAS FAKE NEWS**.
