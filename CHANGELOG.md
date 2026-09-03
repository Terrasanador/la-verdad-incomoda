# Versión 1.12.0 - Verificación del tráfico del AIFA (2026-09-03)

- Publica una verificación original sobre la cifra de 3.6 millones de pasajeros en el primer semestre de 2026.
- Contrasta el dato con AFAC y DataTur y separa la medición observada de la comparación con una meta no identificada.
- Actualiza la biblioteca a veintiuna publicaciones, el sitemap, los datos estructurados y la versión del servicio.

# Versión 1.9.11 - Conectores Facebook, Instagram y X (2026-08-30)

- Añade rutas documentadas para publicaciones, páginas y grupos públicos de Facebook.
- Integra detalles y transcripciones de Instagram, y texto y datos públicos de X.
- El conector social continúa aunque falle la lectura directa; descarta redirecciones a login como destino del contenido.
- Corrige la clasificación de enlaces cortos como perfiles y separa síntesis automáticas de transcripciones de voz.
- Limita las muestras nuevas para controlar latencia y consumo de créditos.
- No incorpora descarga/transcripción de audio propia para Facebook o X; el alcance depende del contenido devuelto por el proveedor.

# Versión 1.9.10 - Resolución de enlaces cortos de video (2026-08-29)

- Resuelve primero la redirección de enlaces cortos de TikTok.
- Entrega al conector social la URL canónica `tiktok.com/@usuario/video/id`.
- Evita que Captapi rechace enlaces `vt.tiktok.com` como videos inválidos.
- Permite recuperar detalles, comentarios y transcripción del video específico.

# Versión 1.9.9 - Análisis efectivo de perfiles y videos (2026-08-29)

- Impide que una auditoría de perfil reemplace el veredicto factual por un mensaje técnico.
- Abre automáticamente hasta cinco videos públicos recuperados de un perfil de TikTok.
- Solicita detalles y transcripción de cada video antes de analizar sus afirmaciones.
- Conserva el veredicto, la credibilidad y la afirmación principal producidos por la investigación.
- Utiliza descripciones, títulos, subtítulos, citas, copias y fuentes relacionadas cuando falta una transcripción.

# Versión 1.9.8 - Verificación integral automática (2026-08-29)

- Elimina los botones para escoger entre afirmación, cuentas y perfil.
- Ejecuta siempre la verificación factual, la revisión de la cuenta y la detección de coordinación como un solo proceso.
- Mantiene el veredicto factual como resultado principal y presenta cuentas o automatización como contexto complementario.
- Devuelve una limitación clara cuando no existen suficientes datos públicos para investigar cuentas relacionadas.

# Versión 1.9.7 - Resumen para redes sociales (2026-08-29)

- Añade un botón para copiar un resumen listo para publicar en redes sociales.
- Limita automáticamente el texto a 750 caracteres.
- Incluye veredicto, afirmación, explicación esencial, enlace y etiquetas identificadoras.
- Confirma visualmente la copia y muestra la cantidad de caracteres utilizada.

# Versión 1.9.6 - Experiencia de verificación y resultados de coordinación (2026-08-29)

- Ordena el flujo para elegir el tipo de análisis antes de aportar el contenido.
- Añade accesos específicos para verificar afirmaciones, comparar cuentas y auditar perfiles.
- Muestra en el informe las cuentas comparadas, publicaciones coincidentes, cronología y evidencia de automatización.
- Activa automáticamente la investigación profunda al comparar cuentas.
- Mejora las instrucciones móviles para aportar tres o más enlaces o capturas identificables.

# Versión 1.9.5 - Auditoría comparativa de cuentas (2026-08-29)

- Localiza publicaciones exactas, casi exactas y paráfrasis, y registra sus URLs y cronología.
- Audita cada cuenta por separado usando señales de actividad, repetición, temporalidad y automatización.
- Distingue coordinación humana, comportamiento compatible con automatización y bots con alta confianza.
- Impide identificar bots únicamente por nombres genéricos, anonimato, ideología o una sola coincidencia.
- Exige al menos tres cuentas individualmente sustentadas para afirmar una granja de bots.

# Versión 1.9.4 - Corrección del límite de respuesta (2026-08-27)

- Aumenta el límite de salida de 5,000 a 14,000 tokens en análisis rápido y de 8,000 a 20,000 en investigación profunda.
- Limita cada lista a cinco elementos y cada informe a cinco fuentes para evitar respuestas truncadas.
- Reduce repeticiones y textos de relleno sin eliminar las secciones de verificación.
- Sustituye el mensaje técnico `max_output_tokens` por una explicación comprensible para el usuario.

# Versión 1.9.3 - Coordinación, nado sincronizado y granjas de bots (2026-08-26)

