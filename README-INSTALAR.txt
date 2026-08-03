LA VERDAD INCÓMODA — INTRODUCCIÓN Y MICRÓFONO CORREGIDOS

ARCHIVOS:
- index.html
- README-INSTALAR.txt

NO USA CARPETAS NI ASSETS.

PROBLEMA CORREGIDO
La versión anterior llamaba a scheduleWelcome(), pero esa función no estaba
definida. Eso detenía el JavaScript antes de registrar correctamente los botones
y podía impedir que se escuchara la introducción.

FLUJO ACTUAL
1. Al entrar aparece el botón COMENZAR.
2. El usuario toca COMENZAR.
3. El navegador solicita permiso para el micrófono.
4. Se reproduce:
   “Bienvenido a La Verdad Incómoda. ¿Qué deseas verificar?”
5. Durante esa frase no existe reconocimiento de voz activo.
6. Después de terminar, espera 650 milisegundos.
7. Solo entonces se crea y activa SpeechRecognition.
8. El usuario hace su pregunta.
9. El análisis comienza automáticamente.
10. Al finalizar se lee el resumen y lo más importante.

INSTALACIÓN
1. Reemplaza index.html en GitHub.
2. Haz Commit directly to main.
3. Espera el deployment Ready de Vercel.
4. Recarga la web sin caché o usa una pestaña de incógnito.
