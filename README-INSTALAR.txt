LA VERDAD INCÓMODA — MICRÓFONO RESTAURADO

PROBLEMA ENCONTRADO
La versión anterior llamaba a startVoiceRecognition(), pero esa función no
existía dentro del archivo. Por eso la bienvenida podía terminar, pero el
micrófono nunca se activaba.

CORRECCIÓN
- Se restauró startVoiceRecognition().
- Se restauró activateVoiceMode().
- La bienvenida se reproduce primero.
- Al terminar, espera 700 milisegundos.
- Después activa el micrófono.
- La pregunta hablada se coloca en el campo y comienza el análisis.

MARCA DE VERSIÓN
LVI-MIC-FUNCTION-RESTORED-V2

INSTALACIÓN
1. Reemplaza completamente index.html en GitHub.
2. Haz Commit directly to main.
3. Espera que Vercel marque Ready.
4. Prueba en incógnito.