- Compara textos, imágenes, hashtags, enlaces, errores compartidos y horarios para encontrar réplicas coordinadas.
- Distingue repetición partidista, coordinación humana probable, nado sincronizado demostrado y automatización.
- La etiqueta NADO SINCRONIZADO DE DESINFORMACIÓN exige una falsedad comprobada y evidencia coincidente de al menos tres emisores independientes.
- La etiqueta GRANJA DE BOTS DIFUNDIENDO DESINFORMACIÓN exige además señales observables de automatización con confianza alta.
- Refuerza el análisis de campañas que niegan imputaciones o datos de prueba para exculpar a una persona procesada.
- Aplica el mismo estándar probatorio a derecha, izquierda, gobiernos, oposiciones, medios y cuentas anónimas.

# Versión 1.9.2 - Separación entre atribución y veracidad (2026-08-26)

- Confirmar que una persona o partido difundió una afirmación ya no aumenta la veracidad de esa afirmación.
- Impide clasificar como parcialmente cierta una falsedad solo porque la atribución de la declaración sea correcta.
- Obliga a evaluar como afirmación principal el contenido investigado y a calificarlo como FALSO/FALSA cuando la evidencia lo contradiga.
- Añade un caso de control específico para narrativas de persecución política y negación de pruebas documentadas.

# Versión 1.9.1 - Afirmaciones judiciales y persecución política (2026-08-26)

- Separa situación procesal, existencia de imputaciones, datos de prueba, culpabilidad y supuesto móvil político.
- Marca como falsa la negación de acusaciones o pruebas cuando los registros judiciales documentan su existencia.
- Exige evidencia específica para sostener una persecución política; el respaldo partidista no basta.
- Mantiene la presunción de inocencia: una detención o vinculación a proceso no equivale a culpabilidad.
- Identifica propaganda o desinformación en defensas partidistas que niegan hechos procesales comprobables, sin condenar globalmente al partido.

# Versión 1.9.0 - Biblioteca editorial ampliada (2026-08-24)

- Se publicaron diez artículos originales adicionales sobre verificación, encuestas, estadísticas, documentos, financiamiento, imágenes generadas, fuentes, gráficas, campañas, promesas y correcciones.
- Se ampliaron los ocho artículos existentes con procedimientos y ejemplos prácticos.
- Cada artículo incluye autoría, fecha, fuentes y enlaces a contenidos relacionados.
- El sitio reúne ahora dieciocho artículos y una biblioteca editorial superior a siete mil palabras.

# Versión 1.8.4 - Corrección de rutas editoriales (2026-08-23)

- Se corrigió la regla de Vercel que entregaba error 404 en las nuevas URL canónicas de los artículos.
- Se añadió una recuperación alternativa del identificador del artículo desde la propia ruta solicitada.
- Se conservaron las redirecciones permanentes desde las URL editoriales anteriores.

# Versión 1.8.3 - Limpieza de recursos (2026-08-19)

- Se retiró una imagen residual de prueba que no estaba vinculada ni publicada en el sitio.
- Se conservaron únicamente los recursos gráficos propios necesarios para la identidad y la vista previa del sitio.

# Versión 1.8.2 - Indexación y URL canónicas (2026-08-19)

- Cada artículo se publica con una URL canónica individual renderizada desde el servidor.
- Las direcciones anteriores con `article.html?slug=` redirigen permanentemente a las nuevas URL.
- El sitemap y los enlaces internos utilizan exclusivamente las rutas canónicas.
- Se reforzó el descubrimiento de los ocho artículos y de la página Quiénes somos.

# Versión 1.8.1 - Informes resumidos (2026-08-13)

- El informe final muestra, copia, comparte, lee e imprime un máximo de cinco fuentes relevantes.
- Se priorizan fuentes oficiales, primarias, documentales, académicas y verificadores que sustentan la conclusión.
- Se limita a una sola página por red social y a dos fuentes por dominio para evitar listas repetitivas.

# Versión 1.8.0 - Contenido editorial para AdSense (2026-08-13)

- La portada incorpora contenido educativo y navegación editorial visible incluso antes de usar el verificador.
- Se publican ocho artículos originales con autor, fecha, fuentes y datos estructurados.
- Se amplían metodología, quiénes somos y preguntas frecuentes.
- Se añaden política editorial, procedimiento de correcciones, autores y responsabilidad editorial.
- El sitemap incluye las páginas editoriales y los artículos para facilitar su indexación.
- Se conservan Vercel, Analytics, Search Console, AdSense, Threads, TikTok, YouTube y el verificador.

# Versión 1.7.7 - Patrones dirigidos (2026-08-13)

