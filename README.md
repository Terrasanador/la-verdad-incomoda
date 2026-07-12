# La Verdad Incómoda 2.1

Motor de investigación y evaluación de credibilidad con IA y evidencia digital.

## Funciones

- Preguntas, texto y enlaces públicos.
- Búsqueda web y contraste de fuentes.
- Evaluación positiva, negativa, mixta o insuficiente.
- Análisis de imágenes.
- Transcripción y análisis de audio.
- Análisis de TXT, PDF y documentos compatibles.
- Video: el servidor recibe el archivo, pero esta versión todavía no extrae audio ni fotogramas; solicita audio, capturas o transcripción en lugar de inventar un resultado.

## Variables de Vercel

- `OPENAI_API_KEY` obligatoria.
- `OPENAI_MODEL` opcional; predeterminado: `gpt-4.1-mini`.
- `OPENAI_TRANSCRIBE_MODEL` opcional; predeterminado: `gpt-4o-mini-transcribe`.

## Límite de archivos

La interfaz limita los archivos a 3.5 MB para mantenerse debajo del límite de solicitud del despliegue.


## Cambio 2.1

- Encabezado y explicación reducidos para que el cuadro de consulta aparezca casi de inmediato en teléfonos.
- Se mantiene la evaluación positiva, negativa o mixta basada en evidencia digital pública.
