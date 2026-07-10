# La Verdad Incómoda

Verificador multimedia con:

- texto y afirmaciones;
- extracción de páginas y metadatos accesibles;
- investigación web mediante OpenAI Responses API + `web_search`;
- imágenes mediante visión;
- audio mediante transcripción;
- video mediante extracción local de fotogramas y audio (primeros 45 segundos);
- fuentes visibles en el resultado.

## Despliegue en Vercel

Variables necesarias:

- `OPENAI_API_KEY`: clave de API.
- `OPENAI_MODEL` (opcional): por defecto `gpt-4.1-mini`.

## Limitaciones honestas

Facebook, Instagram, TikTok y otras plataformas pueden bloquear servidores, exigir inicio de sesión o impedir la descarga automática. Cuando no exista material suficiente, el sistema devuelve **“sin acceso al contenido”** y solicita subir el archivo, en vez de inventar un veredicto.

Vercel limita el cuerpo de cada solicitud a 4.5 MB; la interfaz comprime imágenes y limita el audio/video preparado para respetar ese máximo.