- Identifica si las publicaciones se dirigen recurrentemente contra un gobierno, funcionario, institución, empresa o persona.
- Informa cuántas publicaciones fueron revisadas, cuántas apuntan al objetivo y qué periodo cubre la muestra.
- Distingue crítica recurrente, cobertura negativa sistemática, campaña de descrédito y ataque sistemático con desinformación.
- Fundamenta la clasificación con ejemplos concretos y recursos narrativos repetidos.

# Versión 1.7.6 - Auditoría parcial útil (2026-08-13)

- Un perfil de Threads o TikTok se reconoce también por la URL y por Captapi, aunque la extracción directa de la plataforma esté limitada.
- Si se recuperaron publicaciones, contexto o fuentes, la auditoría se muestra como analizada y nunca como un veredicto global de no verificable.
- Se eliminan fuentes duplicadas por URL o título y se exige relevancia directa para la cuenta o las publicaciones evaluadas.

# Versión 1.7.5 - Intencionalidad y daño (2026-08-13)

- Separa la falsedad de la intención de perjudicar a personas, gobiernos, instituciones o grupos.
- Clasifica la evidencia como daño intencional sustentado, indicios de intención o intención no demostrada.
- Revisa repetición después de correcciones, material previamente desmentido, recortes deliberados, objetivos sistemáticos, coordinación y vínculos financieros documentados.
- Muestra la evidencia concreta utilizada para inferir intención y evita atribuirla por una falsedad aislada.

# Versión 1.7.4 - Antecedentes y conflictos de interés (2026-08-13)

- Las auditorías de medios y periodistas investigan antecedentes documentados de montajes, falsedades, retractaciones, sanciones, sentencias, correcciones y desmentidos.
- Se revisan propiedad, financiamiento, contratos públicos y conflictos de interés cuando existen documentos verificables.
- Los patrones comprobados se expresan directamente, pero las acusaciones de pagos o mercenarismo requieren evidencia financiera o contractual.
- Los perfiles recuperan un contexto web intermedio para contrastar las publicaciones sin regresar al análisis excesivamente largo.

# Versión 1.7.3 - Auditoría de publicaciones (2026-08-13)

- Los perfiles ya no reciben un veredicto global de cierto o falso ni un porcentaje de credibilidad.
- La respuesta evalúa exclusivamente la muestra de publicaciones recuperadas: tendenciosidad, omisiones, manipulación y desinformación verificable.
- La alerta de bot solo aparece cuando coinciden evidencia observable de automatización y repetición de noticias falsas verificadas.

# Versión 1.7.2 - Estabilidad en análisis largos (2026-08-13)

- Los perfiles sociales usan búsqueda web de contexto reducido y no obligatoria para priorizar el análisis de las publicaciones recuperadas.
- Se establece un límite interno antes del máximo de Vercel para devolver siempre un error JSON comprensible si OpenAI tarda demasiado.
- Se elimina el reintento automático del navegador para impedir consultas duplicadas y consumo doble de créditos de Captapi/OpenAI.

# Versión 1.7.1 - Corrección de respuesta social (2026-08-13)

- Corrige la construcción de `extraccion_enlace` para que los resultados de Threads y TikTok puedan incorporar el resumen del conector sin interrumpir el análisis.
- Mantiene Captapi, YouTube, Vercel, Analytics, Search Console, AdSense y el verificador de enlaces.

# Versión 1.7.0 - Análisis de Threads y TikTok (2026-08-13)

- Integración opcional y privada con Captapi mediante `CAPTAPI_API_KEY`, limitada a Threads y TikTok para cuidar los créditos.
- Recuperación complementaria de perfiles y publicaciones públicas de Threads y TikTok.
- Para publicaciones individuales compatibles, intenta recuperar detalles, comentarios y transcripciones realmente disponibles.
- YouTube y las demás redes conservan la extracción existente y no consumen créditos de Captapi.
- Auditorías de perfil limitadas inicialmente a 20 publicaciones y comentarios a 20, con topes configurables de 50.
- Caché de 24 horas para reducir consumo en consultas repetidas.
- Fallos del proveedor externo no interrumpen el verificador: se mantiene la extracción directa y la búsqueda web.
- Se conservan Vercel, Analytics, Search Console, AdSense, canonical, verificación de Google y el Motor Antiamarillismo.

# Versión 1.6.3 - Recuperación ante respuestas transitorias de Vercel (2026-08-07)

- La interfaz reintenta una vez cuando Vercel devuelve HTML o un error HTTP 500, 502, 503 o 504 durante un análisis.
- Las respuestas HTML ya no se muestran como errores técnicos de JSON; si el fallo persiste, aparece una explicación clara en español.
- El endpoint de salud informa la versión correcta, sin exponer claves.
- Se conservan Search Console, la URL canónica, Analytics, AdSense, YouTube Data API y el verificador de enlaces.

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
