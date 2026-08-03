LA VERDAD INCÓMODA — SIN BOTÓN INICIAL

Este paquete contiene únicamente:
- index.html
- README-INSTALAR.txt

CAMBIO CONFIRMADO
- Se eliminó completamente la ventana “Activa el micrófono”.
- Se eliminó el botón inicial “COMENZAR”.
- Al cargar la página se intenta reproducir automáticamente:
  “Bienvenido a La Verdad Incómoda. ¿Qué deseas verificar?”
- Durante esa voz no existe reconocimiento activo.
- Al terminar espera 750 milisegundos.
- Después intenta activar el micrófono automáticamente.
- Si el navegador bloquea el micrófono automático, queda disponible el botón normal
  “Preguntar por voz”; no aparece ninguna ventana inicial.

INSTALACIÓN
1. En GitHub reemplaza por completo el index.html actual.
2. Haz Commit directly to main.
3. Espera a que Vercel marque Ready.
4. Abre la web en incógnito o borra la caché.
5. Para confirmar que subiste esta versión, busca en el código:
   LVI-VOICE-NO-INITIAL-BUTTON-V1

NOTA DEL NAVEGADOR
Los navegadores móviles pueden impedir audio o micrófono automáticos hasta que
exista una interacción del usuario. El código intenta ejecutar el flujo solicitado,
pero esa restricción no puede eliminarse desde JavaScript.
