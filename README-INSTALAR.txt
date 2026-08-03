LA VERDAD INCÓMODA — VOZ CON MÁQUINA DE ESTADOS

ARCHIVOS:
- index.html
- README-INSTALAR.txt

NO USA CARPETAS NI ASSETS.

FLUJO CORREGIDO
1. El usuario toca “COMENZAR”.
2. El navegador solicita permiso del micrófono.
3. Se cierra inmediatamente ese flujo de permiso.
4. Se reproduce una bienvenida breve:
   “Bienvenido a La Verdad Incómoda. ¿Qué deseas verificar?”
5. Durante la bienvenida NO existe un objeto de reconocimiento de voz activo.
6. Solo después de que termina la síntesis de voz se crea SpeechRecognition.
7. El micrófono empieza a escuchar la pregunta del usuario.
8. La investigación comienza automáticamente.
9. Se lee el resumen y lo más importante.
10. Después se pregunta si se desea escuchar el informe completo.

ESTADOS INTERNOS
- IDLE
- WELCOME
- LISTENING_QUERY
- ANALYZING
- READING_SUMMARY
- ASKING_FULL_REPORT
- LISTENING_CONFIRMATION
- READING_FULL_REPORT

Este diseño evita que el micrófono transcriba la voz de la propia página.

INSTALACIÓN
1. Reemplaza index.html en GitHub.
2. Haz Commit directly to main.
3. Espera que Vercel marque Ready.
4. Entra a la página y toca COMENZAR.

COMPATIBILIDAD
Chrome y Edge suelen ofrecer la mejor compatibilidad con reconocimiento de voz.
Safari y algunos navegadores móviles pueden limitar esta función.
